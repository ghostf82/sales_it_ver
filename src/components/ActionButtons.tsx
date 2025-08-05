import { ReactNode } from 'react';
import clsx from 'clsx';

interface ActionButtonProps {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

export function ActionButton({
  icon,
  label,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className
}: ActionButtonProps) {
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
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'flex items-center gap-1 rounded-lg focus:ring-4 transition-colors disabled:opacity-50',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {icon}
      <span className={clsx(size === 'sm' ? 'hidden sm:inline' : '')}>{label}</span>
    </button>
  );
}

interface ActionButtonGroupProps {
  children: ReactNode;
  className?: string;
}

export function ActionButtonGroup({ children, className }: ActionButtonGroupProps) {
  return (
    <div className={clsx('flex flex-wrap items-center gap-2', className)}>
      {children}
    </div>
  );
}