"use client";

interface ProgressBarProps {
  current: number;
  total: number;
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const percent = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div className="w-full max-w-[220px]">
      <div className="flex justify-between text-sm text-ink/60">
        <span>Step {current} of {total}</span>
        <span>{percent}%</span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
