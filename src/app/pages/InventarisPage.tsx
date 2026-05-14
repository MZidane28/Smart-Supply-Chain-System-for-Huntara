import { useState, useMemo, useRef } from 'react';
import {
  ShieldCheck, Database, Search, Upload, X, CheckCircle2,
  Clock, Layers, Hash, ChevronDown, FileImage, Lock,
  RefreshCw, Activity, Cpu, Link2, AlertCircle,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface LedgerEntry {
  id: string;
  timestamp: string;
  hash: string;
  jenis: string;
  dimensi: string;
  status: 'Verified' | 'Pending';
}

// ─── Constants ────────────────────────────────────────────────────────────────
const JENIS_OPTIONS = ['Jati', 'Meranti', 'Kelapa', 'Pinus', 'Akasia', 'Mahoni', 'Merbau', 'Sonokeling'];

const INITIAL_LEDGER: LedgerEntry[] = [
  { id: 'TXN-012', timestamp: '07 Apr 2026, 10:23:41', hash: '0x7F9a3E2c1B8f5D4A6e9C0b3f', jenis: 'Kayu Jati',      dimensi: 'Ø 45cm × 3.2m', status: 'Verified' },
  { id: 'TXN-011', timestamp: '07 Apr 2026, 09:47:18', hash: '0x2D1b8F5a0C3e7B9f4A2d1E8c', jenis: 'Kayu Meranti',   dimensi: 'Ø 38cm × 2.8m', status: 'Verified' },
  { id: 'TXN-010', timestamp: '07 Apr 2026, 08:31:55', hash: '0xA4c9E7f2B1d8C3h5J6k0L9m2', jenis: 'Kayu Mahoni',    dimensi: 'Ø 52cm × 4.0m', status: 'Verified' },
  { id: 'TXN-009', timestamp: '07 Apr 2026, 07:15:22', hash: '0xF3d7A9e5C2b4H8j1K6l0M5n7', jenis: 'Kayu Pinus',     dimensi: 'Ø 29cm × 2.2m', status: 'Verified' },
  { id: 'TXN-008', timestamp: '06 Apr 2026, 16:44:09', hash: '0xB8e2F4a7D5c9G1h3J0k8L6m4', jenis: 'Kayu Akasia',    dimensi: 'Ø 41cm × 3.5m', status: 'Verified' },
  { id: 'TXN-007', timestamp: '06 Apr 2026, 14:22:37', hash: '0x9C5f7B3e8A1d6H2j4K7l5M8n', jenis: 'Kayu Jati',      dimensi: 'Ø 48cm × 3.8m', status: 'Verified' },
  { id: 'TXN-006', timestamp: '06 Apr 2026, 11:08:14', hash: '0xE1c3G7b5F9a2D4h6J8k0L1m3', jenis: 'Kayu Kelapa',    dimensi: 'Ø 33cm × 2.5m', status: 'Verified' },
  { id: 'TXN-005', timestamp: '05 Apr 2026, 15:33:50', hash: '0x4A8d2E6f9B3c7H5j1K9l3M7n', jenis: 'Kayu Meranti',   dimensi: 'Ø 55cm × 4.5m', status: 'Verified' },
  { id: 'TXN-004', timestamp: '05 Apr 2026, 13:17:28', hash: '0x6F2a9C8e1B4d5H7j3K0l8M2n', jenis: 'Kayu Merbau',    dimensi: 'Ø 60cm × 5.0m', status: 'Verified' },
  { id: 'TXN-003', timestamp: '05 Apr 2026, 09:52:41', hash: '0x1B5f8D4a3E7c6H9j2K4l0M6n', jenis: 'Kayu Pinus',     dimensi: 'Ø 36cm × 2.6m', status: 'Verified' },
  { id: 'TXN-002', timestamp: '04 Apr 2026, 17:28:15', hash: '0x3D9e6F1b8A5c4H0j7K3l9M5n', jenis: 'Kayu Akasia',    dimensi: 'Ø 43cm × 3.7m', status: 'Verified' },
  { id: 'TXN-001', timestamp: '04 Apr 2026, 11:05:33', hash: '0x8E7d4G9f3B2a5H1j6K8l4M0n', jenis: 'Kayu Jati',      dimensi: 'Ø 50cm × 4.2m', status: 'Verified' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function generateTxHash(): string {
  const chars = '0123456789ABCDEFabcdef';
  let h = '0x';
  for (let i = 0; i < 24; i++) h += chars[Math.floor(Math.random() * chars.length)];
  return h;
}

function truncateHash(hash: string): string {
  if (hash.length <= 14) return hash;
  return `${hash.slice(0, 10)}...${hash.slice(-6)}`;
}

function formatNow(): string {
  const d = new Date();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
  const day = String(d.getDate()).padStart(2, '0');
  const mon = months[d.getMonth()];
  const yr  = d.getFullYear();
  const time = d.toTimeString().slice(0, 8);
  return `${day} ${mon} ${yr}, ${time}`;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function InventarisPage() {
  // Form state
  const [jenis, setJenis]         = useState('');
  const [diameter, setDiameter]   = useState('');
  const [panjang, setPanjang]     = useState('');
  const [file, setFile]           = useState<File | null>(null);
  const [isDragOver, setDragOver] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const [submitDone, setSubmitDone]   = useState(false);
  const [formError, setFormError]     = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Ledger state
  const [ledger, setLedger]       = useState<LedgerEntry[]>(INITIAL_LEDGER);
  const [search, setSearch]       = useState('');
  const [filterJenis, setFilter]  = useState('Semua');
  const [sortOrder, setSort]      = useState<'terbaru' | 'terlama'>('terbaru');
  const [newId, setNewId]         = useState<string | null>(null);

  const isValid = jenis.trim() && diameter.trim() && panjang.trim();

  // ── Drag & Drop ──────────────────────────────────────────────────────────
  const onDragOver  = (e: React.DragEvent) => { e.preventDefault(); setDragOver(true); };
  const onDragLeave = () => setDragOver(false);
  const onDrop      = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);
  };

  // ── Form submit ──────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!isValid) { setFormError(true); return; }
    setFormError(false);
    setSubmitting(true);

    await new Promise(r => setTimeout(r, 2200));

    const txHash = generateTxHash();
    const entryId = `TXN-${String(ledger.length + 1).padStart(3, '0')}`;
    const newEntry: LedgerEntry = {
      id: entryId,
      timestamp: formatNow(),
      hash: txHash,
      jenis: `Kayu ${jenis}`,
      dimensi: `Ø ${diameter}cm × ${panjang}m`,
      status: 'Verified',
    };

    setLedger(prev => [newEntry, ...prev]);
    setNewId(entryId);
    setSubmitting(false);
    setSubmitDone(true);
    setJenis(''); setDiameter(''); setPanjang(''); setFile(null);

    setTimeout(() => { setSubmitDone(false); setNewId(null); }, 4000);
  };

  // ── Filtered & sorted data ───────────────────────────────────────────────
  const displayed = useMemo(() => {
    let data = [...ledger];
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(e =>
        e.jenis.toLowerCase().includes(q) ||
        e.hash.toLowerCase().includes(q) ||
        e.id.toLowerCase().includes(q)
      );
    }
    if (filterJenis !== 'Semua') {
      data = data.filter(e => e.jenis === `Kayu ${filterJenis}`);
    }
    if (sortOrder === 'terlama') data.reverse();
    return data;
  }, [ledger, search, filterJenis, sortOrder]);

  const verifiedCount = ledger.filter(e => e.status === 'Verified').length;
  const uniqueJenis   = new Set(ledger.map(e => e.jenis)).size;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen">

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4 mb-7">
        <div>
          <div className="flex items-center gap-2 text-xs text-blue-600 font-medium mb-1.5">
            <Database className="w-3.5 h-3.5" />
            <span>Inventaris Material</span>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">
            Inventaris Kayu
          </h1>
          <p className="text-gray-500 text-sm">Pencatatan inventaris kayu yang diamankan dan diverifikasi secara otomatis menggunakan teknologi blockchain</p>
        </div>

        {/* Network status badge */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2.5 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
            <div className="relative flex-shrink-0">
              <div className="w-2.5 h-2.5 bg-green-500 rounded-full" />
              <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-75" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-800 leading-none mb-0.5">Jaringan Aktif</p>
              <p className="text-xs text-gray-500 font-mono">Block #4,832,419</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
            <Cpu className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-gray-800 leading-none mb-0.5">Konsensus</p>
              <p className="text-xs text-blue-600 font-mono">PoA Active</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Two-column layout ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-[2fr_3fr] gap-4 lg:gap-6 items-start">

        {/* ══ LEFT: Input Form ══════════════════════════════════════════════ */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Card header */}
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-600 to-blue-700">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-white text-sm">Input Data Kayu Hasil Survei</h2>
                <p className="text-blue-200 text-xs mt-0.5">Isi formulir lalu submit ke sistem blockchain</p>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-8 lg:p-12 space-y-6 sm:space-y-8 lg:space-y-10">

            {/* Jenis Kayu */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                Jenis Kayu <span className="text-red-400 normal-case">*</span>
              </label>
              <div className="relative">
                <select
                  value={jenis}
                  onChange={e => { setJenis(e.target.value); setFormError(false); }}
                  className={`w-full px-4 py-2.5 border rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-gray-800 transition-colors ${
                    formError && !jenis ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  }`}
                >
                  <option value="">— Pilih jenis kayu —</option>
                  {JENIS_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Diameter & Panjang */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                  Diameter (cm) <span className="text-red-400 normal-case">*</span>
                </label>
                <input
                  type="number"
                  value={diameter}
                  onChange={e => { setDiameter(e.target.value); setFormError(false); }}
                  placeholder="cth. 45"
                  min={1}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-colors ${
                    formError && !diameter ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  }`}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                  Panjang (m) <span className="text-red-400 normal-case">*</span>
                </label>
                <input
                  type="number"
                  value={panjang}
                  onChange={e => { setPanjang(e.target.value); setFormError(false); }}
                  placeholder="cth. 3.2"
                  step={0.1}
                  min={0.1}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-colors ${
                    formError && !panjang ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  }`}
                />
              </div>
            </div>

            {/* Volume preview */}
            {diameter && panjang && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 flex items-center justify-between">
                <span className="text-xs text-blue-700 font-medium">Estimasi Volume</span>
                <span className="text-sm font-semibold text-blue-800 font-mono">
                  {(Math.PI * Math.pow(parseFloat(diameter) / 200, 2) * parseFloat(panjang)).toFixed(3)} m³
                </span>
              </div>
            )}

            {/* File upload */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                Foto Material & Kondisi
              </label>
              <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200 ${
                  isDragOver
                    ? 'border-blue-500 bg-blue-50 scale-[0.99]'
                    : file
                    ? 'border-green-400 bg-green-50/60'
                    : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50/30'
                }`}
              >
                {file ? (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileImage className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB · Siap diupload</p>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); setFile(null); }}
                      className="flex-shrink-0 w-6 h-6 rounded-full hover:bg-red-100 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className={`w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center ${isDragOver ? 'bg-blue-100' : 'bg-gray-100'}`}>
                      <Upload className={`w-5 h-5 ${isDragOver ? 'text-blue-600' : 'text-gray-400'}`} />
                    </div>
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold text-blue-600">Klik untuk upload</span> atau seret file ke sini
                    </p>
                    <p className="text-xs text-gray-400 mt-1">PNG, JPG, HEIC hingga 10 MB</p>
                  </>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*"
                onChange={e => e.target.files?.[0] && setFile(e.target.files[0])}
                className="hidden"
              />
            </div>

            {/* Form error */}
            {formError && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <p className="text-xs font-medium">Harap isi semua kolom yang wajib sebelum melanjutkan.</p>
              </div>
            )}

            {/* Submit button */}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`w-full flex items-center justify-center gap-2.5 py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-300 shadow-sm ${
                isSubmitting
                  ? 'bg-blue-400 text-white cursor-not-allowed'
                  : submitDone
                  ? 'bg-green-500 text-white shadow-green-200 shadow-md'
                  : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-md hover:shadow-blue-200'
              }`}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Mengenkripsi & mencatat ke jaringan...
                </>
              ) : submitDone ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Berhasil Dicatat ke Inventaris!
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Submit
                </>
              )}
            </button>

            {/* Info note */}
            <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1">
              <Link2 className="w-3 h-3" />
              Data yang tersimpan bersifat permanen dan tidak dapat diubah
            </p>
          </div>
        </div>

        {/* ══ RIGHT: Ledger Table ════════════════════════════════════════════ */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Card header */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Layers className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900 text-sm">Riwayat Material (Real-time Ledger)</h2>
                <p className="text-xs text-gray-500">{ledger.length} entri terenkripsi · Immutable</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-green-600">
              <Activity className="w-3.5 h-3.5" />
              <span>Live</span>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 sm:divide-x divide-gray-100 border-b border-gray-100">
            <div className="px-6 py-3.5 text-center">
              <p className="text-xl font-bold text-gray-900">{ledger.length}</p>
              <p className="text-xs text-gray-500 mt-0.5">Total Entri</p>
            </div>
            <div className="px-6 py-3.5 text-center">
              <p className="text-xl font-bold text-green-600">{verifiedCount}</p>
              <p className="text-xs text-gray-500 mt-0.5">Terverifikasi</p>
            </div>
            <div className="px-6 py-3.5 text-center">
              <p className="text-xl font-bold text-blue-600">{uniqueJenis}</p>
              <p className="text-xs text-gray-500 mt-0.5">Jenis Kayu</p>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="px-5 py-3 border-b border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Cari jenis kayu, hash, atau ID transaksi..."
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter by jenis */}
            <div className="relative flex-shrink-0">
              <select
                value={filterJenis}
                onChange={e => setFilter(e.target.value)}
                className="pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-xs appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="Semua">Semua Jenis</option>
                {JENIS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>

            {/* Sort */}
            <div className="relative flex-shrink-0">
              <select
                value={sortOrder}
                onChange={e => setSort(e.target.value as 'terbaru' | 'terlama')}
                className="pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-xs appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="terbaru">Terbaru</option>
                <option value="terlama">Terlama</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto" style={{ maxHeight: '440px', overflowY: 'auto' }}>
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="text-left px-5 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <Clock className="w-3.5 h-3.5" />
                      Timestamp
                    </div>
                  </th>
                  <th className="text-left px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <Hash className="w-3.5 h-3.5" />
                      Hash / Tx ID
                    </div>
                  </th>
                  <th className="text-left px-4 py-3 whitespace-nowrap">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Jenis Kayu</span>
                  </th>
                  <th className="text-left px-4 py-3 whitespace-nowrap">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Dimensi</span>
                  </th>
                  <th className="text-left px-4 py-3 whitespace-nowrap">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {displayed.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center">
                      <Database className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">Tidak ada entri yang cocok dengan filter.</p>
                    </td>
                  </tr>
                ) : (
                  displayed.map((entry, idx) => {
                    const isNew = entry.id === newId;
                    return (
                      <tr
                        key={entry.id}
                        className={`transition-colors duration-500 ${
                          isNew
                            ? 'bg-blue-50'
                            : idx % 2 === 0
                            ? 'bg-white hover:bg-gray-50/80'
                            : 'bg-gray-50/40 hover:bg-gray-50/80'
                        }`}
                      >
                        {/* Timestamp */}
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            {isNew && (
                              <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0" />
                            )}
                            <span className="text-xs text-gray-600 font-mono whitespace-nowrap">{entry.timestamp}</span>
                          </div>
                        </td>

                        {/* Hash */}
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-md whitespace-nowrap">
                            {truncateHash(entry.hash)}
                          </span>
                        </td>

                        {/* Jenis */}
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-800 font-medium">{entry.jenis}</span>
                        </td>

                        {/* Dimensi */}
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs text-gray-700 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-md whitespace-nowrap">
                            {entry.dimensi}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-full px-3 py-1 whitespace-nowrap">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Verified
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table footer */}
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/60">
            <span className="text-xs text-gray-500">
              Menampilkan <span className="font-semibold text-gray-700">{displayed.length}</span> dari{' '}
              <span className="font-semibold text-gray-700">{ledger.length}</span> entri
            </span>
            <span className="text-xs text-gray-400 font-mono">
              Tx terbaru: {truncateHash(ledger[0]?.hash ?? '—')}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
