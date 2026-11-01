"use client";
import Link from "next/link";
import { useState } from "react";
import { getShoe } from "@/data/shoes";
import { CHINA_BRANDS, PICKS_AS_OF, POPULAR, SIGNATURE_BY_BRAND, type NbaPick } from "@/lib/nba-picks";
import { dims } from "@/lib/shoe-insights";
import { Bar, ShoeGlyph } from "./shoe-bits";
import { PageMotifs, Basketball } from "@/components/motifs";

type Tab = "all" | "signature" | "popular" | "china";
const TABS: [Tab, string][] = [["all", "全部"], ["signature", "品牌签名鞋"], ["popular", "人气球星"], ["china", "中国品牌代表"]];

function PickCard({ p, i }: { p: NbaPick; i: number }) {
  const s = p.shoeId ? getShoe(p.shoeId) : undefined;
  const inner = <>
    <div className="pick-num" data-no-translate>{String(i + 1).padStart(2, "0")}</div>
    {s ? <ShoeGlyph shoe={s} /> : <div className="r7-glyph is-blank"><span data-no-translate>{p.brand}</span></div>}
    <span className="pick-brand" data-no-translate>{p.brand}</span>
    <h3 data-no-translate>{p.player}</h3>
    <b className="pick-line"><span>签名系列</span> · <span data-no-translate>{p.line}</span></b>
    <p>{p.note}</p>
    {s ? <><div className="lib-bars"><Bar label="缓震" value={dims(s).cushioning} /><Bar label="响应" value={dims(s).response} /><Bar label="稳定" value={dims(s).stability} /></div>
      <footer><span className="pick-flag">鞋库数据</span><em><span>查看</span> <span data-no-translate>{s.name}</span> ↗</em></footer></>
      : <footer><span className="pick-flag is-off">暂未收录</span></footer>}
  </>;
  return s
    ? <Link href={`/shoes/${s.id}`} className="pick-card" data-testid="pick-card">{inner}</Link>
    : <article className="pick-card is-off" data-testid="pick-card">{inner}</article>;
}

export function NbaPicksPage() {
  const [tab, setTab] = useState<Tab>("all");
  const show = (t: Tab) => tab === "all" || tab === t;
  return (
    <section className="inner-page r7-page" style={{ position: "relative" }}><PageMotifs />
      <header className="r7-hero">
        <span className="eyebrow">NBA PICKS · PUBLIC INFO · DEMO</span>
        <h1>球星选择，<br /><em>场上验证。</em></h1>
        <p>五大品牌的签名鞋球员、最受关注的人气球星，以及中国品牌的 NBA 代言代表。带「鞋库数据」标记的鞋款可以查看完整拆解。</p>
        <p className="r7-asof"><span>资料截至</span> <b data-no-translate>{PICKS_AS_OF}</b> <span>· 整理自公开报道，代言关系可能变化</span></p>
        <span className="r7-hero-motif"><Basketball size={50} /></span>
      </header>
      <div className="r7-tabs" role="tablist">
        {TABS.map(([k, l]) => <button type="button" key={k} className={`r7-chip ${tab === k ? "is-on" : ""}`} onClick={() => setTab(k)} data-testid={`pick-${k}`}>{l}</button>)}
      </div>

      {show("signature") && <section className="r7-pickgroup" data-testid="grp-signature">
        <span className="eyebrow">01 · SIGNATURE ATHLETES BY BRAND</span>
        <h2>五大品牌签名鞋。</h2>
        {SIGNATURE_BY_BRAND.map((b) => (
          <div key={b.brand} className="r7-brandrow">
            <h3 className="r7-brandname"><span data-no-translate>{b.brand}</span> <small><b data-no-translate>{b.players.length}</b> <span>位签名球员</span></small></h3>
            <div className="r7-pickgrid">{b.players.map((p, i) => <PickCard key={p.id} p={p} i={i} />)}</div>
          </div>
        ))}
      </section>}

      {show("popular") && <section className="r7-pickgroup" data-testid="grp-popular">
        <span className="eyebrow">02 · MOST POPULAR</span>
        <h2>人气球星。</h2>
        <p className="r7-muted">编辑精选的五位高关注度球员，不是官方人气排名。</p>
        <div className="r7-pickgrid">{POPULAR.map((p, i) => <PickCard key={p.id} p={p} i={i} />)}</div>
      </section>}

      {show("china") && <section className="r7-pickgroup" data-testid="grp-china">
        <span className="eyebrow">03 · CHINESE BRANDS</span>
        <h2>中国品牌代表。</h2>
        <p className="r7-muted">李宁、安踏、匹克、361° 与准者在 NBA 的签名球员。</p>
        <div className="r7-pickgrid">{CHINA_BRANDS.map((p, i) => <PickCard key={p.id} p={p} i={i} />)}</div>
      </section>}

      <p className="r7-disclosure">演示内容：球员与签名系列整理自公开报道（Sole Retriever、Hypebeast、Sports Business Journal 与品牌官方发布），不含比赛、上脚频率或销量数据。<Link href="/shoes">进入球鞋数据库 ↗</Link> · <Link href="/compare">球鞋对比 ↗</Link></p>
    </section>
  );
}
