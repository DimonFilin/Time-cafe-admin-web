'use client';

import { useEffect, useRef, useState } from 'react';

type Props = {
  value: number;
  onCommit: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Used when the field is empty or invalid on blur */
  fallback?: number;
  className?: string;
};

function clamp(n: number, min?: number, max?: number) {
  let v = n;
  if (min != null) v = Math.max(min, v);
  if (max != null) v = Math.min(max, v);
  return v;
}

export function BlurNumberInput({ value, onCommit, min, max, step, fallback, className }: Props) {
  const [text, setText] = useState(() => String(value));
  const focusedRef = useRef(false);

  useEffect(() => {
    if (!focusedRef.current) setText(String(value));
  }, [value]);

  const commit = () => {
    const trimmed = text.trim().replace(',', '.');
    if (trimmed === '' || trimmed === '-' || trimmed === '.') {
      const next = clamp(fallback ?? value, min, max);
      setText(String(next));
      onCommit(next);
      return;
    }
    const n = Number(trimmed);
    if (!Number.isFinite(n)) {
      const next = clamp(fallback ?? value, min, max);
      setText(String(next));
      onCommit(next);
      return;
    }
    const next = clamp(n, min, max);
    setText(String(next));
    onCommit(next);
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      value={text}
      step={step}
      onChange={(e) => setText(e.target.value)}
      onFocus={() => {
        focusedRef.current = true;
      }}
      onBlur={() => {
        focusedRef.current = false;
        commit();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
      }}
      className={className}
    />
  );
}
