import { Card } from './ui/card';

interface CircularProgressProps {
  title: string;
  percentage: number;
}

export function CircularProgress({ title, percentage }: CircularProgressProps) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <Card className="p-6">
      <p className="text-sm text-gray-600 mb-4">{title}</p>
      <div className="flex items-center justify-between">
        <div className="relative w-24 h-24">
          <svg className="transform -rotate-90 w-24 h-24">
            <circle
              cx="48"
              cy="48"
              r={radius}
              stroke="#e5e7eb"
              strokeWidth="8"
              fill="none"
            />
            <circle
              cx="48"
              cy="48"
              r={radius}
              stroke="#2563eb"
              strokeWidth="8"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-semibold text-gray-900">{percentage}%</span>
          </div>
        </div>
        <div className="flex-1 ml-6">
          <p className="text-sm text-gray-600 mb-1">Target: 100 unit</p>
          <p className="text-sm text-gray-600">Selesai: {Math.round(percentage / 2.22)} unit</p>
        </div>
      </div>
    </Card>
  );
}
