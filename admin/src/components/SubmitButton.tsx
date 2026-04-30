'use client';

import { useFormStatus } from 'react-dom';
import { ReactNode } from 'react';

interface SubmitButtonProps {
  children: ReactNode;
  pendingLabel?: string;
  className?: string;
}

export default function SubmitButton({
  children,
  pendingLabel = 'Saving...',
  className = 'px-5 py-2 bg-brand-orange text-white rounded-lg text-sm font-medium hover:bg-orange-500 transition disabled:opacity-60 disabled:cursor-not-allowed',
}: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className} aria-busy={pending}>
      {pending ? (
        <span className="inline-flex items-center gap-2">
          <Spinner />
          <span>{pendingLabel}</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}

function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4 text-current"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}
