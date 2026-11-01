/* ============================================================================
   示例画像（用于演示与自测）
   ============================================================================
   用途：
   1. results 页在无真实画像时的兜底展示
   2. 演示不同画像如何产生不同推荐（验证个性化是否生效）
   3. 算法回归测试的固定输入

   ★ 全部为虚构示例，不代表真实用户。
   ============================================================================ */

import type { UserProfile } from "./types";

/** 标准后卫：75kg / 标准脚 / 室内木地板 */
export const PROFILE_GUARD: UserProfile = {
  body: {
    age: 25,
    gender: "male",
    heightCm: 180,
    weightKg: 75,
    explosive: { level: 4, source: "selfReported" },
    mobility: { level: 4, source: "selfReported" },
    running: { level: 3, source: "selfReported" },
    braking: { level: 4, source: "selfReported" },
    contact: { level: 3, source: "selfReported" },
    landingStability: { level: 3, source: "selfReported" },
    frequencyPerWeek: 2,
    sessionMinutes: 90,
    experienceYears: 5,
  },
  foot: {
    left: { lengthMm: 265, widthMm: 98, suggestedSize: 42, usualSize: 42 },
    right: { lengthMm: 264, widthMm: 97, suggestedSize: 42, usualSize: 42 },
    forefoot: { width: "standard", spaceNeed: 3, pressureSensitivity: 3 },
    midfoot: { wrapNeed: 3, arch: "medium", archSupportNeed: 3 },
    heel: { slipRisk: 2, lockdownNeed: 3 },
    instep: { height: "medium", lacePressureSensitivity: 3 },
    lastPreference: "normal",
  },
  injury: {
    entries: [],
    restrictions: {
      dropLimit: "any",
      collarRequired: null,
      cushionRequired: false,
      torsionRequired: false,
      carbonPlateAvoid: false,
    },
  },
  play: {
    position: "SG",
    primaryStyle: "offBallShot",
    actions: ["jumpLanding"],
  },
  environment: {
    format: "both",
    movement: ["lateral", "jumpLanding"],
    court: "indoorWood",
    indoor: { dusty: false, humid: false },
  },
  preference: {
    cushion: "balanced",
    response: "balanced",
    courtFeel: "balanced",
    collar: "low",
    wrapNeed: 3,
    flexibilityNeed: 3,
    rollFeelNeed: 3,
    stabilityFeelNeed: 3,
    weightSensitivity: 3,
    carbonPlatePref: "neutral",
  },
  references: [],
};

/** 宽脚重型内线：105kg / 很宽脚 / 室外水泥 */
export const PROFILE_BIG: UserProfile = {
  ...PROFILE_GUARD,
  body: {
    ...PROFILE_GUARD.body,
    heightCm: 196,
    weightKg: 105,
    explosive: { level: 3, source: "selfReported" },
    contact: { level: 5, source: "selfReported" },
    landingStability: { level: 4, source: "selfReported" },
  },
  foot: {
    ...PROFILE_GUARD.foot,
    left: { lengthMm: 285, widthMm: 112, suggestedSize: 45, usualSize: 45 },
    right: { lengthMm: 284, widthMm: 111, suggestedSize: 45, usualSize: 45 },
    forefoot: { width: "veryWide", spaceNeed: 5, pressureSensitivity: 5 },
    heel: { slipRisk: 3, lockdownNeed: 4 },
    lastPreference: "wide",
  },
  play: {
    position: "C",
    primaryStyle: "postAnchor",
    actions: ["paintContact", "jumpLanding"],
  },
  environment: {
    format: "half",
    movement: ["straight", "jumpLanding"],
    court: "outdoorConcrete",
    outdoorWear: "high",
  },
  preference: {
    ...PROFILE_GUARD.preference,
    cushion: "soft",
    courtFeel: "cushioned",
    collar: "high",
    weightSensitivity: 1,
    stabilityFeelNeed: 5,
  },
};

/** 窄脚轻量射手：62kg / 窄脚 / 要求偏硬脚感 */
export const PROFILE_SHOOTER: UserProfile = {
  ...PROFILE_GUARD,
  body: {
    ...PROFILE_GUARD.body,
    weightKg: 62,
    explosive: { level: 4, source: "selfReported" },
    running: { level: 4, source: "selfReported" },
  },
  foot: {
    ...PROFILE_GUARD.foot,
    left: { lengthMm: 258, widthMm: 88, suggestedSize: 41, usualSize: 41 },
    right: { lengthMm: 258, widthMm: 88, suggestedSize: 41, usualSize: 41 },
    forefoot: { width: "narrow", spaceNeed: 2, pressureSensitivity: 4 },
    heel: { slipRisk: 4, lockdownNeed: 5 },
    lastPreference: "narrow",
  },
  preference: {
    ...PROFILE_GUARD.preference,
    cushion: "firm",
    response: "fast",
    courtFeel: "ground",
    weightSensitivity: 5,
    flexibilityNeed: 5,
  },
};

/** 脚踝伤病恢复中：要求中帮以上 + 抗扭 */
export const PROFILE_INJURED: UserProfile = {
  ...PROFILE_GUARD,
  injury: {
    entries: [{ area: "ankle", state: "recovering", severity: 3 }],
    restrictions: {
      dropLimit: "any",
      collarRequired: "mid",
      cushionRequired: true,
      torsionRequired: true,
      carbonPlateAvoid: false,
    },
  },
  preference: {
    ...PROFILE_GUARD.preference,
    collar: "mid",
    stabilityFeelNeed: 5,
  },
};

/** 潮湿木地板 + 大量急停变向 */
export const PROFILE_HUMID: UserProfile = {
  ...PROFILE_GUARD,
  play: {
    position: "PG",
    primaryStyle: "rhythmChange",
    actions: ["crossover", "stepBack", "lateralDefense"],
  },
  environment: {
    format: "full",
    movement: ["lateral", "crossover", "stepBack"],
    court: "indoorWood",
    indoor: { humid: true, dusty: true, season: "summer", region: "south" },
  },
};

export interface SampleCase {
  key: string;
  label: string;
  summary: string;
  profile: UserProfile;
}

export const SAMPLE_CASES: SampleCase[] = [
  {
    key: "guard",
    label: "标准后卫",
    summary: "75kg · 标准脚 265mm · 室内木地板 · 无球投篮",
    profile: PROFILE_GUARD,
  },
  {
    key: "big",
    label: "宽脚重型内线",
    summary: "105kg · 很宽脚 285mm · 室外水泥 · 站桩对抗",
    profile: PROFILE_BIG,
  },
  {
    key: "shooter",
    label: "窄脚轻量射手",
    summary: "62kg · 窄脚 258mm · 要求偏硬脚感与贴地",
    profile: PROFILE_SHOOTER,
  },
  {
    key: "injured",
    label: "脚踝伤恢复中",
    summary: "标准脚 · 要求中帮以上 + 抗扭 + 缓震",
    profile: PROFILE_INJURED,
  },
  {
    key: "humid",
    label: "潮湿木地板急停多",
    summary: "标准脚 · 梅雨季节 · 大量变向与急停",
    profile: PROFILE_HUMID,
  },
];
