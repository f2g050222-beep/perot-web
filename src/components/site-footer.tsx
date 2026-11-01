import Image from "next/image";
import Link from "next/link";

export function SiteFooter() {
  return <footer className="site-footer">
    <div className="footer-top"><span>PEROT</span><span>PLAY WITH PURPOSE</span><span>© 2026</span></div>
    <div className="footer-logo"><Image src="/brand/PEROTlogo.jpg" alt="PEROT 篮球标志" width={480} height={320} /></div>
    <div className="footer-bottom"><p>为每一种球场风格，寻找真正合适的脚下装备。</p><div><Link href="/about">关于项目</Link><Link href="/community">社区留言</Link><Link href="/disclosure">数据声明</Link><Link href="/privacy">隐私说明</Link></div></div>
  </footer>;
}
