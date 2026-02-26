import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useCallback, useEffect, useState } from 'react';
import { twMerge } from 'tailwind-merge';

export default function SearchBar({
  className,
  searchQuery,
  onSearch,
}: {
  className?: string;
  searchQuery?: string;
  onSearch: (query: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(searchQuery || '');

  // Sync internal query with prop
  useEffect(() => {
    if (searchQuery !== undefined) {
      setQuery(searchQuery);
    }
  }, [searchQuery]);

  const debouncedSearch = useCallback(
    (value: string) => {
      const timeoutId = setTimeout(() => {
        onSearch(value);
      }, 300);
      return () => clearTimeout(timeoutId);
    },
    [onSearch],
  );

  useEffect(() => {
    const cleanup = debouncedSearch(query);
    return cleanup;
  }, [query, debouncedSearch]);

  return (
    <div className={twMerge('flex relative items-center h-8 w-full', className)}>
      <input
        type="text"
        placeholder="Search games..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className={twMerge(
          'pl-8! w-full opacity-50 hover:opacity-100 transition-opacity duration-300',
          query && 'opacity-100',
        )}
      />
      <MagnifyingGlassIcon
        className="absolute left-2 w-4 h-4 text-slate-500 cursor-pointer"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            setQuery('');
            onSearch('');
          }
        }}
      />
    </div>
  );
}
