const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: '待实施', className: 'bg-amber-50 text-amber-700 border border-amber-200' },
  in_progress: { label: '进行中', className: 'bg-blue-50 text-blue-700 border border-blue-200' },
  done: { label: '已完成', className: 'bg-green-50 text-green-700 border border-green-200' },
  archived: { label: '已归档', className: 'bg-gray-50 text-gray-500 border border-gray-200' },
};

const priorityConfig: Record<string, { label: string; className: string }> = {
  high: { label: '高', className: 'bg-red-50 text-red-600 border border-red-200' },
  medium: { label: '中', className: 'bg-amber-50 text-amber-600 border border-amber-200' },
  low: { label: '低', className: 'bg-gray-50 text-gray-500 border border-gray-200' },
};

interface StatusBadgeProps {
  type: 'status' | 'priority';
  value: string;
}

export default function StatusBadge({ type, value }: StatusBadgeProps) {
  const config = type === 'status' ? statusConfig[value] : priorityConfig[value];
  if (!config) return null;

  return (
    <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${config.className}`}>
      {config.label}
    </span>
  );
}
