// Errors the UI can explain. The database raises reasons like 'TAKEN' or 'WOMEN_ONLY' in its
// messages; the app turns them into a code, and the code picks the `<area>.errors.<code>` string.

export class CodedError<C extends string> extends Error {
  code: C | 'generic';
  constructor(code: C | 'generic', message?: string) {
    super(message || code);
    this.code = code;
  }
}

/** The first known reason in an error's message. List longer codes before their prefixes (ALREADY_INVITED before ALREADY). */
export function codeFrom<C extends string>(e: unknown, codes: readonly C[]): C | 'generic' {
  const m = String((e as any)?.message ?? e ?? '');
  return codes.find((c) => m.includes(c)) ?? 'generic';
}

/** The string key for an error in one area of the app: `${area}.errors.<code>`, or `.generic`. */
export function errorKey(area: string, e: unknown): string {
  return `${area}.errors.${e instanceof CodedError ? e.code : 'generic'}`;
}
