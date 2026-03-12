'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface UseInlineEditOptions<T> {
  apiEndpoint: string;
  initialItems: T[];
  getId: (item: T) => string;
}

export function useInlineEdit<T extends Record<string, unknown>>({
  apiEndpoint,
  initialItems,
  getId,
}: UseInlineEditOptions<T>) {
  const [items, setItems] = useState<T[]>(initialItems);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const updateField = useCallback(
    async (id: string, field: string, value: unknown) => {
      try {
        const res = await fetch(apiEndpoint, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, [field]: value }),
        });
        if (!res.ok) throw new Error('Update failed');

        // Optimistic update
        setItems((prev) =>
          prev.map((item) =>
            getId(item) === id ? { ...item, [field]: value } : item
          )
        );
        router.refresh();
      } catch (err) {
        console.error('useInlineEdit updateField error:', err);
        throw err;
      }
    },
    [apiEndpoint, getId, router]
  );

  const addItem = useCallback(
    async (data: Partial<T>) => {
      setLoading(true);
      try {
        const res = await fetch(apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Create failed');
        const newItem = await res.json();
        setItems((prev) => [...prev, newItem]);
        router.refresh();
        return newItem;
      } catch (err) {
        console.error('useInlineEdit addItem error:', err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiEndpoint, router]
  );

  const deleteItem = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`${apiEndpoint}?id=${id}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error('Delete failed');
        setItems((prev) => prev.filter((item) => getId(item) !== id));
        router.refresh();
      } catch (err) {
        console.error('useInlineEdit deleteItem error:', err);
        throw err;
      }
    },
    [apiEndpoint, getId, router]
  );

  const refreshItems = useCallback(async () => {
    try {
      const res = await fetch(apiEndpoint);
      if (!res.ok) throw new Error('Refresh failed');
      const data = await res.json();
      setItems(Array.isArray(data) ? data : data.units ?? data.items ?? []);
    } catch (err) {
      console.error('useInlineEdit refreshItems error:', err);
    }
  }, [apiEndpoint]);

  return { items, setItems, loading, updateField, addItem, deleteItem, refreshItems };
}
