"use client";
import { useEffect, useState } from "react";
import { getShoe } from "@/data/shoes";
import { listAdminShoes, saveAdminShoes, type AdminShoe } from "@/lib/admin-store";
import { predictPerf } from "@/lib/feedback-store";
const EMPTY: AdminShoe = { id: "", brand: "", name: "", category: "allRound", year: 2026, price: null, weightG: 380, status: "draft", positioning: "" };
export default function AdminShoes() {
  const [list, setList] = useState<AdminShoe[]>([]);
  const [edit, setEdit] = useState<AdminShoe | null>(null);
  const [view, setView] = useState<string | null>(null);
  useEffect(() => setList(listAdminShoes()), []);
  const commit = (l: AdminShoe[]) => { setList(l); saveAdminShoes(l); };
  const full = view ? getShoe(view) : undefined;
  return (<>
    <header className="admin-head"><p className="eyebrow">SHOES</p><h1>鞋款管理。</h1><p className="admin-muted">在此新增、编辑鞋款资料。演示期修改保存在本机，推荐引擎仍使用代码中的结构化鞋库。</p>
      <button className="button button-dark" onClick={() => setEdit({ ...EMPTY, id: `new-${Date.now()}` })} data-testid="admin-add-shoe">新增鞋款 <b>+</b></button></header>
    {edit && (
      <form className="admin-form" onSubmit={(e) => { e.preventDefault(); const i = list.findIndex((x) => x.id === edit.id); commit(i >= 0 ? list.map((x) => (x.id === edit.id ? edit : x)) : [edit, ...list]); setEdit(null); }}>
        {(["brand", "name", "category", "positioning"] as const).map((k) => <label key={k}><span>{({ brand: "品牌", name: "型号", category: "类别", positioning: "定位" })[k]}</span><input required={k !== "positioning"} value={edit[k]} onChange={(e) => setEdit({ ...edit, [k]: e.target.value })} data-testid={`shoe-${k}`} /></label>)}
        <label><span>年份</span><input type="number" value={edit.year} onChange={(e) => setEdit({ ...edit, year: +e.target.value })} /></label>
        <label><span>重量 (g)</span><input type="number" value={edit.weightG} onChange={(e) => setEdit({ ...edit, weightG: +e.target.value })} /></label>
        <label><span>价格</span><input type="number" value={edit.price ?? ""} onChange={(e) => setEdit({ ...edit, price: e.target.value ? +e.target.value : null })} /></label>
        <label><span>状态</span><select value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value as AdminShoe["status"] })}><option value="published">已发布</option><option value="draft">草稿</option></select></label>
        <div className="admin-form-actions"><button className="button button-dark" type="submit" data-testid="shoe-save">保存</button><button type="button" className="text-button" onClick={() => setEdit(null)}>取消</button></div>
      </form>
    )}
    <table className="admin-table"><thead><tr><th>品牌</th><th>型号</th><th>类别</th><th>年份</th><th>重量</th><th>状态</th><th /></tr></thead>
      <tbody>{list.map((s) => <tr key={s.id}><td data-no-translate>{s.brand}</td><td data-no-translate>{s.name}</td><td data-no-translate>{s.category}</td><td>{s.year}</td><td>{s.weightG}g</td><td><span className={`admin-pill p-${s.status}`}>{s.status === "published" ? "已发布" : "草稿"}</span></td>
        <td className="admin-row-actions"><button onClick={() => setEdit(s)}>编辑</button>{getShoe(s.id) && <button onClick={() => setView(view === s.id ? null : s.id)}>查看数据</button>}</td></tr>)}</tbody></table>
    {full && (<div className="admin-panel"><h2 data-no-translate>{full.brand} {full.name}</h2>
      <div className="admin-kv">{Object.entries(predictPerf(full)).map(([k, v]) => <div key={k}><span data-no-translate>{k}</span><b>{v}</b></div>)}</div>
      <pre className="admin-pre" data-no-translate>{JSON.stringify({ last: full.last, midsole: full.midsole, stability: full.stability, grip: full.grip, evidence: full.evidence }, null, 2)}</pre></div>)}
  </>);
}
