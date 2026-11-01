"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { SHOES, getShoe, formatPrice } from "@/data/shoes";
import type { Shoe } from "@/lib/types";
import { COLLAR_LABEL, DIMS, PLATE_LABEL, POS_LABEL, dims, type DimKey } from "@/lib/shoe-insights";
import { MatchBadge, ShoeGlyph, useMatches } from "./shoe-bits";
import { PageMotifs, Basketball } from "@/components/motifs";

const COLORS = ["#111216", "#9a9488", "#c8a96a"];
const R = 120, C = 160;

function point(i: number, v: number) {
  const a = (Math.PI * 2 * i) / DIMS.length - Math.PI / 2;
  return [C + Math.cos(a) * (R * v) / 10, C + Math.sin(a) * (R * v) / 10];
}

function Radar({ shoes }: { shoes: Shoe[] }) {
  const key = shoes.map((s) => s.id).join("-");
  return (
    <svg className="r7-radar" viewBox="0 0 320 320" data-testid="cmp-radar" key={key}>
      {[2, 4, 6, 8, 10].map((v) => <polygon key={v} className="rd-grid" points={DIMS.map((_, i) => point(i, v).join(",")).join(" ")} />)}
      {DIMS.map((d, i) => { const [x, y] = point(i, 10); const [lx, ly] = point(i, 11.6); return <g key={d.key}><line className="rd-axis" x1={C} y1={C} x2={x} y2={y} /><text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle">{d.label}</text></g>; })}
      {shoes.map((s, k) => { const v = dims(s); return <polygon key={s.id} className="rd-shape" style={{ ["--c" as string]: COLORS[k], animationDelay: `${k * 180}ms` }} points={DIMS.map((d, i) => point(i, v[d.key]).join(",")).join(" ")} />; })}
    </svg>
  );
}

export function CompareLab() {
  const sp = useSearchParams();
  const router = useRouter();
  const matches = useMatches();
  const ids = useMemo(() => {
    const raw = (sp.get("s") ?? "").split(",").filter((x) => getShoe(x));
    const uniq = [...new Set(raw)].slice(0, 3);
    return uniq.length ? uniq : [SHOES[0].id, SHOES[1].id];
  }, [sp]);
  const shoes = ids.map((x) => getShoe(x)!);
  const [q, setQ] = useState("");
  const [copied, setCopied] = useState(false);
  const set = (next: string[]) => router.replace(`/compare?s=${next.join(",")}`, { scroll: false });
  const cands = SHOES.filter((s) => !ids.includes(s.id) && (!q.trim() || `${s.brand} ${s.name}`.toLowerCase().includes(q.trim().toLowerCase())));
  const share = async () => { try { await navigator.clipboard.writeText(window.location.href); } catch { /* 剪贴板不可用时忽略 */ } setCopied(true); setTimeout(() => setCopied(false), 1800); };

  const rows: { key: string; label: string; get: (s: Shoe) => number; best: "max" | "min" | null; fmt?: (s: Shoe) => React.ReactNode }[] = [
    ...DIMS.map((d) => ({ key: d.key, label: d.label, get: (s: Shoe) => dims(s)[d.key as DimKey], best: "max" as const })),
    { key: "weight", label: "重量 (g)", get: (s) => s.weightG, best: "min" },
    { key: "price", label: "参考价", get: (s) => s.price ?? 0, best: "min", fmt: (s) => <span data-no-translate>{formatPrice(s.price)}</span> },
    { key: "durability", label: "耐磨", get: (s) => s.durability, best: "max" },
    { key: "drop", label: "落差 (mm)", get: (s) => s.midsole.dropMm, best: null },
    { key: "plate", label: "抗扭结构", get: () => 0, best: null, fmt: (s) => PLATE_LABEL[s.midsole.plate] },
    { key: "collar", label: "鞋领", get: () => 0, best: null, fmt: (s) => COLLAR_LABEL[s.upper.collar] },
    { key: "pos", label: "定位", get: () => 0, best: null, fmt: (s) => POS_LABEL[s.category] },
  ];
  const wins = shoes.map(() => 0);
  const winners = rows.map((r) => {
    if (!r.best || shoes.length < 2) return [] as number[];
    const vals = shoes.map(r.get);
    const t = r.best === "max" ? Math.max(...vals) : Math.min(...vals);
    if (vals.every((v) => v === t)) return [];
    const w = vals.map((v, i) => (v === t ? i : -1)).filter((i) => i >= 0);
    if (DIMS.some((d) => d.key === r.key)) w.forEach((i) => wins[i]++);
    return w;
  });

  return (
    <section className="inner-page r7-page" style={{ position: "relative" }}><PageMotifs />
      <header className="r7-hero">
        <span className="eyebrow">COMPARE LAB</span>
        <h1>把差异，<br /><em>摆在眼前。</em></h1>
        <p>选择两到三双鞋，六维雷达图与逐项对比会标出每一项的胜出者。链接会记录你的选择，可以直接分享。</p>
        <span className="r7-hero-motif"><Basketball size={46} /></span>
      </header>

      <div className="r7-picker">
        <div className="r7-slots" data-testid="cmp-slots">
          {shoes.map((s, k) => (
            <div key={s.id} className="r7-slot" style={{ ["--c" as string]: COLORS[k] }} data-testid="cmp-slot">
              <i />
              <span data-no-translate>{s.brand} {s.name}</span>
              {shoes.length > 1 && <button type="button" aria-label="移除" onClick={() => set(ids.filter((x) => x !== s.id))} data-testid={`cmp-remove-${s.id}`}>×</button>}
            </div>
          ))}
          {shoes.length < 3 && <span className="r7-slot is-empty">还可以再加一双</span>}
        </div>
        {shoes.length < 3 && (
          <div className="r7-add">
            <input className="r7-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索要加入对比的鞋…" data-testid="cmp-search" />
            <div className="r7-add-list">{cands.map((s) => <button type="button" key={s.id} className="r7-chip" onClick={() => { set([...ids, s.id]); setQ(""); }} data-testid={`cmp-add-${s.id}`}>+ <span data-no-translate>{s.brand} {s.name}</span></button>)}</div>
          </div>
        )}
        <button type="button" className="text-button" onClick={share} data-testid="cmp-share">{copied ? "已复制链接 ✓" : "复制分享链接 ⧉"}</button>
      </div>

      <div className="r7-cmpgrid">
        <div className="r7-panel r7-radarwrap">
          <Radar shoes={shoes} />
          <ul className="r7-legend">{shoes.map((s, k) => <li key={s.id} style={{ ["--c" as string]: COLORS[k] }}><i /><span data-no-translate>{s.name}</span> <em><span>胜出项数</span> <b data-no-translate>{wins[k]}</b></em></li>)}</ul>
        </div>
        <div className="r7-cmpcards">
          {shoes.map((s, k) => (
            <Link key={s.id} href={`/shoes/${s.id}`} className="rel-card" style={{ ["--c" as string]: COLORS[k] }}>
              <ShoeGlyph shoe={s} /><MatchBadge match={matches?.[s.id]} />
              <small><span data-no-translate>{s.brand}</span> · {POS_LABEL[s.category]}</small>
              <b data-no-translate>{s.name}</b><span className="rel-pos">{s.positioning}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="r7-tablewrap">
        <table className="r7-table" data-testid="cmp-table">
          <thead><tr><th>项目</th>{shoes.map((s, k) => <th key={s.id} style={{ ["--c" as string]: COLORS[k] }}><i /><span data-no-translate>{s.name}</span></th>)}</tr></thead>
          <tbody>
            {rows.map((r, ri) => (
              <tr key={r.key}>
                <th>{r.label}</th>
                {shoes.map((s, k) => {
                  const win = winners[ri].includes(k);
                  const v = r.get(s);
                  return <td key={s.id} className={win ? "is-win" : ""} data-testid={win ? "cmp-win" : undefined}>
                    {r.fmt ? r.fmt(s) : <span data-no-translate>{Number.isInteger(v) ? v : v.toFixed(1)}</span>}
                    {DIMS.some((d) => d.key === r.key) && <i className="r7-cell-bar" style={{ ["--w" as string]: `${v * 10}%` }} />}
                  </td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="r7-disclosure">六维数据为演示数据，胜出仅代表该项数值更高（重量与价格为更低），不代表整体更好。<Link href="/shoes">返回鞋库 ↗</Link></p>
    </section>
  );
}
