import { useState, useCallback } from 'react';
import { Card } from '../components/ui/card';
import { MapPin, Navigation, Truck, Activity, Radar, CheckCircle, XCircle, Lock, AlertTriangle, Route, Eye, EyeOff } from 'lucide-react';
import { LogisticsRouteMap, ROUTE_POINTS, type UAVMaterialSpot, type UAVRouteSurvey } from '../components/LogisticsRouteMap';
import type { LogisticsRouteData } from '../components/LogisticsRouteMap';
import type { LatLngTuple } from 'leaflet';

const FLEET_STATUS = [
  { id: 'TRK-02', name: 'Truk Logistik 02', status: 'Dalam Perjalanan', eta: '18 menit', payload: 'Kayu 6.5 ton' },
  { id: 'TRK-05', name: 'Truk Logistik 05', status: 'Memuat Material', eta: '27 menit', payload: 'Panel huntara' },
  { id: 'VAN-01', name: 'Van Survei 01', status: 'Siaga di Bengkel', eta: 'Siaga', payload: 'Peralatan UAV' },
];

// Feeder route metadata — polylines will be fetched from OSRM at scan time
// UAV departs from Huntara, surveys outward along real roads to each material spot
const UAV_ROUTE_BASES: (Omit<UAVRouteSurvey, 'polyline' | 'status'> & { spotPosition: LatLngTuple })[] = [
  {
    id: 'R-001',
    spotPosition: [4.3050, 98.0700] as LatLngTuple,
    condition: 'passable',
    estimatedWidth: 4.5,
    maxPayload: 8,
    detectedAt: '14 Mei 2026, 08:32',
  },
  {
    id: 'R-002',
    spotPosition: [4.2580, 98.0850] as LatLngTuple,
    condition: 'passable',
    estimatedWidth: 3.8,
    maxPayload: 6,
    detectedAt: '14 Mei 2026, 08:45',
  },
  {
    id: 'R-003',
    spotPosition: [4.2550, 98.1280] as LatLngTuple,
    condition: 'blocked',
    estimatedWidth: 2.1,
    maxPayload: 0,
    detectedAt: '14 Mei 2026, 08:51',
  },
];

const MOCK_UAV_SPOTS: UAVMaterialSpot[] = [
  {
    id: 'S-001',
    position: [4.3050, 98.0700] as LatLngTuple,
    estimatedVolume: 42,
    woodType: 'Meranti',
    status: 'unverified',
    detectedAt: '14 Mei 2026, 08:35',
  },
  {
    id: 'S-002',
    position: [4.2580, 98.0850] as LatLngTuple,
    estimatedVolume: 28,
    woodType: 'Jati',
    status: 'unverified',
    detectedAt: '14 Mei 2026, 08:48',
  },
  {
    id: 'S-003',
    position: [4.2550, 98.1280] as LatLngTuple,
    estimatedVolume: 19,
    woodType: 'Kelapa',
    status: 'unverified',
    detectedAt: '14 Mei 2026, 08:55',
  },
];

export function LogistikPemetaanPage() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanDone, setScanDone] = useState(false);
  const [uavRoutes, setUavRoutes] = useState<UAVRouteSurvey[]>([]);
  const [uavSpots, setUavSpots] = useState<UAVMaterialSpot[]>([]);
  const [routeData, setRouteData] = useState<LogisticsRouteData | null>(null);
  const [selectedOrigin, setSelectedOrigin] = useState('reruntuhan');
  const [selectedDest, setSelectedDest] = useState('lokasi');
  const [showMainRoute, setShowMainRoute] = useState(false);

  const hasApprovedRoute = uavRoutes.some(r => r.status === 'approved');

  const handleSimulateScan = async () => {
    setIsScanning(true);
    setScanDone(false);
    const huntara = ROUTE_POINTS[2].position;

    const fetchedRoutes = await Promise.all(
      UAV_ROUTE_BASES.map(async (base) => {
        const origin = `${huntara[1]},${huntara[0]}`;
        const dest = `${base.spotPosition[1]},${base.spotPosition[0]}`;
        const useAlternatives = base.condition === 'blocked';
        const url = `https://router.project-osrm.org/route/v1/driving/${origin};${dest}?overview=full&geometries=geojson${useAlternatives ? '&alternatives=true' : ''}`;
        try {
          const res = await fetch(url);
          const data = await res.json() as { routes: Array<{ geometry: { coordinates: number[][] } }> };
          const polyline: LatLngTuple[] = data.routes[0].geometry.coordinates.map(
            ([lon, lat]: number[]) => [lat, lon] as LatLngTuple
          );
          // For blocked routes, pick the 2nd route returned as the alternative.
          // If OSRM only returns one, offset a via-point slightly to force a detour.
          let alternativePolyline: LatLngTuple[] | undefined;
          if (useAlternatives) {
            if (data.routes.length >= 2) {
              alternativePolyline = data.routes[1].geometry.coordinates.map(
                ([lon, lat]: number[]) => [lat, lon] as LatLngTuple
              );
            } else {
              // Force a detour via an offset waypoint between origin and destination
              const midLat = (huntara[0] + base.spotPosition[0]) / 2 + 0.008;
              const midLon = (huntara[1] + base.spotPosition[1]) / 2 - 0.006;
              const altUrl = `https://router.project-osrm.org/route/v1/driving/${origin};${midLon},${midLat};${dest}?overview=full&geometries=geojson`;
              const altRes = await fetch(altUrl);
              const altData = await altRes.json() as { routes: Array<{ geometry: { coordinates: number[][] } }> };
              alternativePolyline = altData.routes[0].geometry.coordinates.map(
                ([lon, lat]: number[]) => [lat, lon] as LatLngTuple
              );
            }
          }
          const { spotPosition: _, ...rest } = base;
          return { ...rest, polyline, alternativePolyline, status: 'unverified' as const };
        } catch {
          const { spotPosition, ...rest } = base;
          return { ...rest, polyline: [huntara, spotPosition] as LatLngTuple[], status: 'unverified' as const };
        }
      })
    );

    setUavRoutes(fetchedRoutes);
    setUavSpots(MOCK_UAV_SPOTS);
    setIsScanning(false);
    setScanDone(true);
  };

  const handleRouteAction = (id: string, action: 'approved' | 'rejected') => {
    setUavRoutes(prev => prev.map(r => r.id === id ? { ...r, status: action } : r));
  };

  const handleSpotAction = (id: string, action: 'approved' | 'rejected') => {
    if (action === 'approved' && !hasApprovedRoute) return;
    setUavSpots(prev => prev.map(s => s.id === id ? { ...s, status: action } : s));
  };

  const handleRouteDataChange = useCallback((data: LogisticsRouteData) => {
    setRouteData(data);
  }, []);

  const pendingRoutes = uavRoutes.filter(r => r.status === 'unverified');
  const pendingSpots = uavSpots.filter(s => s.status === 'unverified');

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs text-blue-600 font-medium mb-2">
          <MapPin className="w-3.5 h-3.5" />
          <span>Logistik & Pemetaan</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-1">Pemetaan GIS & Survei UAV</h1>
            <p className="text-gray-500 text-sm">Optimasi rute logistik dan pemantauan udara</p>
          </div>
          <button
            onClick={handleSimulateScan}
            disabled={isScanning}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Radar className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
            {isScanning ? 'Mensimulasikan Scan UAV...' : 'Simulasi Scan UAV'}
          </button>
        </div>

        {scanDone && (pendingRoutes.length > 0 || pendingSpots.length > 0) && (
          <div className="mt-3 flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>UAV mendeteksi <strong>{uavRoutes.length} rute</strong> dan <strong>{uavSpots.length} material spot</strong> baru. Tinjau dan setujui di panel di bawah.</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[7fr_3fr] gap-4 lg:gap-6 items-start">
        {/* Left column: Map + Route Summary + Fleet */}
        <div className="flex flex-col gap-4 lg:gap-6">
        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Interactive Map Logistik</h3>
              <p className="text-xs text-gray-500">AI Optimized Route</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-blue-700 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
              <Navigation className="w-3.5 h-3.5" />
              AI Optimized Route
            </div>
          </div>

          {/* Map Legend + Route Controls */}
          {scanDone && (
            <div className="flex flex-wrap gap-3 mb-2 text-xs text-gray-600">
              <span className="flex items-center gap-1.5"><span className="inline-block w-6 border-t-2 border-dashed border-orange-500"></span>Rute UAV (Belum Diverifikasi)</span>
              <span className="flex items-center gap-1.5"><span className="inline-block w-6 border-t-2 border-green-600"></span>Rute UAV (Disetujui)</span>
              <span className="flex items-center gap-1.5"><span className="inline-block w-6 border-t-2 border-red-600"></span>Rute Terblokir</span>
              <span className="flex items-center gap-1.5"><span className="inline-block w-6 border-t-2 border-dashed border-purple-600"></span>Rute Alternatif</span>
              <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-full bg-yellow-400 opacity-70"></span>Material Spot (Belum Diverifikasi)</span>
              <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-full bg-green-600 opacity-70"></span>Material Spot (Disetujui)</span>
            </div>
          )}

          {/* Route Planner */}
          {scanDone && (
            <div className="flex flex-wrap items-center gap-3 mb-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-medium w-14">Dari:</span>
                <div className="flex gap-1.5 flex-wrap">
                  {ROUTE_POINTS.map(point => (
                    <button
                      key={point.id}
                      onClick={() => {
                        if (point.id !== selectedDest) setSelectedOrigin(point.id);
                      }}
                      disabled={point.id === selectedDest}
                      className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                        selectedOrigin === point.id
                          ? 'bg-blue-600 text-white border-blue-600'
                          : point.id === selectedDest
                          ? 'bg-gray-100 text-gray-300 border-gray-100 cursor-not-allowed'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      {point.label.split(' (')[0]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-medium w-14">Tujuan:</span>
                <div className="flex gap-1.5 flex-wrap">
                  {ROUTE_POINTS.map(point => (
                    <button
                      key={point.id}
                      onClick={() => {
                        if (point.id !== selectedOrigin) setSelectedDest(point.id);
                      }}
                      disabled={point.id === selectedOrigin}
                      className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                        selectedDest === point.id
                          ? 'bg-green-600 text-white border-green-600'
                          : point.id === selectedOrigin
                          ? 'bg-gray-100 text-gray-300 border-gray-100 cursor-not-allowed'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-green-300'
                      }`}
                    >
                      {point.label.split(' (')[0]}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setShowMainRoute(v => !v)}
                className={`ml-auto inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                  showMainRoute
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                }`}
              >
                {showMainRoute ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                {showMainRoute ? 'Sembunyikan Rute' : 'Tampilkan Rute'}
              </button>
            </div>
          )}

          <div className="relative h-[360px] sm:h-[460px] xl:h-[580px] rounded-xl overflow-hidden border border-gray-200">
            <LogisticsRouteMap
              className="h-full"
              onRouteDataChange={handleRouteDataChange}
              uavRoutes={uavRoutes}
              uavSpots={uavSpots}
              showMainRoute={showMainRoute}
              activeOriginId={selectedOrigin}
              activeDestinationId={selectedDest}
            />
          </div>
        </Card>

        {/* Route Summary + Fleet below map */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
          {/* Route Summary */}
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Navigation className="w-4 h-4 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Rekomendasi Rute Logistik (AI)</h3>
            </div>
            {routeData?.steps.length ? (
              <div className="space-y-3">
                {routeData.steps.map((step, index) => (
                  <div key={step.from} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-semibold">{index + 1}</div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-800 font-medium">{step.from} → {step.to}</p>
                      <p className="text-xs text-gray-500">{step.time} • {step.distance}</p>
                    </div>
                  </div>
                ))}
                {routeData.summary && (
                  <div className="border-t border-gray-100 pt-3 flex items-center justify-between text-xs text-gray-500">
                    <span>Total estimasi</span>
                    <span className="font-semibold text-gray-800">{routeData.summary.duration} • {routeData.summary.distance}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {[{ from: 'Titik Penumpukan Kayu', to: 'Kilang Kayu', time: '14 menit', distance: '5.1 km' }, { from: 'Kilang Kayu', to: 'Lokasi Huntara', time: '11 menit', distance: '4.0 km' }].map((step, index) => (
                  <div key={step.from} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-semibold">{index + 1}</div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-800 font-medium">{step.from} → {step.to}</p>
                      <p className="text-xs text-gray-500">{step.time} • {step.distance}</p>
                    </div>
                  </div>
                ))}
                <div className="border-t border-gray-100 pt-3 flex items-center justify-between text-xs text-gray-500">
                  <span>Total estimasi</span>
                  <span className="font-semibold text-gray-800">25 menit • 9.1 km</span>
                </div>
              </div>
            )}
          </Card>

          {/* Fleet */}
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Truck className="w-4 h-4 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Armada Aktif</h3>
            </div>
            <div className="space-y-3">
              {FLEET_STATUS.map((unit) => (
                <div key={unit.id} className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{unit.name}</p>
                    <p className="text-xs text-gray-500">{unit.payload}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-blue-600 font-semibold">{unit.status}</p>
                    <p className="text-xs text-gray-500">ETA: {unit.eta}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
        </div>{/* end left column */}

        {/* Right panels */}
        <div className="space-y-4">
          {/* UAV Status */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Status Survei UAV</h3>
              </div>
              <span className={`text-xs px-2 py-1 rounded-md ${isScanning ? 'text-amber-600 bg-amber-50' : 'text-blue-600 bg-blue-50'}`}>
                {isScanning ? 'Scanning...' : 'Live'}
              </span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Area Terpetakan</span>
                <span className="font-semibold text-gray-900">{scanDone ? '100%' : isScanning ? '85%' : '0%'}</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-1000 ${scanDone ? 'bg-green-500' : 'bg-blue-600'}`} style={{ width: scanDone ? '100%' : isScanning ? '85%' : '0%' }} />
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                {scanDone ? (
                  <>
                    <span>Scan selesai</span>
                    <span className="font-medium text-green-600">{uavRoutes.length} rute · {uavSpots.length} spot</span>
                  </>
                ) : isScanning ? (
                  <>
                    <span>Estimasi selesai</span>
                    <span className="font-medium text-gray-700">18 menit lagi</span>
                  </>
                ) : (
                  <>
                    <span>Belum ada scan</span>
                    <span className="font-medium text-gray-400">—</span>
                  </>
                )}
              </div>
            </div>
          </Card>

          {/* Route Approval Panel */}
          {uavRoutes.length > 0 && (
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Route className="w-4 h-4 text-orange-500" />
                <h3 className="font-semibold text-gray-900">Verifikasi Rute UAV</h3>
                {pendingRoutes.length > 0 && (
                  <span className="ml-auto text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">{pendingRoutes.length} pending</span>
                )}
              </div>
              <div className="space-y-3">
                {uavRoutes.map(route => (
                  <div key={route.id} className="border border-gray-100 rounded-lg p-3 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-800">Rute #{route.id}</p>
                        <p className="text-xs text-gray-500">{route.detectedAt}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          route.condition === 'passable' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {route.condition === 'passable' ? 'Dapat Dilalui' : 'Terblokir'}
                        </span>
                        {route.condition === 'blocked' && route.alternativePolyline && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-purple-100 text-purple-700">
                            Ada Rute Alternatif
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-gray-600">Lebar {route.estimatedWidth}m · Maks. {route.maxPayload} ton</p>
                    {route.condition === 'blocked' && route.alternativePolyline && route.status === 'unverified' && (
                      <p className="text-xs text-purple-600 bg-purple-50 rounded-md px-2 py-1">
                        Saat disetujui, rute alternatif (ungu) akan otomatis ditampilkan di peta.
                      </p>
                    )}
                    {route.condition === 'blocked' && route.status === 'approved' && route.alternativePolyline && (
                      <p className="text-xs text-purple-600 bg-purple-50 rounded-md px-2 py-1">
                        ✓ Rute alternatif aktif — lihat jalur ungu di peta.
                      </p>
                    )}
                    {route.status === 'unverified' ? (
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => handleRouteAction(route.id, 'approved')}
                          className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 rounded-md bg-green-50 hover:bg-green-100 text-green-700 font-medium transition-colors"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Setujui
                        </button>
                        <button
                          onClick={() => handleRouteAction(route.id, 'rejected')}
                          className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 rounded-md bg-red-50 hover:bg-red-100 text-red-700 font-medium transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Tolak
                        </button>
                      </div>
                    ) : (
                      <p className={`text-xs font-semibold ${route.status === 'approved' ? 'text-green-600' : 'text-red-500'}`}>
                        {route.status === 'approved' ? '✅ Disetujui' : '❌ Ditolak'}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Spot Approval Panel */}
          {uavSpots.length > 0 && (
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4 text-yellow-500" />
                <h3 className="font-semibold text-gray-900">Verifikasi Material Spot</h3>
                {pendingSpots.length > 0 && (
                  <span className="ml-auto text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">{pendingSpots.length} pending</span>
                )}
              </div>
              {!hasApprovedRoute && (
                <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 mb-3">
                  <Lock className="w-3.5 h-3.5 shrink-0" />
                  Setujui minimal 1 rute terlebih dahulu untuk membuka verifikasi spot
                </div>
              )}
              <div className="space-y-3">
                {uavSpots.map(spot => (
                  <div key={spot.id} className={`border rounded-lg p-3 space-y-2 ${!hasApprovedRoute && spot.status === 'unverified' ? 'opacity-50' : ''} border-gray-100`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-800">Spot #{spot.id}</p>
                        <p className="text-xs text-gray-500">{spot.detectedAt}</p>
                      </div>
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">{spot.woodType}</span>
                    </div>
                    <p className="text-xs text-gray-600">Estimasi Volume: <span className="font-semibold">{spot.estimatedVolume} m³</span></p>
                    {spot.status === 'unverified' ? (
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => handleSpotAction(spot.id, 'approved')}
                          disabled={!hasApprovedRoute}
                          className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 rounded-md bg-green-50 hover:bg-green-100 disabled:hover:bg-green-50 text-green-700 font-medium transition-colors disabled:cursor-not-allowed"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Setujui
                        </button>
                        <button
                          onClick={() => handleSpotAction(spot.id, 'rejected')}
                          disabled={!hasApprovedRoute}
                          className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 rounded-md bg-red-50 hover:bg-red-100 disabled:hover:bg-red-50 text-red-700 font-medium transition-colors disabled:cursor-not-allowed"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Tolak
                        </button>
                      </div>
                    ) : (
                      <p className={`text-xs font-semibold ${spot.status === 'approved' ? 'text-green-600' : 'text-red-500'}`}>
                        {spot.status === 'approved' ? '✅ Waypoint Aktif' : '❌ Ditolak'}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}


