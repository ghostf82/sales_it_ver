import { ReactNode } from 'react';
import clsx from 'clsx';

interface ChartContainerProps {
  title: string;
  children: ReactNode;
  className?: string;
  height?: string;
}

export function ChartContainer({
  title,
  children,
  className,
  height = 'h-[300px]'
}: ChartContainerProps) {
  return (
    <div className={clsx(
      'bg-white rounded-xl shadow-lg p-4 overflow-hidden',
      className
    )}>
      <h3 className="text-base sm:text-lg font-medium mb-2 sm:mb-4">{title}</h3>
      <div className={clsx('w-full', height)}>
        {children}
      </div>
    </div>
  );
}