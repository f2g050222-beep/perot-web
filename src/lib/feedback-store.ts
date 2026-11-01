/* ============================================================================
   穿着反馈存储（私有数据：仅本人与管理端可见，绝不进入公开留言墙）
   ============================================================================
   ★ 组件只依赖 FeedbackRepository 接口。演示期用 localStorage 实现，
     以后换成 API / 数据库时只需提供新的实现并替换 feedbackRepo。
   ============================================================================ */
import type { Shoe } from "./types";

export type FitZone = "toe" | "forefoot" | "instep" | "heel";
export type FitMark = "tight" | "ok" | "loose";
export type PerfDim = "fit" | "lockdown" | "cushioning" | "response" | "traction" | "stability";
export type WearDuration = "lt1w" | "1to4w" | "1to3m" | "gt3m";
export type WearCourt = "indoor" | "outdoor" | "both";

export const FIT_ZONES: FitZone[] = ["toe", "forefoot", "instep", "heel"];
export const PERF_DIMS: PerfDim[] = ["fit", "lockdown", "cushioning", "response", "traction", "stability"];

export type FeedbackKind = "recommended" | "owned";

/** 测评画像摘要：随反馈一起保存，便于研究导出 */
export interface ProfileDigest {
  gender?: string; age?: number; heightCm?: number; weightKg?: number;
  position?: string; primaryStyle?: string; forefootWidth?: string; arch?: string; instep?: string;
  court?: string; format?: string; cushion?: string; response?: string; collar?: string;
}

export interface WearFeedback {
  id: string;
  userId: string;
  /** 鞋库 id；自有鞋为 owned:品牌/型号 */
  shoeId: string;
  shoeLabel: string;
  kind: FeedbackKind;
  ownedShoe?: { brand: string; model: string; size: string };
  /** 同一双鞋的第几次反馈（0 = 首次，1 = 第一次回访 …） */
  followUpIndex: number;
  profile?: ProfileDigest;
  createdAt: number;
  fitMap: Record<FitZone, FitMark>;
  /** 每个维度：系统预测分 vs 用户感受分（1–10） */
  perf: Record<PerfDim, { predicted: number | null; felt: number }>;
  usage: { duration: WearDuration; court: WearCourt; pain: string[] };
  comment: string;
  /** 私有标记：永远为 private，留作后端权限字段 */
  visibility: "private";
}

export interface FeedbackRepository {
  listByUser(userId: string): WearFeedback[];
  listAll(): WearFeedback[];
  add(entry: WearFeedback): void;
  remove(userId: string, id: string): void;
}

const KEY = "perot:feedback:v1";

class LocalFeedbackRepository implements FeedbackRepository {
  private read(): Record<string, WearFeedback[]> {
    if (typeof window === "undefined") return {};
    try { return JSON.parse(window.localStorage.getItem(KEY) ?? "{}"); } catch { return {}; }
  }
  private write(db: Record<string, WearFeedback[]>) {
    try { window.localStorage.setItem(KEY, JSON.stringify(db)); } catch { /* 忽略 */ }
  }
  listByUser(userId: string) { return (this.read()[userId] ?? []).slice().sort((a, b) => b.createdAt - a.createdAt); }
  listAll() { return Object.values(this.read()).flat().sort((a, b) => b.createdAt - a.createdAt); }
  add(entry: WearFeedback) { const db = this.read(); (db[entry.userId] ??= []).push(entry); this.write(db); }
  remove(userId: string, id: string) { const db = this.read(); db[userId] = (db[userId] ?? []).filter((e) => e.id !== id); this.write(db); }
}

export function digestProfile(p: import("./types").UserProfile | null): ProfileDigest | undefined {
  if (!p) return undefined;
  return {
    gender: p.body.gender, age: p.body.age, heightCm: p.body.heightCm, weightKg: p.body.weightKg,
    position: p.play.position, primaryStyle: p.play.primaryStyle, forefootWidth: p.foot.forefoot.width,
    arch: p.foot.midfoot.arch, instep: p.foot.instep.height, court: p.environment.court, format: p.environment.format,
    cushion: p.preference.cushion, response: p.preference.response, collar: p.preference.collar,
  };
}

export const feedbackRepo: FeedbackRepository = new LocalFeedbackRepository();

const r1 = (n: number) => Math.round(Math.max(1, Math.min(10, n)) * 10) / 10;
/** 系统对一双鞋在 6 个维度上的预测分（来自结构化鞋库） */
export function predictPerf(s: Shoe): Record<PerfDim, number> {
  return {
    fit: r1((s.last.forefoot.space + (11 - s.last.forefoot.pressureRisk) + s.last.midfoot.wrap) / 3),
    lockdown: r1((s.last.heel.lockdown + s.last.midfoot.lockdown) / 2),
    cushioning: r1((s.midsole.rebound + s.protection.landing) / 2),
    response: r1(s.midsole.response),
    traction: r1((s.grip.indoorClean + s.grip.braking) / 2),
    stability: r1((s.stability.lateral + s.stability.torsion) / 2),
  };
}

/** 满意度 0–10：感受均分，适配投诉扣分 */
export function satisfaction(f: WearFeedback): number {
  const felt = PERF_DIMS.map((d) => f.perf[d].felt);
  const mean = felt.reduce((a, b) => a + b, 0) / felt.length;
  const fitIssues = FIT_ZONES.filter((z) => f.fitMap[z] !== "ok").length;
  return Math.max(0, mean - fitIssues * 0.6 - (f.usage.pain.length ? 0.8 : 0));
}
