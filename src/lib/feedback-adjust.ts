/* ============================================================================
   反馈调整层（独立于原匹配逻辑）
   ============================================================================
   1. adjustProfileByFeedback：按「预测 vs 感受」差值微调画像偏好
   2. feedbackScoreHook：在原 scoreShoe 之后、排序之前，对相似鞋加/减分
   原 matching.ts 只新增了一个可选 hook，其余逻辑不变。
   ============================================================================ */
import type { Recommendation, Shoe, UserProfile } from "./types";
import { FIT_ZONES, PERF_DIMS, satisfaction, type WearFeedback } from "./feedback-store";

type Lv = 1 | 2 | 3 | 4 | 5;
const clampLv = (n: number) => Math.max(1, Math.min(5, Math.round(n))) as Lv;

export function adjustProfileByFeedback(p: UserProfile, fbs: WearFeedback[]): UserProfile {
  if (!fbs.length) return p;
  const out: UserProfile = JSON.parse(JSON.stringify(p));
  const gap = (d: (typeof PERF_DIMS)[number]) => { const xs = fbs.filter((f) => f.perf[d].predicted != null); return xs.length ? xs.reduce((s, f) => s + (f.perf[d].felt - (f.perf[d].predicted as number)), 0) / xs.length : 0; };
  const tight = (z: (typeof FIT_ZONES)[number]) => fbs.filter((f) => f.fitMap[z] === "tight").length;
  const loose = (z: (typeof FIT_ZONES)[number]) => fbs.filter((f) => f.fitMap[z] === "loose").length;
  if (tight("toe") + tight("forefoot") > 0) out.foot.forefoot.spaceNeed = clampLv(out.foot.forefoot.spaceNeed + 1);
  if (tight("instep") > 0) out.foot.instep.lacePressureSensitivity = clampLv(out.foot.instep.lacePressureSensitivity + 1);
  if (loose("heel") > 0 || gap("lockdown") < -2) out.foot.heel.lockdownNeed = clampLv(out.foot.heel.lockdownNeed + 1);
  if (gap("stability") < -2) out.preference.stabilityFeelNeed = clampLv(out.preference.stabilityFeelNeed + 1);
  if (gap("fit") < -2) out.preference.wrapNeed = clampLv(out.preference.wrapNeed + 1);
  if (gap("cushioning") < -2 && out.preference.cushion === "firm") out.preference.cushion = "balanced";
  if (gap("response") < -2 && out.preference.response === "comfort") out.preference.response = "balanced";
  return out;
}

/** 两双鞋的相似度 0–1（品牌 / 鞋楦 / 缓震 / 定位 / 碳板 / 响应） */
export function shoeSimilarity(a: Shoe, b: Shoe): number {
  if (a.id === b.id) return 1;
  let s = 0;
  if (a.brand === b.brand) s += 0.2;
  if (a.last.overall === b.last.overall) s += 0.2;
  if (Math.abs(a.midsole.cushionSoftness - b.midsole.cushionSoftness) <= 1) s += 0.2;
  if (a.category === b.category) s += 0.15;
  if (a.midsole.plate === b.midsole.plate) s += 0.1;
  if (Math.abs(a.midsole.response - b.midsole.response) <= 1) s += 0.15;
  return Math.min(1, s);
}

export function feedbackScoreHook(fbs: WearFeedback[], shoes: Shoe[]) {
  /* 同一双鞋多次回访时，以最新一次为准 */
  const latest = new Map<string, WearFeedback>();
  for (const f of [...fbs].sort((a, b) => a.createdAt - b.createdAt)) latest.set(f.shoeId, f);
  const find = (f: WearFeedback) => shoes.find((s) => s.id === f.shoeId) ?? (f.ownedShoe ? shoes.find((s) => s.name.toLowerCase() === f.ownedShoe!.model.trim().toLowerCase()) : undefined);
  const rated = [...latest.values()].map((f) => ({ f, shoe: find(f), sat: satisfaction(f) })).filter((x) => x.shoe);
  return (all: Recommendation[]) => {
    if (!rated.length) return;
    for (const r of all) {
      let delta = 0;
      let best: { name: string; sim: number; good: boolean } | null = null;
      for (const x of rated) {
        const sim = shoeSimilarity(r.shoe, x.shoe!);
        if (sim < 0.35) continue;
        const sentiment = (x.sat - 6) / 4; // 约 -1.5 … +1
        const fitComplaint = FIT_ZONES.some((z) => x.f.fitMap[z] !== "ok") && r.shoe.last.overall === x.shoe!.last.overall;
        delta += sim * sentiment * 8 - (fitComplaint ? sim * 4 : 0);
        if (!best || sim > best.sim) best = { name: `${x.shoe!.brand} ${x.shoe!.name}`, sim, good: sentiment > 0 && !fitComplaint };
      }
      delta = Math.max(-12, Math.min(10, delta));
      if (Math.abs(delta) < 0.5 || !best) continue;
      r.score += delta;
      if (delta > 0) r.reasons.push({ kind: "reference", text: `根据你的穿着反馈：与你好评的 ${best.name} 特性相似，因此上调` });
      else r.tradeoffs.push(`根据你的穿着反馈：与你评价不佳的 ${best.name} 特性相似，因此下调`);
    }
  };
}
