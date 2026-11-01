"use client";

/* 全站动效层：Lenis 惯性滚动、滚动进度条、滚动揭示、视差、磁吸按钮、
   点击涟漪、卡片 3D 倾斜、桌面自定义光标、数字计数。
   只用 transform / opacity / clip-path；尊重 prefers-reduced-motion。 */

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

const REVEAL = [
  ".page-intro > *", ".phase-card", ".panel-number", ".eyebrow", "section h1", "section h2", "section h3",
  ".hero-copy > p", ".hero-ctas", ".profile-copy > p", ".library-head", ".shoe-stage", ".carousel",
  ".pick-showcase", ".picks-copy > p", ".message-form", ".result-card", ".result-facts > div", ".result-size",
  ".result-excluded", ".result-actions", ".wizard-index li", ".field-group", ".fieldset", ".site-footer > *",
  ".inner-page article", ".inner-page form",
].join(",");
const MAGNETIC = ".button, .round-action, .circle-portal, .hero-cta, .orb-button, .menu-button, .language-button, .carousel-head button, .text-button";
const TILT = ".carousel-card, .result-card, .phase-card, .wall-card, .shoe-stage, .pick-showcase, .lib-card, .pick-card, .rel-card";
const RIPPLE = "button, .button, .hero-cta, .circle-portal, .text-button, .choice-grid button";

export function MotionLayer() {
  const pathname = usePathname();
  const lenisRef = useRef<Lenis | null>(null);

  /* 一次性：Lenis、光标、磁吸、涟漪、倾斜、进度条 */
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const root = document.documentElement;
    root.classList.add("motion-ready");
    if (reduce) { root.classList.add("motion-reduce"); return; }

    const lenis = new Lenis({ duration: 1.15, easing: (t) => 1 - Math.pow(1 - t, 4), smoothWheel: true });
    lenisRef.current = lenis;
    root.style.scrollBehavior = "auto";
    let raf = 0;
    const bar = document.querySelector<HTMLElement>(".scroll-progress");
    const tick = (time: number) => {
      lenis.raf(time);
      const max = document.documentElement.scrollHeight - innerHeight;
      if (bar) bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
      /* 视差 */
      document.querySelectorAll<HTMLElement>("[data-parallax]").forEach((el) => {
        const r = el.getBoundingClientRect();
        const speed = Number(el.dataset.parallax) || 0.2;
        const offset = (r.top + r.height / 2 - innerHeight / 2) * -speed;
        el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    /* 光标 */
    const dot = document.querySelector<HTMLElement>(".cursor-dot");
    const ring = document.querySelector<HTMLElement>(".cursor-ring");
    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my, craf = 0;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      mx = e.clientX; my = e.clientY;
      if (dot) dot.style.transform = `translate3d(${mx}px, ${my}px, 0) translate(-50%, -50%)`;
      const t = (e.target as Element | null)?.closest?.("a, button, input, textarea, select, label, [role=button]");
      root.classList.toggle("cursor-hover", !!t);
    };
    const cloop = () => {
      rx += (mx - rx) * 0.16; ry += (my - ry) * 0.16;
      if (ring) ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%)`;
      craf = requestAnimationFrame(cloop);
    };
    if (fine) { root.classList.add("has-cursor"); craf = requestAnimationFrame(cloop); }
    const onDown = () => root.classList.add("cursor-down");
    const onUp = () => root.classList.remove("cursor-down");

    /* 磁吸 + 倾斜 */
    const onPointer = (e: PointerEvent) => {
      if (!fine) return;
      onMove(e);
      const target = e.target as Element | null;
      const mag = target?.closest?.(MAGNETIC) as HTMLElement | null;
      document.querySelectorAll<HTMLElement>(".is-magnet").forEach((el) => { if (el !== mag) { el.classList.remove("is-magnet"); el.style.translate = ""; } });
      if (mag && !mag.closest(".choice-grid")) {
        const r = mag.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) / r.width;
        const dy = (e.clientY - (r.top + r.height / 2)) / r.height;
        mag.classList.add("is-magnet");
        mag.style.translate = `${(dx * 10).toFixed(1)}px ${(dy * 8).toFixed(1)}px`;
      }
      const card = target?.closest?.(TILT) as HTMLElement | null;
      document.querySelectorAll<HTMLElement>(".is-tilt").forEach((el) => { if (el !== card) { el.classList.remove("is-tilt"); el.style.rotate = ""; el.style.removeProperty("--mx"); } });
      if (card) {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        card.classList.add("is-tilt");
        card.style.setProperty("--mx", `${(px * 100).toFixed(1)}%`);
        card.style.setProperty("--my", `${(py * 100).toFixed(1)}%`);
        card.style.transform = `perspective(900px) rotateX(${((0.5 - py) * 6).toFixed(2)}deg) rotateY(${((px - 0.5) * 8).toFixed(2)}deg) translateY(-4px)`;
      }
      document.querySelectorAll<HTMLElement>(".was-tilt").forEach((el) => { if (el !== card) { el.style.transform = ""; el.classList.remove("was-tilt"); } });
      if (card) card.classList.add("was-tilt");
    };

    /* 涟漪 */
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest?.(RIPPLE) as HTMLElement | null;
      if (!el || (el as HTMLButtonElement).disabled) return;
      const r = el.getBoundingClientRect();
      const s = document.createElement("span");
      s.className = "ripple";
      const size = Math.max(r.width, r.height) * 2.2;
      s.style.width = s.style.height = `${size}px`;
      s.style.left = `${e.clientX - r.left - size / 2}px`;
      s.style.top = `${e.clientY - r.top - size / 2}px`;
      if (getComputedStyle(el).position === "static") el.style.position = "relative";
      el.classList.add("has-ripple");
      el.appendChild(s);
      setTimeout(() => s.remove(), 700);
    };

    addEventListener("pointermove", onPointer, { passive: true });
    addEventListener("pointerdown", onDown);
    addEventListener("pointerup", onUp);
    addEventListener("click", onClick, true);
    return () => {
      cancelAnimationFrame(raf); cancelAnimationFrame(craf); lenis.destroy();
      removeEventListener("pointermove", onPointer); removeEventListener("pointerdown", onDown);
      removeEventListener("pointerup", onUp); removeEventListener("click", onClick, true);
    };
  }, []);

  /* 每次路由：回到顶部 + 重新绑定滚动揭示与计数 */
  useEffect(() => {
    lenisRef.current?.scrollTo(0, { immediate: true });
    if (document.documentElement.classList.contains("motion-reduce")) return;
    const seen = new WeakSet<Element>();
    /* clip-path 全裁切的元素在 Chrome 里不会触发 IntersectionObserver，改为观察其父元素 */
    const proxies = new Map<HTMLElement, HTMLElement[]>();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const el = en.target as HTMLElement;
        io.unobserve(el);
        (proxies.get(el) ?? [el]).forEach((t) => t.classList.add("is-in"));
        proxies.delete(el);
        if (el.matches(".result-facts > div")) countUp(el.querySelector("b"));
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    /* 只处理已水合的节点：在 React 水合前改 class/style 会导致 hydration mismatch */
    const hyd = (el: Element) => Object.keys(el).some((k) => k.startsWith("__reactFiber"));
    let retry = 0;
    const scan = () => {
      let pending = false;
      const groups = new Map<Element, number>();
      document.querySelectorAll<HTMLElement>(REVEAL).forEach((el) => {
        if (seen.has(el) || el.closest(".site-header, .msg-marquee, .menu-panel, .about-x")) return;
        if (!hyd(el)) { pending = true; return; }
        seen.add(el);
        const parent = el.parentElement ?? document.body;
        const i = groups.get(parent) ?? 0;
        groups.set(parent, i + 1);
        el.style.setProperty("--d", `${Math.min(i, 8) * 70}ms`);
        const clip = el.matches("h1, h2");
        const target = clip ? parent as HTMLElement : el;
        if (clip) { const l = proxies.get(target); if (l) l.push(el); else proxies.set(target, [el]); }
        el.classList.add(clip ? "rv-clip" : "rv");
        const r = target.getBoundingClientRect();
        if (r.top < innerHeight && r.bottom > 0) requestAnimationFrame(() => io.observe(target));
        else io.observe(target);
      });
      document.querySelectorAll<HTMLElement>(".hero-type").forEach((el) => { if (hyd(el)) el.dataset.parallax = "0.25"; else pending = true; });
      document.querySelectorAll<HTMLElement>(".hero-orbit, .profile-metric").forEach((el) => { if (hyd(el)) el.dataset.parallax = "-0.12"; else pending = true; });
      clearTimeout(retry);
      if (pending) retry = window.setTimeout(scan, 120);
    };
    scan();
    let q = 0;
    const mo = new MutationObserver(() => { cancelAnimationFrame(q); q = requestAnimationFrame(scan); });
    mo.observe(document.querySelector("main") ?? document.body, { childList: true, subtree: true });
    return () => { clearTimeout(retry); io.disconnect(); mo.disconnect(); };
  }, [pathname]);

  return (
    <>
      <div className="scroll-progress" aria-hidden />
      <div className="cursor-ring" aria-hidden />
      <div className="cursor-dot" aria-hidden />
    </>
  );
}

function countUp(b: Element | null) {
  if (!b) return;
  const walker = document.createTreeWalker(b, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) if (/^\s*\d+(\.\d+)?\s*$/.test(n.nodeValue ?? "")) nodes.push(n as Text);
  nodes.forEach((n) => {
    const target = Number(n.nodeValue);
    const dec = (n.nodeValue ?? "").includes(".") ? 1 : 0;
    const t0 = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / 1100);
      const e = 1 - Math.pow(1 - p, 3);
      n.nodeValue = (target * e).toFixed(dec);
      if (p < 1) requestAnimationFrame(step); else n.nodeValue = String(target.toFixed(dec));
    };
    requestAnimationFrame(step);
  });
}
