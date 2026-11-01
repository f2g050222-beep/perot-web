"use client";
import Link from "next/link";
import { getShoe, formatPrice, DEMO_DISCLOSURE } from "@/data/shoes";
import { COLLAR_LABEL, LAST_LABEL, PLATE_LABEL, POS_LABEL, dims, fitNotes, similar, suitsWho, traitsOf, DIMS } from "@/lib/shoe-insights";
import { ExplodedShoe } from "@/components/exploded-shoe";
import { Bar, MatchBadge, ShoeGlyph, useMatches } from "./shoe-bits";
import { PageMotifs, StompShoe } from "@/components/motifs";

const EVIDENCE_SOURCE: Record<string, string> = { official: "官方资料", measured: "实测", admin: "管理员录入", userSelf: "用户自评", userFeedback: "用户反馈", inferred: "推断" };
const CONFIDENCE: Record<string, string> = { low: "可信度低", medium: "可信度中等", high: "可信度高", unknown: "可信度未知" };
const STATUS: Record<string, string> = { demo: "演示数据 · 待验证", verified: "已验证", pending: "待验证", missing: "缺失", notApplicable: "不适用" };

export function ShoeDetail({ id }: { id: string }) {
  const s = getShoe(id)!;
  const matches = useMatches();
  const m = matches?.[s.id];
  const d = dims(s);
  const rel = similar(s, 4);
  const f = s.last.forefoot, mf = s.last.midfoot, h = s.last.heel;

  return (
    <section className="inner-page r7-page r7-detail" style={{ position: "relative" }}><PageMotifs />
      <nav className="r7-crumbs"><Link href="/shoes">球鞋数据库</Link> / <span data-no-translate>{s.brand} {s.name}</span></nav>
      <header className="r7-dhero">
        <div className="r7-hero">
          <span className="eyebrow"><span data-no-translate>{s.brand} · {s.year}</span> · {POS_LABEL[s.category]}</span>
          <h1 data-no-translate>{s.name}</h1>
          <p className="r7-dpos">{s.positioning}</p>
          <div className="r7-dmeta">
            <div><span>参考价</span><b data-no-translate>{formatPrice(s.price)}</b></div>
            <div><span>重量</span><b><span data-no-translate>{s.weightG}</span> g</b></div>
            <div><span>楦型</span><b>{LAST_LABEL[s.last.overall]}</b></div>
            <div><span>鞋领</span><b>{COLLAR_LABEL[s.upper.collar]}</b></div>
          </div>
          <div className="lib-tags">{traitsOf(s).map((t) => <span key={t.key}>{t.label}</span>)}</div>
          <div className="r7-ctas">
            <Link className="button button-dark" href={`/compare?s=${s.id},${rel[0]?.id ?? ""}`} data-testid="d-compare">加入对比 <b>⇄</b></Link>
            <Link className="button" href="/feedback" data-testid="d-feedback">写穿着反馈 <b>↗</b></Link>
          </div>
        </div>
        <div className="r7-dvisual"><ExplodedShoe /><span className="r7-hero-motif"><StompShoe /></span></div>
      </header>

      <div className="r7-dgrid">
        <section className="r7-panel r7-matchpanel" data-testid="d-match">
          <span className="eyebrow">MY PROFILE MATCH</span>
          {m ? <>
            <div className="r7-matchhead"><MatchBadge match={m} /><h2>{m.excluded ? "这双鞋与你的画像存在硬冲突" : m.grade}</h2></div>
            {m.excluded && m.triggers.length > 0 && <ul className="r7-list is-warn">{m.triggers.map((t) => <li key={t}>{t}</li>)}</ul>}
            {m.reasons.length > 0 && <><h3>为什么</h3><ul className="r7-list">{m.reasons.slice(0, 4).map((t) => <li key={t}>{t}</li>)}</ul></>}
            {m.tradeoffs.length > 0 && <><h3>需要注意</h3><ul className="r7-list is-warn">{m.tradeoffs.slice(0, 3).map((t) => <li key={t}>{t}</li>)}</ul></>}
          </> : <>
            <h2>还不知道它是否适合你。</h2>
            <p className="r7-muted">完成用户画像测评后，这里会显示匹配度、原因与取舍。</p>
            <Link className="button button-dark" href="/profile-builder">开始测评 <b>↗</b></Link>
          </>}
        </section>

        <section className="r7-panel">
          <span className="eyebrow">PERFORMANCE</span><h2>六维性能。</h2>
          <div className="r7-bars">{DIMS.map((k) => <Bar key={k.key} label={k.label} value={d[k.key]} />)}</div>
        </section>

        <section className="r7-panel">
          <span className="eyebrow">TRACTION</span><h2>抓地，分场地看。</h2>
          <div className="r7-bars">
            <Bar label="干净木地板" value={s.grip.indoorClean} /><Bar label="浮灰木地板" value={s.grip.indoorDusty} /><Bar label="潮湿木地板" value={s.grip.indoorWet} />
            <Bar label="室外塑胶" value={s.grip.outdoorRubber} /><Bar label="室外水泥" value={s.grip.outdoorConcrete} /><Bar label="制动" value={s.grip.braking} />
          </div>
        </section>

        <section className="r7-panel">
          <span className="eyebrow">CUSHION</span><h2>缓震与脚感。</h2>
          <div className="r7-bars">
            <Bar label="软硬（越高越软）" value={s.midsole.cushionSoftness} /><Bar label="响应" value={s.midsole.response} /><Bar label="回弹" value={s.midsole.rebound} />
            <Bar label="前掌推进" value={s.midsole.forefootDrive} /><Bar label="贴地感" value={s.midsole.courtFeel} /><Bar label="鞋底厚度" value={s.midsole.stackHeight} />
          </div>
        </section>

        <section className="r7-panel">
          <span className="eyebrow">SUPPORT</span><h2>支撑与保护。</h2>
          <div className="r7-bars">
            <Bar label="横向稳定" value={s.stability.lateral} /><Bar label="落地稳定" value={s.stability.landing} /><Bar label="防侧翻" value={s.stability.antiRoll} />
            <Bar label="抗扭" value={s.stability.torsion} /><Bar label="脚踝保护" value={s.protection.ankle} /><Bar label="落地保护" value={s.protection.landing} />
          </div>
        </section>

        <section className="r7-panel r7-wide" data-testid="d-last">
          <span className="eyebrow">THREE-ZONE LAST</span><h2>三区楦型。</h2>
          <div className="r7-zones">
            <div className="r7-zone"><h3>前掌</h3><Bar label="楦宽" value={f.lastWidth} /><Bar label="空间" value={f.space} /><Bar label="压迫风险" value={f.pressureRisk} /><Bar label="宽脚适配" value={f.wideFootFit} /><Bar label="窄脚适配" value={f.narrowFootFit} /></div>
            <div className="r7-zone"><h3>足中</h3><Bar label="包裹" value={mf.wrap} /><Bar label="足弓空间" value={mf.archSpace} /><Bar label="鞋带区压力" value={mf.lacePressure} /><Bar label="锁定" value={mf.lockdown} /></div>
            <div className="r7-zone"><h3>后跟</h3><Bar label="宽度" value={h.width} /><Bar label="锁定" value={h.lockdown} /><Bar label="掉跟风险" value={h.slipRisk} /><Bar label="空间" value={h.space} /></div>
          </div>
        </section>

        <section className="r7-panel">
          <span className="eyebrow">SPECS</span><h2>参数。</h2>
          <dl className="r7-specs">
            <div><dt>落差</dt><dd><span data-no-translate>{s.midsole.dropMm}</span> mm</dd></div>
            <div><dt>抗扭结构</dt><dd>{PLATE_LABEL[s.midsole.plate]}</dd></div>
            <div><dt>鞋领设计</dt><dd>{s.upper.collarDesign}</dd></div>
            <div><dt>基准尺码</dt><dd>EU <span data-no-translate>{s.sizeGuide.baseSizeEu}</span></dd></div>
            <div><dt>内长</dt><dd><span data-no-translate>{s.sizeGuide.internalLengthMm}</span> mm</dd></div>
            <div><dt>耐磨</dt><dd><span data-no-translate>{s.durability}</span> / 10</dd></div>
            <div><dt>配色</dt><dd>{s.colors.join("、")}</dd></div>
          </dl>
        </section>

        <section className="r7-panel">
          <span className="eyebrow">SUITS WHO</span><h2>适合谁。</h2>
          <ul className="r7-list">{suitsWho(s).map((t) => <li key={t}>{t}</li>)}</ul>
          <span className="eyebrow r7-gap">FIT NOTES</span><h2>合脚提示。</h2>
          <ul className="r7-list is-note">{fitNotes(s).map((t) => <li key={t}>{t}</li>)}</ul>
        </section>

        <section className="r7-panel r7-evidence" data-testid="d-evidence">
          <span className="eyebrow">DATA SOURCES</span><h2>数据来源。</h2>
          <dl className="r7-specs">
            <div><dt>来源</dt><dd>{EVIDENCE_SOURCE[s.evidence.source] ?? s.evidence.source}</dd></div>
            <div><dt>可信度</dt><dd>{CONFIDENCE[s.evidence.confidence] ?? s.evidence.confidence}</dd></div>
            <div><dt>状态</dt><dd>{STATUS[s.evidence.status] ?? s.evidence.status}</dd></div>
            <div><dt>更新</dt><dd data-no-translate>{s.evidence.updatedAt}</dd></div>
            <div><dt>数据版本</dt><dd data-no-translate>{s.evidence.version}</dd></div>
          </dl>
          <p className="r7-muted">{DEMO_DISCLOSURE}</p>
        </section>
      </div>

      <section className="r7-related">
        <div className="r7-related-head"><h2>相似鞋款。</h2><Link className="text-button" href="/shoes">全部鞋款 ↗</Link></div>
        <div className="r7-rel-track" data-testid="d-related">
          {rel.map((r) => (
            <Link key={r.id} href={`/shoes/${r.id}`} className="rel-card">
              <ShoeGlyph shoe={r} />
              <small><span data-no-translate>{r.brand}</span> · {POS_LABEL[r.category]}</small>
              <b data-no-translate>{r.name}</b>
              <span className="rel-pos">{r.positioning}</span>
            </Link>
          ))}
        </div>
      </section>
    </section>
  );
}
