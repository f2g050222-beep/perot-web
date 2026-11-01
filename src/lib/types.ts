/* ============================================================================
   PEROT 领域类型定义（PRD v1 对齐版）
   ============================================================================
   依据：PEROT期中考试/PRD.md 第 5–7 章、第 10 章、第 16 章
   原则：
   1. 左右脚独立存储，适配以「更需要空间的一侧」为准
   2. 身体能力为多个独立等级，禁止合成单一总分
   3. 鞋款按前掌 / 足中 / 后跟三区独立记录
   4. 每个关键字段带来源、可信度、状态元数据
   5. 用户侧只输出文字等级，不输出分数
   ============================================================================ */

/* ---------------------------------------------------------------------------
   证据元数据（PRD 7）
   --------------------------------------------------------------------------- */

export type EvidenceSource =
  | "official"      // 官方资料
  | "measured"      // 实测
  | "admin"         // 管理员录入
  | "userSelf"      // 用户自评
  | "userFeedback"  // 用户反馈
  | "inferred";     // 推断

export type Confidence = "high" | "medium" | "low" | "unknown";

export type DataStatus =
  | "verified"       // 已验证
  | "pending"        // 待验证
  | "missing"        // 缺失
  | "notApplicable"  // 不适用
  | "demo";          // 演示数据

export interface DataEvidence {
  source: EvidenceSource;
  confidence: Confidence;
  status: DataStatus;
  updatedAt: string;
  version: string;
}

/* ---------------------------------------------------------------------------
   文字等级（PRD 9）
   --------------------------------------------------------------------------- */

export type Grade =
  | "非常适合"
  | "适合"
  | "可考虑"
  | "谨慎考虑"
  | "不建议"
  | "暂无法判断";

/* ---------------------------------------------------------------------------
   5.1 基础身体与运动能力
   --------------------------------------------------------------------------- */

export type Gender = "male" | "female";

/** 能力等级 1–5。测试数据优先，自评标记来源。 */
export type AbilityLevel = 1 | 2 | 3 | 4 | 5;

export interface AbilityScore {
  level: AbilityLevel;
  /** tested = 标准化测试，selfReported = 自评（可信度较低） */
  source: "tested" | "selfReported";
}

export interface BodyAbilityProfile {
  age: number;
  gender: Gender;
  heightCm: number;
  weightKg: number;
  /** 六个独立能力等级，不合成总分 */
  explosive: AbilityScore;        // 爆发力
  mobility: AbilityScore;         // 移动能力
  running: AbilityScore;          // 跑动能力
  braking: AbilityScore;          // 制动能力
  contact: AbilityScore;          // 对抗能力
  landingStability: AbilityScore; // 落地稳定能力
  /* 以下仅用于履历与辅助解释，默认不参与排序 */
  frequencyPerWeek: number;
  sessionMinutes: number;
  experienceYears: number;
}

/* ---------------------------------------------------------------------------
   5.2 足部与脚型 —— 左右脚独立
   --------------------------------------------------------------------------- */

export type ForefootWidth = "narrow" | "standard" | "wide" | "veryWide";
export type ArchType = "low" | "medium" | "high";
export type InstepHeight = "low" | "medium" | "high";
export type LastPreference = "normal" | "wide" | "narrow";

/** 单侧脚数据 */
export interface FootSide {
  lengthMm: number | null;
  widthMm: number | null;
  /** 系统建议尺码（EU） */
  suggestedSize: number | null;
  /** 用户常穿尺码（EU） */
  usualSize: number | null;
}

export interface FootProfile {
  left: FootSide;
  right: FootSide;

  /* 前掌 */
  forefoot: {
    width: ForefootWidth;
    /** 空间需求 1–5 */
    spaceNeed: 1 | 2 | 3 | 4 | 5;
    /** 压迫感 1–5，5 = 极易被挤 */
    pressureSensitivity: 1 | 2 | 3 | 4 | 5;
  };

  /* 足中 */
  midfoot: {
    wrapNeed: 1 | 2 | 3 | 4 | 5;
    arch: ArchType;
    archSupportNeed: 1 | 2 | 3 | 4 | 5;
  };

  /* 后跟 */
  heel: {
    /** 掉跟风险 1–5，5 = 极易掉跟 */
    slipRisk: 1 | 2 | 3 | 4 | 5;
    lockdownNeed: 1 | 2 | 3 | 4 | 5;
  };

  /* 脚背 */
  instep: {
    height: InstepHeight;
    /** 鞋带区压力敏感度 1–5 */
    lacePressureSensitivity: 1 | 2 | 3 | 4 | 5;
  };

  lastPreference: LastPreference;
}

/** 以「更需要空间的一侧」为准，供算法使用 */
export interface FootConstraint {
  lengthMm: number;
  widthMm: number;
  /** 哪一侧决定了约束 */
  governingSide: "left" | "right";
  /** 左右差异是否显著（长度 > 5mm 或宽度 > 3mm） */
  asymmetry: boolean;
  notes: string[];
}

/* ---------------------------------------------------------------------------
   5.3 伤病与保护需求
   --------------------------------------------------------------------------- */

export type InjuryArea =
  | "ankle"
  | "achilles"
  | "knee"
  | "acl"
  | "plantar"
  | "arch"
  | "forefoot"
  | "other";

export type InjuryState = "current" | "history" | "recovering";

export interface InjuryEntry {
  area: InjuryArea;
  state: InjuryState;
  /** 1 轻微 / 2 中等 / 3 严重 */
  severity: 1 | 2 | 3;
  note?: string;
}

export interface InjuryRestrictions {
  /** 前后落差限制 */
  dropLimit: "lowOnly" | "any";
  /** 鞋领硬需求（null = 无硬需求） */
  collarRequired: "mid" | "high" | null;
  cushionRequired: boolean;
  torsionRequired: boolean;
  /** 是否要求避开碳板（部分用户不适） */
  carbonPlateAvoid: boolean;
}

export interface InjuryProfile {
  entries: InjuryEntry[];
  restrictions: InjuryRestrictions;
}

/* ---------------------------------------------------------------------------
   5.4 位置与打法
   --------------------------------------------------------------------------- */

export type Position = "PG" | "SG" | "SF" | "PF" | "C";

export type PlayStyleTag =
  // 后卫
  | "rhythmChange"   // 节奏变换
  | "burstDrive"     // 突破爆发
  | "movingShot"     // 移动投篮
  | "offBallShot"    // 无球投篮
  | "guardAllRound"  // 后卫全能
  // 锋线
  | "wingAllRound"   // 锋线全能
  | "driveAndShoot"  // 突破投篮
  | "defRebound"     // 防守篮板
  | "transition"     // 转换冲击
  | "dunkFinish"     // 扣篮终结
  // 内线
  | "stretchBig"     // 空间型
  | "postAnchor"     // 站桩对抗
  | "postUp"         // 背打对抗
  | "rimProtect"     // 护框快跳
  | "switchMobile";  // 移动换防与快下

export type PlayAction =
  | "onBall"
  | "pickAndRoll"
  | "crossover"
  | "stepBack"
  | "lateralDefense"
  | "jumpLanding"
  | "paintContact";

export interface PlayStyleProfile {
  position: Position;
  primaryStyle: PlayStyleTag;
  secondaryStyle?: PlayStyleTag;
  actions: PlayAction[];
}

/* ---------------------------------------------------------------------------
   5.5 场地与使用方式
   --------------------------------------------------------------------------- */

export type GameFormat = "half" | "full" | "both";

export type MovementType =
  | "straight"
  | "lateral"
  | "crossover"
  | "stepBack"
  | "jumpLanding";

export type CourtType = "indoorWood" | "outdoorRubber" | "outdoorConcrete";

export interface IndoorCondition {
  region?: "north" | "south";
  season?: "spring" | "summer" | "autumn" | "winter";
  /** 潮湿 / 梅雨 */
  humid: boolean;
  /** 浮灰 */
  dusty: boolean;
}

export type OutdoorWear = "low" | "medium" | "high";

export interface EnvironmentProfile {
  format: GameFormat;
  movement: MovementType[];
  court: CourtType;
  indoor?: IndoorCondition;
  outdoorWear?: OutdoorWear;
}

/* ---------------------------------------------------------------------------
   5.6 脚感与主观偏好
   --------------------------------------------------------------------------- */

export type CushionPref = "soft" | "balanced" | "firm";
export type ResponsePref = "fast" | "balanced" | "comfort";
export type CourtFeelPref = "ground" | "balanced" | "cushioned";
export type CollarPref = "low" | "mid" | "high";

export interface PreferenceProfile {
  cushion: CushionPref;
  response: ResponsePref;
  courtFeel: CourtFeelPref;
  collar: CollarPref;
  /** 以下 1–5，3 为中性 */
  wrapNeed: 1 | 2 | 3 | 4 | 5;
  flexibilityNeed: 1 | 2 | 3 | 4 | 5;
  rollFeelNeed: 1 | 2 | 3 | 4 | 5;
  stabilityFeelNeed: 1 | 2 | 3 | 4 | 5;
  weightSensitivity: 1 | 2 | 3 | 4 | 5;
  carbonPlatePref: "want" | "neutral" | "avoid";
}

/** 参考鞋体验（PRD 5.6：仅作相似性微调，无固定权重） */
export interface ReferenceShoeExperience {
  shoeId?: string;
  name: string;
  /** 喜欢程度 1–5 */
  liked: 1 | 2 | 3 | 4 | 5;
  /** 适配程度 1–5 */
  fit: 1 | 2 | 3 | 4 | 5;
  dislikes: string[];
  court: CourtType;
}

/* ---------------------------------------------------------------------------
   完整画像（一次测评的输入）
   --------------------------------------------------------------------------- */

export interface UserProfile {
  body: BodyAbilityProfile;
  foot: FootProfile;
  injury: InjuryProfile;
  play: PlayStyleProfile;
  environment: EnvironmentProfile;
  preference: PreferenceProfile;
  references: ReferenceShoeExperience[];
}

/* ---------------------------------------------------------------------------
   6. 球鞋结构化数据库
   --------------------------------------------------------------------------- */

export type ShoeCategory = "guard" | "wing" | "big" | "allRound";
export type Collar = "low" | "mid" | "high";
export type LastType = "normal" | "wide" | "narrow";
export type PlateType = "none" | "tpu" | "carbon";

/** 6.2 鞋楦三区 */
export interface ShoeLast {
  forefoot: {
    lastWidth: number;       // 楦宽 1–10
    space: number;           // 前掌空间 1–10
    pressureRisk: number;    // 压迫风险 1–10（越高越易压）
    wideFootFit: number;     // 宽脚适配 1–10
    narrowFootFit: number;   // 窄脚适配 1–10
  };
  midfoot: {
    wrap: number;            // 包裹 1–10
    archSpace: number;       // 足弓空间 1–10
    lacePressure: number;    // 鞋带区压力 1–10（越高越压）
    lockdown: number;        // 足中锁定 1–10
  };
  heel: {
    width: number;           // 后跟宽度 1–10
    lockdown: number;        // 锁定 1–10
    slipRisk: number;        // 掉跟风险 1–10
    space: number;           // 后跟空间 1–10
  };
  overall: LastType;
}

/** 6.3 鞋面与鞋领 */
export interface ShoeUpper {
  rigidity: number;          // 鞋面刚性 1–10
  stretch: number;           // 延展性 1–10
  wrapStrength: number;      // 包裹强度 1–10
  lateralSupport: number;    // 侧向支撑 1–10
  pressureRisk: number;      // 鞋面压迫风险 1–10
  collar: Collar;
  collarDesign: string;
}

/** 6.4 中底与脚感 */
export interface ShoeMidsole {
  cushionSoftness: number;   // 缓震软硬 1(硬)–10(软)
  response: number;          // 响应速度 1–10
  rebound: number;           // 回弹 1–10
  forefootDrive: number;     // 前掌推进 1–10
  rollFeel: number;          // 滚动感 1–10
  courtFeel: number;         // 贴地感 1–10
  stackHeight: number;       // 鞋底厚薄 1(薄)–10(厚)
  dropMm: number;            // 前后落差 mm
  plate: PlateType;
  plateRigidity: number;     // 碳板/抗扭结构刚性 1–10
}

/** 6.5 稳定 */
export interface ShoeStability {
  lateral: number;           // 横向稳定 1–10
  landing: number;           // 落地稳定 1–10
  centerHeight: number;      // 重心高度 1(低)–10(高)
  baseWidth: number;         // 底盘宽度 1–10
  antiRoll: number;          // 防侧翻 1–10
  torsion: number;           // 抗扭 1–10
}

/** 6.5 抓地 —— 按条件分别记录（PRD 强制） */
export interface ShoeGrip {
  indoorClean: number;       // 干净木地板 1–10
  indoorDusty: number;       // 浮灰木地板 1–10
  indoorWet: number;         // 潮湿木地板 1–10
  outdoorRubber: number;     // 室外橡胶 1–10
  outdoorConcrete: number;   // 室外水泥 1–10
  braking: number;           // 制动 1–10
}

/** 6.5 灵活与保护 */
export interface ShoeAgility {
  forefootFlex: number;      // 前掌弯折 1–10
  lateralFreedom: number;    // 横移自由度 1–10
  changeDirection: number;   // 变向自由度 1–10
}

export interface ShoeProtection {
  ankle: number;             // 脚踝保护 1–10
  foot: number;              // 足部保护 1–10
  landing: number;           // 落地保护 1–10
  lateralContact: number;    // 横向对抗保护 1–10
}

export interface Shoe {
  id: string;
  brand: string;
  name: string;
  generation: string;
  year: number;
  imageUrl?: string;
  colors: string[];
  category: ShoeCategory;
  /** 一句话定位，非营销文案 */
  positioning: string;

  evidence: DataEvidence;

  /** 尺码基准：内长 mm（用于尺码推荐） */
  sizeGuide: {
    baseSizeEu: number;
    internalLengthMm: number;
    /** 品牌尺码偏差（正数 = 偏大） */
    brandBiasEu: number;
  };

  weightG: number;
  weightBaseSizeEu: number;
  /** 价格预留字段，PRD 明确不参与推荐计算 */
  price?: number;

  last: ShoeLast;
  upper: ShoeUpper;
  midsole: ShoeMidsole;
  stability: ShoeStability;
  grip: ShoeGrip;
  agility: ShoeAgility;
  protection: ShoeProtection;
  durability: number;        // 耐磨 1–10
}

/* ---------------------------------------------------------------------------
   8.4 推荐结果
   --------------------------------------------------------------------------- */

export type ReasonKind =
  | "foot"        // 足部适配
  | "injury"      // 伤病保护
  | "court"       // 场地
  | "play"        // 打法
  | "body"        // 身体与能力
  | "feel"        // 脚感
  | "preference"  // 偏好
  | "reference"   // 参考鞋
  | "tradeoff";   // 取舍

export interface RecommendationReason {
  kind: ReasonKind;
  /** 用户侧可读的一句话，必须含因果与边界 */
  text: string;
}

/** 硬约束检查结果 */
export interface HardCheckResult {
  /** 是否被完全排除 */
  excluded: boolean;
  /** 触发的原因（人类可读） */
  triggers: string[];
  /** 未排除但需降级的扣分 0–1 */
  penalty: number;
}

export interface ScoreBreakdown {
  foot: number;
  injury: number;
  court: number;
  play: number;
  body: number;
  feel: number;
  preference: number;
  reference: number;
}

export interface Recommendation {
  shoe: Shoe;
  /** 内部 0–100 分，仅管理端/调试可见 */
  score: number;
  breakdown: ScoreBreakdown;
  hard: HardCheckResult;
  /** 第一层（足部/伤病/场地）是否全部达标，用于等级降档 */
  tierPassed: boolean;
  grade: Grade;
  reasons: RecommendationReason[];
  /** 取舍与注意事项 */
  tradeoffs: string[];
  /** 数据缺失导致的可信度下降说明（PRD 7） */
  dataGaps: string[];
  /** 为什么不是第一推荐（第 2、3 双必填） */
  whyNotFirst?: string;
}

export type RecommendSlot = "best" | "balanced" | "tradeoff";

export interface RecommendationResult {
  recommendAt: number;
  ruleVersion: string;
  shoeDataVersion: string;
  profileSnapshot: UserProfile;
  /** 固定三双 */
  slots: { slot: RecommendSlot; item: Recommendation }[];
  /** 被硬约束排除的鞋，用于向用户解释 */
  excluded: Recommendation[];
  /** 全局数据不足提示 */
  globalGaps: string[];
}
