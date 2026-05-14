
# Smart Supply Chain System for Huntara

> Dashboard B2B manajemen rantai pasok cerdas untuk proyek konstruksi **Huntara** (Hunian Sementara) — mengintegrasikan pemetaan GIS real-time, survei UAV, verifikasi blockchain, dan optimasi rute berbasis AI.

---

## Tentang Proyek

Sistem ini dirancang untuk mendukung koordinasi logistik material bangunan pasca-bencana secara efisien. Mulai dari pemantauan material di lapangan menggunakan drone, verifikasi stok via blockchain, hingga optimasi rute pengiriman dengan AI — semua tersaji dalam satu dashboard terpadu.

Proyek ini dibuat untuk **Lomba Inovasi Teknologi Universitas Diponegoro (UNDIP)**.

---

## Fitur Utama

### Logistik & Pemetaan GIS
- **Peta interaktif** berbasis Leaflet dengan tile OpenStreetMap
- **Simulasi Scan UAV** — drone memetakan rute & material spot secara otomatis
- **Real-world routing** menggunakan OSRM API (jalan nyata, bukan garis lurus)
- **Alur verifikasi hybrid**: Unverified → Approve/Reject → Waypoint aktif
- **Rute alternatif otomatis** untuk jalur yang terblokir (ditampilkan sebagai garis ungu)
- Pilih titik awal & tujuan rute logistik secara bebas

### Inventaris Blockchain
- Pencatatan stok material berbasis teknologi blockchain
- Tabel transaksi dengan hash verifikasi
- Status immutable untuk setiap perubahan inventaris

### Optimasi AI
- Rekomendasi rute logistik terbaik berdasarkan kondisi lapangan
- Analitik prediktif kebutuhan material

### Konstruksi & BIM
- Integrasi viewer model BIM (Building Information Modeling)
- Pemantauan progres konstruksi Huntara secara visual

---

## Tech Stack

| Kategori | Teknologi |
|---|---|
| Framework | React 18 + TypeScript |
| Build Tool | Vite 6 |
| Styling | Tailwind CSS v4 + Radix UI (shadcn) |
| Routing | React Router v7 |
| Peta | Leaflet 1.9 + React-Leaflet 4.2 |
| Routing API | OSRM (Open Source Routing Machine) |
| Icons | Lucide React |
| Animasi | Motion (Framer Motion) |

---

## Menjalankan Secara Lokal

```bash
# 1. Clone repo
git clone https://github.com/MZidane28/Smart-Supply-Chain-System-for-Huntara.git
cd Smart-Supply-Chain-System-for-Huntara

# 2. Install dependencies
npm install

# 3. Jalankan dev server
npm run dev
```

Buka [http://localhost:5173](http://localhost:5173) di browser.

---

## Build untuk Production

```bash
npm run build
```

Output akan tersimpan di folder `dist/`.

---

## Struktur Proyek

```
src/
├── app/
│   ├── components/        # Komponen reusable (Map, Sidebar, Header, dll)
│   │   └── ui/            # Komponen UI primitif (shadcn)
│   └── pages/             # Halaman utama
│       ├── Home.tsx
│       ├── LogistikPemetaanPage.tsx
│       ├── InventarisPage.tsx
│       ├── OptimisiAIPage.tsx
│       └── KonstruksiBIMPage.tsx
└── styles/                # Global styles & Tailwind config
```

---

## Catatan API

Proyek ini menggunakan **OSRM Public API** (`router.project-osrm.org`) untuk kalkulasi rute jalan nyata. API ini bersifat publik dan tidak memerlukan API key — berfungsi langsung di browser tanpa backend tambahan.

---

## Author

**Muhammad Zidane Septian Irsyadi**
Universitas Diponegoro — Lomba Dashboard Inovasi 2026
  
