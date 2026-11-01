import type { UserProfile } from "./types";

const empty = (v: unknown) => v === undefined || v === null || v === "";
const num = (v: unknown) => typeof v === "number" && !Number.isNaN(v) && v > 0;

/** 返回某一步尚未完成的必填项（中文标签，韩语由全站翻译层处理） */
export function missingFor(step: number, p: UserProfile): string[] {
  const m: string[] = [];
  if (step === 0) {
    if (empty(p.body.gender)) m.push("性别");
    if (!num(p.body.age)) m.push("年龄");
    if (!num(p.body.heightCm)) m.push("身高");
    if (!num(p.body.weightKg)) m.push("体重");
  }
  if (step === 1) {
    if (!num(p.foot.left.lengthMm)) m.push("左脚脚长");
    if (!num(p.foot.right.lengthMm)) m.push("右脚脚长");
    if (!num(p.foot.left.widthMm)) m.push("左脚脚宽");
    if (!num(p.foot.right.widthMm)) m.push("右脚脚宽");
    if (!num(p.foot.left.usualSize)) m.push("左脚常穿尺码");
    if (!num(p.foot.right.usualSize)) m.push("右脚常穿尺码");
    if (empty(p.foot.forefoot.width)) m.push("前掌宽度");
    if (empty(p.foot.midfoot.arch)) m.push("足弓类型");
    if (empty(p.foot.instep.height)) m.push("脚背高度");
    if (empty(p.foot.lastPreference)) m.push("楦型偏好");
  }
  if (step === 2) {
    if (empty(p.injury.restrictions.dropLimit)) m.push("落差限制");
    if (p.injury.restrictions.collarRequired === undefined) m.push("鞋领限制");
  }
  if (step === 3) {
    if (empty(p.play.position)) m.push("位置");
    if (empty(p.play.primaryStyle)) m.push("主打法");
    if (p.play.actions.length === 0) m.push("动作侧重（至少一项）");
    if (empty(p.environment.format)) m.push("比赛形式");
    if (empty(p.environment.court)) m.push("主要场地");
    if (p.environment.movement.length === 0) m.push("移动特征（至少一项）");
  }
  if (step === 4) {
    if (empty(p.preference.cushion)) m.push("缓震手感");
    if (empty(p.preference.response)) m.push("响应");
    if (empty(p.preference.courtFeel)) m.push("贴地感");
    if (empty(p.preference.collar)) m.push("鞋领偏好");
    if (empty(p.preference.carbonPlatePref)) m.push("碳板偏好");
  }
  return m;
}

export const isProfileComplete = (p: UserProfile) => [0, 1, 2, 3, 4].every((s) => missingFor(s, p).length === 0);
