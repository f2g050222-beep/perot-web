"use client";
import { useEffect, useState } from "react";
import { listModeration, setModeration, type ModStatus } from "@/lib/admin-store";
const L: Record<ModStatus, string> = { pending: "待审核", approved: "已通过", hidden: "已隐藏" };
export default function AdminModeration() {
  const [list, setList] = useState<ReturnType<typeof listModeration>>([]);
  const [f, setF] = useState<ModStatus | "all">("all");
  useEffect(() => setList(listModeration()), []);
  const act = (k: string, s: ModStatus) => { setModeration(k, s); setList(listModeration()); };
  return (<>
    <header className="admin-head"><p className="eyebrow">MODERATION</p><h1>留言审核。</h1><p className="admin-muted">审核公开留言墙的内容（演示：记录审核状态，不改动留言墙）。穿着反馈是私有数据，不在此处，也不会公开。</p></header>
    <div className="admin-filters">{(["all", "pending", "approved", "hidden"] as const).map((k) => <button key={k} className={f === k ? "is-on" : ""} onClick={() => setF(k)}>{k === "all" ? "全部" : L[k]}</button>)}</div>
    <div className="admin-cards">{list.filter((m) => f === "all" || m.status === f).map((m) => (
      <article key={m.key} className="admin-msg"><header><b data-no-translate>{m.name}</b><span data-no-translate>{m.lang} · {m.shoe}</span><span className={`admin-pill p-${m.status}`}>{L[m.status]}</span></header>
        <p data-no-translate>{m.text}</p>
        <div className="admin-row-actions"><button onClick={() => act(m.key, "approved")}>通过</button><button onClick={() => act(m.key, "hidden")}>隐藏</button><button onClick={() => act(m.key, "pending")}>设为待审核</button></div></article>))}</div>
  </>);
}
