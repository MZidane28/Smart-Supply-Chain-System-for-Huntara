import { useState } from 'react';
import {
  Building2, Download, Layers, Box, DoorOpen, Package,
  CheckCircle2, AlertTriangle, Clock, TrendingUp, Cpu,
  FileText, ChevronRight,
} from 'lucide-react';
import { BIMViewer } from '../components/BIMViewer';

// ─── QTO Data ─────────────────────────────────────────────────────────────────
const QTO_ITEMS = [
  { name: 'Tiang Utama',       material: 'Kayu Jati',    unit: 'unit', required: 12,  available: 12,  icon: Box          },
  { name: 'Balok Lantai',      material: 'Kayu Meranti', unit: 'unit', required: 28,  available: 28,  icon: Box          },
  { name: 'Kuda-kuda Atap',    material: 'Kayu Akasia',  unit: 'unit', required: 8,   available: 8,   icon: Box          },
  { name: 'Panel Dinding',     material: 'Kayu Pinus',   unit: 'unit', required: 24,  available: 18,  icon: Package      },
  { name: 'Reng & Usuk',       material: 'Kayu Kelapa',  unit: 'btg',  required: 45,  available: 45,  icon: Box          },
  { name: 'Pintu Panel',       material: 'Kayu Jati',    unit: 'unit', required: 3,   available: 2,   icon: DoorOpen     },
  { name: 'Rangka Jendela',    material: 'Kayu Meranti', unit: 'unit', required: 6,   available: 4,   icon: Box          },
  { name: 'Konektor Baut',     material: 'Galvanis',     unit: 'pcs',  required: 240, available: 240, icon: Box          },
];

// ─── Gantt Data ───────────────────────────────────────────────────────────────
// Timeline: April 1–30, 2026  (30 days, indices 0–29)
// Today: April 9, 2026  → position (9-1)/29 * 100 = 27.59 %

const TOTAL_DAYS = 29; // max index
const TODAY_DAY  = 9;  // April 9
const TODAY_POS  = ((TODAY_DAY - 1) / TOTAL_DAYS) * 100; // ≈ 27.59 %

function pos(day: number) { return ((day - 1) / TOTAL_DAYS) * 100; }
function width(s: number, e: number) { return pos(e) - pos(s); }

const TASKS = [
  {
    id: 't1', name: 'Persiapan Lahan',
    team: 'Tim Survei',
    start: 1, end: 4,
    status: 'done',
    color: '#22c55e',
    trackColor: '#bbf7d0',
  },
  {
    id: 't2', name: 'Pondasi & Leveling',
    team: 'Tim Sipil',
    start: 3, end: 8,
    status: 'done',
    color: '#22c55e',
    trackColor: '#bbf7d0',
  },
  {
    id: 't3', name: 'Pemasangan Rangka Kayu',
    team: 'Tim Struktur',
    start: 7, end: 15,
    status: 'active',
    color: '#3b82f6',
    trackColor: '#bfdbfe',
  },
  {
    id: 't4', name: 'Instalasi Atap',
    team: 'Tim Atap',
    start: 13, end: 20,
    status: 'pending',
    color: '#94a3b8',
    trackColor: '#e2e8f0',
  },
  {
    id: 't5', name: 'Pemasangan Panel Dinding',
    team: 'Tim Finishing',
    start: 17, end: 24,
    status: 'pending',
    color: '#94a3b8',
    trackColor: '#e2e8f0',
  },
  {
    id: 't6', name: 'Finishing & Pengecatan',
    team: 'Tim Finishing',
    start: 21, end: 28,
    status: 'pending',
    color: '#94a3b8',
    trackColor: '#e2e8f0',
  },
  {
    id: 't7', name: 'Inspeksi & Serah Terima',
    team: 'Tim QC',
    start: 27, end: 30,
    status: 'pending',
    color: '#f59e0b',
    trackColor: '#fde68a',
  },
];

const GANTT_MARKERS = [
  { label: '1 Apr', day: 1  },
  { label: '6 Apr', day: 6  },
  { label: '11 Apr', day: 11 },
  { label: '16 Apr', day: 16 },
  { label: '21 Apr', day: 21 },
  { label: '26 Apr', day: 26 },
  { label: '30 Apr', day: 30 },
];

const STATUS_META: Record<string, { label: string; bg: string; text: string }> = {
  done:    { label: 'Selesai',      bg: 'bg-green-100', text: 'text-green-700'  },
  active:  { label: 'Berjalan',     bg: 'bg-blue-100',  text: 'text-blue-700'   },
  pending: { label: 'Menunggu',     bg: 'bg-gray-100',  text: 'text-gray-500'   },
};

// ─── Layer toggle config ──────────────────────────────────────────────────────
const LAYERS_CONFIG = [
  { key: 'structure' as const, label: 'Struktur',  icon: Box,      color: 'text-blue-600',  bg: 'bg-blue-100'  },
  { key: 'roof'      as const, label: 'Atap',       icon: Building2, color: 'text-sky-600',   bg: 'bg-sky-100'   },
  { key: 'openings'  as const, label: 'Bukaan',     icon: DoorOpen, color: 'text-amber-600', bg: 'bg-amber-100' },
];

// ─── Main Page ────────────────────────────────────────────────────────────────
export function KonstruksiBIMPage() {
  const [layers, setLayers] = useState({ structure: true, roof: true, openings: true });

  const toggleLayer = (key: keyof typeof layers) =>
    setLayers(prev => ({ ...prev, [key]: !prev[key] }));

  const qtoFilled = QTO_ITEMS.filter(i => i.available >= i.required).length;
  const qtoShort  = QTO_ITEMS.length - qtoFilled;
  const totalRequired  = QTO_ITEMS.reduce((s, i) => s + i.required, 0);
  const totalAvailable = QTO_ITEMS.reduce((s, i) => s + i.available, 0);
  const overallPct = Math.round((totalAvailable / totalRequired) * 100);

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen">

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4 mb-7">
        <div>
          <div className="flex items-center gap-2 text-xs text-blue-600 font-medium mb-1.5">
            <Building2 className="w-3.5 h-3.5" />
            <span>Konstruksi & BIM</span>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">
            Manajemen Konstruksi & BIM
          </h1>
          <p className="text-gray-500 text-sm">Visualisasi 3D, QTO, dan Penjadwalan Huntara</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
            <div className="relative flex-shrink-0">
              <div className="w-2.5 h-2.5 bg-green-500 rounded-full" />
              <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-75" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-800 leading-none mb-0.5">Revit Sync</p>
              <p className="text-xs text-gray-500 font-mono">v2025.1.2 · Online</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
            <Cpu className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-gray-800 leading-none mb-0.5">IFC Model</p>
              <p className="text-xs text-blue-600 font-mono">Type A · 6×4×3m</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick stats ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Material Tersedia', value: `${overallPct}%`,   sub: `${totalAvailable}/${totalRequired} item`,  icon: Package,     color: overallPct === 100 ? 'text-green-600' : 'text-amber-600', bg: 'bg-green-50' },
          { label: 'Unit Siap Bangun',  value: '3 Unit',            sub: 'Modul Tipe A terkonfirmasi',               icon: Building2,   color: 'text-blue-600',                                           bg: 'bg-blue-50'  },
          { label: 'Progres Jadwal',    value: '27.6%',             sub: 'Hari ke-9 dari 30 hari',                   icon: TrendingUp,  color: 'text-blue-600',                                           bg: 'bg-blue-50'  },
          { label: 'Deadline Proyek',   value: '30 Apr',            sub: '21 hari tersisa',                          icon: Clock,       color: 'text-gray-600',                                           bg: 'bg-gray-50'  },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-4">
            <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900 leading-none">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{stat.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main grid: BIM Viewer (2/3) + QTO (1/3) ──────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-5 mb-5">

        {/* BIM 3D Viewer */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Box className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900 text-sm">BIM 3D Viewer (Integrasi Revit)</h2>
                <p className="text-xs text-gray-500">Huntara Type A · IFC 2x3 · Drag untuk rotasi</p>
              </div>
            </div>

            {/* Layer toggles */}
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-gray-400 mr-1 flex-shrink-0" />
              {LAYERS_CONFIG.map(({ key, label, icon: Icon, color, bg }) => (
                <button
                  key={key}
                  onClick={() => toggleLayer(key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    layers[key]
                      ? `${bg} ${color} border-transparent`
                      : 'bg-white text-gray-400 border-gray-200'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Canvas container */}
          <div className="relative" style={{ height: 440 }}>
            <BIMViewer layers={layers} />
          </div>

          {/* Footer */}
          <div className="px-5 py-2.5 border-t border-gray-100 bg-gray-50/60 flex items-center justify-between">
            <span className="text-xs text-gray-400 font-mono">
              rotasi mouse · scroll zoom · BIM Level of Detail: LOD 300
            </span>
            <div className="flex items-center gap-3">
              {LAYERS_CONFIG.map(({ key, label, color }) => (
                layers[key] && (
                  <span key={key} className={`text-xs font-medium flex items-center gap-1 ${color}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {label}
                  </span>
                )
              ))}
            </div>
          </div>
        </div>

        {/* QTO Panel */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900 text-sm">Automated QTO</h2>
                <p className="text-xs text-gray-500">Kebutuhan Material (Bill of Quantities)</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {qtoShort > 0 && (
                <span className="flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1">
                  <AlertTriangle className="w-3 h-3" />
                  {qtoShort} kurang
                </span>
              )}
            </div>
          </div>

          {/* Overall progress bar */}
          <div className="px-5 py-3 border-b border-gray-50 bg-gray-50/40">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-gray-600">Material Tersedia</span>
              <span className={`text-xs font-bold ${overallPct === 100 ? 'text-green-600' : 'text-amber-600'}`}>
                {overallPct}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${overallPct === 100 ? 'bg-green-500' : 'bg-amber-500'}`}
                style={{ width: `${overallPct}%` }}
              />
            </div>
          </div>

          {/* Item list */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-50" style={{ maxHeight: 340 }}>
            {QTO_ITEMS.map(item => {
              const pct = Math.min(100, Math.round((item.available / item.required) * 100));
              const ok  = item.available >= item.required;
              return (
                <div key={item.name} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50/80 transition-colors">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${ok ? 'bg-green-50' : 'bg-amber-50'}`}>
                    {ok
                      ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                      : <AlertTriangle className="w-4 h-4 text-amber-600" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-gray-800 truncate">{item.name}</span>
                      <span className={`text-xs font-mono ml-2 flex-shrink-0 ${ok ? 'text-green-700' : 'text-amber-700'}`}>
                        {item.available}/{item.required} {item.unit}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${ok ? 'bg-green-500' : 'bg-amber-400'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 flex-shrink-0">{item.material}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Download BoQ */}
          <div className="px-5 py-3.5 border-t border-gray-100 bg-gray-50/60">
            <button className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow-md hover:shadow-blue-200">
              <Download className="w-4 h-4" />
              Download BoQ (Excel)
            </button>
            <p className="text-center text-xs text-gray-400 mt-2">
              {QTO_ITEMS.length} komponen · diperbarui otomatis dari BIM
            </p>
          </div>
        </div>
      </div>

      {/* ── Gantt Chart ───────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 text-sm">Jadwal Konstruksi (Scheduling)</h2>
              <p className="text-xs text-gray-500">April 2026 · Huntara Type A · Deadline: 30 April 2026</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {[
              { label: 'Selesai',   color: 'bg-green-500' },
              { label: 'Berjalan',  color: 'bg-blue-500'  },
              { label: 'Menunggu', color: 'bg-gray-300'  },
              { label: 'Kritis',   color: 'bg-amber-400' },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-sm ${l.color}`} />
                <span className="text-xs text-gray-500">{l.label}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5 border-l border-gray-200 pl-4">
              <div className="w-px h-4 bg-red-500" />
              <span className="text-xs text-red-600 font-medium">Hari ini (9 Apr)</span>
            </div>
          </div>
        </div>

        <div className="px-6 py-4">
          {/* Header row with date markers */}
          <div className="flex mb-3">
            <div className="flex-shrink-0 w-52" />
            <div className="flex-1 relative h-6">
              {GANTT_MARKERS.map(({ label: lbl, day }) => (
                <div
                  key={day}
                  className="absolute top-0 flex flex-col items-center"
                  style={{ left: `${pos(day)}%`, transform: 'translateX(-50%)' }}
                >
                  <span className="text-xs text-gray-400 font-mono whitespace-nowrap">{lbl}</span>
                  <div className="w-px h-2 bg-gray-200 mt-0.5" />
                </div>
              ))}
            </div>
          </div>

          {/* Task rows */}
          <div className="space-y-2.5">
            {TASKS.map(task => {
              const meta = STATUS_META[task.status];
              const left  = pos(task.start);
              const w     = width(task.start, task.end);
              return (
                <div key={task.id} className="flex items-center gap-0 group">
                  {/* Task label */}
                  <div className="flex-shrink-0 w-52 pr-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-gray-800 leading-tight">{task.name}</p>
                      <p className="text-xs text-gray-400">{task.team}</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  {/* Bar track */}
                  <div className="flex-1 relative h-9 bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
                    {/* Vertical grid lines */}
                    {GANTT_MARKERS.map(({ day }) => (
                      <div
                        key={day}
                        className="absolute top-0 bottom-0 w-px bg-gray-200/80"
                        style={{ left: `${pos(day)}%` }}
                      />
                    ))}

                    {/* Today line */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20"
                      style={{ left: `${TODAY_POS}%` }}
                    >
                      <div className="absolute -top-0.5 -left-1.5 w-3 h-3 bg-red-500 rotate-45 rounded-sm" />
                    </div>

                    {/* Task bar */}
                    <div
                      className="absolute top-1.5 bottom-1.5 rounded-md flex items-center px-2 z-10 transition-all duration-300"
                      style={{
                        left: `${left}%`,
                        width: `${w}%`,
                        backgroundColor: task.color,
                        opacity: task.status === 'pending' ? 0.6 : 1,
                      }}
                    >
                      <span className="text-white text-xs font-semibold truncate drop-shadow-sm">
                        {w > 12 ? `${task.start}–${task.end} Apr` : ''}
                      </span>
                    </div>
                  </div>

                  {/* Status badge */}
                  <div className="flex-shrink-0 w-24 pl-3">
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${meta.bg} ${meta.text}`}>
                      {task.status === 'done'   && <CheckCircle2 className="w-3 h-3" />}
                      {task.status === 'active' && <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />}
                      {meta.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Gantt footer */}
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-400">
              Durasi proyek: 30 hari · <span className="text-green-600 font-medium">2 fase selesai</span> · <span className="text-blue-600 font-medium">1 fase berjalan</span> · <span className="text-gray-500">4 fase tertunda</span>
            </span>
            <span className="text-xs text-gray-400 font-mono">
              Sisa waktu: <span className="font-semibold text-gray-600">21 hari</span>
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}
