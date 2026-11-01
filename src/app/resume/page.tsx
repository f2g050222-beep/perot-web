import Link from "next/link";
import { PageShell } from "@/components/page-shell";

export default function ResumePage() {
  return <PageShell eyebrow="MY RESUME" title="你的篮球鞋履历。" description="定位为个人篮球鞋履历，而不是一次性问卷。历史测评不可被新测评覆盖。">
    <div className="phase-card"><span>TIMELINE</span><h2>时间线</h2><p>身体、伤病、打法、脚型偏好和推荐变化将按测评快照排列。</p></div>
    <div className="phase-card"><span>COPY & UPDATE</span><h2>复制并更新</h2><p>从任意历史测评复制为新草稿，原记录保持只读。</p><Link className="button button-dark" href="/profile-builder">以空白测评开始 <b>↗</b></Link></div>
    <div className="phase-card"><span>FEEDBACK</span><h2>穿着与反馈</h2><p>真实反馈与演示样例反馈分层展示，不混用虚构群体数据。</p><Link className="text-button" href="/feedback">去填写反馈 ↗</Link></div>
  </PageShell>;
}