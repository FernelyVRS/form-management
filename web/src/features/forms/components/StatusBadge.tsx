import { cn } from "@/lib/utils";

export type VersionStatus = 'Draft' | 'Published' | 'Archived';

interface StatusBadgeProps {
  status: VersionStatus;
  className?: string;
}

const statusConfig: Record<VersionStatus, { label: string; className: string }> = {
  Draft: {
    label: 'DRAFT',
    className: 'bg-gray-100 text-gray-700 border-gray-200',
  },
  Published: {
    label: 'PUBLISHED',
    className: 'bg-blue-600 text-white border-blue-600',
  },
  Archived: {
    label: 'ARCHIVED',
    className: 'bg-slate-100 text-slate-500 border-slate-200',
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig['Draft'];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
