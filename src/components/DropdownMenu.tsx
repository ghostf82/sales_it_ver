import { useState, ReactNode, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import clsx from 'clsx';

interface DropdownMenuItemProps {
  icon?: ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export function DropdownMenuItem({
  icon,
  label,
  onClick,
  disabled = false
}: DropdownMenuItemProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'w-full text-right px-4 py-2 text-sm flex items-center gap-2 rounded-lg',
        disabled
          ? 'opacity-50 cursor-not-allowed'
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

interface DropdownMenuProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

export function DropdownMenu({
  trigger,
  children,
  align = 'right',
  className
}: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className={clsx('relative', className)} ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>
      
      {isOpen && (
        <div 
          className={clsx(
            'absolute mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 z-10',
            align === 'left' ? 'left-0' : 'right-0'
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}

interface DropdownButtonProps {
  label: string;
  icon?: ReactNode;
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  align?: 'left' | 'right';
  className?: string;
}

export function DropdownButton({
  label,
  icon,
  children,
  variant = 'secondary',
  size = 'md',
  align = 'right',
  className
}: DropdownButtonProps) {
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-300',
    secondary: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 focus:ring-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-300',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-300',
    warning: 'bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-300'
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  return (
    <DropdownMenu
      align={align}
      className={className}
      trigger={
        <button
          className={clsx(
            'flex items-center gap-1 rounded-lg focus:ring-4 transition-colors',
            variantClasses[variant],
            sizeClasses[size]
          )}
        >
          {icon}
          <span className={clsx(size === 'sm' ? 'hidden sm:inline' : '')}>{label}</span>
          <ChevronDown className={clsx('w-4 h-4', size === 'sm' ? 'ml-0 sm:ml-1' : 'ml-1')} />
        </button>
      }
    >
      {children}
    </DropdownMenu>
  );
}