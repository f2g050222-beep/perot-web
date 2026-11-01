import { PageShell } from "@/components/page-shell";

export default function DisclosurePage() {
  return <PageShell eyebrow="DISCLOSURE" title="演示数据声明。" description="所有演示鞋款、属性、推荐结果和反馈样例均标记为「演示数据」「待验证」或「非真实群体反馈」。">
    <div className="phase-card"><span>NOTICE</span><ul>
      <li>不使用虚构的品牌官方参数、用户数量、真实测评、医学背书或商业数据。</li>
      <li>演示推荐运行完整算法，但结论受演示数据质量限制。</li>
      <li>页脚粒子动效不是用户行为统计或数据可视化。</li>
    </ul></div>
  </PageShell>;
}