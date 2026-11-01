/* ============================================================================
   管理端演示数据层（localStorage）
   ★ 演示登录守卫，仅用于界面骨架；正式上线必须换成服务端鉴权。
   ★ 与 feedbackRepo 一样，后续可替换为 API 实现。
   ============================================================================ */
import { SHOES } from "@/data/shoes";
import { wallMessages } from "./messages";
import { feedbackRepo, predictPerf, PERF_DIMS, type WearFeedback } from "./feedback-store";

export const DEMO_ADMIN = { user: "admin", pass: "perot2026" };
const SESSION = "perot:admin:session";
export const adminSession = {
  isIn: () => typeof window !== "undefined" && window.sessionStorage.getItem(SESSION) === "1",
  login: (u: string, p: string) => { const ok = u === DEMO_ADMIN.user && p === DEMO_ADMIN.pass; if (ok) window.sessionStorage.setItem(SESSION, "1"); return ok; },
  logout: () => window.sessionStorage.removeItem(SESSION),
};

function load<T>(k: string, d: T): T { if (typeof window === "undefined") return d; try { const v = window.localStorage.getItem(k); return v ? (JSON.parse(v) as T) : d; } catch { return d; } }
function save(k: string, v: unknown) { try { window.localStorage.setItem(k, JSON.stringify(v)); } catch { /* 忽略 */ } }

/* ---------- 鞋款管理（管理端副本；推荐引擎仍读取 data/shoes.ts） ---------- */
export interface AdminShoe { id: string; brand: string; name: string; category: string; year: number; price: number | null; weightG: number; status: "published" | "draft"; positioning: string }
const SHOE_KEY = "perot:admin:shoes:v1";
export function listAdminShoes(): AdminShoe[] {
  return load<AdminShoe[] | null>(SHOE_KEY, null) ?? SHOES.map((s) => ({ id: s.id, brand: s.brand, name: s.name, category: s.category, year: s.year, price: s.price ?? null, weightG: s.weightG, status: "published", positioning: s.positioning }));
}
export function saveAdminShoes(list: AdminShoe[]) { save(SHOE_KEY, list); }

/* ---------- 留言审核（只记录审核状态，不改动留言墙本身） ---------- */
export type ModStatus = "pending" | "approved" | "hidden";
const MOD_KEY = "perot:admin:moderation:v1";
export function listModeration() {
  const st = load<Record<string, ModStatus>>(MOD_KEY, {});
  return wallMessages.map((m, i) => ({ key: `wall-${i}`, ...m, status: st[`wall-${i}`] ?? ("approved" as ModStatus) }));
}
export function setModeration(key: string, status: ModStatus) { const st = load<Record<string, ModStatus>>(MOD_KEY, {}); st[key] = status; save(MOD_KEY, st); }

/* ---------- 购买 / 点击数据（演示，确定性生成） ---------- */
function seeded(id: string, k: number) { let h = 2166136261; for (const c of id + k) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return ((h >>> 0) % 1000) / 1000; }
export function commerceStats() {
  return SHOES.map((s) => {
    const views = Math.round(400 + seeded(s.id, 1) * 2600);
    const clicks = Math.round(views * (0.08 + seeded(s.id, 2) * 0.18));
    const intents = Math.round(clicks * (0.12 + seeded(s.id, 3) * 0.25));
    return { id: s.id, label: `${s.brand} ${s.name}`, views, clicks, intents, ctr: clicks / views, conv: intents / clicks };
  });
}

/* ---------- 用户（演示 + 本机真实匿名用户） ---------- */
export function listUsers() {
  const real = new Map<string, number>();
  feedbackRepo.listAll().forEach((f) => real.set(f.userId, (real.get(f.userId) ?? 0) + 1));
  const demo = DEMO_FEEDBACK.reduce((m, f) => m.set(f.userId, (m.get(f.userId) ?? 0) + 1), new Map<string, number>());
  return [
    ...[...real].map(([id, n]) => ({ id, source: "本机" as const, feedback: n })),
    ...[...demo].map(([id, n]) => ({ id, source: "演示" as const, feedback: n })),
  ];
}

/* ---------- 演示反馈（管理端可选显示，不写入任何用户的私有存储） ---------- */
const fit = (a: string) => ({ toe: a[0], forefoot: a[1], instep: a[2], heel: a[3] }) as unknown as WearFeedback["fitMap"];
const M: Record<string, "tight" | "ok" | "loose"> = { t: "tight", o: "ok", l: "loose" };
function demoFb(i: number, userId: string, shoeId: string, map: string, delta: number[], dur: WearFeedback["usage"]["duration"], court: WearFeedback["usage"]["court"], pain: string[], comment: string, follow = 0): WearFeedback {
  const s = SHOES.find((x) => x.id === shoeId)!;
  const p = predictPerf(s);
  const fm = fit(map); (Object.keys(fm) as (keyof typeof fm)[]).forEach((k) => { fm[k] = M[fm[k] as unknown as string]; });
  return {
    id: `demo-${i}`, userId, shoeId, shoeLabel: `${s.brand} ${s.name}`, kind: "recommended", followUpIndex: follow,
    profile: { position: ["PG", "SF", "C", "SG"][i % 4], forefootWidth: ["wide", "standard", "veryWide"][i % 3], court: court === "outdoor" ? "outdoorRubber" : "indoorWood", weightKg: 70 + (i * 7) % 30 },
    createdAt: Date.UTC(2026, 9, 1 + i * 2), fitMap: fm,
    perf: Object.fromEntries(PERF_DIMS.map((d, k) => [d, { predicted: p[d], felt: Math.max(1, Math.min(10, Math.round(p[d] + delta[k]))) }])) as WearFeedback["perf"],
    usage: { duration: dur, court, pain }, comment, visibility: "private",
  };
}
export const DEMO_FEEDBACK: WearFeedback[] = SHOES.length < 4 ? [] : [
  demoFb(1, "demo-u01", SHOES[0].id, "oooo", [1, 0, 1, 0, 1, 0], "1to4w", "indoor", [], "Very stable, fits wide feet."),
  demoFb(2, "demo-u02", SHOES[1].id, "tooo", [-2, 0, 1, 0, 0, -1], "lt1w", "indoor", ["小指压迫"], "Forefoot tight on day one."),
  demoFb(3, "demo-u02", SHOES[1].id, "oooo", [0, 0, 1, 0, 0, 0], "1to3m", "indoor", [], "Broke in after a month.", 1),
  demoFb(4, "demo-u03", SHOES[2].id, "oool", [0, -3, 0, 1, 0, -2], "1to4w", "both", ["后跟磨"], "Heel slips on hard cuts."),
  demoFb(5, "demo-u04", SHOES[3].id, "oooo", [1, 1, 2, 1, -1, 1], "gt3m", "outdoor", [], "Outsole wearing fast outdoors."),
  demoFb(6, "demo-u05", SHOES[0].id, "otoo", [0, 0, -1, 0, 1, 0], "1to3m", "indoor", ["脚背勒"], ""),
];

/* ---------- 研究导出 ---------- */
export function exportRows(list: WearFeedback[]) {
  const anon = new Map<string, string>();
  const aid = (u: string) => { if (!anon.has(u)) anon.set(u, `U${String(anon.size + 1).padStart(3, "0")}`); return anon.get(u)!; };
  return list.map((f) => {
    const row: Record<string, string | number> = {
      feedback_id: f.id, user_anon: aid(f.userId), kind: f.kind, shoe_id: f.shoeId, shoe_label: f.shoeLabel ?? f.shoeId,
      owned_size: f.ownedShoe?.size ?? "", follow_up_index: f.followUpIndex ?? 0,
      created_at_iso: new Date(f.createdAt).toISOString(),
    };
    Object.entries(f.profile ?? {}).forEach(([k, v]) => { row[`profile_${k}`] = v ?? ""; });
    PERF_DIMS.forEach((d) => { row[`pred_${d}`] = f.perf[d].predicted ?? ""; row[`felt_${d}`] = f.perf[d].felt; row[`gap_${d}`] = f.perf[d].predicted == null ? "" : +(f.perf[d].felt - f.perf[d].predicted).toFixed(1); });
    (Object.keys(f.fitMap) as (keyof typeof f.fitMap)[]).forEach((z) => { row[`fit_${z}`] = f.fitMap[z]; });
    row.usage_duration = f.usage.duration; row.usage_court = f.usage.court; row.pain_tags = f.usage.pain.join("|"); row.comment = f.comment;
    return row;
  });
}
export function toCSV(rows: Record<string, string | number>[]) {
  const cols = [...new Set(rows.flatMap((r) => Object.keys(r)))];
  const esc = (v: unknown) => { const s = String(v ?? ""); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  return "\uFEFF" + [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
}
export function download(name: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
