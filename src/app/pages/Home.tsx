import { MetricCard } from '../components/MetricCard';
import { CircularProgress } from '../components/CircularProgress';
import { MapCard } from '../components/MapCard';
import { AIAnalytics } from '../components/AIAnalytics';
import { BlockchainTable } from '../components/BlockchainTable';
import { Package, Recycle } from 'lucide-react';

export function Home() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          Selamat Datang di Sistem Integrasi Huntara Aceh Tamiang
        </h1>
        <p className="text-gray-600">
          Platform terpadu untuk optimasi supply chain material kayu pasca bencana
        </p>
      </div>

      {/* Top Row - Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6 mb-6">
        <MetricCard
          title="Total Kayu Terkumpul"
          value="1,250 m³"
          trend="+5% dari kemarin"
          icon={<Package className="w-6 h-6" />}
          color="blue"
        />
        <CircularProgress
          title="Progres Pembangunan Huntara"
          percentage={45}
        />
        <MetricCard
          title="Efisiensi Limbah Kayu"
          value="85%"
          icon={<Recycle className="w-6 h-6" />}
          color="green"
        />
      </div>

      {/* Middle Row - Map & AI Analytics */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6 mb-6">
        <div className="xl:col-span-2">
          <MapCard />
        </div>
        <div>
          <AIAnalytics />
        </div>
      </div>

      {/* Bottom Row - Blockchain Table */}
      <BlockchainTable />
    </div>
  );
}
