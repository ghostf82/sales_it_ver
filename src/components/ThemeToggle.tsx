import { Sun } from 'lucide-react';

interface ThemeToggleProps {
  onToggle: () => void;
}

export function ThemeToggle({ onToggle }: ThemeToggleProps) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
      title="الوضع الفاتح"
    >
      <Sun className="w-5 h-5" />
    </button>
  );
}