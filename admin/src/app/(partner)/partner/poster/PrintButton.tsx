'use client';

export default function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-orange text-brand-teal text-sm font-semibold hover:brightness-95">
      Print poster
    </button>
  );
}
