"use client";

/* ============================================================================
   测评表单控件
   ============================================================================
   全部复用 Codex 既有的视觉类（.choice-grid / .selected / .round-action），
   只补充少量必要的布局类，避免破坏原有设计语言。
   ============================================================================ */

import type { ReactNode } from "react";

/* ---------------------------------------------------------------- 单选 */

export function ChoiceGroup<T extends string>({
  options,
  value,
  onChange,
  cols = 2,
}: {
  options: { value: T; label: string; hint?: string }[];
  value: T | null;
  onChange: (v: T) => void;
  cols?: 1 | 2 | 3;
}) {
  return (
    <div className={`choice-grid choice-cols-${cols}`}>
      {options.map((o) => (
        <button
          type="button"
          key={o.value}
          className={value === o.value ? "selected" : ""}
          onClick={() => onChange(o.value)}
        >
          <span>
            {o.label}
            {o.hint && <small className="choice-hint">{o.hint}</small>}
          </span>
          <b>{value === o.value ? "✓" : "+"}</b>
        </button>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------- 多选 */

export function MultiChoiceGroup<T extends string>({
  options,
  value,
  onChange,
  cols = 2,
  exclusiveValue,
}: {
  options: { value: T; label: string }[];
  value: T[];
  onChange: (v: T[]) => void;
  cols?: 1 | 2 | 3;
  /** 选中此项时清空其它（如「无特殊需求」） */
  exclusiveValue?: T;
}) {
  const toggle = (v: T) => {
    if (exclusiveValue !== undefined && v === exclusiveValue) {
      onChange([v]);
      return;
    }
    const base =
      exclusiveValue !== undefined ? value.filter((x) => x !== exclusiveValue) : value;
    if (base.includes(v)) {
      onChange(base.filter((x) => x !== v));
    } else {
      onChange([...base, v]);
    }
  };

  return (
    <div className={`choice-grid choice-cols-${cols}`}>
      {options.map((o) => {
        const on = value.includes(o.value);
        return (
          <button
            type="button"
            key={o.value}
            className={on ? "selected" : ""}
            onClick={() => toggle(o.value)}
          >
            <span>{o.label}</span>
            <b>{on ? "✓" : "+"}</b>
          </button>
        );
      })}
    </div>
  );
}

/* ---------------------------------------------------------------- 1–5 等级 */

export function ScaleRow({
  label,
  hint,
  value,
  onChange,
  anchors,
  levels = [1, 2, 3, 4, 5],
}: {
  label: string;
  hint?: string;
  value: 1 | 2 | 3 | 4 | 5;
  onChange: (v: 1 | 2 | 3 | 4 | 5) => void;
  anchors?: [string, string];
  /** 可选等级，默认 1–5；严重度等只需 1–3 时传入 */
  levels?: (1 | 2 | 3 | 4 | 5)[];
}) {
  return (
    <div className="scale-field">
      <div className="scale-head">
        <span className="scale-label">{label}</span>
        {hint && <span className="scale-hint">{hint}</span>}
      </div>
      <div className="scale-row" style={{ gridTemplateColumns: `repeat(${levels.length}, 1fr)` }}>
        {levels.map((lv) => (
          <button
            type="button"
            key={lv}
            className={`scale-btn ${value === lv ? "is-on" : ""}`}
            onClick={() => onChange(lv)}
            aria-label={`${label} ${lv} 级`}
          >
            {lv}
          </button>
        ))}
      </div>
      {anchors && (
        <div className="scale-anchors">
          <span>{anchors[0]}</span>
          <span>{anchors[1]}</span>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- 数值 */

export function NumberField({
  label,
  value,
  onChange,
  unit,
  min,
  max,
  step = 1,
  hint,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  hint?: string;
}) {
  return (
    <label className="num-field">
      <span className="num-label">{label}</span>
      <span className="num-wrap">
        <input
          type="number"
          inputMode="decimal"
          value={value ?? ""}
          min={min}
          max={max}
          step={step}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === "") return onChange(null);
            const n = Number(raw);
            if (!Number.isNaN(n)) onChange(n);
          }}
        />
        {unit && <em>{unit}</em>}
      </span>
      {hint && <small className="num-hint">{hint}</small>}
    </label>
  );
}

/* ---------------------------------------------------------------- 复选 */

export function CheckRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      className={`check-row ${checked ? "is-on" : ""}`}
      onClick={() => onChange(!checked)}
    >
      <span className="check-box">{checked ? "✓" : ""}</span>
      <span>
        {label}
        {hint && <small>{hint}</small>}
      </span>
    </button>
  );
}

/* ---------------------------------------------------------------- 分组 */

export function FieldGroup({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <section className="field-group">
      <div className="field-group-head">
        <h4>{title}</h4>
        {note && <p>{note}</p>}
      </div>
      <div className="field-group-body">{children}</div>
    </section>
  );
}

/* ---------------------------------------------------------------- 两列栅格 */

export function Grid2({ children }: { children: ReactNode }) {
  return <div className="grid-2">{children}</div>;
}
