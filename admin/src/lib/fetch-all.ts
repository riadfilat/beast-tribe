// The database API returns at most 1,000 rows per request. Anything that can grow past that
// (a club's members, a quarter of bookings) must be read in pages, or it is silently cut short.
// `build` must apply a stable order.
export async function fetchAll<T = any>(
  build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
  page = 1000,
  max = 100000,
): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; from < max; from += page) {
    const { data, error } = await build(from, from + page - 1);
    if (error) throw new Error(error.message);
    out.push(...(data || []));
    if (!data || data.length < page) break;
  }
  return out;
}
