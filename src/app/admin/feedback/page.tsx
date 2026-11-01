"use client";
/* 管理端：全部用户的穿着反馈（筛选 / 按鞋聚合 / 研究导出） */
import { Fragment, useEffect, useMemo, useState } from "react";
import { DEMO_FEEDBACK, download, exportRows, toCSV } from "@/lib/admin-store";
import { FIT_ZONES, PERF_DIMS, feedbackRepo, satisfaction, type WearFeedback } from "@/lib/feedback-store";
const DIM: Record<string, string> = { fit: "合脚", lockdown: "锁定", cushioning: "缓震", response: "响应", traction: "抓地", stability: "稳定" };
export default function AdminFeedback() {
  const [real, setReal] = useState<WearFeedback[]>([]);
  const [demo, setDemo] = useState(true);
  const [user, setUser] = useState(""); const [shoe, setShoe] = useState(""); const [kind, setKind] = useState(""); const [from, setFrom] = useState(""); const [to, setTo] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  useEffect(() => setReal(feedbackRepo.listAll()), []);
  const all = useMemo(() => [...real, ...(demo ? DEMO_FEEDBACK : [])], [real, demo]);
  const list = all.filter((f) => (!user || f.userId === user) && (!shoe || f.shoeId === shoe) && (!kind || f.kind === kind)
    && (!from || f.createdAt >= Date.parse(from)) && (!to || f.createdAt <= Date.parse(to) + 86400000));
  const users = [...new Set(all.map((f) => f.userId))]; const shoes = [...new Map(all.map((f) => [f.shoeId, f.shoeLabel ?? f.shoeId]))];
  const agg = [...new Set(list.map((f) => f.shoeId))].map((id) => {
    const xs = list.filter((f) => f.shoeId === id);
    const gaps = PERF_DIMS.map((d) => { const v = xs.filter((f) => f.perf[d].predicted != null); return v.length ? v.reduce((a, f) => a + f.perf[d].felt - (f.perf[d].predicted as number), 0) / v.length : null; });
    return { id, label: xs[0].shoeLabel ?? id, n: xs.length, sat: xs.reduce((a, f) => a + satisfaction(f), 0) / xs.length, fitIssues: xs.filter((f) => FIT_ZONES.some((z) => f.fitMap[z] !== "ok")).length, pain: xs.filter((f) => f.usage.pain.length).length, gaps };
  }).sort((a, b) => b.n - a.n);
  const sat = list.length ? list.reduce((a, f) => a + satisfaction(f), 0) / list.length : 0;
  const stamp = new Date().toISOString().slice(0, 10);
  return (<>
    <header className="admin-head"><p className="eyebrow">WEAR FEEDBACK · PRIVATE DATA</p><h1>穿着反馈。</h1><p className="admin-muted">全部用户的私有反馈，仅管理端可见。localStorage 演示期：只能看到本浏览器产生的真实反馈，接入后端后即可汇总所有用户。</p>
      <div className="admin-row-actions">
        <button className="button button-dark" onClick={() => download(`perot-feedback-${stamp}.csv`, toCSV(exportRows(list)), "text/csv;charset=utf-8")} data-testid="export-csv">导出 CSV <b>↓</b></button>
        <button className="button" onClick={() => download(`perot-feedback-${stamp}.json`, JSON.stringify({ exportedAt: new Date().toISOString(), count: list.length, rows: exportRows(list) }, null, 2), "application/json")} data-testid="export-json">导出 JSON <b>↓</b></button>
      </div></header>
    <div className="admin-stats">
      <div className="admin-stat"><b data-no-translate>{list.length}</b><span>条反馈</span></div>
      <div className="admin-stat"><b data-no-translate>{new Set(list.map((f) => f.userId)).size}</b><span>位用户</span></div>
      <div className="admin-stat"><b data-no-translate>{sat.toFixed(1)}</b><span>平均满意度</span></div>
      <div className="admin-stat"><b data-no-translate>{list.filter((f) => f.followUpIndex > 0).length}</b><span>条回访</span></div>
      <div className="admin-stat"><b data-no-translate>{list.filter((f) => f.kind === "owned").length}</b><span>条自有鞋反馈</span></div>
      <div className="admin-stat"><b data-no-translate>{list.filter((f) => f.usage.pain.length).length}</b><span>条报告不适</span></div>
    </div>
    <div className="admin-filters admin-filter-form">
      <label><span>用户</span><select value={user} onChange={(e) => setUser(e.target.value)} data-testid="flt-user"><option value="">全部</option>{users.map((u) => <option key={u} value={u}>{u}</option>)}</select></label>
      <label><span>鞋款</span><select value={shoe} onChange={(e) => setShoe(e.target.value)}><option value="">全部</option>{shoes.map(([id, l]) => <option key={id} value={id}>{l}</option>)}</select></label>
      <label><span>类型</span><select value={kind} onChange={(e) => setKind(e.target.value)}><option value="">全部</option><option value="recommended">推荐鞋</option><option value="owned">自有鞋</option></select></label>
      <label><span>开始日期</span><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
      <label><span>结束日期</span><input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label>
      <label className="admin-check"><input type="checkbox" checked={demo} onChange={(e) => setDemo(e.target.checked)} data-testid="flt-demo" /><span>包含演示数据</span></label>
    </div>
    <h2 className="admin-h2">按鞋款聚合</h2>
    <table className="admin-table"><thead><tr><th>鞋款</th><th>反馈数</th><th>平均满意度</th><th>适配问题</th><th>报告不适</th>{PERF_DIMS.map((d) => <th key={d}>{DIM[d]}<small>差值</small></th>)}</tr></thead>
      <tbody>{agg.map((a) => <tr key={a.id}><td data-no-translate>{a.label}</td><td>{a.n}</td><td>{a.sat.toFixed(1)}</td><td>{a.fitIssues}</td><td>{a.pain}</td>{a.gaps.map((g, i) => <td key={i} className={g != null && Math.abs(g) >= 2 ? "is-gap" : ""}>{g == null ? "—" : (g > 0 ? "+" : "") + g.toFixed(1)}</td>)}</tr>)}</tbody></table>
    <h2 className="admin-h2">全部记录</h2>
    <table className="admin-table" data-testid="admin-fb-table"><thead><tr><th>时间</th><th>用户</th><th>鞋款</th><th>类型</th><th>回访</th><th>满意度</th><th>一句话</th></tr></thead>
      <tbody>{list.map((f) => <Fragment key={f.id}><tr onClick={() => setOpen(open === f.id ? null : f.id)} className="admin-clickrow"><td data-no-translate>{new Date(f.createdAt).toLocaleString()}</td><td data-no-translate>{f.userId}</td><td data-no-translate>{f.shoeLabel ?? f.shoeId}</td><td>{f.kind === "owned" ? "自有鞋" : "推荐鞋"}</td><td>{f.followUpIndex > 0 ? `#${f.followUpIndex}` : "—"}</td><td>{satisfaction(f).toFixed(1)}</td><td data-no-translate>{f.comment}</td></tr>
        {open === f.id && <tr><td colSpan={7}><pre className="admin-pre" data-no-translate>{JSON.stringify(f, null, 2)}</pre></td></tr>}</Fragment>)}</tbody></table>
  </>);
}
