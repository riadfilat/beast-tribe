import { BRAND, LOCKUP, PACK_GAP, PACK_LAYOUT, PACK_SIZE, WOLF_PATHS, WORDMARK_GLYPHS } from './paths';

// Beast Tribe identity ("The Pack") for the web: three of Operation Beast's wolves howling
// together, in the journey colours (Dreamer aqua, Seeker orange, Mover = the surface's ink).
// `id` must be unique per page: it names the masks that cut the gaps between the wolves.

function Wolf({ x, y, s, fill, stroke, strokeWidth }: { x: number; y: number; s: number; fill: string; stroke?: string; strokeWidth?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="miter">
      {WOLF_PATHS.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </g>
  );
}

function PackShapes({ ink, id }: { ink: string; id: string }) {
  const [[x1, y1, s1], [x2, y2, s2], [x3, y3, s3]] = PACK_LAYOUT;
  const pad = 20;
  const box = { x: -pad, y: -pad, width: PACK_SIZE.width + pad * 2, height: PACK_SIZE.height + pad * 2 };
  const cut = (x: number, y: number, s: number) => <Wolf x={x} y={y} s={s} fill="#000" stroke="#000" strokeWidth={(2 * PACK_GAP) / s} />;
  return (
    <>
      <defs>
        <mask id={`${id}-a`} maskUnits="userSpaceOnUse" {...box}>
          <rect {...box} fill="#fff" />
          {cut(x2, y2, s2)}
          {cut(x3, y3, s3)}
        </mask>
        <mask id={`${id}-b`} maskUnits="userSpaceOnUse" {...box}>
          <rect {...box} fill="#fff" />
          {cut(x3, y3, s3)}
        </mask>
      </defs>
      <g mask={`url(#${id}-a)`}>
        <Wolf x={x1} y={y1} s={s1} fill={BRAND.aqua} />
      </g>
      <g mask={`url(#${id}-b)`}>
        <Wolf x={x2} y={y2} s={s2} fill={BRAND.orange} />
      </g>
      <Wolf x={x3} y={y3} s={s3} fill={ink} />
    </>
  );
}

export function PackMark({ height, ink = BRAND.teal, id = 'bt-mark', className }: { height: number; ink?: string; id?: string; className?: string }) {
  const width = (height * PACK_SIZE.width) / PACK_SIZE.height;
  return (
    <svg className={className} width={width} height={height} viewBox={`0 0 ${PACK_SIZE.width} ${PACK_SIZE.height}`} role="img" aria-label="Beast Tribe">
      <PackShapes ink={ink} id={id} />
    </svg>
  );
}

export function Lockup({ height, ink = BRAND.teal, id = 'bt-lockup', className }: { height: number; ink?: string; id?: string; className?: string }) {
  const width = (height * LOCKUP.width) / LOCKUP.height;
  return (
    <svg className={className} width={width} height={height} viewBox={`0 0 ${LOCKUP.width} ${LOCKUP.height}`} role="img" aria-label="Beast Tribe">
      <PackShapes ink={ink} id={id} />
      <g transform={`translate(${LOCKUP.wordX} ${LOCKUP.wordY}) scale(${LOCKUP.wordScale})`} fill={ink}>
        {WORDMARK_GLYPHS.map((g, i) => (
          <path key={i} d={g.d} transform={`translate(${g.x} ${g.y})`} />
        ))}
      </g>
    </svg>
  );
}
