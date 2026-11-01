"use client";
import { useEffect, useState } from "react";
import type { Shoe } from "@/lib/types";
import { computeMatches, tone, type Match } from "@/lib/shoe-insights";

/** 侧视球鞋插画（无品牌图片，用数据色调） */
export function ShoeGlyph({ shoe, big = false }: { shoe: Shoe; big?: boolean }) {
  const high = shoe.upper.collar === "high", mid = shoe.upper.collar === "mid";
  const collarY = high ? 18 : mid ? 30 : 40;
  const stack = 10 + shoe.midsole.stackHeight * 1.6;
  return (
    <div className={`r7-glyph ${big ? "is-big" : ""}`} style={{ background: tone(shoe) }}>
      <svg viewBox="0 0 220 120" aria-hidden>
        <path className="g-upper" d={`M24 ${100 - stack} C30 ${collarY + 30} 52 ${collarY} 74 ${collarY} L92 ${collarY + 2} C104 ${collarY + 26} 128 54 160 60 C190 66 204 76 204 ${100 - stack} Z`} />
        <path className="g-lace" d={`M96 ${collarY + 14} l14 10 M106 ${collarY + 24} l14 10 M118 ${collarY + 32} l14 8`} />
        <rect className="g-mid" x="18" y={100 - stack} width="190" height={stack} rx={stack / 2} />
        <rect className="g-out" x="22" y="100" width="182" height="6" rx="3" />
        {shoe.midsole.plate === "carbon" && <path className="g-plate" d={`M60 ${100 - stack / 2} H170`} />}
      </svg>
      <span data-no-translate>{shoe.brand}</span>
    </div>
  );
}

export function Bar({ label, value, max = 10, note }: { label: string; value: number; max?: number; note?: string }) {
  return (
    <div className="r7-bar">
      <span>{label}</span>
      <i><b style={{ ["--w" as string]: `${(value / max) * 100}%` }} /></i>
      <em data-no-translate>{Number.isInteger(value) ? value : value.toFixed(1)}</em>
      {note && <small>{note}</small>}
    </div>
  );
}

export function useMatches() {
  const [m, setM] = useState<Record<string, Match> | null>(null);
  useEffect(() => { setM(computeMatches()); }, []);
  return m;
}

export function MatchBadge({ match }: { match?: Match }) {
  if (!match) return null;
  if (match.excluded) return <span className="r7-match is-out">不建议</span>;
  return <span className="r7-match" title={match.grade}><b data-no-translate>{match.score}</b><span>匹配</span></span>;
}
