import { Navigation } from 'lucide-react';
import { Card } from './ui/card';
import { LogisticsRouteMap } from './LogisticsRouteMap';

export function MapCard() {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">Interactive Map Logistik</h3>
          <p className="text-xs text-gray-500">AI Optimized Route</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-blue-700 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
          <Navigation className="w-3.5 h-3.5" />
          AI Optimized Route
        </div>
      </div>

      <LogisticsRouteMap className="h-80" />
    </Card>
  );
}
