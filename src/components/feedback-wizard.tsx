"use client";

/* 穿着反馈向导：选鞋 → 适配地图 → 性能对比 → 使用情况 → 一句话 → 提交
   ★ 数据私有：只写入 feedbackRepo（本人 + 管理端可见），不会发布到任何公开区域 */
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { SHOES } from "@/data/shoes";
import { loadDraft } from "@/lib/profile-store";
import { isProfileComplete } from "@/lib/assess-validation";
import { recommendForUser } from "@/lib/recommend-user";
import { FIT_ZONES, PERF_DIMS, digestProfile, feedbackRepo, predictPerf, type FitMark, type FitZone, type PerfDim, type WearCourt, type WearDuration } from "@/lib/feedback-store";
import { getCurrentUserId } from "@/lib/user-session";
import { StompShoe } from "@/components/motifs";
import type { Shoe } from "@/lib/types";

const STEPS = ["选择鞋款", "适配地图", "性能对比", "使用情况", "一句话"];
const ZONE_LABEL: Record<FitZone, string> = { toe: "脚趾", forefoot: "前掌", instep: "脚背", heel: "后跟" };
const MARK_LABEL: Record<FitMark, string> = { tight: "偏紧", ok: "刚好", loose: "偏松" };
const DIM_LABEL: Record<PerfDim, string> = { fit: "合脚", lockdown: "锁定", cushioning: "缓震", response: "响应", traction: "抓地", stability: "稳定" };
const DURATION: [WearDuration, string][] = [["lt1w", "不到 1 周"], ["1to4w", "1–4 周"], ["1to3m", "1–3 个月"], ["gt3m", "3 个月以上"]];
const COURT: [WearCourt, string][] = [["indoor", "室内"], ["outdoor", "室外"], ["both", "室内外都有"]];
const PAIN = ["脚趾磨", "小指压迫", "足弓酸", "脚背勒", "后跟磨", "脚踝不稳", "膝盖不适"];

export function FeedbackWizard() {
  const [ready, setReady] = useState(false);
  const [recShoes, setRecShoes] = useState<Shoe[]>([]);
  const [hasProfile, setHasProfile] = useState(false);
  const [step, setStep] = useState(0);
  const [shoeId, setShoeId] = useState("");
  const [fitMap, setFitMap] = useState<Partial<Record<FitZone, FitMark>>>({});
  const [felt, setFelt] = useState<Partial<Record<PerfDim, number>>>({});
  const [duration, setDuration] = useState<WearDuration | "">("");
  const [court, setCourt] = useState<WearCourt | "">("");
  const [pain, setPain] = useState<string[]>([]);
  const [noPain, setNoPain] = useState(false);
  const [comment, setComment] = useState("");
  const [owned, setOwned] = useState({ brand: "", model: "", size: "" });
  const [prior, setPrior] = useState<Record<string, number>>({});
  const [done, setDone] = useState<{ count: number; top: string[] } | null>(null);

  useEffect(() => {
    const d = loadDraft();
    if (d && isProfileComplete(d)) {
      setHasProfile(true);
      setRecShoes(recommendForUser(d).result.slots.map((s) => s.item.shoe));
    } else setRecShoes(SHOES.slice(0, 6));
    const counts: Record<string, number> = {};
    feedbackRepo.listByUser(getCurrentUserId()).forEach((f) => { counts[f.shoeId] = (counts[f.shoeId] ?? 0) + 1; });
    setPrior(counts);
    setReady(true);
  }, []);

  const isOwned = shoeId === "__owned";
  const ownedKey = `owned:${owned.brand.trim().toLowerCase()}/${owned.model.trim().toLowerCase()}`;
  const effectiveId = isOwned ? ownedKey : shoeId;
  /* 自有鞋若型号能在鞋库中找到，则沿用鞋库预测；否则没有预测值 */
  const shoe = isOwned ? SHOES.find((s) => s.name.toLowerCase() === owned.model.trim().toLowerCase()) : SHOES.find((s) => s.id === shoeId);
  const predicted = useMemo(() => (shoe ? predictPerf(shoe) : null), [shoe]);
  const followUp = prior[effectiveId] ?? 0;

  const missing = (): string[] => {
    if (step === 0) return !shoeId ? ["选择一双鞋"] : isOwned ? [!owned.brand.trim() && "品牌", !owned.model.trim() && "型号", !owned.size.trim() && "尺码"].filter(Boolean) as string[] : [];
    if (step === 1) return FIT_ZONES.filter((z) => !fitMap[z]).map((z) => ZONE_LABEL[z]);
    if (step === 2) return PERF_DIMS.filter((d) => felt[d] == null).map((d) => DIM_LABEL[d]);
    if (step === 3) return [!duration && "穿着时长", !court && "使用场地", !(noPain || pain.length) && "不适情况"].filter(Boolean) as string[];
    return [];
  };
  const miss = missing();

  const submit = () => {
    const userId = getCurrentUserId();
    const label = isOwned ? `${owned.brand.trim()} ${owned.model.trim()}` : shoe ? `${shoe.brand} ${shoe.name}` : shoeId;
    feedbackRepo.add({
      id: `fb-${Date.now()}`, userId, shoeId: effectiveId, shoeLabel: label, kind: isOwned ? "owned" : "recommended",
      ownedShoe: isOwned ? { brand: owned.brand.trim(), model: owned.model.trim(), size: owned.size.trim() } : undefined,
      followUpIndex: followUp, profile: digestProfile(loadDraft()), createdAt: Date.now(),
      fitMap: fitMap as Record<FitZone, FitMark>,
      perf: Object.fromEntries(PERF_DIMS.map((d) => [d, { predicted: predicted ? predicted[d] : null, felt: felt[d]! }])) as Record<PerfDim, { predicted: number | null; felt: number }>,
      usage: { duration: duration as WearDuration, court: court as WearCourt, pain: noPain ? [] : pain },
      comment: comment.trim().slice(0, 120), visibility: "private",
    });
    const d = loadDraft();
    const r = d && isProfileComplete(d) ? recommendForUser(d) : null;
    setDone({ count: feedbackRepo.listByUser(userId).length, top: r ? r.result.slots.map((s) => `${s.item.shoe.brand} ${s.item.shoe.name}`) : [] });
  };

  const reset = () => { const c: Record<string, number> = {}; feedbackRepo.listByUser(getCurrentUserId()).forEach((f) => { c[f.shoeId] = (c[f.shoeId] ?? 0) + 1; }); setPrior(c); setOwned({ brand: "", model: "", size: "" }); setStep(0); setShoeId(""); setFitMap({}); setFelt({}); setDuration(""); setCourt(""); setPain([]); setNoPain(false); setComment(""); setDone(null); };

  return (
    <section className="fb-page">
      <div className="fb-hero">
        <p className="eyebrow">WEAR FEEDBACK · PRIVATE</p>
        <h1>穿过之后，<br /><em>告诉我们真相。</em></h1>
        <p className="fb-lead">你的反馈只属于你：仅你本人与管理端可见，不会出现在留言墙或任何公开位置。它会被记住，并用于调整你之后的推荐。</p>
        <span className="fb-motif" aria-hidden><StompShoe /></span>
      </div>

      {done ? (
        <div className="fb-done" data-testid="fb-done">
          <div className="fb-done-check" aria-hidden>✓</div>
          <h2>画像已更新</h2>
          <p><span>已记录你的第</span> {done.count} <span>条穿着反馈，推荐已重新计算。</span></p>
          {done.top.length > 0 ? (
            <ol className="fb-done-list">{done.top.map((t, i) => <li key={t} style={{ ["--i" as string]: i }}><small data-no-translate>0{i + 1}</small><span data-no-translate>{t}</span></li>)}</ol>
          ) : <p>完成用户画像测评后，这里会显示刷新后的推荐。</p>}
          <div className="fb-actions">
            <Link className="button button-dark" href="/profile-builder/results">查看刷新后的推荐 <b>↗</b></Link>
            <button type="button" className="text-button" onClick={reset} data-testid="fb-retake">再评一双 ↺</button>
            
          </div>
        </div>
      ) : !ready ? null : (
        <div className="fb-card">
          <ol className="fb-progress" aria-label="进度">
            {STEPS.map((s, i) => <li key={s} className={i < step ? "is-done" : i === step ? "is-active" : ""}><i /><span>{s}</span></li>)}
          </ol>
          <div className="fb-bar"><i style={{ transform: `scaleX(${(step + 1) / STEPS.length})` }} /></div>

          <div key={step} className="fb-step">
            {step === 0 && (<>
              <h2>你穿的是哪一双？</h2>
              <p className="fb-hint">{hasProfile ? "来自你最近一次的推荐结果。" : "还没有测评结果，先从鞋库中选择；完成测评后这里会显示你的推荐。"}</p>
              <div className="fb-shoes" data-testid="fb-shoes">
                {recShoes.map((s) => (
                  <button type="button" key={s.id} className={`fb-shoe ${shoeId === s.id ? "is-on" : ""}`} onClick={() => setShoeId(s.id)} aria-pressed={shoeId === s.id}>
                    <small data-no-translate>{s.brand}</small><strong data-no-translate>{s.name}</strong><span>{s.positioning}</span>
                    {prior[s.id] ? <em className="fb-badge"><span>已反馈</span> {prior[s.id]} <span>次 · 可回访</span></em> : null}
                  </button>
                ))}
                <button type="button" className={`fb-shoe fb-shoe-own ${isOwned ? "is-on" : ""}`} onClick={() => setShoeId("__owned")} data-testid="fb-owned">
                  <small>OWN</small><strong>我自己的鞋</strong><span>以前买过、正在穿的鞋，也可以反馈。</span>
                </button>
              </div>
              {isOwned && (
                <div className="fb-owned-form">
                  <label><span>品牌</span><input className="fb-input" value={owned.brand} onChange={(e) => setOwned({ ...owned, brand: e.target.value })} placeholder="例如：Nike" data-testid="own-brand" /></label>
                  <label><span>型号</span><input className="fb-input" value={owned.model} onChange={(e) => setOwned({ ...owned, model: e.target.value })} placeholder="例如：Kobe 6" data-testid="own-model" /></label>
                  <label><span>尺码</span><input className="fb-input" value={owned.size} onChange={(e) => setOwned({ ...owned, size: e.target.value })} placeholder="例如：EU 43" data-testid="own-size" /></label>
                </div>
              )}
              {shoeId && followUp > 0 && <p className="fb-followup"><span>这是你对这双鞋的第</span> {followUp + 1} <span>次反馈（回访），会和之前的记录一起保存。</span></p>}
            </>)}

            {step === 1 && (<>
              <h2>哪里紧，哪里松？</h2>
              <p className="fb-hint">点击脚的每个区域，标记感受。</p>
              <div className="fb-fit">
                <svg viewBox="0 0 160 360" className="fb-foot" aria-hidden>
                  <path d="M80 8c38 0 62 34 62 84 0 40-10 64-12 100-3 52 8 88-6 128-10 26-34 32-48 32s-36-8-44-36c-10-38 0-74-4-124C26 150 18 128 18 92 18 42 42 8 80 8z" />
                  {FIT_ZONES.map((z, i) => <rect key={z} x="18" y={[8, 92, 176, 262][i]} width="124" height="84" className={`zone zone-${fitMap[z] ?? "none"}`} />)}
                </svg>
                <div className="fb-zones">
                  {FIT_ZONES.map((z) => (
                    <div key={z} className="fb-zone">
                      <b>{ZONE_LABEL[z]}</b>
                      <div className="fb-chips">{(["tight", "ok", "loose"] as FitMark[]).map((m) => (
                        <button type="button" key={m} className={`fb-chip ${fitMap[z] === m ? "is-on" : ""}`} onClick={() => setFitMap({ ...fitMap, [z]: m })} data-testid={`fit-${z}-${m}`}>{MARK_LABEL[m]}</button>
                      ))}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>)}

            {step === 2 && (<>
              <h2>预测 vs 你的感受</h2>
              <p className="fb-hint">{predicted ? "灰色刻度是系统预测，拖动滑块给出你的真实感受（1–10）。差距较大会被高亮。" : "这双鞋不在鞋库中，没有系统预测；直接给出你的真实感受（1–10）。"}</p>
              <div className="fb-perf">
                {PERF_DIMS.map((d) => {
                  const v = felt[d];
                  const pd = predicted ? predicted[d] : null;
                  const gap = v == null || pd == null ? 0 : v - pd;
                  return (
                    <div key={d} className={`fb-dim ${Math.abs(gap) >= 2.5 ? "is-gap" : ""}`}>
                      <div className="fb-dim-head"><b>{DIM_LABEL[d]}</b><span><span>预测</span> <i data-no-translate>{pd ?? "—"}</i> · <span>感受</span> <i data-no-translate>{v ?? "—"}</i></span></div>
                      <div className="fb-range">
                        <em style={{ left: `${((pd ?? 5.5) - 1) / 9 * 100}%`, opacity: pd == null ? 0 : 1 }} aria-hidden />
                        <input type="range" min={1} max={10} step={1} value={v ?? Math.round(pd ?? 5)} onChange={(e) => setFelt({ ...felt, [d]: Number(e.target.value) })} onClick={(e) => setFelt({ ...felt, [d]: Number((e.target as HTMLInputElement).value) })} aria-label={DIM_LABEL[d]} data-testid={`perf-${d}`} />
                      </div>
                      {Math.abs(gap) >= 2.5 && <p className="fb-gap">{gap > 0 ? "比预测好很多" : "比预测差很多"}</p>}
                    </div>
                  );
                })}
              </div>
            </>)}

            {step === 3 && (<>
              <h2>你是怎么穿它的？</h2>
              <div className="fb-group"><b>穿着时长</b><div className="fb-chips">{DURATION.map(([k, l]) => <button type="button" key={k} className={`fb-chip ${duration === k ? "is-on" : ""}`} onClick={() => setDuration(k)} data-testid={`dur-${k}`}>{l}</button>)}</div></div>
              <div className="fb-group"><b>使用场地</b><div className="fb-chips">{COURT.map(([k, l]) => <button type="button" key={k} className={`fb-chip ${court === k ? "is-on" : ""}`} onClick={() => setCourt(k)} data-testid={`court-${k}`}>{l}</button>)}</div></div>
              <div className="fb-group"><b>不适或疼痛</b><div className="fb-chips">
                <button type="button" className={`fb-chip ${noPain ? "is-on" : ""}`} onClick={() => { setNoPain(!noPain); setPain([]); }} data-testid="pain-none">没有不适</button>
                {PAIN.map((p) => <button type="button" key={p} className={`fb-chip ${pain.includes(p) ? "is-on" : ""}`} onClick={() => { setNoPain(false); setPain(pain.includes(p) ? pain.filter((x) => x !== p) : [...pain, p]); }}>{p}</button>)}
              </div><p className="fb-hint">仅作体验记录，不做医疗判断。</p></div>
            </>)}

            {step === 4 && (<>
              <h2>还想说一句吗？</h2>
              <p className="fb-hint">可选。仅你本人与管理端可见。</p>
              <input className="fb-input" maxLength={120} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="例如：前掌很稳，但后跟有点空" data-testid="fb-comment" />
              <p className="fb-count" data-no-translate>{comment.length}/120</p>
            </>)}
          </div>

          <div className="fb-nav">
            <button type="button" className="text-button" disabled={step === 0} onClick={() => setStep(step - 1)}>← 上一步</button>
            {miss.length > 0 && <span className="wizard-missing fb-missing"><span>还需完成：</span>{miss.join("、")}</span>}
            {step < STEPS.length - 1
              ? <button type="button" className="button button-dark" disabled={miss.length > 0} onClick={() => setStep(step + 1)} data-testid="fb-next">下一步 <b>→</b></button>
              : <button type="button" className="button button-dark" onClick={submit} data-testid="fb-submit">提交反馈 <b>↗</b></button>}
          </div>
        </div>
      )}
    </section>
  );
}
