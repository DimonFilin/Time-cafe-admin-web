'use client';

import { type RefObject, useEffect, useRef } from 'react';

const PATTERN_IDS = ['layout-grid', 'layout-grid-major', 'wall-hatch', 'stair-half'] as const;

function renamePatternIds(svg: SVGSVGElement) {
  for (const id of PATTERN_IDS) {
    const el = svg.querySelector(`#${CSS.escape(id)}`);
    if (el) el.id = `pv-${id}`;
  }
  svg.querySelectorAll('*').forEach((node) => {
    for (const attr of ['fill', 'stroke', 'marker-start', 'marker-end', 'mask']) {
      const value = node.getAttribute(attr);
      if (!value?.startsWith('url(#')) continue;
      const refId = value.slice(5, -1);
      if ((PATTERN_IDS as readonly string[]).includes(refId)) {
        node.setAttribute(attr, `url(#pv-${refId})`);
      }
    }
  });
}

function stripEditChrome(svg: SVGSVGElement) {
  svg.querySelectorAll('[pointer-events="all"]').forEach((el) => el.remove());
  svg.querySelectorAll('g[opacity="0.75"], g[opacity="0.8"], g[opacity="0.85"]').forEach((el) => {
    el.remove();
  });
  svg.querySelectorAll('polyline[stroke-dasharray], line[stroke-dasharray]').forEach((el) => {
    el.remove();
  });
  svg.querySelectorAll('rect[stroke-dasharray]').forEach((el) => el.remove());

  svg.querySelectorAll('text').forEach((t) => {
    if (t.textContent?.trim() === '✎') {
      t.closest('g')?.remove();
    }
  });

  svg.querySelectorAll('circle').forEach((c) => {
    const r = Number(c.getAttribute('r') || 0);
    const fill = c.getAttribute('fill') || '';
    if (
      r > 0 &&
      r <= 7 &&
      (fill.includes('37,99,235') || fill === '#1d4ed8' || fill === '#c2410c')
    ) {
      c.remove();
    }
  });
}

function preparePreviewSvg(source: SVGSVGElement): SVGSVGElement {
  const clone = source.cloneNode(true) as SVGSVGElement;
  renamePatternIds(clone);
  stripEditChrome(clone);

  clone.removeAttribute('style');
  clone.removeAttribute('class');
  clone.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  clone.style.display = 'block';
  clone.style.width = '100%';
  clone.style.height = 'auto';
  clone.style.maxHeight = 'min(75vh, 900px)';
  clone.style.cursor = 'default';

  return clone;
}

type Props = {
  open: boolean;
  onClose: () => void;
  svgRef: RefObject<SVGSVGElement | null>;
  cafeName?: string;
  planWidth: number;
  planHeight: number;
};

export function LayoutPlanPreviewModal({
  open,
  onClose,
  svgRef,
  cafeName,
  planWidth,
  planHeight,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const host = hostRef.current;
    const src = svgRef.current;
    if (!host || !src) return;
    host.replaceChildren();
    try {
      host.appendChild(preparePreviewSvg(src));
    } catch {
      host.textContent = 'Не удалось построить предпросмотр';
    }
  }, [open, svgRef, planWidth, planHeight]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[94vh] w-full max-w-[min(96vw,1400px)] flex-col rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-bg))] shadow-2xl">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[rgb(var(--tc-border))] px-4 py-3">
          <div>
            <h3 className="text-lg font-semibold">Просмотр планировки</h3>
            <p className="text-sm text-[rgb(var(--tc-muted))]">
              {cafeName ? `${cafeName} · ` : ''}
              Итоговый вид без инструментов редактирования
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[rgb(var(--tc-border))] px-3 py-2 text-sm font-medium hover:bg-[rgb(var(--tc-border))]/25"
          >
            Закрыть
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto p-4">
          <div
            ref={hostRef}
            className="mx-auto w-full max-w-full rounded-lg bg-[#fafafa] p-3 ring-1 ring-black/5 dark:ring-white/10"
            style={{
              aspectRatio:
                planWidth > 0 && planHeight > 0 ? `${planWidth} / ${planHeight}` : undefined,
              minHeight: 320,
              maxHeight: 'min(78vh, 920px)',
            }}
          />
        </div>
      </div>
    </div>
  );
}
