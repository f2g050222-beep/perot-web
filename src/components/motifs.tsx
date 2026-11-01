/* 装饰动效：篮球（弹跳旋转）、球鞋（跺地 + 冲击尘土）、跑动球鞋、花饰线条。纯 SVG + CSS。 */

export function Basketball({ className = "", size = 64 }: { className?: string; size?: number }) {
  return (
    <span className={`motif motif-ball ${className}`} aria-hidden style={{ width: size, height: size * 1.9 }}>
      <svg viewBox="0 0 100 100" className="ball-svg" width={size} height={size}>
        <circle cx="50" cy="50" r="46" fill="#111216" />
        <circle cx="50" cy="50" r="46" fill="none" stroke="#f6f5f1" strokeWidth="2.5" opacity=".9" />
        <path d="M4 50 H96 M50 4 V96 M18 18 Q50 50 18 82 M82 18 Q50 50 82 82" fill="none" stroke="#f6f5f1" strokeWidth="2.5" opacity=".9" />
      </svg>
      <i className="ball-shadow" />
    </span>
  );
}

function ShoeGlyph({ fill = "#111216", accent = "#d9ff37" }: { fill?: string; accent?: string }) {
  return (
    <svg viewBox="0 0 120 60" width="100%" height="100%">
      <path d="M6 44 Q4 30 14 22 Q26 8 44 8 L52 9 Q58 20 70 23 L94 28 Q114 32 116 44 Z" fill={fill} />
      <path d="M4 44 L118 44 Q118 54 108 54 L12 54 Q4 54 4 44 Z" fill="#f6f5f1" stroke={fill} strokeWidth="2.5" />
      <path d="M18 34 Q50 42 82 32 Q100 28 112 38" fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round" />
      {[0, 1, 2].map((i) => <line key={i} x1={54 + i * 7} y1={14 + i * 3} x2={58 + i * 7} y2={19 + i * 3} stroke="#f6f5f1" strokeWidth="2" strokeLinecap="round" />)}
    </svg>
  );
}

export function StompShoe({ className = "" }: { className?: string }) {
  return (
    <span className={`motif motif-stomp ${className}`} aria-hidden>
      <span className="stomp-shoe"><ShoeGlyph /></span>
      <span className="stomp-ground" />
      <span className="stomp-ring" />
      {Array.from({ length: 7 }).map((_, i) => <i key={i} className="dust" style={{ ["--a" as string]: `${-80 + i * 27}deg`, ["--k" as string]: i }} />)}
    </span>
  );
}

export function RunningShoe({ className = "" }: { className?: string }) {
  return (
    <span className={`motif motif-run ${className}`} aria-hidden>
      <span className="run-shoe"><ShoeGlyph /></span>
      <span className="run-lines"><i /><i /><i /></span>
    </span>
  );
}

export function Flourish({ className = "" }: { className?: string }) {
  return (
    <svg className={`motif motif-flourish ${className}`} viewBox="0 0 220 60" aria-hidden>
      <path d="M4 40 C40 4, 70 56, 110 30 S180 4, 216 30" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="110" cy="30" r="4" fill="#d9ff37" stroke="currentColor" />
    </svg>
  );
}

/* 小页面通用装饰带 */
export function PageMotifs() {
  return (
    <div className="page-motifs" aria-hidden>
      <Basketball size={46} />
      <StompShoe />
      <RunningShoe />
      <Flourish />
    </div>
  );
}
