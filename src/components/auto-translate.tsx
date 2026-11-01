"use client";

/* 全站韩语翻译层：语言为 ko 时，把页面上所有中文文本节点与常用属性
   按词典（lib/i18n-ko.ts）替换为韩语；切回 zh 时还原原文。
   使用 MutationObserver 覆盖客户端渲染与路由切换后的新内容。 */

import { useEffect } from "react";
import { KO } from "@/lib/i18n-ko";

const CJK = /[\u4e00-\u9fff]/;
const ATTRS = ["placeholder", "aria-label", "title", "alt"] as const;
let pattern: RegExp | null = null;

function getPattern() {
  if (pattern) return pattern;
  const keys = Object.keys(KO).filter((k) => k.length >= 2).sort((a, b) => b.length - a.length);
  pattern = new RegExp(keys.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"), "g");
  return pattern;
}

export function translateKo(input: string): string {
  if (!CJK.test(input)) return input;
  const trimmed = input.trim();
  if (KO[trimmed]) return input.replace(trimmed, KO[trimmed]);
  return input.replace(getPattern(), (m) => KO[m] ?? m);
}

const original = new WeakMap<Node, string>();
const translated = new WeakMap<Node, string>();
const attrOriginal = new WeakMap<Element, Record<string, string>>();

function skip(el: Element | null): boolean {
  for (let e = el; e; e = e.parentElement) {
    const tag = e.tagName;
    if (tag === "SCRIPT" || tag === "STYLE" || tag === "TEXTAREA" || e.hasAttribute("data-no-translate")) return true;
  }
  return false;
}

function apply(root: Node, ko: boolean) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const v = n.nodeValue ?? "";
    if (ko) {
      if (translated.get(n) === v) continue;
      if (!CJK.test(v)) continue;
      if (skip(n.parentElement)) continue;
      original.set(n, v);
      const t = translateKo(v);
      translated.set(n, t);
      if (t !== v) n.nodeValue = t;
    } else if (original.has(n) && translated.get(n) === v) {
      n.nodeValue = original.get(n)!;
      translated.delete(n);
    }
  }
  const els = root instanceof Element || root instanceof Document ? (root as ParentNode).querySelectorAll("[placeholder],[aria-label],[title],[alt]") : [];
  els.forEach((el) => {
    const store = attrOriginal.get(el) ?? {};
    for (const a of ATTRS) {
      const v = el.getAttribute(a);
      if (v == null) continue;
      if (ko) {
        if (!CJK.test(v)) continue;
        store[a] = v;
        el.setAttribute(a, translateKo(v));
      } else if (store[a]) {
        el.setAttribute(a, store[a]);
        delete store[a];
      }
    }
    attrOriginal.set(el, store);
  });
}

let titleOriginal: string | null = null;

export function AutoTranslate({ language }: { language: "zh" | "ko" }) {
  useEffect(() => {
    const ko = language === "ko";
    /* 切回中文：按 WeakMap 记录的原文逐节点还原（属性同理），无需刷新 */
    if (!ko) {
      apply(document.body, false);
      if (titleOriginal != null) { document.title = titleOriginal; titleOriginal = null; }
      return;
    }
    if (CJK.test(document.title)) { titleOriginal = document.title; document.title = translateKo(document.title); }
    apply(document.body, true);
    /* alive 标记 + 取消挂起的 rAF：修复旧 bug——切回中文后，排队中的回调又重新挂上了韩语观察器 */
    let alive = true;
    let raf = 0;
    const opts: MutationObserverInit = { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: [...ATTRS] };
    const obs = new MutationObserver(() => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        if (!alive) return;
        obs.disconnect();
        apply(document.body, true);
        if (CJK.test(document.title)) { titleOriginal = document.title; document.title = translateKo(document.title); }
        if (alive) obs.observe(document.body, opts);
      });
    });
    obs.observe(document.body, opts);
    return () => { alive = false; cancelAnimationFrame(raf); obs.disconnect(); };
  }, [language]);
  return null;
}