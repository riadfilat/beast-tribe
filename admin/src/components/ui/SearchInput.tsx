'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useTransition, Suspense } from 'react';
import { useDebouncedCallback } from 'use-debounce';

interface SearchInputProps {
  placeholder?: string;
  paramName?: string;
  className?: string;
  defaultValue?: string;
}

function SearchInputInner({
  placeholder = 'Search...',
  paramName = 'q',
  className = '',
  defaultValue = '',
}: SearchInputProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleSearch = useDebouncedCallback((value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('page');
    if (value) {
      params.set(paramName, value);
    } else {
      params.delete(paramName);
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }, 300);

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none select-none text-sm">
        🔍
      </span>
      <input
        type="text"
        defaultValue={defaultValue}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder={placeholder}
        className={`pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-aqua outline-none transition ${
          isPending ? 'opacity-60' : ''
        } ${className}`}
      />
      {isPending && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs animate-pulse">
          ...
        </span>
      )}
    </div>
  );
}

export default function SearchInput(props: SearchInputProps) {
  return (
    <Suspense fallback={
      <div className={`relative ${props.className || ''}`}>
        <input
          type="text"
          defaultValue={props.defaultValue || ''}
          placeholder={props.placeholder || 'Search...'}
          className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none"
          disabled
        />
      </div>
    }>
      <SearchInputInner {...props} />
    </Suspense>
  );
}
