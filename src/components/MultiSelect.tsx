import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';
import clsx from 'clsx';

interface Option {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  showSelectAll?: boolean;
  selectAllLabel?: string;
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = 'اختر...',
  label,
  className,
  showSelectAll = false,
  selectAllLabel = 'عرض الكل'
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleOption = (optionValue: string) => {
    const newValue = value.includes(optionValue)
      ? value.filter(v => v !== optionValue)
      : [...value, optionValue];
    onChange(newValue);
  };

  const handleSelectAll = () => {
    onChange(value.length === options.length ? [] : options.map(opt => opt.value));
  };

  const handleClear = () => {
    onChange([]);
    setIsOpen(false);
  };

  return (
    <div className={clsx('relative', className)} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium mb-2 text-right">
          {label}
        </label>
      )}
      
      <div
        className={clsx(
          'relative bg-white border rounded-lg cursor-pointer',
          'hover:border-blue-500',
          'focus-within:border-blue-500',
          'focus-within:ring-2 focus-within:ring-blue-500/20'
        )}
      >
        <div
          className="min-h-[2.5rem] px-3 py-2 flex items-center gap-2 text-right"
          onClick={() => setIsOpen(!isOpen)}
        >
          {value.length > 0 ? (
            <div className="flex flex-wrap gap-1 flex-1">
              {value.map(v => {
                const option = options.find(opt => opt.value === v);
                return option ? (
                  <span
                    key={v}
                    className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-sm rounded px-2 py-0.5"
                  >
                    {option.label}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleOption(v);
                      }}
                      className="hover:text-blue-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ) : null;
              })}
            </div>
          ) : (
            <span className="text-gray-500 flex-1 text-right">
              {placeholder}
            </span>
          )}
          <ChevronDown className={clsx(
            'w-4 h-4 transition-transform',
            isOpen && 'transform rotate-180'
          )} />
        </div>
        
        {isOpen && (
          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
            <div className="sticky top-0 bg-white border-b p-2 flex items-center justify-between">
              <button
                onClick={handleClear}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                مسح الكل
              </button>
              {showSelectAll && (
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {value.length === options.length ? 'إلغاء تحديد الكل' : selectAllLabel}
                </button>
              )}
            </div>
            <div className="p-1">
              {options.map(option => (
                <div
                  key={option.value}
                  className={clsx(
                    'flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-right',
                    'hover:bg-gray-100'
                  )}
                  onClick={() => handleToggleOption(option.value)}
                >
                  <div className={clsx(
                    'w-4 h-4 border rounded',
                    value.includes(option.value)
                      ? 'bg-blue-600 border-blue-600'
                      : 'border-gray-300'
                  )}>
                    {value.includes(option.value) && (
                      <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    )}
                  </div>
                  <span className="flex-1">{option.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}