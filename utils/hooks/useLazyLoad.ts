import { useCallback, useState } from 'react';
import { useIntersectionObserver } from './useIntersectionObserver';

interface UseLazyLoadOptions<T> {
  initialData?: T[];
  pageSize?: number;
  fetchMore: (offset: number, limit: number) => Promise<T[]>;
  hasMore?: boolean;
}

export function useLazyLoad<T>({
  initialData = [],
  pageSize = 10,
  fetchMore,
  hasMore = true,
}: UseLazyLoadOptions<T>) {
  const [data, setData] = useState<T[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(hasMore);

  const loadMore = useCallback(async () => {
    if (loading || !hasMoreData) return;

    setLoading(true);
    try {
      const newData = await fetchMore(data.length, pageSize);
      if (newData.length === 0 || newData.length < pageSize) {
        setHasMoreData(false);
      }
      // Deduplicate by id
      setData((prev) => {
        const existingIds = new Set(prev.map((item: any) => item.id));
        const uniqueNewData = newData.filter((item: any) => !existingIds.has(item.id));
        return [...prev, ...uniqueNewData];
      });
    } catch (error) {
      console.error('Error loading more data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadInitial = useCallback(async () => {
    if (loading || data.length > 0) return;

    setLoading(true);
    try {
      const initialData = await fetchMore(0, pageSize);
      if (initialData.length === 0 || initialData.length < pageSize) {
        setHasMoreData(false);
      }
      setData(initialData);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const sentinelRef = useIntersectionObserver({
    onIntersect: loadMore,
    threshold: 0.1,
    rootMargin: '100px',
  });

  return {
    data,
    loading,
    hasMoreData,
    sentinelRef,
    loadMore,
    loadInitial,
  };
}
