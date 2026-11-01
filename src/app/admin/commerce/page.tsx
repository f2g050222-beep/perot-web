"use client";
import { useEffect, useState } from "react";
import { commerceStats } from "@/lib/admin-store";
export default function AdminCommerce() {
  const [rows, setRows] = useState<ReturnType<typeof commerceStats>>([]);
  useEffect(() => setRows(commerceStats().sort((a, b) => b.intents - a.intents)), []);
  const max = Math.max(1, ...rows.map((r) => r.views));
  return (<>
    <header className="admin-head"><p className="eyebrow">COMMERCE · DEMO</p><h1>购买 / 点击数据。</h1><p className="admin-muted">演示数据：每双鞋的浏览、点击与购买意向。PEROT 是决策支持平台，价格不参与推荐计算。</p></header>
    <table className="admin-table"><thead><tr><th>鞋款</th><th>浏览</th><th>点击</th><th>购买意向</th><th>点击率</th><th>转化率</th><th /></tr></thead>
      <tbody>{rows.map((r) => <tr key={r.id}><td data-no-translate>{r.label}</td><td>{r.views}</td><td>{r.clicks}</td><td>{r.intents}</td><td>{(r.ctr * 100).toFixed(1)}%</td><td>{(r.conv * 100).toFixed(1)}%</td><td className="admin-barcell"><i style={{ transform: `scaleX(${r.views / max})` }} /></td></tr>)}</tbody></table>
  </>);
}
