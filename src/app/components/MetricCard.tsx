import { TrendingUp } from 'lucide-react';
import { Card } from './ui/card';

interface MetricCardProps {
  title: string;
  value: string;
  trend?: string;
  icon?: React.ReactNode;
  color?: string;
}

export function MetricCard({ title, value, trend, icon, color = 'blue' }: MetricCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
  };

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-2">{title}</p>
          <p className="text-3xl font-semibold text-gray-900 mb-2">{value}</p>
          {trend && (
            <div className="flex items-center gap-1 text-sm text-green-600">
              <TrendingUp className="w-4 h-4" />
              <span>{trend}</span>
            </div>
          )}
        </div>
        {icon && (
          <div className={`p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
