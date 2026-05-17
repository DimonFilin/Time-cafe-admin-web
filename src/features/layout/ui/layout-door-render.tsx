import type { DoorDrawPart } from './layout-doors';

export function DoorSymbol({ part }: { part: DoorDrawPart }) {
  const { hinge, leafEnd, mid, kind } = (() => {
    const { a, b, n, swing, hingeSide } = part;
    const ux = b.x - a.x;
    const uy = b.y - a.y;
    const len = Math.hypot(ux, uy) || 1;
    const tx = ux / len;
    const ty = uy / len;
    const hinge = hingeSide === 'left' ? a : b;
    const openDir = swing === 'in' ? -1 : 1;
    const leafLen = len * 0.92;
    const sign = hingeSide === 'left' ? 1 : -1;
    const lx = hinge.x + tx * leafLen * sign;
    const ly = hinge.y + ty * leafLen * sign;
    const leafEnd = {
      x: lx + n.x * leafLen * openDir,
      y: ly + n.y * leafLen * openDir,
    };
    return {
      hinge,
      leafEnd,
      mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
      kind: part.kind,
    };
  })();

  const r = Math.hypot(leafEnd.x - hinge.x, leafEnd.y - hinge.y) || 1;
  const sweep = part.swing === 'in' ? 0 : 1;

  return (
    <g>
      <line
        x1={hinge.x}
        y1={hinge.y}
        x2={leafEnd.x}
        y2={leafEnd.y}
        stroke="#1f2937"
        strokeWidth={1.4}
      />
      <path
        d={`M ${hinge.x} ${hinge.y} A ${r} ${r} 0 0 ${sweep} ${leafEnd.x} ${leafEnd.y}`}
        fill="none"
        stroke="#6b7280"
        strokeWidth={1}
        strokeDasharray={part.swing === 'both' ? '4 3' : undefined}
      />
      {kind === 'code_lock' && (
        <rect
          x={mid.x - 3}
          y={mid.y - 3}
          width={6}
          height={6}
          rx={1}
          fill="#374151"
          stroke="none"
        />
      )}
    </g>
  );
}
