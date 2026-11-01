"use client";
/* 管理端外壳：独立导航（不使用客户端页头），演示登录守卫 */
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { adminSession } from "@/lib/admin-store";
import { useLanguage } from "@/components/language-provider";

function AdminLang({ className }: { className?: string }) {
  const { language, toggle } = useLanguage();
  return <button type="button" className={`admin-lang ${className ?? ""}`} data-no-translate="" data-testid="admin-lang" onClick={toggle}>{language === "zh" ? "한국어" : "中文"}</button>;
}

const NAV = [["/admin", "仪表盘"], ["/admin/shoes", "鞋款管理"], ["/admin/moderation", "留言审核"], ["/admin/feedback", "穿着反馈"], ["/admin/commerce", "购买 / 点击数据"], ["/admin/users", "用户列表"]];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [ok, setOk] = useState<boolean | null>(null);
  const isLogin = path === "/admin/login";
  useEffect(() => {
    const inn = adminSession.isIn();
    setOk(inn);
    if (!inn && !isLogin) router.replace("/admin/login");
  }, [path, isLogin, router]);

  if (isLogin) return <div className="admin-root admin-login-root"><AdminLang className="is-float" />{children}</div>;
  return (
    <div className="admin-root">
      <aside className="admin-side">
        <Link href="/admin" className="admin-brand" data-no-translate>PEROT <small>ADMIN</small></Link>
        <nav>{NAV.map(([h, l]) => <Link key={h} href={h} className={path === h ? "is-on" : ""}>{l}</Link>)}</nav>
        <div className="admin-side-foot">
          <AdminLang />
          <Link href="/">← 返回客户端</Link>
          <button type="button" onClick={() => { adminSession.logout(); router.replace("/admin/login"); }}>退出登录</button>
        </div>
      </aside>
      <div className="admin-main">{!ok && <p className="admin-muted">正在验证管理员身份…</p>}<div hidden={!ok}>{children}</div></div>
    </div>
  );
}
