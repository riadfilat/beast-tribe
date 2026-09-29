"""Beast Tribe pack glyphs — workbench (helpers + a contact sheet for reviewing drawings).

Usage: python3 workbench.py out.svg [ids...]   (then render the SVG to check the drawings)


Every glyph lives in a 120x120 box (y down). Shared DNA with the OB wolf:
italic 52-degree axis, flat feet, straight cuts, triangle eye, slash knockouts.
Each glyph = list of subpaths (point lists); rendered with fill-rule evenodd so
subpaths that sit inside another subpath knock out.
"""
import json, math, sys

K = 1 / math.tan(math.radians(52))  # x shift per unit of rise on the italic axis
U = (math.cos(math.radians(52)), -math.sin(math.radians(52)))  # unit vector up the italic
N = (-U[1], U[0])  # perpendicular (right-hand side of the italic)


def it(x, y, rise):
    return (x + rise * K, y - rise)


def slash(cx, cy, length, width, angle=52):
    """Parallelogram knockout with horizontal ends, centred on (cx, cy)."""
    a = math.radians(angle)
    dx, dy = math.cos(a) * length / 2, -math.sin(a) * length / 2
    h = width / 2
    return [(cx - dx - h, cy - dy), (cx - dx + h, cy - dy), (cx + dx + h, cy + dy), (cx + dx - h, cy + dy)]


def tri(*pts):
    return list(pts)


def arc(cx, cy, r, a0, a1, n=8):
    out = []
    for i in range(n + 1):
        a = math.radians(a0 + (a1 - a0) * i / n)
        out.append((cx + r * math.cos(a), cy - r * math.sin(a)))
    return out


# The parent wolf (OB master vector), fitted into the 120 box.
WOLF_PATHS = [
    "M131.50 23.61 L63.65 109.78 L98.50 104.71 L75.53 136.73 L104.85 136.85 L148.74 73.02 L113.51 73.17 Z",
    "M70.00 69.83 L71.94 51.56 L85.55 49.23 Z M1.97 94.21 L15.95 111.50 L0.00 136.86 L33.98 136.86 L128.59 15.08 L124.54 0.00 L97.85 30.99 L63.06 38.98 L41.90 68.39 C39.76 71.37 36.73 77.49 32.25 80.37 Z",
]

G = {}
import os
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'glyphs.py')).read())


def wolf_group():
    s = 88 / 148.74
    return f'<g transform="translate(16 19.5) scale({s:.4f})">' + ''.join(f'<path d="{d}" fill-rule="evenodd"/>' for d in WOLF_PATHS) + '</g>'


def glyph_svg(name):
    if name == 'wolf':
        return wolf_group()
    d = ''
    for sub in G[name]:
        d += 'M' + ' L'.join(f'{x:.2f} {y:.2f}' for x, y in sub) + ' Z '
    return f'<path d="{d}" fill-rule="evenodd"/>'


def sheet(names, out, cell=300):
    cols = 4
    rows = math.ceil(len(names) / cols)
    W, H = cols * cell, rows * (cell + 110)
    parts = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">', f'<rect width="{W}" height="{H}" fill="#E8E5E1"/>']
    for i, n in enumerate(names):
        cx, cy = (i % cols) * cell, (i // cols) * (cell + 110)
        s = (cell - 20) / 120
        parts.append(f'<g transform="translate({cx + 10} {cy + 10})"><rect width="{cell - 20}" height="{cell - 20}" fill="#023C3C"/>')
        grid = ''.join(f'<line x1="{k * s}" y1="0" x2="{k * s}" y2="{cell - 20}" stroke="#F4F1EA" stroke-opacity="{0.22 if k % 50 == 0 else 0.07}" stroke-width="1"/><line x1="0" y1="{k * s}" x2="{cell - 20}" y2="{k * s}" stroke="#F4F1EA" stroke-opacity="{0.22 if k % 50 == 0 else 0.07}" stroke-width="1"/>' for k in range(0, 121, 10))
        parts.append(grid)
        parts.append(f'<g transform="scale({s})" fill="#F4F1EA">{glyph_svg(n)}</g></g>')
        # patches: 96, 56, 36
        x = cx + 14
        for size, col, ink in ((96, '#56C4C4', '#023C3C'), (56, '#023C3C', '#F4F1EA'), (36, '#E88F24', '#023C3C')):
            y = cy + cell + 2 + (96 - size) / 2
            sc = size / 120 * 0.78
            off = size * 0.11
            parts.append(f'<g transform="translate({x} {y})"><circle cx="{size / 2}" cy="{size / 2}" r="{size / 2}" fill="{col}"/><g transform="translate({off} {off}) scale({sc})" fill="{ink}">{glyph_svg(n)}</g></g>')
            x += size + 14
        parts.append(f'<text x="{x + 4}" y="{cy + cell + 56}" font-family="Helvetica" font-weight="bold" font-size="22" fill="#023C3C">{n}</text>')
    parts.append('</svg>')
    open(out, 'w').write('\n'.join(parts))
    return W, H


if __name__ == '__main__':
    names = sys.argv[2:] if len(sys.argv) > 2 else ['wolf'] + list(G.keys())
    W, H = sheet(names, sys.argv[1])
    print(W, H)
