"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminSession, DEMO_ADMIN } from "@/lib/admin-store";
export default function AdminLoginPage() {
  const router = useRouter();
  const [u, setU] = useState(""); const [p, setP] = useState(""); const [err, setErr] = useState(false);
  return (
    <form className="admin-login" onSubmit={(e) => { e.preventDefault(); if (adminSession.login(u, p)) router.replace("/admin"); else setErr(true); }}>
      <p className="eyebrow">ADMIN ACCESS</p>
      <h1>管理端登录。</h1>
      <p className="admin-muted">仅授权管理人员可访问。当前为演示守卫，正式版将接入服务端权限验证。</p>
      <label><span>账号</span><input value={u} onChange={(e) => setU(e.target.value)} data-testid="admin-user" autoComplete="username" /></label>
      <label><span>密码</span><input type="password" value={p} onChange={(e) => setP(e.target.value)} data-testid="admin-pass" autoComplete="current-password" /></label>
      {err && <p className="admin-err">账号或密码错误</p>}
      <button className="button button-dark" type="submit" data-testid="admin-login">登录 <b>↗</b></button>
      <p className="admin-hint"><span>演示账号</span> <code data-no-translate>{DEMO_ADMIN.user} / {DEMO_ADMIN.pass}</code></p>
    </form>
  );
}
