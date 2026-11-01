import Link from "next/link";
import { ReactNode } from "react";
import { PageMotifs } from "@/components/motifs";

export function PageShell({ eyebrow, title, description, action, children }: { eyebrow: string; title: string; description: string; action?: string; children?: ReactNode }) {
  return <section className="inner-page" style={{ position: "relative" }}><PageMotifs />
    <div className="page-intro"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p>{action && <Link className="button button-dark" href={action}>开始体验 <b>↗</b></Link>}</div>
    {children ?? <div className="phase-card"><span>PHASE 01</span><h2>页面基础架构已就绪</h2><p>此模块将在后续开发阶段接入真实的数据、表单和交互能力。</p></div>}
  </section>;
}
