'use client';

import { Printer } from '@phosphor-icons/react';

/** Prints the page; everything except the statement is hidden when printing. */
export function PrintButton({ label = 'Print' }: { label?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className="btn small">
      <Printer size={14} weight="bold" />
      {label}
    </button>
  );
}
