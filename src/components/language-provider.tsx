"use client";

import { AutoTranslate } from "@/components/auto-translate";
import { createContext, useContext, useEffect, useState } from "react";

type Language = "zh" | "ko";

const LanguageContext = createContext<{
  language: Language;
  toggle: () => void;
}>({ language: "zh", toggle: () => {} });

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  /* ★ 初始值必须固定为 "zh"，不能在 useState 初始化里读 localStorage。
     否则服务端渲染 zh、客户端渲染 ko，触发 hydration mismatch，
     React 会重建整棵组件树（表现为页面闪烁、交互状态丢失）。 */
  const [language, setLanguage] = useState<Language>("zh");

  /* 挂载后再同步用户上次的选择 */
  useEffect(() => {
    const saved = window.localStorage.getItem("perot-language");
    if (saved === "ko" || saved === "zh") {
      setLanguage(saved);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language === "ko" ? "ko" : "zh-CN";
  }, [language]);

  const toggle = () =>
    setLanguage((current) => {
      const next: Language = current === "zh" ? "ko" : "zh";
      window.localStorage.setItem("perot-language", next);
      return next;
    });

  return (
    <LanguageContext.Provider value={{ language, toggle }}>
      {children}
      <AutoTranslate language={language} />
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
