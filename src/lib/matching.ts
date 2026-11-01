/* ============================================================================
   PEROT 推荐引擎 v1（PRD 第 8–10 章）
   ============================================================================
   执行顺序（PRD 8.1）：
     1. 数据完整性与可信度检查
     2. 硬约束排除
     3. 软匹配计算与排序
     4. 参考鞋相似性微调
     5. 生成三双推荐与文字解释

   ★ 纯函数，无副作用，不依赖 React
   ★ 用户侧只输出文字等级，分数仅内部/管理端可见
   ★ 低可信度数据不得生成「非常适合」
   ★ 全场场景中重量 > 410g 仅降权，不排除（PRD 5.5）
   ============================================================================ */

import type {
  FootConstraint,
  Grade,
  HardCheckResult,
  Recommendation,
  RecommendationReason,
  RecommendationResult,
  RecommendSlot,
  ScoreBreakdown,
  Shoe,
  UserProfile,
} from "./types";

export const RULE_VERSION = "rule-v1.0";

/* ---------------------------------------------------------------------------
   权重（第一层 / 第二层 / 第三层，PRD 8.3）
   --------------------------------------------------------------------------- */

export const WEIGHTS = {
  /* 第一层：足部适配、伤病保护、场地安全、关键打法 */
  foot: 0.24,
  injury: 0.16,
  court: 0.12,
  play: 0.1,
  /* 第二层：身体、稳定、抓地、缓震、响应、耐磨、重量 */
  body: 0.14,
  /* 第三层：主观脚感、鞋领、参考鞋、非关键偏好 */
  feel: 0.1,
  preference: 0.09,
  reference: 0.05,
} as const;

/** 第一层门槛：低于此值则整体降档，避免「均衡鞋垄断」（PRD 8.3） */
export const FIRST_TIER_FLOOR = {
  foot: 0.55,
  injury: 0.45,
  court: 0.45,
} as const;

/* ---------------------------------------------------------------------------
   工具
   --------------------------------------------------------------------------- */

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
/** 1–10 量表 → 0–1 */
const t10 = (v: number) => clamp01((v - 1) / 9);
/** 1–5 量表 → 0–1 */
const t5 = (v: number) => clamp01((v - 1) / 4);
/** 接近度：actual 越接近 target 分越高 */
const near = (actual: number, target: number, tol: number) =>
  clamp01(1 - Math.abs(actual - target) / tol);

/* ---------------------------------------------------------------------------
   足部约束：以「更需要空间的一侧」为准（PRD 5.2 / 18）
   --------------------------------------------------------------------------- */

export function deriveFootConstraint(profile: UserProfile): FootConstraint {
  const { left, right, forefoot } = profile.foot;

  const leftLen = left.lengthMm ?? 0;
  const rightLen = right.lengthMm ?? 0;
  const leftWid = left.widthMm ?? 0;
  const rightWid = right.widthMm ?? 0;

  /* 长度与宽度各自取较大值；若长度与宽度指向不同侧，以宽度为准
     （挤脚比顶脚更常见，且宽度是硬约束主因） */
  const widerSide: "left" | "right" = leftWid >= rightWid ? "left" : "right";
  const longerSide: "left" | "right" = leftLen >= rightLen ? "left" : "right";

  const lengthMm = Math.max(leftLen, rightLen);
  const widthMm = Math.max(leftWid, rightWid);

  const notes: string[] = [];
  const lenDelta = Math.abs(leftLen - rightLen);
  const widDelta = Math.abs(leftWid - rightWid);
  const asymmetry = lenDelta > 5 || widDelta > 3;

  if (lenDelta > 5) {
    notes.push(
      `左右脚长度相差 ${lenDelta}mm，按较长的${longerSide === "left" ? "左" : "右"}脚选码`
    );
  }
  if (widDelta > 3) {
    notes.push(
      `左右脚宽度相差 ${widDelta}mm，按较宽的${widerSide === "left" ? "左" : "右"}脚判断鞋楦`
    );
  }
  if (forefoot.width === "veryWide") {
    notes.push("前掌为很宽，窄楦鞋款会被硬性排除");
  }

  return {
    lengthMm,
    widthMm,
    governingSide: widerSide,
    asymmetry,
    notes,
  };
}

/** 估算鞋内前掌宽度（mm）。
    经验式：以内长 265mm / 楦宽 5 为基准，楦宽每 +1 约 +3.0mm。
    ★ 属估算值（误差约 ±4mm），只用于辅助判断，不单独作为硬排除的唯一依据。 */
function estimateInternalWidth(shoe: Shoe): number {
  const base = shoe.sizeGuide.internalLengthMm * 0.365;
  return base + (shoe.last.forefoot.lastWidth - 5) * 3.0;
}

/* ---------------------------------------------------------------------------
   硬约束（PRD 8.2）
   --------------------------------------------------------------------------- */

export function runHardCheck(
  profile: UserProfile,
  shoe: Shoe,
  fc: FootConstraint
): HardCheckResult {
  const triggers: string[] = [];
  let excluded = false;
  let penalty = 0;

  const { foot, injury, environment, preference, body, play } = profile;
  const { forefoot } = foot;

  /* --- 规则 1：左右脚空间约束（前掌宽度） ---
     判据优先级：分类判断（可靠）> mm 估算（误差 ±4mm，仅辅助） */
  const estWidth = estimateInternalWidth(shoe);
  const widthGap = fc.widthMm - estWidth; // >0 表示脚比鞋宽

  if (forefoot.width === "veryWide" && shoe.last.forefoot.wideFootFit <= 4) {
    excluded = true;
    triggers.push(
      `你的前掌为很宽，这双宽脚适配仅 ${shoe.last.forefoot.wideFootFit}/10，前掌会被明显挤压`
    );
  } else if (forefoot.width === "wide" && shoe.last.forefoot.wideFootFit <= 3) {
    excluded = true;
    triggers.push(
      `你的前掌偏宽，这双宽脚适配仅 ${shoe.last.forefoot.wideFootFit}/10，属于窄楦`
    );
  } else if (widthGap > 12) {
    /* 脚宽明显超过估算鞋内宽（阈值放宽，因估算有误差） */
    excluded = true;
    triggers.push(
      `你较宽一侧脚宽 ${fc.widthMm}mm，这双估算鞋内前掌宽约 ${estWidth.toFixed(0)}mm，差值超过 12mm，挤压风险高`
    );
  } else if (widthGap > 6) {
    penalty += 0.1;
    triggers.push(
      `你较宽一侧脚宽 ${fc.widthMm}mm，这双估算鞋内前掌宽约 ${estWidth.toFixed(0)}mm，偏紧，建议试穿`
    );
  }

  /* --- 规则 2：脚长可穿范围（尺码可由用户选择，不因内长基准排除） ---
     ★ 42 码内长只是基准，用户可按建议尺码选择，故仅检查极端范围。 */
  if (fc.lengthMm > 0 && (fc.lengthMm < 235 || fc.lengthMm > 315)) {
    penalty += 0.1;
    triggers.push(
      `你较长一侧脚长 ${fc.lengthMm}mm，超出常规量产鞋款的可穿范围，可能需要定制`
    );
  }

  /* --- 规则 3：伤病与结构冲突 --- */
  const hasAnkle = injury.entries.some(
    (e) => e.area === "ankle" || e.area === "achilles"
  );
  const hasKnee = injury.entries.some(
    (e) => e.area === "knee" || e.area === "acl"
  );
  const hasFootIssue = injury.entries.some(
    (e) => e.area === "plantar" || e.area === "arch" || e.area === "forefoot"
  );

  if (injury.restrictions.collarRequired) {
    const rank = { low: 0, mid: 1, high: 2 } as const;
    const need = injury.restrictions.collarRequired;
    if (rank[shoe.upper.collar] < rank[need]) {
      excluded = true;
      triggers.push(
        `你的伤病要求${need === "high" ? "高帮" : "中帮及以上"}支撑，这双是${collarLabel(shoe.upper.collar)}`
      );
    }
  }

  if (hasAnkle && shoe.protection.ankle <= 3 && shoe.upper.collar === "low") {
    penalty += 0.2;
    triggers.push(
      `你有脚踝或跟腱问题，这双低帮且脚踝保护仅 ${shoe.protection.ankle}/10`
    );
  }

  if (hasKnee && injury.restrictions.torsionRequired && shoe.stability.torsion < 6) {
    excluded = true;
    triggers.push(
      `你的膝或前交叉韧带需要抗扭支撑，这双抗扭仅 ${shoe.stability.torsion}/10`
    );
  }

  if (hasKnee && shoe.stability.landing <= 4) {
    penalty += 0.15;
    triggers.push(`你有膝部问题，这双落地稳定仅 ${shoe.stability.landing}/10`);
  }

  if (hasFootIssue && injury.restrictions.cushionRequired && shoe.midsole.cushionSoftness <= 2) {
    penalty += 0.15;
    triggers.push(
      `你的足底或足弓需要缓冲，这双中底偏硬（软硬度 ${shoe.midsole.cushionSoftness}/10）`
    );
  }

  if (injury.restrictions.carbonPlateAvoid && shoe.midsole.plate === "carbon") {
    excluded = true;
    triggers.push("你要求避开碳板，这双为碳板结构");
  }

  if (injury.restrictions.dropLimit === "lowOnly" && shoe.midsole.dropMm > 8) {
    excluded = true;
    triggers.push(
      `你的伤病限制要求低前后落差，这双落差 ${shoe.midsole.dropMm}mm`
    );
  }

  /* --- 规则 4：场地与耐磨 / 抓地冲突 --- */
  if (environment.court === "outdoorConcrete" && shoe.durability <= 4) {
    excluded = true;
    triggers.push(
      `你主要在水泥地打球，这双耐磨仅 ${shoe.durability}/10，外场磨损会很快`
    );
  }

  if (environment.court === "outdoorRubber" && shoe.durability <= 3) {
    excluded = true;
    triggers.push(
      `你主要在室外橡胶地打球，这双耐磨仅 ${shoe.durability}/10，撑不住外场`
    );
  }

  const needsBraking =
    play.actions.includes("stepBack") ||
    play.actions.includes("lateralDefense") ||
    play.actions.includes("crossover");

  if (environment.indoor?.dusty && shoe.grip.indoorDusty <= 4) {
    penalty += 0.18;
    triggers.push(
      `你的木地板有浮灰，这双浮灰抓地仅 ${shoe.grip.indoorDusty}/10，变向时容易打滑`
    );
  }

  if (environment.indoor?.humid && shoe.grip.indoorWet <= 4) {
    penalty += 0.18;
    triggers.push(
      `你的场地潮湿，这双潮湿抓地仅 ${shoe.grip.indoorWet}/10，存在打滑风险`
    );
  }

  if (needsBraking && shoe.grip.braking <= 4) {
    penalty += 0.12;
    triggers.push(
      `你的动作包含急停或横移，这双制动仅 ${shoe.grip.braking}/10`
    );
  }

  /* --- 规则 5：体重 × 缓震 × 稳定 --- */
  if (body.weightKg >= 95 && shoe.midsole.cushionSoftness >= 8 && shoe.stability.landing <= 5) {
    penalty += 0.15;
    triggers.push(
      `你体重 ${body.weightKg}kg，这双中底偏软且落地稳定仅 ${shoe.stability.landing}/10，长期使用支撑不足`
    );
  }

  /* --- 规则 6：全场重量（PRD 5.5：仅降权，不排除） --- */
  const isFullCourt = environment.format === "full" || environment.format === "both";
  if (isFullCourt && shoe.weightG > 410) {
    penalty += 0.06;
    triggers.push(
      `你打全场，这双单只 ${shoe.weightG}g，连续跑动会有负担（仅降低优先级，不排除）`
    );
  }

  /* --- 规则 7：碳板偏好（偏好不硬排除，除伤病要求外） --- */
  if (preference.carbonPlatePref === "avoid" && shoe.midsole.plate === "carbon") {
    penalty += 0.1;
    triggers.push("你倾向避开碳板，这双为碳板结构");
  }

  return { excluded, triggers, penalty: clamp01(penalty) };
}

function collarLabel(c: "low" | "mid" | "high"): string {
  return c === "low" ? "低帮" : c === "mid" ? "中帮" : "高帮";
}

/* ---------------------------------------------------------------------------
   软匹配（PRD 8.3 八个维度）
   原则：偏好"需求低"不等于"匹配差"，用接近度而非需求乘法
   --------------------------------------------------------------------------- */

function scoreFoot(profile: UserProfile, shoe: Shoe, fc: FootConstraint): number {
  const { forefoot, midfoot, heel, instep, lastPreference } = profile.foot;

  /* 前掌宽度适配 */
  let widthFit: number;
  if (forefoot.width === "veryWide" || forefoot.width === "wide") {
    widthFit = t10(shoe.last.forefoot.wideFootFit);
  } else if (forefoot.width === "narrow") {
    widthFit = t10(shoe.last.forefoot.narrowFootFit);
  } else {
    widthFit = (t10(shoe.last.forefoot.wideFootFit) + t10(shoe.last.forefoot.narrowFootFit)) / 2;
  }

  /* 前掌空间 vs 空间需求 */
  const spaceFit = near(shoe.last.forefoot.space, 3 + forefoot.spaceNeed, 5);

  /* 压迫风险 vs 压迫敏感度 */
  const pressureFit = 1 - t10(shoe.last.forefoot.pressureRisk) * t5(forefoot.pressureSensitivity);

  /* 足中包裹 vs 包裹需求 */
  const wrapFit = near(shoe.last.midfoot.wrap, 2 + midfoot.wrapNeed, 5);

  /* 足弓支撑：archSpace 越高空间越足；高足弓需要空间，低足弓需要支撑 */
  const archFit =
    midfoot.arch === "high"
      ? t10(shoe.last.midfoot.archSpace)
      : midfoot.arch === "low"
      ? t10(shoe.stability.torsion)
      : near(shoe.last.midfoot.archSpace, 5, 6);
  const archSupportFit = archFit * 0.6 + t10(shoe.stability.torsion) * 0.4;

  /* 后跟锁定 vs 锁定需求 + 掉跟风险 */
  const heelFit =
    near(shoe.last.heel.lockdown, 2 + heel.lockdownNeed, 5) * 0.6 +
    (1 - t10(shoe.last.heel.slipRisk) * t5(heel.slipRisk)) * 0.4;

  /* 脚背高度 vs 鞋面压迫 */
  const instepFit =
    instep.height === "high"
      ? 1 - t10(shoe.upper.pressureRisk) * 0.7 - t10(shoe.last.midfoot.lacePressure) * 0.3
      : instep.height === "low"
      ? t10(shoe.upper.pressureRisk) * 0.4 + t10(shoe.upper.wrapStrength) * 0.6
      : near(shoe.upper.pressureRisk, 5, 6);

  /* 鞋带区压力敏感 */
  const laceFit = 1 - t10(shoe.last.midfoot.lacePressure) * t5(instep.lacePressureSensitivity);

  /* 楦型偏好 */
  const lastFit =
    lastPreference === "wide"
      ? t10(shoe.last.forefoot.wideFootFit)
      : lastPreference === "narrow"
      ? t10(shoe.last.forefoot.narrowFootFit)
      : shoe.last.overall === "normal"
      ? 1
      : 0.7;

  /* 尺码匹配：脚长与内长差值越小越好 */
  const sizeFit =
    fc.lengthMm > 0
      ? near(fc.lengthMm, shoe.sizeGuide.internalLengthMm, 16)
      : 0.7;

  return clamp01(
    widthFit * 0.22 +
      spaceFit * 0.14 +
      pressureFit * 0.1 +
      wrapFit * 0.1 +
      archSupportFit * 0.1 +
      heelFit * 0.1 +
      instepFit * 0.08 +
      laceFit * 0.05 +
      lastFit * 0.06 +
      sizeFit * 0.05
  );
}

function scoreInjury(profile: UserProfile, shoe: Shoe): number {
  const { entries, restrictions } = profile.injury;

  /* 无伤病：返回中性值，不惩罚也不加分 */
  if (entries.length === 0) {
    const base = t10(shoe.protection.ankle) * 0.3 + t10(shoe.stability.torsion) * 0.3 + 0.4;
    return clamp01(base * 0.85);
  }

  let need = 0;
  let got = 0;

  for (const e of entries) {
    const w = e.severity / 3; // 严重度加权
    switch (e.area) {
      case "ankle":
        need += w;
        got += w * (t10(shoe.protection.ankle) * 0.6 + (shoe.upper.collar === "high" ? 1 : shoe.upper.collar === "mid" ? 0.7 : 0.3) * 0.4);
        break;
      case "achilles":
        need += w;
        got += w * (t10(shoe.last.heel.lockdown) * 0.4 + t10(shoe.midsole.cushionSoftness) * 0.3 + t10(shoe.upper.pressureRisk === 0 ? 10 : 10 - shoe.upper.pressureRisk) * 0.3);
        break;
      case "knee":
        need += w;
        got += w * (t10(shoe.stability.landing) * 0.4 + t10(shoe.midsole.cushionSoftness) * 0.3 + t10(shoe.stability.torsion) * 0.3);
        break;
      case "acl":
        need += w;
        got += w * (t10(shoe.stability.torsion) * 0.4 + t10(shoe.stability.lateral) * 0.35 + t10(shoe.stability.landing) * 0.25);
        break;
      case "plantar":
        need += w;
        got += w * (t10(shoe.midsole.cushionSoftness) * 0.4 + t10(shoe.last.midfoot.archSpace) * 0.3 + t10(shoe.midsole.forefootDrive) * 0.3);
        break;
      case "arch":
        need += w;
        got += w * (t10(shoe.last.midfoot.archSpace) * 0.4 + t10(shoe.stability.torsion) * 0.6);
        break;
      case "forefoot":
        need += w;
        got += w * (t10(shoe.last.forefoot.space) * 0.5 + (1 - t10(shoe.last.forefoot.pressureRisk)) * 0.5);
        break;
      default:
        need += w * 0.5;
        got += w * 0.5 * t10(shoe.protection.foot);
    }
  }

  /* 强制限制额外加权 */
  if (restrictions.cushionRequired) {
    need += 0.3;
    got += 0.3 * t10(shoe.midsole.cushionSoftness);
  }
  if (restrictions.torsionRequired) {
    need += 0.3;
    got += 0.3 * t10(shoe.stability.torsion);
  }

  return need > 0 ? clamp01(got / need) : 0.7;
}

function scoreCourt(profile: UserProfile, shoe: Shoe): number {
  const { court, indoor, outdoorWear, movement } = profile.environment;
  const g = shoe.grip;

  let gripScore: number;
  if (court === "indoorWood") {
    if (indoor?.humid) {
      gripScore = t10(g.indoorWet) * 0.6 + t10(g.indoorClean) * 0.4;
    } else if (indoor?.dusty) {
      gripScore = t10(g.indoorDusty) * 0.6 + t10(g.indoorClean) * 0.4;
    } else {
      gripScore = t10(g.indoorClean);
    }
  } else if (court === "outdoorConcrete") {
    gripScore = t10(g.outdoorConcrete) * 0.5 + t10(shoe.durability) * 0.35 + t10(g.braking) * 0.15;
  } else {
    gripScore = t10(g.outdoorRubber) * 0.55 + t10(shoe.durability) * 0.3 + t10(g.braking) * 0.15;
  }

  /* 室外磨损程度影响耐磨权重 */
  if (court !== "indoorWood" && outdoorWear === "high") {
    gripScore = gripScore * 0.75 + t10(shoe.durability) * 0.25;
  }

  /* 移动特征补充制动 */
  const needsBrake =
    movement.includes("stepBack") ||
    movement.includes("lateral") ||
    movement.includes("crossover");
  if (needsBrake) {
    gripScore = gripScore * 0.8 + t10(g.braking) * 0.2;
  }

  return clamp01(gripScore);
}

/** 打法 → 需求向量 */
interface PlayNeed {
  drive: number;      // 前掌推进
  response: number;   // 响应
  stability: number;  // 稳定
  lateral: number;    // 侧向
  torsion: number;    // 抗扭
  agility: number;    // 灵活
  cushion: number;    // 缓震
  landing: number;    // 落地
  durability: number; // 耐久
  courtFeel: number;  // 贴地
  lowDrop: number;    // 低落差偏好
}

const PLAY_NEED: Record<string, PlayNeed> = {
  rhythmChange: { drive: 0.7, response: 0.85, stability: 0.8, lateral: 0.9, torsion: 0.7, agility: 0.85, cushion: 0.5, landing: 0.6, durability: 0.5, courtFeel: 0.75, lowDrop: 0.6 },
  burstDrive: { drive: 0.95, response: 0.9, stability: 0.6, lateral: 0.6, torsion: 0.6, agility: 0.85, cushion: 0.45, landing: 0.55, durability: 0.5, courtFeel: 0.9, lowDrop: 0.85 },
  movingShot: { drive: 0.6, response: 0.8, stability: 0.65, lateral: 0.7, torsion: 0.55, agility: 0.75, cushion: 0.55, landing: 0.7, durability: 0.5, courtFeel: 0.7, lowDrop: 0.5 },
  offBallShot: { drive: 0.5, response: 0.75, stability: 0.6, lateral: 0.6, torsion: 0.5, agility: 0.8, cushion: 0.6, landing: 0.65, durability: 0.55, courtFeel: 0.6, lowDrop: 0.4 },
  guardAllRound: { drive: 0.75, response: 0.8, stability: 0.7, lateral: 0.75, torsion: 0.65, agility: 0.8, cushion: 0.6, landing: 0.65, durability: 0.6, courtFeel: 0.7, lowDrop: 0.55 },
  wingAllRound: { drive: 0.7, response: 0.7, stability: 0.8, lateral: 0.8, torsion: 0.75, agility: 0.7, cushion: 0.7, landing: 0.75, durability: 0.65, courtFeel: 0.55, lowDrop: 0.45 },
  driveAndShoot: { drive: 0.85, response: 0.8, stability: 0.7, lateral: 0.7, torsion: 0.65, agility: 0.75, cushion: 0.6, landing: 0.65, durability: 0.6, courtFeel: 0.7, lowDrop: 0.6 },
  defRebound: { drive: 0.4, response: 0.55, stability: 0.9, lateral: 0.75, torsion: 0.8, agility: 0.5, cushion: 0.75, landing: 0.85, durability: 0.75, courtFeel: 0.4, lowDrop: 0.3 },
  transition: { drive: 0.9, response: 0.8, stability: 0.65, lateral: 0.6, torsion: 0.6, agility: 0.85, cushion: 0.6, landing: 0.7, durability: 0.6, courtFeel: 0.65, lowDrop: 0.6 },
  dunkFinish: { drive: 0.9, response: 0.75, stability: 0.75, lateral: 0.65, torsion: 0.7, agility: 0.7, cushion: 0.7, landing: 0.9, durability: 0.65, courtFeel: 0.55, lowDrop: 0.5 },
  stretchBig: { drive: 0.5, response: 0.6, stability: 0.75, lateral: 0.6, torsion: 0.7, agility: 0.55, cushion: 0.8, landing: 0.8, durability: 0.7, courtFeel: 0.45, lowDrop: 0.35 },
  postAnchor: { drive: 0.4, response: 0.45, stability: 0.95, lateral: 0.85, torsion: 0.9, agility: 0.35, cushion: 0.9, landing: 0.9, durability: 0.85, courtFeel: 0.3, lowDrop: 0.25 },
  postUp: { drive: 0.5, response: 0.5, stability: 0.9, lateral: 0.8, torsion: 0.85, agility: 0.4, cushion: 0.85, landing: 0.85, durability: 0.8, courtFeel: 0.35, lowDrop: 0.3 },
  rimProtect: { drive: 0.55, response: 0.6, stability: 0.9, lateral: 0.8, torsion: 0.8, agility: 0.5, cushion: 0.85, landing: 0.95, durability: 0.8, courtFeel: 0.35, lowDrop: 0.3 },
  switchMobile: { drive: 0.65, response: 0.7, stability: 0.8, lateral: 0.85, torsion: 0.75, agility: 0.7, cushion: 0.75, landing: 0.8, durability: 0.7, courtFeel: 0.5, lowDrop: 0.4 },
};

function scorePlay(profile: UserProfile, shoe: Shoe): number {
  const need = PLAY_NEED[profile.play.primaryStyle];
  if (!need) return 0.7;

  const m = shoe.midsole;
  const s = shoe.stability;
  const a = shoe.agility;

  /* 低落差偏好：落差越小越符合 */
  const lowDropFit = clamp01(1 - shoe.midsole.dropMm / 14);

  return clamp01(
    t10(m.forefootDrive) * need.drive * 0.14 +
      t10(m.response) * need.response * 0.12 +
      t10(s.lateral) * need.lateral * 0.12 +
      t10(s.torsion) * need.torsion * 0.1 +
      t10(s.landing) * need.landing * 0.1 +
      t10(a.forefootFlex) * need.agility * 0.1 +
      t10(a.changeDirection) * need.agility * 0.08 +
      t10(m.cushionSoftness) * need.cushion * 0.08 +
      t10(shoe.durability) * need.durability * 0.06 +
      t10(m.courtFeel) * need.courtFeel * 0.05 +
      lowDropFit * need.lowDrop * 0.05
  ) * 1.0;
}

function scoreBody(profile: UserProfile, shoe: Shoe): number {
  const { body } = profile;

  /* 体重 → 缓震总量与稳定需求（非线性：越重需求越陡） */
  const weightNeed = clamp01((body.weightKg - 55) / 50); // 55→0, 105→1
  const cushionFit =
    t10(shoe.midsole.cushionSoftness) * (0.4 + weightNeed * 0.6) +
    t10(shoe.stability.landing) * weightNeed * 0.4;

  /* 爆发力 → 推进与响应 */
  const explosiveFit =
    t10(shoe.midsole.forefootDrive) * (body.explosive.level / 5) * 0.6 +
    t10(shoe.midsole.response) * (body.explosive.level / 5) * 0.4;

  /* 移动能力 → 灵活 */
  const mobilityFit =
    t10(shoe.agility.changeDirection) * (body.mobility.level / 5) * 0.6 +
    t10(shoe.agility.lateralFreedom) * (body.mobility.level / 5) * 0.4;

  /* 跑动能力 → 轻量 + 缓震衰减 */
  const weightFit = clamp01(1 - (shoe.weightG - 320) / 180);
  const runningFit = weightFit * (body.running.level / 5) * 0.6 + t10(shoe.midsole.cushionSoftness) * 0.4;

  /* 制动能力 → 制动抓地 */
  const brakingFit = t10(shoe.grip.braking) * (body.braking.level / 5);

  /* 对抗能力 → 稳定与保护 */
  const contactFit =
    t10(shoe.stability.lateral) * (body.contact.level / 5) * 0.5 +
    t10(shoe.protection.lateralContact) * (body.contact.level / 5) * 0.5;

  /* 落地稳定 → 落地保护 */
  const landingFit =
    t10(shoe.stability.landing) * (body.landingStability.level / 5) * 0.6 +
    t10(shoe.protection.landing) * 0.4;

  /* 自评数据降低可信度：向中性值收缩 */
  const selfRated =
    body.explosive.source === "selfReported" ||
    body.landingStability.source === "selfReported";
  const shrink = selfRated ? 0.85 : 1;

  const raw =
    cushionFit * 0.26 +
    explosiveFit * 0.16 +
    mobilityFit * 0.14 +
    runningFit * 0.14 +
    brakingFit * 0.12 +
    contactFit * 0.1 +
    landingFit * 0.08;

  return clamp01(0.5 + (raw - 0.5) * shrink);
}

function scoreFeel(profile: UserProfile, shoe: Shoe): number {
  const { preference, body } = profile;
  const m = shoe.midsole;

  /* 缓震偏好 → 目标软硬度（1=硬, 10=软） */
  const targetSoftness =
    preference.cushion === "soft" ? 8 : preference.cushion === "firm" ? 3 : 5.5;
  /* 体重大的人对软塌更敏感，收窄容忍度 */
  const weightTol = body.weightKg >= 90 ? 3.5 : 5;
  const cushionFit = near(m.cushionSoftness, targetSoftness, weightTol);

  /* 响应偏好 */
  const targetResp =
    preference.response === "fast" ? 9 : preference.response === "comfort" ? 4 : 6.5;
  const responseFit = near(m.response, targetResp, 6);

  /* 贴地偏好 */
  const targetFeel =
    preference.courtFeel === "ground" ? 9 : preference.courtFeel === "cushioned" ? 3 : 6;
  const courtFeelFit = near(m.courtFeel, targetFeel, 6);

  /* 滚动感需求 */
  const rollFit = near(m.rollFeel, 2 + preference.rollFeelNeed, 5);

  return clamp01(
    cushionFit * 0.36 + responseFit * 0.28 + courtFeelFit * 0.24 + rollFit * 0.12
  );
}

function scorePreference(profile: UserProfile, shoe: Shoe): number {
  const p = profile.preference;

  /* 鞋领偏好 */
  const collarFit =
    p.collar === shoe.upper.collar ? 1 : Math.abs(collarRank(p.collar) - collarRank(shoe.upper.collar)) === 1 ? 0.6 : 0.3;

  /* 重量敏感度：越敏感越要求轻 */
  const weightFit = clamp01(1 - (shoe.weightG - 320) / 180);
  const weightScore = weightFit * (p.weightSensitivity / 5) + 0.5 * (1 - p.weightSensitivity / 5);

  /* 包裹需求 */
  const wrapFit = near(shoe.upper.wrapStrength, 2 + p.wrapNeed, 5);

  /* 灵活需求 */
  const flexFit = near(shoe.agility.forefootFlex, 2 + p.flexibilityNeed, 5);

  /* 稳定感需求 */
  const stabFit = near(shoe.stability.lateral, 2 + p.stabilityFeelNeed, 5);

  /* 碳板偏好 */
  const plateFit =
    p.carbonPlatePref === "want"
      ? shoe.midsole.plate === "carbon"
        ? 1
        : shoe.midsole.plate === "tpu"
        ? 0.6
        : 0.3
      : p.carbonPlatePref === "avoid"
      ? shoe.midsole.plate === "carbon"
        ? 0.2
        : 1
      : 0.8;

  return clamp01(
    collarFit * 0.2 + weightScore * 0.22 + wrapFit * 0.18 + flexFit * 0.16 + stabFit * 0.14 + plateFit * 0.1
  );
}

function collarRank(c: "low" | "mid" | "high"): number {
  return c === "low" ? 0 : c === "mid" ? 1 : 2;
}

/** 参考鞋只做相似性微调，无固定权重（PRD 5.6 / 18） */
function scoreReference(profile: UserProfile, shoe: Shoe): number {
  const refs = profile.references;
  if (refs.length === 0) return 0.7;

  /* 以最喜欢的参考鞋为基准 */
  const best = [...refs].sort((a, b) => b.liked - a.liked)[0];
  if (!best.shoeId) return 0.7;
  if (best.shoeId === shoe.id) return 1;

  /* 同 category 视为相近 */
  const refShoe = profile.references.find((r) => r.shoeId === best.shoeId);
  if (!refShoe) return 0.7;

  /* 只做弱信号：不覆盖硬约束，也不主导排序 */
  const likedBoost = (best.liked - 3) / 10; // -0.2 ~ +0.2
  return clamp01(0.7 + likedBoost * 0.5);
}

/* ---------------------------------------------------------------------------
   综合评分
   --------------------------------------------------------------------------- */

export function scoreShoe(
  profile: UserProfile,
  shoe: Shoe,
  fc: FootConstraint
): Recommendation {
  const hard = runHardCheck(profile, shoe, fc);

  const breakdown: ScoreBreakdown = {
    foot: scoreFoot(profile, shoe, fc),
    injury: scoreInjury(profile, shoe),
    court: scoreCourt(profile, shoe),
    play: scorePlay(profile, shoe),
    body: scoreBody(profile, shoe),
    feel: scoreFeel(profile, shoe),
    preference: scorePreference(profile, shoe),
    reference: scoreReference(profile, shoe),
  };

  const weighted =
    breakdown.foot * WEIGHTS.foot +
    breakdown.injury * WEIGHTS.injury +
    breakdown.court * WEIGHTS.court +
    breakdown.play * WEIGHTS.play +
    breakdown.body * WEIGHTS.body +
    breakdown.feel * WEIGHTS.feel +
    breakdown.preference * WEIGHTS.preference +
    breakdown.reference * WEIGHTS.reference;

  /* 硬约束罚分 */
  const score01 = clamp01(weighted - hard.penalty);

  /* 第一层门槛：任一核心维度未达标，整体降档（非补偿） */
  const tierPassed =
    breakdown.foot >= FIRST_TIER_FLOOR.foot &&
    breakdown.injury >= FIRST_TIER_FLOOR.injury &&
    breakdown.court >= FIRST_TIER_FLOOR.court;

  const score = Math.round(score01 * 1000) / 10; // 0–100

  const dataGaps = collectDataGaps(profile, shoe);
  const { reasons, tradeoffs } = buildReasons(profile, shoe, breakdown, hard);

  /* 取舍兜底：PRD 8.4 要求展示取舍，无物理取舍时说明数据限制 */
  if (tradeoffs.length === 0) {
    if (shoe.evidence.status === "demo" || shoe.evidence.confidence === "low") {
      tradeoffs.push("主要限制在数据：该鞋款属性为演示数据，尚未实测校验，结论需试穿确认");
    } else {
      tradeoffs.push("在关键指标上未发现明显取舍，但鞋感存在个体差异，建议试穿");
    }
  }

  const grade = gradeOf({
    score,
    excluded: hard.excluded,
    tierPassed,
    confidence: shoe.evidence.confidence,
    status: shoe.evidence.status,
    dataGapCount: dataGaps.length,
  });

  return {
    shoe,
    score,
    breakdown,
    hard,
    tierPassed,
    grade,
    reasons,
    tradeoffs,
    dataGaps,
  };
}

/* ---------------------------------------------------------------------------
   文字等级（PRD 9）
   --------------------------------------------------------------------------- */

function gradeOf(args: {
  score: number;
  excluded: boolean;
  tierPassed: boolean;
  confidence: "high" | "medium" | "low" | "unknown";
  status: string;
  dataGapCount: number;
}): Grade {
  const { score, excluded, tierPassed, confidence, dataGapCount } = args;

  if (excluded) return "不建议";

  /* 数据严重不足 → 不给结论 */
  if (confidence === "unknown" || dataGapCount >= 4) return "暂无法判断";

  /* 第一层未达标：最高只能到「可考虑」（PRD 8.3 安全优先） */
  if (!tierPassed) {
    return score >= 60 ? "可考虑" : "谨慎考虑";
  }

  /* 低可信度不得生成「非常适合」（PRD 9） */
  const capHigh = confidence === "low";

  if (score >= 85 && !capHigh) return "非常适合";
  if (score >= 75) return "适合";
  if (score >= 65) return "可考虑";
  if (score >= 55) return "谨慎考虑";
  return "不建议";
}

/* ---------------------------------------------------------------------------
   数据缺口说明（PRD 7：必须说明具体维度与影响）
   --------------------------------------------------------------------------- */

function collectDataGaps(profile: UserProfile, shoe: Shoe): string[] {
  const gaps: string[] = [];

  const { left, right } = profile.foot;
  if (left.widthMm === null || right.widthMm === null) {
    gaps.push("缺少左右脚宽度实测，宽楦适配可信度降低");
  }
  if (left.lengthMm === null || right.lengthMm === null) {
    gaps.push("缺少脚长实测，尺码建议可信度降低");
  }

  if (shoe.evidence.status === "demo") {
    gaps.push("鞋款为演示数据，尚未实测校验");
  }
  if (shoe.evidence.confidence === "low") {
    gaps.push("鞋款属性可信度较低，结论仅供参考");
  }

  const env = profile.environment;
  if (env.court === "indoorWood" && env.indoor?.humid && shoe.grip.indoorWet <= 0) {
    gaps.push("该鞋款尚无潮湿木地板实测数据，无法给出强结论");
  }

  if (
    profile.body.explosive.source === "selfReported" ||
    profile.body.landingStability.source === "selfReported"
  ) {
    gaps.push("身体能力为自评，推进与落地适配结论可信度有限");
  }

  return gaps;
}

/* ---------------------------------------------------------------------------
   理由生成（三段式：你的特征 + 鞋的属性 + 边界）
   --------------------------------------------------------------------------- */

function buildReasons(
  profile: UserProfile,
  shoe: Shoe,
  b: ScoreBreakdown,
  hard: HardCheckResult
): { reasons: RecommendationReason[]; tradeoffs: string[] } {
  const reasons: RecommendationReason[] = [];
  const tradeoffs: string[] = [];
  const { foot, injury, play, environment, preference, body } = profile;

  /* --- 足部 --- */
  if (foot.forefoot.width === "veryWide" || foot.forefoot.width === "wide") {
    reasons.push({
      kind: "foot",
      text: `你前掌${foot.forefoot.width === "veryWide" ? "很宽" : "偏宽"}，这双宽脚适配 ${shoe.last.forefoot.wideFootFit}/10、前掌空间 ${shoe.last.forefoot.space}/10 —— 前掌不会被挤，但足中包裹 ${shoe.last.midfoot.wrap}/10${shoe.last.midfoot.wrap <= 6 ? "偏松，脚背高的人可能觉得空" : "够用"}`,
    });
  } else if (foot.forefoot.width === "narrow") {
    reasons.push({
      kind: "foot",
      text: `你前掌偏窄，这双窄脚适配 ${shoe.last.forefoot.narrowFootFit}/10、楦型为${shoe.last.overall === "narrow" ? "窄楦" : shoe.last.overall === "wide" ? "宽楦" : "正常楦"} —— ${shoe.last.forefoot.narrowFootFit >= 7 ? "包裹贴合，不会左右滑动" : "可能偏松，需要靠鞋带收紧"}`,
    });
  } else {
    reasons.push({
      kind: "foot",
      text: `你前掌为标准宽度，这双宽脚适配 ${shoe.last.forefoot.wideFootFit}/10、窄脚适配 ${shoe.last.forefoot.narrowFootFit}/10 —— ${Math.abs(shoe.last.forefoot.wideFootFit - shoe.last.forefoot.narrowFootFit) <= 3 ? "属于中性楦，标准脚型容错较高" : "楦型偏向一侧，标准脚可能略紧或略松"}`,
    });
  }

  /* 后跟锁定 */
  if (foot.heel.slipRisk >= 4) {
    reasons.push({
      kind: "foot",
      text: `你容易掉跟，这双后跟锁定 ${shoe.last.heel.lockdown}/10、掉跟风险 ${shoe.last.heel.slipRisk}/10 —— ${shoe.last.heel.lockdown >= 8 ? "锁定足够，急停时脚不会前冲" : "锁定一般，建议试穿确认"}`,
    });
  }

  /* --- 伤病 --- */
  if (injury.entries.length > 0) {
    const worst = [...injury.entries].sort((a, b) => b.severity - a.severity)[0];
    const areaLabel: Record<string, string> = {
      ankle: "脚踝", achilles: "跟腱", knee: "膝盖", acl: "前交叉韧带",
      plantar: "足底", arch: "足弓", forefoot: "前掌", other: "其他",
    };
    reasons.push({
      kind: "injury",
      text: `你有${areaLabel[worst.area] ?? "相关"}问题（${worst.state === "current" ? "当前" : worst.state === "recovering" ? "恢复中" : "既往"}，${worst.severity === 3 ? "较重" : worst.severity === 2 ? "中等" : "轻微"}），这双${collarLabel(shoe.upper.collar)}、脚踝保护 ${shoe.protection.ankle}/10、抗扭 ${shoe.stability.torsion}/10、落地稳定 ${shoe.stability.landing}/10 —— ${shoe.protection.ankle >= 7 ? "保护结构足够" : "保护偏基础，需自行加护具"}`,
    });
  }

  /* --- 场地 --- */
  const courtLabelMap = {
    indoorWood: "室内木地板",
    outdoorRubber: "室外橡胶",
    outdoorConcrete: "室外水泥",
  } as const;
  const envLabel = courtLabelMap[environment.court];

  if (environment.court === "indoorWood") {
    const cond = environment.indoor?.humid
      ? `潮湿条件抓地 ${shoe.grip.indoorWet}/10`
      : environment.indoor?.dusty
      ? `浮灰条件抓地 ${shoe.grip.indoorDusty}/10`
      : `干净木地板抓地 ${shoe.grip.indoorClean}/10`;
    reasons.push({
      kind: "court",
      text: `你主要在${envLabel}打球，这双${cond}、制动 ${shoe.grip.braking}/10 —— ${shoe.grip.braking >= 7 ? "急停与横移有保障" : "制动一般，湿滑天气要谨慎"}`,
    });
  } else {
    reasons.push({
      kind: "court",
      text: `你主要在${envLabel}打球，这双${environment.court === "outdoorConcrete" ? "水泥地" : "橡胶地"}抓地 ${environment.court === "outdoorConcrete" ? shoe.grip.outdoorConcrete : shoe.grip.outdoorRubber}/10、耐磨 ${shoe.durability}/10 —— ${shoe.durability >= 7 ? "外场磨损可控" : "耐磨一般，高强度外场会较快损耗"}`,
    });
  }

  /* --- 打法 --- */
  const styleText: Record<string, string> = {
    rhythmChange: "节奏变换",
    burstDrive: "突破爆发",
    movingShot: "移动投篮",
    offBallShot: "无球投篮",
    guardAllRound: "后卫全能",
    wingAllRound: "锋线全能",
    driveAndShoot: "突破投篮",
    defRebound: "防守篮板",
    transition: "转换冲击",
    dunkFinish: "扣篮终结",
    stretchBig: "空间型内线",
    postAnchor: "站桩对抗",
    postUp: "背打对抗",
    rimProtect: "护框快跳",
    switchMobile: "移动换防",
  };
  reasons.push({
    kind: "play",
    text: `你的主打法是${styleText[play.primaryStyle] ?? "综合型"}，这双前掌推进 ${shoe.midsole.forefootDrive}/10、响应 ${shoe.midsole.response}/10、侧向稳定 ${shoe.stability.lateral}/10 —— ${shoe.stability.lateral >= 8 ? "对抗与变向时底盘稳" : "侧向支撑一般，大幅变向需要提前减速"}`,
  });

  /* --- 身体 --- */
  reasons.push({
    kind: "body",
    text: `你体重 ${body.weightKg}kg、爆发力 ${body.explosive.level}/5、落地稳定 ${body.landingStability.level}/5，这双缓震软硬度 ${shoe.midsole.cushionSoftness}/10、落地稳定 ${shoe.stability.landing}/10 —— ${body.weightKg >= 90 ? (shoe.stability.landing >= 7 ? "能接住你的落地冲击" : "缓震够但落地支撑偏弱，长时间打会累") : "缓震量对你的体重够用，不会拖沓"}`,
  });

  /* --- 脚感 --- */
  const cushionText =
    preference.cushion === "soft" ? "偏软" : preference.cushion === "firm" ? "偏硬" : "平衡";
  reasons.push({
    kind: "feel",
    text: `你偏好${cushionText}脚感，这双中底软硬度 ${shoe.midsole.cushionSoftness}/10、贴地感 ${shoe.midsole.courtFeel}/10 —— ${Math.abs(shoe.midsole.cushionSoftness - (preference.cushion === "soft" ? 8 : preference.cushion === "firm" ? 3 : 5.5)) <= 2 ? "与你的偏好接近" : "手感会有偏差，建议试穿"}`,
  });

  /* --- 取舍 --- */
  if (shoe.weightG > 410 && (environment.format === "full" || environment.format === "both")) {
    tradeoffs.push(`单只 ${shoe.weightG}g，打全场时后半段会有明显负担`);
  }
  if (shoe.midsole.cushionSoftness >= 8 && body.weightKg >= 85) {
    tradeoffs.push(`中底偏软，以你 ${body.weightKg}kg 的体重长期使用支撑会衰减`);
  }
  if (shoe.last.forefoot.wideFootFit <= 4 && foot.forefoot.width === "standard") {
    tradeoffs.push("楦型偏窄，标准脚刚穿会偏紧，需要磨合");
  }
  if (shoe.grip.braking <= 5) {
    tradeoffs.push("制动一般，湿滑场地需要控制急停幅度");
  }
  if (shoe.durability <= 5 && environment.court !== "indoorWood") {
    tradeoffs.push(`耐磨 ${shoe.durability}/10，室外使用损耗较快`);
  }
  if (shoe.upper.collar === "low" && injury.entries.some((e) => e.area === "ankle")) {
    tradeoffs.push("低帮设计，脚踝保护依赖你自己的控制与护具");
  }
  if (hard.triggers.length > 0 && !hard.excluded) {
    tradeoffs.push(...hard.triggers.slice(0, 2));
  }

  return { reasons, tradeoffs };
}

/* ---------------------------------------------------------------------------
   主函数：输出三双（PRD 8.4）
   --------------------------------------------------------------------------- */

export function recommend(
  profile: UserProfile,
  shoes: Shoe[],
  options?: { ruleVersion?: string; shoeDataVersion?: string; adjust?: (all: Recommendation[]) => void }
): RecommendationResult {
  const fc = deriveFootConstraint(profile);

  const all = shoes.map((s) => scoreShoe(profile, s, fc));
  options?.adjust?.(all);

  /* 候选：未硬排除、数据足够、且不是「不建议」 */
  const candidates = all.filter(
    (r) => !r.hard.excluded && r.grade !== "暂无法判断"
  );

  /* 分数归一化（PRD 8.1 内部分数用于调试）
     ★ 演示鞋库下绝对分天然集中在 55–70，直接展示无区分度。
       按本批候选的相对分布拉伸到 55–95，使 Top1 具备可读性，
       但等级判定仍受第一层门槛与数据可信度约束。 */
  normalizeScores(candidates);

  const passed = candidates
    .filter((r) => r.grade !== "不建议")
    .sort((a, b) => b.score - a.score);

  const excluded = all.filter(
    (r) => r.hard.excluded || r.grade === "暂无法判断" || r.grade === "不建议"
  );

  /* 选取三双：最适合 / 平衡 / 取舍 */
  const slots: { slot: RecommendSlot; item: Recommendation }[] = [];

  const best = passed[0];
  if (best) slots.push({ slot: "best", item: best });

  const rest = passed.slice(1);

  /* 平衡选择：分数不低于第一推荐的 88%，且各维度方差最小（没有明显短板） */
  const floor = best ? best.score * 0.88 : 0;
  const balanced =
    [...rest]
      .filter((r) => r.score >= floor)
      .sort((a, b) => variance(a.breakdown) - variance(b.breakdown))[0] ?? rest[0];

  if (balanced) {
    balanced.whyNotFirst = whyNot(balanced, best);
    slots.push({ slot: "balanced", item: balanced });
  }

  /* 取舍选择：核心维度达标，但在非核心维度有明显取舍
     ★ 必须 tierPassed，避免把「整体最差」误标为「取舍方案」 */
  const tradeoffPick =
    [...rest]
      .filter((r) => r !== balanced && r.tierPassed)
      .sort((a, b) => {
        const ta = a.tradeoffs.length + (1 - a.breakdown.preference) * 2;
        const tb = b.tradeoffs.length + (1 - b.breakdown.preference) * 2;
        return tb - ta;
      })[0] ??
    [...rest]
      .filter((r) => r !== balanced)
      .sort((a, b) => b.score - a.score)[0];

  if (tradeoffPick) {
    tradeoffPick.whyNotFirst = whyNot(tradeoffPick, best);
    slots.push({ slot: "tradeoff", item: tradeoffPick });
  }

  /* 通过不足三双时，从「无硬冲突但分数偏低」的鞋中补充，标注为仅供参考
     （PRD 8.2：可完全排除或降级为仅供参考） */
  if (slots.length < 3) {
    const fillers = all
      .filter(
        (r) =>
          !r.hard.excluded &&
          r.grade === "不建议" &&
          !slots.some((s) => s.item === r)
      )
      .sort((a, b) => b.score - a.score);

    for (const f of fillers) {
      if (slots.length >= 3) break;
      f.grade = "谨慎考虑";
      f.whyNotFirst =
        "无硬性冲突，但综合匹配度偏低；仅在你对现有推荐都不满意时参考";
      f.tradeoffs.unshift("匹配度偏低，属于补充选项，不建议作为首选");
      slots.push({ slot: slots.length === 1 ? "balanced" : "tradeoff", item: f });
    }
  }

  /* 全局数据缺口 */
  const globalGaps: string[] = [];
  if (shoes.every((s) => s.evidence.status === "demo")) {
    globalGaps.push("当前鞋库全部为演示数据，所有结论均受数据质量限制");
  }
  if (passed.length < 3) {
    globalGaps.push(
      `通过硬约束的鞋款只有 ${passed.length} 双，不足三双；说明你的条件较严格，或鞋库覆盖不足`
    );
  }

  return {
    recommendAt: Date.now(),
    ruleVersion: options?.ruleVersion ?? RULE_VERSION,
    shoeDataVersion: options?.shoeDataVersion ?? "demo",
    profileSnapshot: profile,
    slots,
    excluded: excluded.sort((a, b) => b.score - a.score),
    globalGaps,
  };
}

function variance(b: ScoreBreakdown): number {
  const vals = Object.values(b);
  const mean = vals.reduce((x, y) => x + y, 0) / vals.length;
  return vals.reduce((x, y) => x + (y - mean) ** 2, 0) / vals.length;
}

/** 按本批候选的相对分布把原始分拉伸到 55–95，并重算文字等级 */
function normalizeScores(items: Recommendation[]): void {
  if (items.length === 0) return;

  const raw = items.map((r) => r.score);
  const min = Math.min(...raw);
  const max = Math.max(...raw);
  const span = max - min;

  for (const item of items) {
    /* 单双候选时给 85 分（无参照，不给满分） */
    const t = span > 0.5 ? (item.score - min) / span : 0.75;
    const normalized = 55 + t * 40;

    item.score = Math.round(normalized * 10) / 10;
    item.grade = gradeOf({
      score: item.score,
      excluded: false,
      tierPassed: item.tierPassed,
      confidence: item.shoe.evidence.confidence,
      status: item.shoe.evidence.status,
      dataGapCount: item.dataGaps.length,
    });
  }
}

function whyNot(item: Recommendation, best?: Recommendation): string {
  if (!best) return "—";
  const diffs: string[] = [];
  const b = best.breakdown;
  const i = item.breakdown;

  if (b.foot - i.foot > 0.08) diffs.push("足部适配不如第一推荐");
  if (b.injury - i.injury > 0.08) diffs.push("保护性略低");
  if (b.court - i.court > 0.08) diffs.push("场地抓地匹配稍弱");
  if (b.play - i.play > 0.08) diffs.push("与你的打法契合度稍低");
  if (b.feel - i.feel > 0.08) diffs.push("脚感与你的偏好有偏差");

  if (diffs.length === 0) {
    return `综合分接近第一推荐（${best.score.toFixed(0)} vs ${item.score.toFixed(0)}），差异主要在细节取舍`;
  }
  return `相比第一推荐，这双在${diffs.join("、")}上有差距`;
}

/* ---------------------------------------------------------------------------
   尺码建议（PRD 5.2：结合实际穿着尺码）
   --------------------------------------------------------------------------- */

export interface SizeAdvice {
  side: "left" | "right";
  footLengthMm: number;
  suggestedEu: number;
  note: string;
}

export function suggestSize(profile: UserProfile, shoe: Shoe): SizeAdvice[] {
  const out: SizeAdvice[] = [];
  const pairs: { side: "left" | "right"; mm: number | null; usual: number | null }[] = [
    { side: "left", mm: profile.foot.left.lengthMm, usual: profile.foot.left.usualSize },
    { side: "right", mm: profile.foot.right.lengthMm, usual: profile.foot.right.usualSize },
  ];

  for (const p of pairs) {
    if (!p.mm) continue;
    /* 内长按 42 码基准，每码约 6.67mm */
    const delta = (p.mm - shoe.sizeGuide.internalLengthMm) / 6.67;
    const raw = shoe.sizeGuide.baseSizeEu + delta + shoe.sizeGuide.brandBiasEu;
    const suggestedEu = Math.round(raw * 2) / 2;

    let note = "按实测脚长推荐";
    if (p.usual && Math.abs(suggestedEu - p.usual) >= 1) {
      note = `与你常穿 ${p.usual} 码相差 ${(suggestedEu - p.usual).toFixed(1)} 码，建议试穿`;
    }
    if (delta > 0.6) note += "；该款偏小，建议大半码";

    out.push({ side: p.side, footLengthMm: p.mm, suggestedEu, note });
  }
  return out;
}
