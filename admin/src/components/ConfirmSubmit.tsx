'use client';
import { useFormStatus } from 'react-dom';
import { ReactNode } from 'react';

export function ConfirmButton({
  children,
  confirmMessage,
  className,
}: {
  children: ReactNode;
  confirmMessage: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(e) => {
        if (!confirm(confirmMessage)) e.preventDefault();
      }}
      className={className}
    >
      {pending ? 'Processing...' : children}
    </button>
  );
}
