import { PageShell } from "@/components/page-shell";

export default function PrivacyPage() {
  return <PageShell eyebrow="PRIVACY" title="隐私说明。" description="伤病等敏感信息将最小化采集。演示期数据只保存在当前浏览器，不向第三方发送。">
    <div className="phase-card"><span>PRIVACY</span><p>后续将预留导出与删除机制。本页为期中演示结构页，不构成完整隐私政策。</p></div>
  </PageShell>;
}