"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { SHOES } from "@/data/shoes";
import { commerceStats, DEMO_FEEDBACK, listModeration, listUsers } from "@/lib/admin-store";
import { feedbackRepo } from "@/lib/feedback-store";
export default function AdminDashboard() {
  const [s, setS] = useState<{ k: string; v: number; href: string }[]>([]);
  useEffect(() => {
    const c = commerceStats();
    setS([
      { k: "鞋款", v: SHOES.length, href: "/admin/shoes" },
      { k: "真实穿着反馈（本机）", v: feedbackRepo.listAll().length, href: "/admin/feedback" },
      { k: "演示反馈", v: DEMO_FEEDBACK.length, href: "/admin/feedback" },
      { k: "待审核 / 已隐藏留言", v: listModeration().filter((m) => m.status !== "approved").length, href: "/admin/moderation" },
      { k: "用户", v: listUsers().length, href: "/admin/users" },
      { k: "购买意向（演示）", v: c.reduce((a, b) => a + b.intents, 0), href: "/admin/commerce" },
    ]);
  }, []);
  return (<>
    <header className="admin-head"><p className="eyebrow">DASHBOARD</p><h1>数据管理中心。</h1><p className="admin-muted">本地演示数据：在接入后端之前，管理端只能看到同一浏览器中产生的真实数据。</p></header>
    <div className="admin-stats">{s.map((x) => <Link key={x.k} href={x.href} className="admin-stat"><b data-no-translate>{x.v}</b><span>{x.k}</span></Link>)}</div>
  </>);
}
