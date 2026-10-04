// Search box text goes inside PostgREST `.or()` filters, where a comma starts a new condition and
// brackets or quotes change the grammar. Drop those (and the * and % wildcards) so a search can
// only ever match text, never add or alter a condition.
export const searchTerm = (q?: string | null) =>
  (q || '').replace(/[,()"\\%*]/g, ' ').replace(/\s+/g, ' ').trim();
