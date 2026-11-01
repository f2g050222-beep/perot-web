"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/components/language-provider";

const navigation = [
  ["首页", "/"], ["用户画像测评", "/profile-builder"], ["推荐结果", "/profile-builder/results"], ["球鞋数据库", "/shoes"],
  ["NBA Picks", "/nba-picks"], ["球鞋对比", "/compare"], ["用户偏好", "/account/preferences"],
  ["历史记录", "/history"], ["我的履历", "/resume"], ["穿着反馈", "/feedback"], ["留言社区", "/community"], ["用户登录", "/login"],
  ["管理端入口", "/admin/login"], ["About", "/about"],
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { language, toggle } = useLanguage();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const last = useRef(0);
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 8);
      if (Math.abs(y - last.current) < 6) return;
      setHidden(y > last.current && y > 120);
      last.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return <header className={`site-header ${hidden && !open ? "is-hidden" : ""} ${scrolled ? "is-scrolled" : ""}`}>
    <div className="nav-wrap">
      <Link href="/" className="brand" aria-label="PEROT 首页" onClick={() => setOpen(false)}>
        <Image src="/brand/PEROTlogonew.jpg" alt="PEROT 标志" width={180} height={90} priority />
      </Link>
      <span className="brand-tag">BASKETBALL / INTELLIGENCE</span>
      <button className="language-button" data-no-translate="" data-testid="lang-toggle" onClick={toggle} aria-label="切换语言 / 언어 전환">{language === "zh" ? "한국어" : "中文"}</button><button className="menu-button" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="site-menu">
        <span>{open ? "关闭" : "菜单"}</span><i /><i />
      </button>
    </div>
    <nav id="site-menu" className={`menu-panel ${open ? "is-open" : ""}`} aria-label="主导航">
      <div className="menu-kicker">EXPLORE PEROT</div>
      <div className="menu-links">
        {navigation.map(([label, href], index) => <Link href={href} key={href} onClick={() => setOpen(false)}><span>{String(index + 1).padStart(2, "0")}</span>{label}<b>↗</b></Link>)}
      </div>
    </nav>
  </header>;
}
