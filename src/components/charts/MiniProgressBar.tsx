import { cn } from '@/lib/utils/cn';

interface MiniProgressBarProps {
  value: number;
  max: number;
  color?: 'blue' | 'emerald' | 'amber' | 'red' | 'purple';
  showLabel?: boolean;
  className?: string;
}

const colorMap = {
  blue: 'bg-blue-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
  purple: 'bg-purple-500',
};

export default function MiniProgressBar({
  value,
  max,
  color = 'blue',
  showLabel = true,
  className,
}: MiniProgressBarProps) {
  const percent = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const overBudget = value > max && max > 0;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden min-w-[60px]">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            overBudget ? 'bg-red-500' : colorMap[color]
          )}
          style={{ width: `${Math.min(100, percent)}%` }}
        />
      </div>
      {showLabel && (
        <span className={cn('text-xs font-medium tabular-nums min-w-[36px] text-right', overBudget ? 'text-red-600' : 'text-gray-500')}>
          {percent.toFixed(0)} %
        </span>
      )}
    </div>
  );
}
