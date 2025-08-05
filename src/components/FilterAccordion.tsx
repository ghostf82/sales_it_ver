import { useState, ReactNode } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import clsx from 'clsx';

interface FilterAccordionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export function FilterAccordion({
  title,
  children,
  defaultOpen = false,
  className
}: FilterAccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={clsx(
      'bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden',
      className
    )}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <h3 className="text-lg font-semibold">{title}</h3>
        {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>
      
      <div className={clsx(
        'transition-all duration-300 overflow-hidden',
        isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
      )}>
        <div className="p-4 pt-0 border-t border-gray-100 dark:border-gray-700">
          {children}
        </div>
      </div>
    </div>
  );
}