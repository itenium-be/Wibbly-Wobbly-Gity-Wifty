const WINDOWS = [-16, 2].flatMap((wx) => [-36, -22, -8].map((wy) => [wx, wy] as const));

export function Tardis({ x, y }: { x: number; y: number }) {
  return (
    <g data-testid="tardis" className="tardis" style={{ transform: `translate(${x}px, ${y}px)` }}>
      <g className="tardis-bob">
        <g transform="scale(1.4)">
          <rect x={-4} y={-62} width={8} height={8} rx={2} className="tardis-lamp" />
          <rect x={-20} y={-54} width={40} height={6} fill="#163a80" />
          <rect x={-22} y={-48} width={44} height={8} fill="#0d1a33" />
          <text x={0} y={-42} fontSize={5} fill="#fff" textAnchor="middle">
            POLICE BOX
          </text>
          <rect x={-20} y={-40} width={40} height={48} fill="#1f4fa8" stroke="#163a80" strokeWidth={2} />
          {WINDOWS.map(([wx, wy]) => (
            <rect key={`${wx},${wy}`} x={wx} y={wy} width={14} height={11} fill={wy === -36 ? '#dfeaff' : '#163a80'} />
          ))}
          <line x1={0} y1={-40} x2={0} y2={8} stroke="#163a80" strokeWidth={2} />
        </g>
      </g>
    </g>
  );
}
