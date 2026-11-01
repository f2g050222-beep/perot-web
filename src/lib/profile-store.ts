/* ============================================================================
   PEROT 画像状态管理（localStorage）
   ============================================================================
   分离两件事：
   - draft（草稿）：用户正在填写的，可反复修改
   - snapshots（快照）：提交后的不可变历史（PRD 第 11 章）

   ★ 演示期使用 localStorage；接入后端后只需替换本文件的实现，
     组件层调用方式不变。
   ============================================================================ */

import type { UserProfile } from "./types";

const DRAFT_KEY = "perot:profile:draft:v1";
const SNAP_KEY = "perot:profile:snapshots:v1";

/** 空白画像：所有可选项留空，由用户逐步填写 */
export function emptyProfile(): UserProfile {
  return {
    body: {
      age: 25,
      gender: "" as never,
      heightCm: 175,
      weightKg: 70,
      explosive: { level: 3, source: "selfReported" },
      mobility: { level: 3, source: "selfReported" },
      running: { level: 3, source: "selfReported" },
      braking: { level: 3, source: "selfReported" },
      contact: { level: 3, source: "selfReported" },
      landingStability: { level: 3, source: "selfReported" },
      frequencyPerWeek: 2,
      sessionMinutes: 90,
      experienceYears: 3,
    },
    foot: {
      left: { lengthMm: null, widthMm: null, suggestedSize: 42, usualSize: null },
      right: { lengthMm: null, widthMm: null, suggestedSize: 42, usualSize: null },
      forefoot: { width: "" as never, spaceNeed: 3, pressureSensitivity: 3 },
      midfoot: { wrapNeed: 3, arch: "" as never, archSupportNeed: 3 },
      heel: { slipRisk: 2, lockdownNeed: 3 },
      instep: { height: "" as never, lacePressureSensitivity: 3 },
      lastPreference: "" as never,
    },
    injury: {
      entries: [],
      restrictions: {
        dropLimit: "" as never,
        collarRequired: undefined as never,
        cushionRequired: false,
        torsionRequired: false,
        carbonPlateAvoid: false,
      },
    },
    play: {
      position: "" as never,
      primaryStyle: "" as never,
      actions: [],
    },
    environment: {
      format: "" as never,
      movement: [],
      court: "" as never,
      indoor: { dusty: false, humid: false },
    },
    preference: {
      cushion: "" as never,
      response: "" as never,
      courtFeel: "" as never,
      collar: "" as never,
      wrapNeed: 3,
      flexibilityNeed: 3,
      rollFeelNeed: 3,
      stabilityFeelNeed: 3,
      weightSensitivity: 3,
      carbonPlatePref: "" as never,
    },
    references: [],
  };
}

/* ---------------------------------------------------------------- 草稿 */

export function loadDraft(): UserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<UserProfile>;
    /* 与空画像合并，保证新增字段有默认值（前向兼容） */
    const base = emptyProfile();
    return {
      body: { ...base.body, ...parsed.body },
      foot: { ...base.foot, ...parsed.foot },
      injury: { ...base.injury, ...parsed.injury },
      play: { ...base.play, ...parsed.play },
      environment: { ...base.environment, ...parsed.environment },
      preference: { ...base.preference, ...parsed.preference },
      references: parsed.references ?? [],
    };
  } catch {
    return null;
  }
}

export function saveDraft(profile: UserProfile): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(profile));
  } catch {
    /* 存储满或隐私模式：静默失败，不阻塞填写 */
  }
}

export function clearDraft(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DRAFT_KEY);
}

/* ---------------------------------------------------------------- 快照 */

export interface ProfileSnapshot {
  id: string;
  savedAt: number;
  profile: UserProfile;
  /** 规则版本与鞋库版本，便于追溯结论为何变化（PRD 第 11 章） */
  ruleVersion: string;
  shoeDataVersion: string;
}

export function loadSnapshots(): ProfileSnapshot[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SNAP_KEY);
    return raw ? (JSON.parse(raw) as ProfileSnapshot[]) : [];
  } catch {
    return [];
  }
}

export function saveSnapshot(snap: ProfileSnapshot): void {
  if (typeof window === "undefined") return;
  const all = loadSnapshots();
  /* 快照不可变：只追加，不覆盖 */
  all.unshift(snap);
  try {
    window.localStorage.setItem(SNAP_KEY, JSON.stringify(all.slice(0, 30)));
  } catch {
    /* 忽略 */
  }
}
