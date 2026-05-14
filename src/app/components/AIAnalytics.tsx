import { Card } from './ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Brain } from 'lucide-react';

const data = [
  { id: 'jati', name: 'Jati', matchRate: 92 },
  { id: 'mahoni', name: 'Mahoni', matchRate: 85 },
  { id: 'kelapa', name: 'Kelapa', matchRate: 78 },
  { id: 'pinus', name: 'Pinus', matchRate: 88 },
  { id: 'akasia', name: 'Akasia', matchRate: 81 },
];

export function AIAnalytics() {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Status AI Matchmaking</h3>
        <Brain className="w-5 h-5 text-blue-600" />
      </div>
      
      <p className="text-sm text-gray-600 mb-4">
        Tingkat kecocokan antara stok kayu dengan desain shelter
      </p>

      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
            domain={[0, 100]}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#fff', 
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '12px'
            }}
            formatter={(value) => [`${value}%`, 'Match Rate']}
          />
          <Bar 
            dataKey="matchRate" 
            fill="#2563eb" 
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Rata-rata Match Rate</span>
          <span className="font-semibold text-blue-600">84.8%</span>
        </div>
      </div>
    </Card>
  );
}