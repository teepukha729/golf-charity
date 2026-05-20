'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import useCurrencyStore, { CURRENCIES } from '@/store/currencyStore';

export default function CurrencySelector({ className = '' }) {
  const { currency, setCurrency } = useCurrencyStore();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = CURRENCIES[currency];

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1f3527] bg-[#111a14] text-sm text-[#e8f5e9] hover:border-[#4ade80] transition-all"
        aria-label="Select currency"
      >
        <span>{current.flag}</span>
        <span className="font-semibold">{current.code}</span>
        <ChevronDown className={`w-3 h-3 text-[#7aad8a] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-48 rounded-xl border border-[#1f3527] bg-[#0d1610] shadow-2xl z-50 overflow-hidden">
          {Object.values(CURRENCIES).map((cur) => (
            <button
              key={cur.code}
              onClick={() => { setCurrency(cur.code); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                currency === cur.code
                  ? 'bg-[#1a472a] text-[#4ade80]'
                  : 'text-[#e8f5e9] hover:bg-[#172219]'
              }`}
            >
              <span className="text-base">{cur.flag}</span>
              <div className="text-left flex-1">
                <div className="font-semibold">{cur.code}</div>
                <div className="text-xs text-[#7aad8a]">{cur.label}</div>
              </div>
              {currency === cur.code && <Check className="w-3.5 h-3.5" />}
            </button>
          ))}
          <div className="px-4 py-2 border-t border-[#1f3527]">
            <p className="text-xs text-[#5a8a6a]">Rates are approximate</p>
          </div>
        </div>
      )}
    </div>
  );
}
