import React, { useState, useEffect, useRef } from 'react';

export default function ResponsiveSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Select',
  className = '',
  name,
  disabled = false,
  maxHeight = 280,
}) {
  const [open, setOpen] = useState(false);

  const selected = options.find(o => String(o.value) === String(value));
  const scrollYRef = useRef(0);

  useEffect(() => {
    if (!open) return;
    // lock background scroll
    const y = window.scrollY || window.pageYOffset;
    scrollYRef.current = y;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${y}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';

    return () => {
      // restore
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      window.scrollTo(0, scrollYRef.current || 0);
    };
  }, [open]);

  return (
    <div className={`relative ${className}`}>
      {/* native select for larger screens */}
      <select
        value={value || ''}
        onChange={(e) => onChange && onChange(e.target.value)}
        name={name}
        disabled={disabled}
        className="hidden sm:block w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
      >
        <option value="">{placeholder}</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value} title={opt.label}>{opt.label}</option>
        ))}
      </select>

      {/* mobile compact button */}
      <div className="sm:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          disabled={disabled}
          className="w-full text-left px-3 py-2 border border-slate-300 rounded-lg bg-white"
        >
          <span className="truncate block">{selected ? selected.label : placeholder}</span>
        </button>

        {open && (
          <div className="fixed inset-0 z-50 sm:hidden">
            <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
            <div className="absolute inset-x-4 top-16 bottom-8 mx-auto w-full max-w-lg">
              <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
                <div className="flex items-center justify-between px-4 py-3 border-b bg-slate-50">
                  <div className="text-sm font-semibold text-slate-900">{placeholder}</div>
                  <button onClick={() => setOpen(false)} className="text-sm text-slate-600">Close</button>
                </div>
                <div className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
                  {options.length === 0 ? (
                    <div className="p-4 text-sm text-slate-500">No options</div>
                  ) : (
                    options.map(opt => {
                      const isSelected = String(opt.value) === String(value);
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => { onChange && onChange(opt.value); setOpen(false); }}
                          className={`w-full text-left px-4 py-4 border-b border-slate-100 transition-colors ${isSelected ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50'}`}
                          aria-pressed={isSelected}
                        >
                          <div className="text-sm truncate">{opt.label}</div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
