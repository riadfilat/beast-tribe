// Place art: one picture per sport for places that have no photo of their own yet.
// Built only from the pack-patch glyphs (Operation Beast's own sport icons from the brand
// guidelines, and game-icons.net, CC BY 3.0, credited in Settings) on the brand colourways.
// Nothing is drawn by hand. Run from the repo root:
//
//     node scripts/brand/place-art/generate.js [--sheet out.jpg]
//
// Writes admin/public/places/art/<art>.jpg (960 x 540), served by the website.
const fs = require('fs');
const path = require('path');
const sharp = require(path.resolve(__dirname, '../../../admin/node_modules/sharp'));

const ROOT = path.resolve(__dirname, '../../..');
const OUT = path.join(ROOT, 'admin/public/places/art');
const W = 960;
const H = 540;

// Same colourways as the pack patches (src/lib/emblem.ts PATCH_PAINT).
const TEAL = '#023C3C';
const CHALK = '#F4F1EA';
const PAINT = {
  slate: [TEAL, CHALK], dreamer: [TEAL, '#56C4C4'], seeker: [TEAL, '#E88F24'],
  aqua: ['#56C4C4', TEAL], orange: ['#E88F24', TEAL], chalk: [CHALK, TEAL],
  ember: ['#0E1212', '#E88F24'], frost: ['#0E1212', '#56C4C4'], sand: ['#C4A882', '#0E1212'],
};

// art id: [glyph, colourway]. The app maps each sport to one of these (src/lib/sportPhotos.ts).
const ART = {
  padel: ['padel', 'seeker'],
  tennis: ['tennis', 'dreamer'],
  racket: ['racket', 'orange'],
  badminton: ['badminton', 'aqua'],
  pingpong: ['pingpong', 'dreamer'],
  football: ['football', 'aqua'],
  basketball: ['basketball', 'orange'],
  volleyball: ['volleyball', 'dreamer'],
  swim: ['swim', 'aqua'],
  climbing: ['climbing', 'seeker'],
  boxing: ['boxing', 'ember'],
  martial: ['martial', 'frost'],
  yoga: ['yoga', 'chalk'],
  dumbbell: ['dumbbell', 'slate'],
  kettlebell: ['kettlebell', 'seeker'],
  run: ['run', 'seeker'],
  walk: ['walk', 'dreamer'],
  hiking: ['hiking', 'sand'],
  cycling: ['cycling', 'dreamer'],
  riding: ['riding', 'sand'],
};

function loadGlyphs() {
  const src = fs.readFileSync(path.join(ROOT, 'src/components/brand/glyphs.ts'), 'utf8');
  const json = src.slice(src.indexOf('GLYPHS: Record<string, Glyph> = ') + 'GLYPHS: Record<string, Glyph> = '.length);
  // A plain object literal written by generate.py: read it as data.
  return new Function(`return ${json.slice(0, json.lastIndexOf('}') + 1)}`)();
}

/** The glyph inside a box of `size` px centred on (cx, cy); the glyph fills 58% of the box. */
function glyph(g, cx, cy, size, fill, extra = '') {
  const [tx, ty, s] = g.t;
  const k = size / 100;
  return `<g transform="translate(${cx - size / 2} ${cy - size / 2}) scale(${k}) ${extra} translate(${tx} ${ty}) scale(${s})">` +
    `<path d="${g.d}" fill="${fill}" fill-rule="${g.rule || 'nonzero'}"/></g>`;
}

function svg(g, ground, ink) {
  // A giant tone-on-tone echo bleeding off the right edge, and the sport's mark in the middle,
  // so a square crop (thumbnails) and the full width (cards) both read.
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${ground}"/>
  ${glyph(g, W * 0.86, H * 0.62, 1250, ink, 'rotate(-14 50 50)').replace('<path', '<path fill-opacity="0.08"')}
  ${glyph(g, W * 0.08, H * 0.12, 520, ink, 'rotate(18 50 50)').replace('<path', '<path fill-opacity="0.05"')}
  ${glyph(g, W / 2, H / 2, 520, ink)}
</svg>`;
}

async function main() {
  const glyphs = loadGlyphs();
  fs.mkdirSync(OUT, { recursive: true });
  const tiles = [];
  for (const [id, [gid, cw]] of Object.entries(ART)) {
    const g = glyphs[gid];
    if (!g) throw new Error(`no glyph ${gid}`);
    const [ground, ink] = PAINT[cw];
    const buf = await sharp(Buffer.from(svg(g, ground, ink))).jpeg({ quality: 86, mozjpeg: true }).toBuffer();
    fs.writeFileSync(path.join(OUT, `${id}.jpg`), buf);
    tiles.push({ id, buf });
  }
  const sheetAt = process.argv.indexOf('--sheet');
  if (sheetAt > 0) {
    const cols = 4, tw = 480, th = 270;
    const rows = Math.ceil(tiles.length / cols);
    const parts = await Promise.all(tiles.map(async (t, i) => ({
      input: await sharp(t.buf).resize(tw, th).toBuffer(), left: (i % cols) * (tw + 8), top: Math.floor(i / cols) * (th + 8),
    })));
    await sharp({ create: { width: cols * (tw + 8) - 8, height: rows * (th + 8) - 8, channels: 3, background: '#ffffff' } })
      .composite(parts).jpeg({ quality: 85 }).toFile(process.argv[sheetAt + 1]);
  }
  console.log(`${tiles.length} pictures in ${path.relative(ROOT, OUT)}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
