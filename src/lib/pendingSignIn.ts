// The email and password a member just typed, kept in memory (never in navigation params, which can
// end up in a URL or saved navigation state) so the verify screen can sign them in once confirmed.
let pending: { email: string; password: string } | null = null;

export function holdSignIn(email: string, password: string) {
  pending = { email, password };
}

/** Read and forget. */
export function takeSignIn(): { email: string; password: string } | null {
  const p = pending;
  pending = null;
  return p;
}
