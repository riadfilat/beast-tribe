// Money and calendar helpers shared by the admin and partner pages. Riyadh time is UTC+3, no DST.

/** Today's date in Riyadh, YYYY-MM-DD. */
export const todayRiyadh = () => new Date(Date.now() + 3 * 3600000).toISOString().slice(0, 10);

/** "SAR 1,234". Whole riyals by default; `cents` for per-use pay, where halalas add up. */
export const sar = (n: number, cents = false) =>
  cents
    ? `SAR ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `SAR ${Math.round(n).toLocaleString('en-US')}`;

/**
 * A month given as YYYY-MM (defaults to this month, Riyadh time).
 * `from` / `to`: its first and last day as dates. `start` / `end`: the instants [start, end) in Riyadh time.
 */
export function monthRange(m?: string | null) {
  const ym = m && /^\d{4}-(0[1-9]|1[0-2])$/.test(m) ? m : todayRiyadh().slice(0, 7);
  const [y, mo] = ym.split('-').map(Number);
  const last = new Date(Date.UTC(y, mo, 0)).getUTCDate();
  const shift = (d: number) => new Date(Date.UTC(y, mo - 1 + d, 1)).toISOString().slice(0, 7);
  return {
    ym,
    from: `${ym}-01`,
    to: `${ym}-${String(last).padStart(2, '0')}`,
    start: new Date(Date.UTC(y, mo - 1, 1) - 3 * 3600000),
    end: new Date(Date.UTC(y, mo, 1) - 3 * 3600000),
    label: new Date(Date.UTC(y, mo - 1, 1)).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }),
    prev: shift(-1),
    next: shift(1),
  };
}
