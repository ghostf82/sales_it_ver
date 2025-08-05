import { Trash2 } from 'lucide-react';
import { useAuth } from '../lib/auth';

interface DeleteOnlyButtonProps {
  onDelete: () => void;
  className?: string;
}

export function DeleteOnlyButton({ onDelete, className = '' }: DeleteOnlyButtonProps) {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return null;
  }

  return (
    <button
      onClick={onDelete}
      className={`text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors ${className}`}
      title="حذف"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}