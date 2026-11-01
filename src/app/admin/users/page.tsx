"use client";
import { useEffect, useState } from "react";
import { listUsers } from "@/lib/admin-store";
export default function AdminUsers() {
  const [rows, setRows] = useState<ReturnType<typeof listUsers>>([]);
  useEffect(() => setRows(listUsers()), []);
  return (<>
    <header className="admin-head"><p className="eyebrow">USERS</p><h1>用户列表。</h1><p className="admin-muted">未接入账号系统前，用户以本机匿名 id 区分；演示用户仅用于展示。</p></header>
    <table className="admin-table"><thead><tr><th>用户 ID</th><th>来源</th><th>穿着反馈数</th></tr></thead>
      <tbody>{rows.map((u) => <tr key={u.id}><td data-no-translate>{u.id}</td><td>{u.source}</td><td>{u.feedback}</td></tr>)}</tbody></table>
  </>);
}
