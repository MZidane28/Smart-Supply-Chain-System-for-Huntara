import { useState, useMemo } from 'react';
import {
  Brain, Leaf, Clock, AlertTriangle, Info, CheckCircle2,
  RefreshCw, TrendingDown, Target, Activity, Cpu, Zap,
  Package2, Send,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';

// ─── Types ────────────────────────────────────────────────────────────────────
interface MatchItem {
  id: string;
  kayuId: string;
  kayuJenis: string;
  kayuDimensi: string;
  komponen: string;
  modul: string;
  score: number;
  status: 'Optimal' | 'Butuh Penyesuaian';
  limbah: number;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number }>;
  label?: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const BASE_MATCHES: MatchItem[] = [
  { id: 'M-001', kayuId: 'KYU-012', kayuJenis: 'Kayu Jati',     kayuDimensi: 'Ø 45cm × 3.2m', komponen: 'Balok Lantai',        modul: 'Tipe A', score: 96, status: 'Optimal',           limbah: 2.1  },
  { id: 'M-002', kayuId: 'KYU-011', kayuJenis: 'Kayu Meranti',  kayuDimensi: 'Ø 38cm × 2.8m', komponen: 'Rangka Dinding',      modul: 'Tipe B', score: 88, status: 'Optimal',           limbah: 5.4  },
  { id: 'M-003', kayuId: 'KYU-010', kayuJenis: 'Kayu Mahoni',   kayuDimensi: 'Ø 52cm × 4.0m', komponen: 'Kolom Utama',         modul: 'Tipe A', score: 74, status: 'Butuh Penyesuaian', limbah: 12.7 },
  { id: 'M-004', kayuId: 'KYU-009', kayuJenis: 'Kayu Pinus',    kayuDimensi: 'Ø 29cm × 2.2m', komponen: 'Papan Plafon',        modul: 'Tipe C', score: 91, status: 'Optimal',           limbah: 3.0  },
  { id: 'M-005', kayuId: 'KYU-008', kayuJenis: 'Kayu Akasia',   kayuDimensi: 'Ø 41cm × 3.5m', komponen: 'Kuda-kuda Atap',      modul: 'Tipe B', score: 82, status: 'Optimal',           limbah: 6.8  },
  { id: 'M-006', kayuId: 'KYU-007', kayuJenis: 'Kayu Jati',     kayuDimensi: 'Ø 48cm × 3.8m', komponen: 'Balok Pembatas',      modul: 'Tipe A', score: 68, status: 'Butuh Penyesuaian', limbah: 18.2 },
  { id: 'M-007', kayuId: 'KYU-006', kayuJenis: 'Kayu Kelapa',   kayuDimensi: 'Ø 33cm × 2.5m', komponen: 'Panel Dinding Sisi',  modul: 'Tipe C', score: 79, status: 'Optimal',           limbah: 8.1  },
  { id: 'M-008', kayuId: 'KYU-005', kayuJenis: 'Kayu Meranti',  kayuDimensi: 'Ø 55cm × 4.5m', komponen: 'Pondasi Kayu',        modul: 'Tipe A', score: 94, status: 'Optimal',           limbah: 2.9  },
];

const FORECAST_DATA = [
  { hari: 'H+0',  tanpaAI: 800, denganAI: 450 },
  { hari: 'H+5',  tanpaAI: 780, denganAI: 410 },
  { hari: 'H+10', tanpaAI: 760, denganAI: 372 },
  { hari: 'H+15', tanpaAI: 742, denganAI: 338 },
  { hari: 'H+20', tanpaAI: 725, denganAI: 308 },
  { hari: 'H+25', tanpaAI: 710, denganAI: 280 },
  { hari: 'H+30', tanpaAI: 698, denganAI: 256 },
];

const SPARK_DATA = [
  { d: 'W1', v: 620 }, { d: 'W2', v: 580 }, { d: 'W3', v: 520 },
  { d: 'W4', v: 480 }, { d: 'W5', v: 450 },
];

const RECOMMENDATIONS = [
  {
    id: 'REC-001',
    type: 'warning' as const,
    title: 'Kekurangan Material Tipe B',
    desc: 'Kekurangan 15 balok kayu untuk Modul Tipe B. Kebutuhan: 28 balok, tersedia: 13 balok.',
    action: 'Request Material Tambahan',
    Icon: AlertTriangle,
  },
  {
    id: 'REC-002',
    type: 'info' as const,
    title: 'Kelebihan Material di Gudang A',
    desc: 'Terdeteksi 8 unit material ukuran XL tidak terpakai. Realokasi ke proyek lain disarankan.',
    action: 'Realokasi Sekarang',
    Icon: Info,
  },
  {
    id: 'REC-003',
    type: 'success' as const,
    title: 'Modul Tipe A Siap Konstruksi',
    desc: 'Semua material untuk Modul Tipe A telah lengkap dan terverifikasi di blockchain.',
    action: 'Jadwalkan Konstruksi',
    Icon: CheckCircle2,
  },
  {
    id: 'REC-004',
    type: 'warning' as const,
    title: '3 Material Non-Standar Terdeteksi',
    desc: '3 batang berukuran non-standar perlu pemotongan sebelum digunakan pada Rangka Dinding Tipe B.',
    action: 'Jadwalkan Pemotongan',
    Icon: AlertTriangle,
  },
];

const REC_STYLES = {
  warning: {
    card:    'bg-amber-50  border-amber-200',
    iconBg:  'bg-amber-100',
    iconClr: 'text-amber-600',
    title:   'text-amber-900',
    btn:     'border-amber-200 text-amber-700 hover:bg-amber-100',
  },
  info: {
    card:    'bg-blue-50   border-blue-200',
    iconBg:  'bg-blue-100',
    iconClr: 'text-blue-600',
    title:   'text-blue-900',
    btn:     'border-blue-200 text-blue-700 hover:bg-blue-100',
  },
  success: {
    card:    'bg-green-50  border-green-200',
    iconBg:  'bg-green-100',
    iconClr: 'text-green-600',
    title:   'text-green-900',
    btn:     'border-green-200 text-green-700 hover:bg-green-100',
  },
};

const PHASES = [
  { label: 'Persiapan Material',   done: true  },
  { label: 'Pemotongan & Fabrikasi', done: true  },
  { label: 'Perakitan Modul',       done: false },
  { label: 'Instalasi Lapangan',    done: false },
];

// ─── Sub-components ───────────────────────────────────────────────────────────
function CircularGauge({ value }: { value: number }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - value / 100);
  return (
    <div className="relative w-36 h-36 mx-auto">
      <svg width="144" height="144" style={{ transform: 'rotate(-90deg)' }}>
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
        </defs>
        {/* Track */}
        <circle cx="72" cy="72" r={r} fill="none" stroke="#e0e7ff" strokeWidth="12" />
        {/* Progress */}
        <circle
          cx="72" cy="72" r={r}
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-3xl font-bold text-gray-900">{value}%</span>
        <span className="text-xs text-gray-500 mt-0.5">Kecocokan</span>
      </div>
    </div>
  );
}

function ScoreCell({ score }: { score: number }) {
  const color = score >= 90 ? '#16a34a' : score >= 75 ? '#2563eb' : '#d97706';
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden flex-shrink-0">
        <div
          className="h-full rounded-full"
          style={{ width: `${score}%`, backgroundColor: color, transition: 'width 0.7s ease' }}
        />
      </div>
      <span className="text-xs font-bold w-8 text-right tabular-nums" style={{ color }}>
        {score}%
      </span>
    </div>
  );
}

function ForecastTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const tanpa  = payload.find(p => p.dataKey === 'tanpaAI')?.value  ?? 0;
  const dengan = payload.find(p => p.dataKey === 'denganAI')?.value ?? 0;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-xs min-w-[160px]">
      <p className="font-semibold text-gray-700 mb-2">{label}</p>
      <div className="space-y-1.5">
        <p className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
            Tanpa AI
          </span>
          <span className="font-semibold text-amber-700">{tanpa} kg</span>
        </p>
        <p className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
            Dengan AI
          </span>
          <span className="font-semibold text-blue-700">{dengan} kg</span>
        </p>
        <p className="flex items-center justify-between gap-3 border-t border-gray-100 pt-1.5 mt-1.5">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
            Hemat
          </span>
          <span className="font-bold text-green-700">{tanpa - dengan} kg</span>
        </p>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export function OptimisiAIPage() {
  const [matches, setMatches] = useState<MatchItem[]>(BASE_MATCHES);
  const [running, setRunning] = useState(false);
  const [activeFilter, setFilter] = useState('Semua');

  const avgScore    = Math.round(matches.reduce((s, m) => s + m.score, 0) / matches.length);
  const optimalCnt  = matches.filter(m => m.status === 'Optimal').length;
  const adjustCnt   = matches.length - optimalCnt;
  const totalLimbah = matches.reduce((s, m) => s + m.limbah, 0).toFixed(1);

  const filtered = useMemo(() => {
    if (activeFilter === 'Semua') return matches;
    if (activeFilter === 'Optimal') return matches.filter(m => m.status === 'Optimal');
    return matches.filter(m => m.status === 'Butuh Penyesuaian');
  }, [matches, activeFilter]);

  const handleRerun = async () => {
    setRunning(true);
    await new Promise(r => setTimeout(r, 2500));
    setMatches(prev =>
      prev.map(m => {
        const delta    = Math.floor(Math.random() * 10) - 4;
        const newScore = Math.min(99, Math.max(56, m.score + delta));
        const newLimbah = Math.max(0.5, parseFloat((m.limbah + (Math.random() * 2 - 1)).toFixed(1)));
        return {
          ...m,
          score: newScore,
          status: newScore >= 75 ? 'Optimal' : 'Butuh Penyesuaian',
          limbah: newLimbah,
        };
      })
    );
    setRunning(false);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen">

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-7">
        <div>
          <div className="flex items-center gap-2 text-xs text-blue-600 font-medium mb-1.5">
            <Brain className="w-3.5 h-3.5" />
            <span>Optimasi AI</span>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">
            AI Matchmaking & Forecasting
          </h1>
          <p className="text-gray-500 text-sm">Optimasi alokasi material dan prediksi limbah</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-gray-400">Terakhir dijalankan</p>
            <p className="text-xs font-semibold text-gray-600">3 menit lalu · v2.1</p>
          </div>
          <button
            onClick={handleRerun}
            disabled={running}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm ${
              running
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-md hover:shadow-blue-200'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${running ? 'animate-spin' : ''}`} />
            {running ? 'AI Sedang Berjalan...' : 'Jalankan Ulang AI'}
          </button>
        </div>
      </div>

      {/* ── Top Metrics ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-5 mb-6">

        {/* Card 1 – Match Rate Gauge */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 bg-blue-100 rounded-md flex items-center justify-center">
              <Target className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-700">Tingkat Kecocokan Material</h3>
          </div>
          <CircularGauge value={avgScore} />
          <div className="mt-4 flex items-center justify-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-gray-600"><span className="font-bold text-gray-800">{optimalCnt}</span> Optimal</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-amber-400 rounded-full" />
              <span className="text-gray-600"><span className="font-bold text-gray-800">{adjustCnt}</span> Butuh Penyesuaian</span>
            </div>
          </div>
        </div>

        {/* Card 2 – Waste Reduction */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 bg-green-100 rounded-md flex items-center justify-center">
              <Leaf className="w-3.5 h-3.5 text-green-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-700">Prediksi Pengurangan Limbah</h3>
          </div>
          <div className="flex items-end gap-1.5 mb-1">
            <span className="text-5xl font-bold text-green-600 tabular-nums">450</span>
            <span className="text-2xl font-semibold text-green-400 mb-1">kg</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-green-600 mb-4">
            <TrendingDown className="w-3.5 h-3.5" />
            <span className="font-medium">+23% lebih efisien vs. bulan lalu</span>
          </div>
          <ResponsiveContainer width="100%" height={52}>
            <AreaChart data={SPARK_DATA} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#16a34a" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <Area
                type="monotone" dataKey="v"
                stroke="#16a34a" strokeWidth={2.5}
                fill="url(#sparkGrad)" dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
          <p className="text-xs text-gray-400 mt-1.5">Tren 5 minggu terakhir</p>
        </div>

        {/* Card 3 – Schedule */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 bg-blue-100 rounded-md flex items-center justify-center">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-700">Estimasi Waktu Pengerjaan</h3>
          </div>
          <div className="flex items-end gap-1.5 mb-4">
            <span className="text-5xl font-bold text-gray-900 tabular-nums">14</span>
            <span className="text-2xl font-semibold text-gray-400 mb-1">Hari</span>
          </div>
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-gray-500">Progres jadwal</span>
              <span className="font-semibold text-blue-600">Hari ke-5 / 14</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full" style={{ width: '35.7%' }} />
            </div>
          </div>
          <div className="space-y-2">
            {PHASES.map((phase, idx) => (
              <div key={idx} className="flex items-center gap-2.5">
                <div className={`w-3 h-3 rounded-full flex-shrink-0 border-2 ${
                  phase.done
                    ? 'bg-green-500 border-green-500'
                    : 'bg-white border-gray-300'
                }`} />
                <span className={`text-xs ${
                  phase.done ? 'text-gray-400 line-through' : 'text-gray-700 font-medium'
                }`}>
                  {phase.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Matchmaking Engine ───────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">

        {/* Card header */}
        <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Cpu className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 text-sm">
                Hasil Rekomendasi Alokasi (Matchmaking)
              </h2>
              <p className="text-xs text-gray-500">
                Model: HuntaraMatch v2.1 · Confidence threshold: 94.2%
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {running && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg">
                <Activity className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
                <span className="text-xs text-blue-600 font-medium">AI sedang memproses ulang...</span>
              </div>
            )}
            {/* Filter tabs */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
              {[
                { key: 'Semua',             label: `Semua (${matches.length})`       },
                { key: 'Optimal',           label: `Optimal (${optimalCnt})`         },
                { key: 'Butuh Penyesuaian', label: `Penyesuaian (${adjustCnt})`      },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    activeFilter === tab.key
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            {/* Column headers */}
            <div
              className="grid px-6 py-3 bg-gray-50 border-b border-gray-100"
              style={{ gridTemplateColumns: '2fr 76px 2fr 140px 160px 88px' }}
            >
              {['Material Kayu (Inventaris)', '', 'Komponen Huntara (Target)', 'Skor Kecocokan', 'Status Kecocokan', 'Est. Limbah'].map((h, i) => (
                <span key={i} className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {h}
                </span>
              ))}
            </div>

            {/* Rows */}
            <div className={`transition-opacity duration-300 ${running ? 'opacity-40' : 'opacity-100'}`}>
              {filtered.map((m, idx) => (
                <div
                  key={m.id}
                  className={`grid items-center px-6 py-4 border-b border-gray-50 transition-colors hover:bg-blue-50/20 ${
                    idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                  }`}
                  style={{ gridTemplateColumns: '2fr 76px 2fr 140px 160px 88px' }}
                >
                  {/* Inventory side */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-amber-50 border border-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Package2 className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 leading-none mb-0.5">{m.kayuId}</p>
                      <p className="text-xs text-gray-500">{m.kayuJenis}</p>
                      <p className="text-xs font-mono text-gray-400 mt-0.5">{m.kayuDimensi}</p>
                    </div>
                  </div>

                  {/* AI connector arrow */}
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center w-full">
                      <div className="flex-1 h-px bg-blue-200" />
                      <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center mx-1.5 flex-shrink-0 shadow-sm shadow-blue-300">
                        <Zap className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="flex-1 h-px bg-blue-200" />
                    </div>
                    <span className="text-xs font-bold text-blue-500 tracking-widest">AI</span>
                  </div>

                  {/* Target side */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Target className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 leading-none mb-0.5">{m.komponen}</p>
                      <p className="text-xs text-gray-500">Modul {m.modul}</p>
                    </div>
                  </div>

                  {/* Score bar */}
                  <ScoreCell score={m.score} />

                  {/* Status badge */}
                  <div>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                      m.status === 'Optimal'
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {m.status === 'Optimal'
                        ? <CheckCircle2 className="w-3 h-3" />
                        : <AlertTriangle className="w-3 h-3" />
                      }
                      {m.status}
                    </span>
                  </div>

                  {/* Waste estimate */}
                  <div>
                    <span className="text-sm font-semibold text-gray-600 tabular-nums">
                      {m.limbah.toFixed(1)} kg
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Table footer */}
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                Menampilkan <span className="font-semibold text-gray-700">{filtered.length}</span> dari{' '}
                <span className="font-semibold text-gray-700">{matches.length}</span> pasangan material
              </span>
              <span className="text-xs text-gray-500">
                Total estimasi limbah:{' '}
                <span className="font-semibold text-amber-600">{totalLimbah} kg</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Row ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-[3fr_2fr] gap-4 lg:gap-6">

        {/* Forecast Area Chart */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900 text-sm">
                  Proyeksi Pengurangan Limbah (30 Hari)
                </h2>
                <p className="text-xs text-gray-500">
                  Perbandingan skenario dengan & tanpa optimasi AI
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <div className="w-6 h-0.5 bg-amber-400 rounded" />
                Tanpa AI
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <div className="w-6 h-0.5 bg-blue-500 rounded" />
                Dengan AI
              </div>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={FORECAST_DATA} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="tanpaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}    />
                </linearGradient>
                <linearGradient id="denganGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.22} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="hari"  tick={{ fontSize: 11 }} stroke="#d1d5db" tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} stroke="#d1d5db" tickLine={false} axisLine={false} unit=" kg" />
              <Tooltip content={<ForecastTooltip />} cursor={{ stroke: '#e0e7ff', strokeWidth: 1 }} />
              <Area
                type="monotone" dataKey="tanpaAI"
                stroke="#f59e0b" strokeWidth={2}
                fill="url(#tanpaGrad)" dot={false}
                strokeDasharray="5 3"
              />
              <Area
                type="monotone" dataKey="denganAI"
                stroke="#3b82f6" strokeWidth={2.5}
                fill="url(#denganGrad)"
                dot={{ fill: '#3b82f6', r: 3, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>

          <div className="mt-4 bg-green-50 border border-green-100 rounded-xl px-4 sm:px-5 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-start gap-2 text-xs text-green-700">
              <Leaf className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Total penghematan limbah yang diproyeksikan selama 30 hari ke depan</span>
            </div>
            <span className="text-sm font-bold text-green-700 sm:flex-shrink-0 sm:ml-3">~442 kg limbah dicegah</span>
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 text-sm">Rekomendasi AI</h2>
              <p className="text-xs text-gray-500">4 tindakan diprioritaskan sistem</p>
            </div>
          </div>

          <div className="p-4 space-y-3">
            {RECOMMENDATIONS.map(rec => {
              const s = REC_STYLES[rec.type];
              return (
                <div key={rec.id} className={`rounded-xl border p-3.5 ${s.card}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${s.iconBg}`}>
                      <rec.Icon className={`w-4 h-4 ${s.iconClr}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold leading-snug ${s.title}`}>{rec.title}</p>
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed">{rec.desc}</p>
                      <button
                        className={`mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border bg-white transition-colors ${s.btn}`}
                      >
                        <Send className="w-2.5 h-2.5" />
                        {rec.action}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
