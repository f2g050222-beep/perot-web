import { Suspense } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div className="admin-root admin-login-root"><p className="admin-muted">正在验证管理员身份…</p></div>}><AdminShell>{children}</AdminShell></Suspense>;
}
