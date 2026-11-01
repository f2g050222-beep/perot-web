"use client";

/* 爆炸视图球鞋：鞋面 / 鞋垫 / 中底 / 外底 四层。
   mode="loop"：自动循环 分离 ↔ 组合；mode="scroll"：由所在固定区块的滚动进度驱动。 */

import { useEffect, useRef } from "react";

const LAYERS = [
  { key: "upper", label: "鞋面", sub: "UPPER", y: -120 },
  { key: "insole", label: "鞋垫", sub: "INSOLE", y: -40 },
  { key: "midsole", label: "中底", sub: "MIDSOLE", y: 40 },
  { key: "outsole", label: "外底", sub: "OUTSOLE", y: 120 },
] as const;

export function ExplodedShoe({ mode = "loop", dark = false }: { mode?: "loop" | "scroll"; dark?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mode !== "scroll") return;
    const el = ref.current;
    const pin = el?.closest<HTMLElement>(".explode-pin");
    if (!el || !pin) return;
    let raf = 0;
    const tick = () => {
      const r = pin.getBoundingClientRect();
      const total = r.height - innerHeight;
      const p = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0;
      /* 0→0.5 分离，0.5→1 组合 */
      const e = p < 0.5 ? p * 2 : (1 - p) * 2;
      el.style.setProperty("--e", e.toFixed(3));
      pin.style.setProperty("--p", p.toFixed(3));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [mode]);

  const ink = dark ? "#f6f5f1" : "#111216";
  const paper = dark ? "#111216" : "#f6f5f1";

  return (
    <div ref={ref} className={`xshoe xshoe-${mode} ${dark ? "is-dark" : ""}`} aria-label="球鞋分层结构" role="img">
      <svg viewBox="-20 -200 560 420" className="xshoe-svg">
        {/* 外底 */}
        <g className="xl xl-outsole" style={{ ["--ty" as string]: `${LAYERS[3].y}px` }}>
          <path d="M20 40 Q20 62 60 64 L470 64 Q512 62 512 36 L506 28 L26 28 Z" fill={ink} />
          {Array.from({ length: 18 }).map((_, i) => <rect key={i} x={50 + i * 24} y={50} width={12} height={8} rx={2} fill={paper} opacity={0.55} />)}
        </g>
        {/* 中底 */}
        <g className="xl xl-midsole" style={{ ["--ty" as string]: `${LAYERS[2].y}px` }}>
          <path d="M26 28 Q18 4 40 -4 L300 -6 Q420 -8 492 -2 Q518 4 506 28 Z" fill={paper} stroke={ink} strokeWidth="3" />
          <path d="M60 12 Q200 22 340 10 T480 12" fill="none" stroke={ink} strokeWidth="2" strokeDasharray="6 7" />
          <ellipse cx="400" cy="12" rx="44" ry="8" fill="#d9ff37" stroke={ink} strokeWidth="2" />
        </g>
        {/* 鞋垫 */}
        <g className="xl xl-insole" style={{ ["--ty" as string]: `${LAYERS[1].y}px` }}>
          <path d="M60 -8 Q50 -22 90 -24 L440 -22 Q480 -20 470 -8 Z" fill="#cfcdc4" stroke={ink} strokeWidth="2.5" />
        </g>
        {/* 鞋面 */}
        <g className="xl xl-upper" style={{ ["--ty" as string]: `${LAYERS[0].y}px` }}>
          <path d="M40 -10 Q30 -60 70 -96 Q110 -150 170 -150 L210 -146 Q236 -100 280 -86 L380 -64 Q470 -48 496 -10 Z" fill={ink} />
          <path d="M170 -150 Q160 -110 196 -80 L300 -70" fill="none" stroke={paper} strokeWidth="3" />
          {[0, 1, 2, 3, 4].map((i) => <line key={i} x1={214 + i * 22} y1={-128 + i * 9} x2={232 + i * 22} y2={-112 + i * 9} stroke={paper} strokeWidth="4" strokeLinecap="round" />)}
          <path d="M70 -40 Q200 -10 330 -40 Q420 -60 480 -20" fill="none" stroke="#d9ff37" strokeWidth="5" strokeLinecap="round" />
          <circle cx="92" cy="-96" r="7" fill={paper} />
        </g>
      </svg>
      <ul className="xshoe-labels">
        {LAYERS.map((l) => (
          <li key={l.key} className={`xlab xlab-${l.key}`} style={{ ["--ty" as string]: `${l.y}px` }}>
            <i /> <b>{l.label}</b> <small>{l.sub}</small>
          </li>
        ))}
      </ul>
    </div>
  );
}
