"use client";

/* ============================================================================
   测评向导（PRD 13.2 – 13.7）
   ============================================================================
   五步表单容器：
   - 从 localStorage 恢复草稿（避免刷新丢数据）
   - 每步自动保存
   - 最后一步写入草稿并跳转结果页
   ============================================================================ */

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { UserProfile } from "@/lib/types";
import { emptyProfile, loadDraft, saveDraft } from "@/lib/profile-store";
import { StompShoe, Basketball } from "@/components/motifs";
import { missingFor } from "@/lib/assess-validation";
import { StepBody, StepFoot, StepInjury, StepPlay, StepPreference } from "./steps";

const STEPS = [
  { key: "body", label: "身体与能力", hint: "体重与六项能力决定缓震、稳定的需求强度" },
  { key: "foot", label: "足部数据", hint: "左右脚分开填写，系统取更需要空间的一侧" },
  { key: "injury", label: "伤病与保护", hint: "可触发硬性排除，优先于任何性能偏好" },
  { key: "play", label: "打法与场地", hint: "位置、打法与场地条件共同决定抓地权重" },
  { key: "pref", label: "脚感与偏好", hint: "软硬、响应、贴地属于软匹配" },
] as const;

export function AssessWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<UserProfile>(() => emptyProfile());
  const [hydrated, setHydrated] = useState(false);

  /* 挂载后再读草稿，避免服务端与客户端渲染不一致 */
  useEffect(() => {
    const draft = loadDraft();
    if (draft) setProfile(draft);
    setHydrated(true);
  }, []);

  /* 任何改动自动存草稿 */
  useEffect(() => {
    if (!hydrated) return;
    saveDraft(profile);
  }, [profile, hydrated]);

  const patchBody = (p: Partial<UserProfile["body"]>) =>
    setProfile((cur) => ({ ...cur, body: { ...cur.body, ...p } }));
  const patchFoot = (p: Partial<UserProfile["foot"]>) =>
    setProfile((cur) => ({ ...cur, foot: { ...cur.foot, ...p } }));
  const patchInjury = (p: Partial<UserProfile["injury"]>) =>
    setProfile((cur) => ({ ...cur, injury: { ...cur.injury, ...p } }));
  const patchPlay = (p: Partial<UserProfile["play"]>) =>
    setProfile((cur) => ({ ...cur, play: { ...cur.play, ...p } }));
  const patchEnv = (p: Partial<UserProfile["environment"]>) =>
    setProfile((cur) => ({ ...cur, environment: { ...cur.environment, ...p } }));
  const patchPref = (p: Partial<UserProfile["preference"]>) =>
    setProfile((cur) => ({ ...cur, preference: { ...cur.preference, ...p } }));

  const current = STEPS[step];
  const percent = ((step + 1) / STEPS.length) * 100;

  const content = useMemo(() => {
    switch (step) {
      case 0:
        return <StepBody profile={profile} patch={patchBody} />;
      case 1:
        return <StepFoot profile={profile} patch={patchFoot} />;
      case 2:
        return <StepInjury profile={profile} patch={patchInjury} />;
      case 3:
        return <StepPlay profile={profile} patchPlay={patchPlay} patchEnv={patchEnv} />;
      default:
        return <StepPreference profile={profile} patch={patchPref} />;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, profile]);

  const missing = missingFor(step, profile);
  const firstIncomplete = [0, 1, 2, 3, 4].find((i) => missingFor(i, profile).length > 0) ?? 5;

  const next = () => {
    if (missing.length > 0) return;
    saveDraft(profile);
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      router.push("/profile-builder/results");
    }
  };

  const prev = () => {
    if (step === 0) return;
    setStep((s) => s - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="profile-builder-page">
      <aside className="profile-builder-intro">
        <span className="eyebrow">PLAYER PROFILE</span><span className="wizard-motifs" aria-hidden><Basketball size={36} /><StompShoe /></span>
        <h1>
          建立你的
          <br />
          <em>球员画像。</em>
        </h1>
        <p>
          五个部分，约四分钟。回答越接近真实，后面的判断就越不像猜测。
        </p>
        <ol className="wizard-index">
          {STEPS.map((s, i) => (
            <li key={s.key} className={i === step ? "is-now" : i < step ? "is-done" : ""} onClick={() => { if (i <= firstIncomplete) setStep(i); }} style={{ cursor: i <= firstIncomplete ? "pointer" : "not-allowed" }}>
              <span>0{i + 1}</span>
              {s.label}
            </li>
          ))}
        </ol>
        <small>
          草稿自动保存在本机，刷新不会丢失。数据仅用于生成推荐。
        </small>
      </aside>

      <div className="wizard-main">
        <div className="form-progress">
          <span>
            0{step + 1} / 0{STEPS.length}
          </span>
          <i>
            <b style={{ width: `${percent}%` }} />
          </i>
        </div>

        <h3 className="wizard-title">{current.label}</h3>
        <p className="wizard-hint">{current.hint}</p>

        <div key={step} className="wizard-step-anim">{content}</div>

        {missing.length > 0 && (
          <p className="wizard-missing" role="status" data-testid="wizard-missing">
            还需完成：{missing.join("、")}
          </p>
        )}

        <div className="wizard-actions">
          <button
            type="button"
            className="text-button"
            onClick={prev}
            style={{ visibility: step === 0 ? "hidden" : "visible" }}
          >
            ← 上一步
          </button>
          <button type="button" className="round-action" onClick={next} disabled={missing.length > 0} aria-disabled={missing.length > 0} data-testid="wizard-next">
            {step === STEPS.length - 1 ? "生成推荐" : "继续"} <b>↓</b>
          </button>
        </div>
      </div>
    </div>
  );
}
