"use client";

/* ============================================================================
   推荐结果页（PRD 8.4 / 13.8）
   ============================================================================
   固定输出三双：最适合 / 平衡选择 / 取舍选择。
   用户侧只显示文字等级，不显示计算分数。
   ============================================================================ */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SHOES, SHOE_DATA_VERSION, DEMO_DISCLOSURE } from "@/data/shoes";
import {
  recommend,
  deriveFootConstraint,
  suggestSize,
  RULE_VERSION,
} from "@/lib/matching";
import { loadDraft, saveSnapshot } from "@/lib/profile-store";
import { PageMotifs } from "@/components/motifs";
import { recommendForUser } from "@/lib/recommend-user";
import { isProfileComplete } from "@/lib/assess-validation";
import { SAMPLE_CASES } from "@/lib/sample-profiles";
import type { Recommendation, RecommendSlot, UserProfile } from "@/lib/types";

const SLOT_LABEL: Record<RecommendSlot, string> = {
  best: "最适合",
  balanced: "平衡选择",
  tradeoff: "取舍选择",
};

const DIM_LABEL: Record<string, string> = {
  foot: "足部适配",
  injury: "保护性",
  court: "场地匹配",
  play: "打法契合",
  body: "身体匹配",
  feel: "脚感",
  preference: "偏好",
  reference: "参考鞋",
};

export default function AssessResultsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fromDraft, setFromDraft] = useState(false);
  const [ready, setReady] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const draft = loadDraft();
    if (draft && isProfileComplete(draft)) {
      setProfile(draft);
      setFromDraft(true);
    } else {
      setProfile(SAMPLE_CASES[0].profile);
      setFromDraft(false);
    }
    setReady(true);
  }, []);

  const adjusted = useMemo(() => (profile ? recommendForUser(profile) : null), [profile]);
  const result = adjusted?.result ?? null;
  const feedbackCount = adjusted?.feedbackCount ?? 0;

  const fc = useMemo(() => (profile ? deriveFootConstraint(profile) : null), [profile]);

  if (!ready || !profile || !result || !fc) {
    return (
      <section className="inner-page">
        <div className="page-intro">
          <span className="eyebrow">RESULT</span>
          <h1>正在计算…</h1>
        </div>
      </section>
    );
  }

  const peers = result.slots.map((s) => s.item);
  const passedCount = SHOES.length - result.excluded.length;

  return (
    <section className="inner-page result-page" style={{ position: "relative" }}><PageMotifs />
      <div className="page-intro">
        <span className="eyebrow">RECOMMENDATION · {result.ruleVersion}</span>
        {feedbackCount > 0 && (
          <p className="result-fbnote" data-testid="fb-note">
            <span>已根据你的</span> <span>{feedbackCount}</span> <span>条穿着反馈调整推荐</span>
          </p>
        )}
        <h1>
          为你的脚
          <br />
          <em>找到的答案。</em>
        </h1>
        <p>
          固定输出三双。用户侧只显示文字等级，不显示计算分数。全部结论基于演示鞋库，
          需试穿确认。
        </p>
      </div>

      {!fromDraft && (
        <div className="result-banner">
          还没有你的画像，当前展示的是示例画像的推荐结果。
          <Link href="/profile-builder">去建立我的画像 ↗</Link>
        </div>
      )}

      {/* 足部约束摘要 */}
      <div className="result-facts">
        <div>
          <span>较宽一侧脚宽</span>
          <b>{fc.widthMm} mm</b>
        </div>
        <div>
          <span>较长一侧脚长</span>
          <b>{fc.lengthMm} mm</b>
        </div>
        <div>
          <span>主导侧</span>
          <b>{fc.governingSide === "left" ? "左脚" : "右脚"}</b>
        </div>
        <div>
          <span>通过硬约束</span>
          <b>
            {passedCount} / {SHOES.length} 双
          </b>
        </div>
      </div>

      {fc.notes.length > 0 && (
        <ul className="result-notes">
          {fc.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      )}

      {result.globalGaps.length > 0 && (
        <div className="result-gaps">
          {result.globalGaps.map((g) => (
            <p key={g}>{g}</p>
          ))}
        </div>
      )}

      {/* 三双推荐 */}
      <div className="result-slots">
        {result.slots.map(({ slot, item }) => (
          <ResultCard key={slot} slot={slot} item={item} peers={peers} />
        ))}
      </div>

      {/* 尺码建议 */}
      {result.slots[0] && (
        <SizeAdvice
          shoeName={`${result.slots[0].item.shoe.brand} ${result.slots[0].item.shoe.name}`}
          advice={suggestSize(profile, result.slots[0].item.shoe)}
        />
      )}

      {/* 被排除 */}
      {result.excluded.length > 0 && (
        <div className="result-excluded">
          <h2>未被推荐 · {result.excluded.length} 双</h2>
          <p>不只说推荐什么，也说为什么排除。</p>
          <div className="excl-list">
            {result.excluded.map((r) => (
              <div className="excl-row" key={r.shoe.id}>
                <span>
                  {r.shoe.brand} {r.shoe.name}
                </span>
                <em>{r.hard.triggers[0] ?? r.dataGaps[0] ?? "综合匹配度偏低"}</em>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="result-actions">
        <button
          type="button"
          className="button button-dark"
          onClick={() => {
            saveSnapshot({
              id: `snap-${Date.now()}`,
              savedAt: Date.now(),
              profile,
              ruleVersion: result.ruleVersion,
              shoeDataVersion: result.shoeDataVersion,
            });
            setSaved(true);
          }}
        >
          {saved ? "已保存到履历 ✓" : "保存这次测评"} <b>↗</b>
        </button>
        <Link className="text-button" href="/profile-builder">
          修改画像 ↗
        </Link>
        <Link className="text-button" href="/shoes">
          自己看鞋库 ↗
        </Link>
      </div>

      <p className="result-disclosure">{DEMO_DISCLOSURE}</p>
    </section>
  );
}

/* ---------------------------------------------------------------- 卡片 */

function relativeNote(item: Recommendation, peers: Recommendation[]): string | null {
  if (peers.length < 2) return null;
  const dims = Object.keys(item.breakdown) as (keyof typeof item.breakdown)[];

  let bestDim: string | null = null;
  let bestVal = -1;
  let worstDim: string | null = null;
  let worstVal = 2;

  for (const d of dims) {
    const values = peers.map((p) => p.breakdown[d]);
    if (Math.max(...values) - Math.min(...values) < 0.02) continue;

    const v = item.breakdown[d];
    const isTop = peers.every((p) => p === item || p.breakdown[d] <= v + 0.001);
    const isBottom = peers.every((p) => p === item || p.breakdown[d] >= v - 0.001);
    if (isTop && v > bestVal) {
      bestVal = v;
      bestDim = DIM_LABEL[d] ?? d;
    }
    if (isBottom && v < worstVal) {
      worstVal = v;
      worstDim = DIM_LABEL[d] ?? d;
    }
  }

  if (bestDim && worstDim && bestDim !== worstDim) {
    return `三双之中，它的${bestDim}最好，${worstDim}相对最弱。`;
  }
  if (bestDim) return `三双之中，它的${bestDim}最好。`;
  if (worstDim) return `三双之中，它的${worstDim}相对最弱。`;
  return "三双之间各项接近，差异在细节取舍。";
}

function ResultCard({
  slot,
  item,
  peers,
}: {
  slot: RecommendSlot;
  item: Recommendation;
  peers: Recommendation[];
}) {
  const rel = relativeNote(item, peers);
  const gradeClass =
    item.grade === "非常适合" || item.grade === "适合"
      ? "g-good"
      : item.grade === "可考虑"
      ? "g-mid"
      : item.grade === "谨慎考虑"
      ? "g-warn"
      : "g-bad";

  return (
    <article className="result-card">
      <header>
        <span className="result-slot">{SLOT_LABEL[slot]}</span>
        <span className={`result-grade ${gradeClass}`}>{item.grade}</span>
      </header>

      <h3>
        {item.shoe.brand} {item.shoe.name}
      </h3>
      <p className="result-pos">{item.shoe.positioning}</p>

      {rel && <p className="result-rel">{rel}</p>}
      {slot !== "best" && item.whyNotFirst && (
        <p className="result-whynot">{item.whyNotFirst}</p>
      )}

      <div className="result-block">
        <h4>适合你的原因</h4>
        <ul>
          {item.reasons.map((r, i) => (
            <li key={i}>{r.text}</li>
          ))}
        </ul>
      </div>

      {item.tradeoffs.length > 0 && (
        <div className="result-block">
          <h4>取舍与注意</h4>
          <ul>
            {item.tradeoffs.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </div>
      )}

      {item.dataGaps.length > 0 && (
        <div className="result-block result-block-gap">
          <h4>数据状态</h4>
          <ul>
            {item.dataGaps.map((g, i) => (
              <li key={i}>{g}</li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}

function SizeAdvice({
  shoeName,
  advice,
}: {
  shoeName: string;
  advice: { side: "left" | "right"; footLengthMm: number; suggestedEu: number; note: string }[];
}) {
  if (advice.length === 0) return null;
  const same = advice.length === 2 && advice[0].suggestedEu === advice[1].suggestedEu;

  return (
    <div className="result-size">
      <h2>尺码建议</h2>
      <p>基于 {shoeName} 的内长基准与品牌偏差推算，实际以试穿为准。</p>
      <div className="size-grid">
        {advice.map((a) => (
          <div key={a.side}>
            <span>
              {a.side === "left" ? "左脚" : "右脚"} · {a.footLengthMm}mm
            </span>
            <b>EU {a.suggestedEu}</b>
            <em>{a.note}</em>
          </div>
        ))}
      </div>
      {!same && advice.length === 2 && (
        <p className="size-warn">
          左右脚建议尺码不同，按较大的
          {advice[0].suggestedEu > advice[1].suggestedEu ? "左脚" : "右脚"}下单，另一侧靠鞋带与袜厚调节。
        </p>
      )}
    </div>
  );
}
