import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, Circle } from 'react-leaflet';
import L, { type LatLngTuple } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { cn } from './ui/utils';

export interface UAVMaterialSpot {
  id: string;
  position: LatLngTuple;
  estimatedVolume: number;
  woodType: string;
  status: 'unverified' | 'approved' | 'rejected';
  detectedAt: string;
}

export interface UAVRouteSurvey {
  id: string;
  polyline: LatLngTuple[];
  alternativePolyline?: LatLngTuple[];
  condition: 'passable' | 'blocked';
  estimatedWidth: number;
  maxPayload: number;
  status: 'unverified' | 'approved' | 'rejected';
  detectedAt: string;
}

const DEFAULT_MARKER_ICON = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const HUNTARA_ICON = L.divIcon({
  className: '',
  html: `<div style="
    background: #16a34a;
    border: 3px solid #fff;
    border-radius: 50% 50% 50% 0;
    width: 28px; height: 28px;
    transform: rotate(-45deg);
    box-shadow: 0 2px 8px rgba(0,0,0,0.35);
    display: flex; align-items: center; justify-content: center;
  "><span style="transform: rotate(45deg); font-size: 14px; display: block; text-align: center; line-height: 22px;">🏗️</span></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -30],
});

export const ROUTE_POINTS: Array<{
  id: string;
  label: string;
  position: LatLngTuple;
}> = [
  {
    id: 'reruntuhan',
    label: 'Titik Penumpukan Kayu (Disaster Site)',
    position: [4.2828, 98.0566],
  },
  {
    id: 'kilang',
    label: 'Kilang Kayu (Processing Workshop)',
    position: [4.2952, 98.1021],
  },
  {
    id: 'lokasi',
    label: 'Lokasi Huntara (Construction Site)',
    position: [4.2711, 98.1395],
  },
];

interface OsrmRouteLeg {
  distance: number;
  duration: number;
}

interface OsrmResponse {
  code: string;
  routes: Array<{
    distance: number;
    duration: number;
    geometry: {
      coordinates: number[][];
    };
    legs: OsrmRouteLeg[];
  }>;
}

export interface RouteStep {
  from: string;
  to: string;
  time: string;
  distance: string;
}

export interface LogisticsRouteData {
  steps: RouteStep[];
  summary: { distance: string; duration: string } | null;
}

interface LogisticsRouteMapProps {
  className?: string;
  onRouteDataChange?: (data: LogisticsRouteData) => void;
  uavRoutes?: UAVRouteSurvey[];
  uavSpots?: UAVMaterialSpot[];
  showMainRoute?: boolean;
  activeOriginId?: string;
  activeDestinationId?: string;
}

function formatDistance(distanceMeters: number): string {
  return `${(distanceMeters / 1000).toFixed(1)} km`;
}

function formatDuration(durationSeconds: number): string {
  const minutes = Math.round(durationSeconds / 60);
  return `${minutes} menit`;
}

export function LogisticsRouteMap({ className, onRouteDataChange, uavRoutes = [], uavSpots = [], showMainRoute = true, activeOriginId, activeDestinationId }: LogisticsRouteMapProps) {
  const activePoints = useMemo(() => {
    const originIdx = activeOriginId ? ROUTE_POINTS.findIndex(p => p.id === activeOriginId) : 0;
    const destIdx = activeDestinationId ? ROUTE_POINTS.findIndex(p => p.id === activeDestinationId) : ROUTE_POINTS.length - 1;
    const from = Math.min(originIdx < 0 ? 0 : originIdx, destIdx < 0 ? ROUTE_POINTS.length - 1 : destIdx);
    const to = Math.max(originIdx < 0 ? 0 : originIdx, destIdx < 0 ? ROUTE_POINTS.length - 1 : destIdx);
    return ROUTE_POINTS.slice(from, to + 1);
  }, [activeOriginId, activeDestinationId]);

  const [routePath, setRoutePath] = useState<LatLngTuple[]>(ROUTE_POINTS.map((point) => point.position));
  const [routeLegs, setRouteLegs] = useState<OsrmRouteLeg[]>([]);
  const [routeSummary, setRouteSummary] = useState<{ distance: number; duration: number } | null>(null);
  const [isRouting, setIsRouting] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  useEffect(() => {
    if (!showMainRoute) return;
    const controller = new AbortController();
    const coordinates = activePoints.map((point) => `${point.position[1]},${point.position[0]}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson&steps=true`;

    setIsRouting(true);
    setRouteError(null);

    fetch(url, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Routing request failed (${response.status})`);
        }
        const data = (await response.json()) as OsrmResponse;
        if (data.code !== 'Ok' || !data.routes.length) {
          throw new Error('Routing service did not return a valid route');
        }
        const bestRoute = data.routes[0];
        const mappedPath = bestRoute.geometry.coordinates.map(([lon, lat]) => [lat, lon] as LatLngTuple);
        setRoutePath(mappedPath);
        setRouteLegs(bestRoute.legs);
        setRouteSummary({ distance: bestRoute.distance, duration: bestRoute.duration });
      })
      .catch((error: unknown) => {
        if ((error as { name?: string }).name === 'AbortError') return;
        setRouteError(error instanceof Error ? error.message : 'Unknown routing error');
      })
      .finally(() => {
        setIsRouting(false);
      });

    return () => controller.abort();
  }, [activePoints, showMainRoute]);

  const routeSteps = useMemo(() => {
    if (routeLegs.length !== activePoints.length - 1) return [];
    return routeLegs.map((leg, index) => ({
      from: activePoints[index].label.split(' (')[0],
      to: activePoints[index + 1].label.split(' (')[0],
      time: formatDuration(leg.duration),
      distance: formatDistance(leg.distance),
    }));
  }, [routeLegs, activePoints]);

  const summary = useMemo(() => {
    if (!routeSummary) return null;
    return {
      distance: formatDistance(routeSummary.distance),
      duration: formatDuration(routeSummary.duration),
    };
  }, [routeSummary]);

  useEffect(() => {
    if (!onRouteDataChange) return;
    onRouteDataChange({ steps: routeSteps, summary });
  }, [onRouteDataChange, routeSteps, summary]);

  return (
    <div className={cn('relative h-full w-full rounded-xl overflow-hidden border border-gray-200', className)}>
      <MapContainer
        center={ROUTE_POINTS[0].position}
        zoom={13}
        scrollWheelZoom
        className="h-full w-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {showMainRoute && (<>
        <Polyline
          positions={routePath}
          pathOptions={{ color: '#2563eb', weight: 4, opacity: 0.85 }}
        />

        {activePoints.map((point, index) => (
          <Marker key={point.id} position={point.position} icon={DEFAULT_MARKER_ICON}>
            <Popup>
              <div className="max-w-[220px] space-y-1 text-gray-800">
                <h4 className="text-sm font-bold">{point.label.split(' (')[0]}</h4>
                <p className="text-xs text-gray-500">{point.label.match(/\((.+)\)/)?.[1]}</p>
                <p className="text-xs font-semibold text-blue-600">Titik {index + 1} dari {activePoints.length}</p>
              </div>
            </Popup>
          </Marker>
        ))}
        </>)}

        {/* Permanent Huntara marker — always visible */}
        {(() => {
          const huntara = ROUTE_POINTS.find(p => p.id === 'lokasi')!;
          return (
            <Marker position={huntara.position} icon={HUNTARA_ICON}>
              <Popup>
                <div className="max-w-[220px] space-y-1 text-gray-800">
                  <h4 className="text-sm font-bold">Lokasi Huntara</h4>
                  <p className="text-xs text-gray-500">Construction Site</p>
                  <p className="text-xs font-semibold text-green-700">📍 Titik Tujuan Akhir Logistik</p>
                </div>
              </Popup>
            </Marker>
          );
        })()}

        {/* UAV Route Surveys */}
        {uavRoutes.filter(r => r.status !== 'rejected').map((route) => {
          const approvedColor = route.condition === 'passable' ? '#16a34a' : '#dc2626';
          return (
          <>
          <Polyline
            key={route.id}
            positions={route.polyline}
            pathOptions={{
              color: route.status === 'approved' ? approvedColor : '#f97316',
              weight: 3,
              opacity: 0.9,
              dashArray: route.status === 'unverified' ? '8 6' : undefined,
            }}
          >
            <Popup>
              <div className="max-w-[200px] space-y-1 text-gray-800">
                <h4 className="text-sm font-bold">Rute UAV #{route.id}</h4>
                <p className="text-xs">Kondisi: <span className={route.condition === 'passable' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>{route.condition === 'passable' ? 'Dapat Dilalui' : 'Terblokir'}</span></p>
                <p className="text-xs">Lebar Jalan: {route.estimatedWidth} m</p>
                <p className="text-xs">Maks. Muatan: {route.maxPayload} ton</p>
                <p className="text-xs text-gray-500">Terdeteksi: {route.detectedAt}</p>
                <p className="text-xs font-semibold mt-1">{route.status === 'unverified' ? '⏳ Menunggu Persetujuan' : route.condition === 'passable' ? '✅ Disetujui' : '🔴 Terblokir (Confirmed)'}</p>
              </div>
            </Popup>
          </Polyline>
          {route.condition === 'blocked' && route.status === 'approved' && route.alternativePolyline && (
            <Polyline
              key={`${route.id}-alt`}
              positions={route.alternativePolyline}
              pathOptions={{ color: '#7c3aed', weight: 3, opacity: 0.9, dashArray: '6 4' }}
            >
              <Popup>
                <div className="max-w-[200px] space-y-1 text-gray-800">
                  <h4 className="text-sm font-bold">Rute Alternatif #{route.id}</h4>
                  <p className="text-xs text-purple-700 font-semibold">Jalur pengganti otomatis ditemukan AI</p>
                  <p className="text-xs text-gray-500">Melewati jalan yang tidak terblokir menuju material spot yang sama.</p>
                </div>
              </Popup>
            </Polyline>
          )}
          </>
          );
        })}

        {/* UAV Material Spots */}
        {uavSpots.filter(s => s.status !== 'rejected').map((spot) => {
          const color = spot.status === 'approved' ? '#16a34a' : '#eab308';
          return (
            <Circle
              key={spot.id}
              center={spot.position}
              radius={120}
              pathOptions={{ color, fillColor: color, fillOpacity: 0.35, weight: 2 }}
            >
              <Popup>
                <div className="max-w-[200px] space-y-1 text-gray-800">
                  <h4 className="text-sm font-bold">Material Spot #{spot.id}</h4>
                  <p className="text-xs">Jenis Kayu: <span className="font-semibold">{spot.woodType}</span></p>
                  <p className="text-xs">Estimasi Volume: {spot.estimatedVolume} m³</p>
                  <p className="text-xs text-gray-500">Terdeteksi: {spot.detectedAt}</p>
                  <p className="text-xs font-semibold mt-1">{spot.status === 'unverified' ? '⏳ Menunggu Persetujuan' : '✅ Waypoint Aktif'}</p>
                </div>
              </Popup>
            </Circle>
          );
        })}
      </MapContainer>
    </div>
  );
}
