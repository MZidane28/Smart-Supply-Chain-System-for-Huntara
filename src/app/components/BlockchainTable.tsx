import { CheckCircle2 } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';

const materialData = [
  {
    id: 'KYU-2024-001',
    jenis: 'Kayu Jati',
    dimensi: '200 x 50 x 30 cm',
    status: 'Layak',
    verified: true,
  },
  {
    id: 'KYU-2024-002',
    jenis: 'Kayu Mahoni',
    dimensi: '180 x 45 x 25 cm',
    status: 'Layak',
    verified: true,
  },
  {
    id: 'KYU-2024-003',
    jenis: 'Kayu Kelapa',
    dimensi: '150 x 40 x 20 cm',
    status: 'Perlu Inspeksi',
    verified: true,
  },
  {
    id: 'KYU-2024-004',
    jenis: 'Kayu Pinus',
    dimensi: '220 x 55 x 35 cm',
    status: 'Layak',
    verified: true,
  },
  {
    id: 'KYU-2024-005',
    jenis: 'Kayu Akasia',
    dimensi: '190 x 48 x 28 cm',
    status: 'Layak',
    verified: true,
  },
];

export function BlockchainTable() {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Log Inventaris Material (Blockchain Verified)</h3>
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Terverifikasi
        </Badge>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">ID Kayu</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Jenis</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Dimensi</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status Kelayakan</th>
            </tr>
          </thead>
          <tbody>
            {materialData.map((material, index) => (
              <tr 
                key={material.id} 
                className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                }`}
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-900 font-medium">{material.id}</span>
                    {material.verified && (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-gray-600">{material.jenis}</td>
                <td className="py-3 px-4 text-sm text-gray-600">{material.dimensi}</td>
                <td className="py-3 px-4">
                  <Badge
                    variant={material.status === 'Layak' ? 'default' : 'secondary'}
                    className={
                      material.status === 'Layak'
                        ? 'bg-green-100 text-green-800 hover:bg-green-100'
                        : 'bg-amber-100 text-amber-800 hover:bg-amber-100'
                    }
                  >
                    {material.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between text-sm text-gray-600">
        <span>Menampilkan {materialData.length} dari {materialData.length} material</span>
        <span>Terakhir diperbarui: 5 menit yang lalu</span>
      </div>
    </Card>
  );
}
