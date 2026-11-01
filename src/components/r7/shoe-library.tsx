"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { SHOES, formatPrice, DEMO_DISCLOSURE } from "@/data/shoes";
import type { ShoeCategory } from "@/lib/types";
import { CUSHION_LABEL, POS_LABEL, TIER_LABEL, TRAITS, cushionFeel, dims, tier, traitsOf, type CushionFeel, type Tier } from "@/lib/shoe-insights";
import { Bar, MatchBadge, ShoeGlyph, useMatches } from "./shoe-bits";
import { PageMotifs, RunningShoe } from "@/components/motifs";

type Sort = "match" | "name" | "priceAsc" | "priceDesc" | "weight" | "year";
const SORTS: [Sort, string][] = [["match", "按匹配度"], ["name", "按名称"], ["priceAsc", "价格从低到高"], ["priceDesc", "价格从高到低"], ["weight", "重量从轻到重"], ["year", "最新发布"]];
const BRANDS = [...new Set(SHOES.map((s) => s.brand))];

function toggle<T>(arr: T[], v: T) { return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]; }

function Chip({ on, onClick, children, id }: { on: boolean; onClick: () => void; children: React.ReactNode; id: string }) {
  return <button type="button" className={`r7-chip ${on ? "is-on" : ""}`} onClick={onClick} data-testid={id} aria-pressed={on}>{children}</button>;
}

export function ShoeLibrary() {
  const matches = useMatches();
  const [q, setQ] = useState("");
  const [brands, setBrands] = useState<string[]>([]);
  const [pos, setPos] = useState<ShoeCategory[]>([]);
  const [cush, setCush] = useState<CushionFeel[]>([]);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [traits, setTraits] = useState<string[]>([]);
  const [sort, setSort] = useState<Sort>("name");
  const [cmp, setCmp] = useState<string[]>([]);
  const effSort = sort === "match" && !matches ? "name" : sort;

  const list = useMemo(() => {
    const k = q.trim().toLowerCase();
    const r = SHOES.filter((s) =>
      (!k || `${s.brand} ${s.name} ${s.positioning}`.toLowerCase().includes(k)) &&
      (!brands.length || brands.includes(s.brand)) &&
      (!pos.length || pos.includes(s.category)) &&
      (!cush.length || cush.includes(cushionFeel(s))) &&
      (!tiers.length || tiers.includes(tier(s))) &&
      traits.every((t) => TRAITS.find((x) => x.key === t)!.test(s)));
    const by: Record<Sort, (a: typeof SHOES[number], b: typeof SHOES[number]) => number> = {
      match: (a, b) => (matches?.[b.id]?.excluded ? -1 : matches?.[b.id]?.score ?? 0) - (matches?.[a.id]?.excluded ? -1 : matches?.[a.id]?.score ?? 0),
      name: (a, b) => `${a.brand} ${a.name}`.localeCompare(`${b.brand} ${b.name}`),
      priceAsc: (a, b) => (a.price ?? 0) - (b.price ?? 0),
      priceDesc: (a, b) => (b.price ?? 0) - (a.price ?? 0),
      weight: (a, b) => a.weightG - b.weightG,
      year: (a, b) => b.year - a.year,
    };
    return [...r].sort(by[effSort]);
  }, [q, brands, pos, cush, tiers, traits, effSort, matches]);

  const active = brands.length + pos.length + cush.length + tiers.length + traits.length + (q ? 1 : 0);
  const clear = () => { setQ(""); setBrands([]); setPos([]); setCush([]); setTiers([]); setTraits([]); };

  return (
    <section className="inner-page r7-page" style={{ position: "relative" }}><PageMotifs />
      <header className="r7-hero">
        <span className="eyebrow">PEROT SHOE DATABASE · DEMO DATA</span>
        <h1>球鞋，<br /><em>应该有据可依。</em></h1>
        <p>统一的六维性能指标、三区楦型数据与可追溯的数据状态。筛选、排序，然后点开任意一双查看完整拆解。</p>
        <div className="r7-hero-links"><Link className="text-button" href="/compare">进入球鞋对比 ↗</Link><Link className="text-button" href="/nba-picks">NBA Picks ↗</Link></div>
        <span className="r7-hero-motif"><RunningShoe /></span>
      </header>

      <div className="r7-toolbar">
        <input className="r7-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索品牌、型号或定位…" data-testid="lib-search" />
        <label className="r7-sort"><span>排序</span>
          <select value={effSort} onChange={(e) => setSort(e.target.value as Sort)} data-testid="lib-sort">
            {SORTS.filter(([k]) => k !== "match" || matches).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </label>
      </div>

      <div className="r7-filters">
        <div><b>品牌</b>{BRANDS.map((b) => <Chip key={b} id={`f-brand-${b}`} on={brands.includes(b)} onClick={() => setBrands(toggle(brands, b))}><span data-no-translate>{b}</span></Chip>)}</div>
        <div><b>位置</b>{(Object.keys(POS_LABEL) as ShoeCategory[]).map((p) => <Chip key={p} id={`f-pos-${p}`} on={pos.includes(p)} onClick={() => setPos(toggle(pos, p))}>{POS_LABEL[p]}</Chip>)}</div>
        <div><b>缓震</b>{(Object.keys(CUSHION_LABEL) as CushionFeel[]).map((c) => <Chip key={c} id={`f-cush-${c}`} on={cush.includes(c)} onClick={() => setCush(toggle(cush, c))}>{CUSHION_LABEL[c]}</Chip>)}</div>
        <div><b>价位</b>{(Object.keys(TIER_LABEL) as Tier[]).map((t) => <Chip key={t} id={`f-tier-${t}`} on={tiers.includes(t)} onClick={() => setTiers(toggle(tiers, t))}>{TIER_LABEL[t]}</Chip>)}</div>
        <div><b>特性</b>{TRAITS.map((t) => <Chip key={t.key} id={`f-trait-${t.key}`} on={traits.includes(t.key)} onClick={() => setTraits(toggle(traits, t.key))}>{t.label}</Chip>)}</div>
      </div>

      <div className="r7-count">
        <span>符合条件的鞋款</span> <b data-testid="lib-count">{list.length}</b>
        {active > 0 && <button type="button" className="text-button" onClick={clear} data-testid="lib-clear">清除筛选</button>}
        {!matches && <Link className="r7-count-hint" href="/profile-builder">完成画像测评后，每双鞋会显示你的匹配度 ↗</Link>}
      </div>

      {list.length === 0 ? <div className="r7-empty" data-testid="lib-empty"><p>没有符合条件的鞋款。</p><button type="button" className="button button-dark" onClick={clear}>清除筛选 <b>↺</b></button></div> :
        <div className="r7-grid" data-testid="lib-grid">
          {list.map((s, i) => {
            const d = dims(s);
            return (
              <article key={s.id} className="lib-card" style={{ ["--i" as string]: i }} data-testid="lib-card">
                <Link href={`/shoes/${s.id}`} className="lib-card-link">
                  <div className="lib-card-top"><ShoeGlyph shoe={s} /><MatchBadge match={matches?.[s.id]} /></div>
                  <small><span data-no-translate>{s.brand}</span> · {POS_LABEL[s.category]} · <span data-no-translate>{s.year}</span></small>
                  <h3 data-no-translate>{s.name}</h3>
                  <p>{s.positioning}</p>
                  <div className="lib-bars"><Bar label="缓震" value={d.cushioning} /><Bar label="响应" value={d.response} /><Bar label="抓地" value={d.traction} /></div>
                  <div className="lib-tags">{traitsOf(s).slice(0, 3).map((t) => <span key={t.key}>{t.label}</span>)}</div>
                  <footer><b data-no-translate>{formatPrice(s.price)}</b><em>查看详情 ↗</em></footer>
                </Link>
                <button type="button" className={`lib-cmp ${cmp.includes(s.id) ? "is-on" : ""}`} onClick={() => setCmp(cmp.includes(s.id) ? cmp.filter((x) => x !== s.id) : [...cmp, s.id].slice(-3))} data-testid={`cmp-${s.id}`}>{cmp.includes(s.id) ? "已加入对比 ✓" : "加入对比 +"}</button>
              </article>
            );
          })}
        </div>}

      {cmp.length > 0 && (
        <div className="r7-tray" data-testid="cmp-tray">
          <span><b data-no-translate>{cmp.length}</b> <span>/ 3 · 待对比鞋款</span></span>
          <Link className="button button-light" href={`/compare?s=${cmp.join(",")}`} data-testid="cmp-go">开始对比 <b>↗</b></Link>
        </div>
      )}
      <p className="r7-disclosure">{DEMO_DISCLOSURE}</p>
    </section>
  );
}
