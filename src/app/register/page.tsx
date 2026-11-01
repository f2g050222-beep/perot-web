import Link from "next/link";
import { PageShell } from "@/components/page-shell";

export default function RegisterPage() {
  return <PageShell eyebrow="REGISTER" title="创建你的账号。" description="注册用户可在后续阶段保存测评、履历与反馈。当前为结构预留页。">
    <form className="phase-card" action="/login">
      <span>ACCOUNT</span>
      <p><label>邮箱<br /><input name="email" type="email" /></label></p>
      <p><label>密码<br /><input name="password" type="password" /></label></p>
      <button className="button button-dark" type="submit">创建账号（演示） <b>↗</b></button>
      <p>已有账号？<Link href="/login">去登录 ↗</Link></p>
    </form>
  </PageShell>;
}