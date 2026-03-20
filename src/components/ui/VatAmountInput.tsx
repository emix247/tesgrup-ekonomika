'use client';

import { useState, useEffect } from 'react';
import { grossToNet, netToGross } from '@/lib/utils/vat';
import { formatCZK } from '@/lib/utils/format';

interface VatAmountInputProps {
  /** Gross amount (s DPH) - the stored value */
  value: string;
  /** Called with gross amount string whenever either field changes */
  onChange: (grossAmount: string) => void;
  /** Current VAT rate */
  vatRate: number;
  /** Called when VAT rate changes */
  onVatRateChange: (rate: number) => void;
  /** Available VAT rates */
  vatRates?: number[];
  /** Label for the amount section */
  label?: string;
  /** Compact layout (inline) */
  compact?: boolean;
}

export default function VatAmountInput({
  value,
  onChange,
  vatRate,
  onVatRateChange,
  vatRates = [0, 12, 21],
  label = 'Částka',
  compact = false,
}: VatAmountInputProps) {
  // Track which mode is active: user enters "gross" (s DPH) or "net" (bez DPH)
  const [inputMode, setInputMode] = useState<'gross' | 'net'>('gross');
  // Separate net field for when user types in net mode
  const [netValue, setNetValue] = useState('');

  // Sync net value when gross value or vat rate changes externally
  useEffect(() => {
    const gross = parseFloat(value) || 0;
    if (gross > 0 && inputMode === 'gross') {
      setNetValue(Math.round(grossToNet(gross, vatRate)).toString());
    }
  }, [value, vatRate, inputMode]);

  const grossNum = parseFloat(value) || 0;
  const netNum = parseFloat(netValue) || 0;

  function handleGrossChange(v: string) {
    onChange(v);
    const g = parseFloat(v) || 0;
    if (g > 0) {
      setNetValue(Math.round(grossToNet(g, vatRate)).toString());
    } else {
      setNetValue('');
    }
  }

  function handleNetChange(v: string) {
    setNetValue(v);
    const n = parseFloat(v) || 0;
    if (n > 0) {
      onChange(Math.round(netToGross(n, vatRate)).toString());
    } else {
      onChange('');
    }
  }

  function handleVatRateChange(newRate: number) {
    onVatRateChange(newRate);
    // Recalculate based on current input mode
    if (inputMode === 'gross') {
      const g = parseFloat(value) || 0;
      if (g > 0) setNetValue(Math.round(grossToNet(g, newRate)).toString());
    } else {
      const n = parseFloat(netValue) || 0;
      if (n > 0) onChange(Math.round(netToGross(n, newRate)).toString());
    }
  }

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <label className="block text-xs text-gray-500 whitespace-nowrap">{label}</label>
          <div className="flex rounded-md overflow-hidden border border-gray-300 text-[11px]">
            <button type="button" onClick={() => setInputMode('gross')}
              className={`px-2 py-0.5 transition-colors ${inputMode === 'gross' ? 'bg-primary-600 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'}`}>
              s DPH
            </button>
            <button type="button" onClick={() => setInputMode('net')}
              className={`px-2 py-0.5 transition-colors ${inputMode === 'net' ? 'bg-primary-600 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'}`}>
              bez DPH
            </button>
          </div>
          <select value={vatRate} onChange={e => handleVatRateChange(Number(e.target.value))}
            className="px-2 py-1 border border-gray-300 rounded-md text-xs">
            {vatRates.map(r => <option key={r} value={r}>{r} %</option>)}
          </select>
        </div>
        <div className="flex items-center gap-3">
          {inputMode === 'gross' ? (
            <>
              <div className="flex-1">
                <input type="number" value={value} onChange={e => handleGrossChange(e.target.value)}
                  placeholder="Částka s DPH" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium" />
              </div>
              {vatRate > 0 && grossNum > 0 && (
                <div className="text-xs text-gray-500 whitespace-nowrap">
                  bez DPH: <span className="font-medium">{formatCZK(Math.round(grossToNet(grossNum, vatRate)))}</span>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex-1">
                <input type="number" value={netValue} onChange={e => handleNetChange(e.target.value)}
                  placeholder="Částka bez DPH" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium" />
              </div>
              {vatRate > 0 && netNum > 0 && (
                <div className="text-xs text-gray-500 whitespace-nowrap">
                  s DPH: <span className="font-medium">{formatCZK(Math.round(netToGross(netNum, vatRate)))}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <div className="flex rounded-lg overflow-hidden border border-gray-300 text-xs">
          <button type="button" onClick={() => setInputMode('gross')}
            className={`px-3 py-1 transition-colors ${inputMode === 'gross' ? 'bg-primary-600 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'}`}>
            s DPH
          </button>
          <button type="button" onClick={() => setInputMode('net')}
            className={`px-3 py-1 transition-colors ${inputMode === 'net' ? 'bg-primary-600 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'}`}>
            bez DPH
          </button>
        </div>
        <select value={vatRate} onChange={e => handleVatRateChange(Number(e.target.value))}
          className="px-2 py-1 border border-gray-300 rounded-lg text-sm">
          {vatRates.map(r => <option key={r} value={r}>DPH {r} %</option>)}
        </select>
      </div>
      <div className="flex items-center gap-4">
        {inputMode === 'gross' ? (
          <>
            <input type="number" value={value} onChange={e => handleGrossChange(e.target.value)}
              placeholder="Částka s DPH (Kč)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            {vatRate > 0 && grossNum > 0 && (
              <div className="text-sm text-gray-500 min-w-[140px]">
                bez DPH: <span className="font-medium text-gray-700">{formatCZK(Math.round(grossToNet(grossNum, vatRate)))}</span>
              </div>
            )}
          </>
        ) : (
          <>
            <input type="number" value={netValue} onChange={e => handleNetChange(e.target.value)}
              placeholder="Částka bez DPH (Kč)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            {vatRate > 0 && netNum > 0 && (
              <div className="text-sm text-gray-500 min-w-[140px]">
                s DPH: <span className="font-medium text-gray-700">{formatCZK(Math.round(netToGross(netNum, vatRate)))}</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
