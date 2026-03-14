'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils/cn';

interface EditableCellProps {
  value: string | number | null;
  field: string;
  entityId: string;
  apiEndpoint: string;
  type?: 'text' | 'number' | 'select' | 'date';
  options?: { value: string; label: string }[];
  formatFn?: (value: string | number | null) => string;
  onSave?: (updatedEntity?: Record<string, unknown>) => void;
  suffix?: string;
  className?: string;
  placeholder?: string;
  min?: number;
  step?: number;
}

export default function EditableCell({
  value,
  field,
  entityId,
  apiEndpoint,
  type = 'text',
  options,
  formatFn,
  onSave,
  suffix,
  className,
  placeholder = '—',
  min,
  step,
}: EditableCellProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState<string>(value?.toString() ?? '');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current instanceof HTMLInputElement && type !== 'date') {
        inputRef.current.select();
      }
    }
  }, [editing, type]);

  const displayValue = formatFn ? formatFn(value) : (value?.toString() ?? '');

  const handleStartEdit = useCallback(() => {
    setEditValue(value?.toString() ?? '');
    setEditing(true);
  }, [value]);

  const handleCancel = useCallback(() => {
    setEditing(false);
    setEditValue(value?.toString() ?? '');
  }, [value]);

  const handleSave = useCallback(async () => {
    const newValue = type === 'number' ? (editValue === '' ? null : Number(editValue)) : editValue;

    // Skip if value hasn't changed
    if (String(newValue ?? '') === String(value ?? '')) {
      setEditing(false);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(apiEndpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: entityId, [field]: newValue }),
      });

      if (!res.ok) throw new Error('Save failed');
      const updated = await res.json();
      setEditing(false);
      onSave?.(updated);
    } catch (err) {
      console.error('EditableCell save error:', err);
    } finally {
      setSaving(false);
    }
  }, [editValue, type, value, apiEndpoint, entityId, field, onSave]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  }, [handleSave, handleCancel]);

  if (editing) {
    if (type === 'select' && options) {
      return (
        <select
          ref={inputRef as React.RefObject<HTMLSelectElement>}
          value={editValue}
          onChange={(e) => {
            setEditValue(e.target.value);
          }}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          disabled={saving}
          className={cn(
            'w-full px-2 py-1 text-sm border border-primary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white',
            saving && 'opacity-50',
            className
          )}
        >
          <option value="">—</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );
    }

    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type={type === 'number' ? 'number' : type === 'date' ? 'date' : 'text'}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        disabled={saving}
        min={min}
        step={step ?? (type === 'number' ? 'any' : undefined)}
        className={cn(
          'w-full px-2 py-1 text-sm border border-primary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500',
          saving && 'opacity-50',
          className
        )}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={handleStartEdit}
      className={cn(
        'group relative w-full text-left px-1 py-0.5 -mx-1 rounded hover:bg-primary-50 transition-colors cursor-pointer',
        className
      )}
      title="Klikněte pro úpravu"
    >
      <span className={!displayValue || displayValue === '—' ? 'text-gray-400' : ''}>
        {displayValue || placeholder}
        {suffix && value != null ? ` ${suffix}` : ''}
      </span>
      <svg
        className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
      </svg>
    </button>
  );
}
