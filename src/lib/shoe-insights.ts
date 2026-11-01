/* 鞋库 / 详情 / 对比共用的派生数据（只读 src/data/shoes.ts，不改原匹配逻辑） */
import { SHOES, SHOE_DATA_VERSION } from "@/data/shoes";
import type { Recommendation, Shoe, ShoeCategory } from "./types";
import { recommend, RULE_VERSION } from "./matching";
import { loadDraft } from "./profile-store";
import { isProfileComplete } from "./assess-validation";
import { feedbackRepo } from "./feedback-store";
import { adjustProfileByFeedback, feedbackScoreHook } from "./feedback-adjust";
import { getCurrentUserId } from "./user-session";

export const DIMS = [
  { key: "cushioning", label: "缓震" },
  { key: "response", label: "响应" },
  { key: "traction", label: "抓地" },
  { key: "stability", label: "稳定" },
  { key: "lockdown", label: "锁定" },
  { key: "courtFeel", label: "贴地感" },
] as const;
export type DimKey = (typeof DIMS)[number]["key"];

const avg = (...n: number[]) => Math.round((n.reduce((a, b) => a + b, 0) / n.length) * 10) / 10;

export function dims(s: Shoe): Record<DimKey, number> {
  return {
    cushioning: s.midsole.cushionSoftness,
    response: s.midsole.response,
    traction: avg(s.grip.indoorClean, s.grip.indoorDusty, s.grip.braking),
    stability: avg(s.stability.lateral, s.stability.landing, s.stability.antiRoll),
    lockdown: avg(s.last.midfoot.lockdown, s.last.heel.lockdown, s.upper.wrapStrength),
    courtFeel: s.midsole.courtFeel,
  };
}

export const POS_LABEL: Record<ShoeCategory, string> = { guard: "后卫", wing: "锋线", big: "内线", allRound: "全能" };

export type Tier = "entry" | "mid" | "flagship";
export const TIER_LABEL: Record<Tier, string> = { entry: "入门价位", mid: "中端价位", flagship: "旗舰价位" };
export function tier(s: Shoe): Tier {
  const p = s.price ?? 0;
  return p < 1200 ? "entry" : p < 1700 ? "mid" : "flagship";
}

export type CushionFeel = "soft" | "balanced" | "firm";
export const CUSHION_LABEL: Record<CushionFeel, string> = { soft: "偏软缓震", balanced: "软硬均衡", firm: "偏硬贴地" };
export function cushionFeel(s: Shoe): CushionFeel {
  const c = s.midsole.cushionSoftness;
  return c >= 7 ? "soft" : c <= 4 ? "firm" : "balanced";
}

export const TRAITS: { key: string; label: string; test: (s: Shoe) => boolean }[] = [
  { key: "wide", label: "宽脚友好", test: (s) => s.last.forefoot.wideFootFit >= 7 },
  { key: "narrow", label: "窄脚贴合", test: (s) => s.last.forefoot.narrowFootFit >= 8 },
  { key: "outdoor", label: "外场耐磨", test: (s) => s.grip.outdoorRubber >= 7 || s.durability >= 7 },
  { key: "carbon", label: "碳板推进", test: (s) => s.midsole.plate === "carbon" },
  { key: "high", label: "高帮保护", test: (s) => s.upper.collar === "high" },
  { key: "light", label: "轻量", test: (s) => s.weightG < 380 },
  { key: "soft", label: "强缓震", test: (s) => s.midsole.cushionSoftness >= 7 },
  { key: "fast", label: "快响应", test: (s) => s.midsole.response >= 8 },
];
export const traitsOf = (s: Shoe) => TRAITS.filter((t) => t.test(s));

export const COLLAR_LABEL = { low: "低帮", mid: "中帮", high: "高帮" } as const;
export const PLATE_LABEL = { none: "无板", tpu: "TPU 抗扭片", carbon: "碳板" } as const;
export const LAST_LABEL = { normal: "标准楦", wide: "宽楦", narrow: "窄楦" } as const;

/** 品牌色调（仅用于插画色块） */
export function tone(s: Shoe): string {
  const t: Record<string, string> = { Nike: "#d9d6cc", Jordan: "#c9c2b2", adidas: "#e4e2dc" };
  return t[s.brand] ?? "#dcd9d0";
}

export type Match = { score: number; grade: string; reasons: string[]; tradeoffs: string[]; excluded: boolean; triggers: string[] };

/** 有完整画像时，计算每双鞋的匹配度（含穿着反馈调整层） */
export function computeMatches(): Record<string, Match> | null {
  if (typeof window === "undefined") return null;
  const p = loadDraft();
  if (!p || !isProfileComplete(p)) return null;
  const fbs = feedbackRepo.listByUser(getCurrentUserId());
  const hook = feedbackScoreHook(fbs, SHOES);
  let all: Recommendation[] = [];
  recommend(adjustProfileByFeedback(p, fbs), SHOES, {
    ruleVersion: RULE_VERSION,
    shoeDataVersion: SHOE_DATA_VERSION,
    adjust: (a) => { hook(a); all = a; },
  });
  return Object.fromEntries(all.map((r) => [r.shoe.id, {
    score: Math.round(r.score), grade: r.grade, reasons: r.reasons.map((x) => x.text), tradeoffs: r.tradeoffs,
    excluded: r.hard.excluded || r.grade === "不建议" || r.grade === "暂无法判断", triggers: r.hard.triggers,
  }]));
}

/** 按六维性能的欧氏距离找相似鞋 */
export function similar(s: Shoe, n = 4): Shoe[] {
  const a = dims(s);
  return SHOES.filter((x) => x.id !== s.id)
    .map((x) => { const b = dims(x); return { x, d: DIMS.reduce((t, k) => t + (a[k.key] - b[k.key]) ** 2, 0) }; })
    .sort((p, q) => p.d - q.d).slice(0, n).map((o) => o.x);
}

/** 适合谁：由结构化数据推导的句子 */
export function suitsWho(s: Shoe): string[] {
  const out: string[] = [];
  const d = dims(s);
  if (s.category === "guard") out.push("持球突破、急停变向多的后卫型球员");
  if (s.category === "wing") out.push("需要攻守均衡、对抗与速度兼顾的锋线球员");
  if (s.category === "big") out.push("体重较大、落地冲击多、内线对抗频繁的球员");
  if (s.category === "allRound") out.push("位置不固定、什么都做一点的全能型球员");
  if (d.cushioning >= 7) out.push("膝盖或足底需要更多保护的球员");
  if (d.courtFeel >= 7) out.push("喜欢贴地、反馈清晰脚感的球员");
  if (s.last.forefoot.wideFootFit >= 7) out.push("前掌偏宽、怕挤脚的球员");
  if (s.last.forefoot.narrowFootFit >= 8) out.push("脚型偏窄、追求紧密包裹的球员");
  if (s.grip.outdoorRubber >= 7 || s.durability >= 7) out.push("经常在室外水泥或塑胶场打球的球员");
  return out;
}

/** 合脚提示：由三区楦型数据推导 */
export function fitNotes(s: Shoe): string[] {
  const out: string[] = [];
  const f = s.last.forefoot, m = s.last.midfoot, h = s.last.heel;
  if (f.space <= 4) out.push("前掌空间偏小，宽脚建议线下试穿或考虑加半码。");
  if (f.space >= 8) out.push("前掌空间充裕，窄脚可能需要系紧鞋带避免前后滑动。");
  if (m.lacePressure >= 7) out.push("鞋带区压力偏高，高脚背需注意勒脚背。");
  if (m.archSpace <= 4) out.push("足弓空间偏低，高足弓可能有顶足弓感。");
  if (h.slipRisk >= 6) out.push("后跟掉跟风险偏高，建议使用最后一个鞋带孔加强锁定。");
  if (h.lockdown >= 8) out.push("后跟锁定扎实，急停时脚跟稳定。");
  if (s.sizeGuide.brandBiasEu > 0) out.push("尺码略偏大，可考虑正常码或小半码。");
  if (s.sizeGuide.brandBiasEu < 0) out.push("尺码略偏小，可考虑加半码。");
  if (out.length === 0) out.push("三区数据均衡，大多数脚型按正常尺码即可。");
  return out;
}
