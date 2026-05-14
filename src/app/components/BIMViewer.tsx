import { useRef, useEffect, useState, useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Maximize2 } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
type Vec3 = [number, number, number];

interface Projected {
  sx: number;
  sy: number;
  depth: number;
}

interface LayerState {
  structure: boolean;
  roof: boolean;
  openings: boolean;
}

// ─── Huntara House Vertices ───────────────────────────────────────────────────
// Coordinate system: x = right, y = up, z = toward viewer
// House: 6m wide (x: -3 to 3), 4m deep (z: -2 to 2), 3m wall height, 4.5m ridge
const VERTS: Vec3[] = [
  // 0-3: Floor corners [FL, FR, BR, BL]
  [-3, 0,  2], [3, 0,  2], [3, 0, -2], [-3, 0, -2],
  // 4-7: Wall tops [FL, FR, BR, BL]
  [-3, 3,  2], [3, 3,  2], [3, 3, -2], [-3, 3, -2],
  // 8-9: Roof ridge [front, back]
  [0, 4.5,  2], [0, 4.5, -2],
  // 10-13: Door [BL, BR, TR, TL] — on front face z=2
  [-0.8, 0, 2], [0.8, 0, 2], [0.8, 2.2, 2], [-0.8, 2.2, 2],
  // 14-17: Front window left
  [-2.5, 1.0, 2], [-1.5, 1.0, 2], [-1.5, 2.0, 2], [-2.5, 2.0, 2],
  // 18-21: Front window right
  [1.5, 1.0, 2], [2.5, 1.0, 2], [2.5, 2.0, 2], [1.5, 2.0, 2],
  // 22-25: Side window — right face x=3
  [3, 1.0, 0.8], [3, 1.0, -0.8], [3, 2.0, -0.8], [3, 2.0, 0.8],
  // 26-31: Intermediate top-plate nodes for rafters
  [-3, 3,  1], [-3, 3, 0], [-3, 3, -1],  // 26-28 left eave
  [ 3, 3,  1], [ 3, 3, 0], [ 3, 3, -1],  // 29-31 right eave
  // 32-34: Ridge intermediate nodes
  [0, 4.5,  1], [0, 4.5, 0], [0, 4.5, -1],
];

interface EdgeGroup {
  layer: keyof LayerState;
  color: string;
  width: number;
  edges: [number, number][];
  dot?: boolean;
}

const EDGE_GROUPS: EdgeGroup[] = [
  {
    layer: 'structure',
    color: '#475569',
    width: 2.5,
    edges: [[0,1],[1,2],[2,3],[3,0]], // foundation slab outline
    dot: false,
  },
  {
    layer: 'structure',
    color: '#2563eb',
    width: 2.2,
    edges: [
      [0,4],[1,5],[2,6],[3,7],  // vertical wall columns
      [4,5],[5,6],[6,7],[7,4],  // top plate ring beam
    ],
    dot: true,
  },
  {
    layer: 'roof',
    color: '#0284c7',
    width: 1.6,
    edges: [
      // Ridge
      [8,32],[32,33],[33,34],[34,9],
      // Left slope rafters
      [4,8],[26,32],[27,33],[28,34],[7,9],
      // Right slope rafters
      [5,8],[29,32],[30,33],[31,34],[6,9],
      // Left eave purlin
      [4,26],[26,27],[27,28],[28,7],
      // Right eave purlin
      [5,29],[29,30],[30,31],[31,6],
    ],
    dot: false,
  },
  {
    layer: 'openings',
    color: '#d97706',
    width: 1.6,
    edges: [
      [10,11],[11,12],[12,13],[13,10],   // door
      [14,15],[15,16],[16,17],[17,14],   // front window left
      [18,19],[19,20],[20,21],[21,18],   // front window right
      [22,23],[23,24],[24,25],[25,22],   // side window
    ],
    dot: false,
  },
];

// Cross-hatch for door fill (visual detail)
const DOOR_CROSS: [number, number][] = [[10,12],[11,13]];
const WIN_CROSSES: [number, number][][] = [
  [[14,16],[15,17]], [[18,20],[19,21]], [[22,24],[23,25]],
];

// ─── Projection ───────────────────────────────────────────────────────────────
function project(v: Vec3, rotY: number, rotX: number, scale: number, cx: number, cy: number): Projected {
  const [vx, vy, vz] = v;
  // Rotate around Y (yaw)
  const x1 = vx * Math.cos(rotY) - vz * Math.sin(rotY);
  const z1 = vx * Math.sin(rotY) + vz * Math.cos(rotY);
  const y1 = vy;
  // Rotate around X (pitch)
  const y2 = y1 * Math.cos(rotX) - z1 * Math.sin(rotX);
  const z2 = y1 * Math.sin(rotX) + z1 * Math.cos(rotX);
  const x2 = x1;
  // Perspective divide
  const cam = 14;
  const f = cam / (cam + z2 + 5);
  return { sx: cx + x2 * scale * f, sy: cy - y2 * scale * f, depth: z2 };
}

// ─── Draw label on canvas ─────────────────────────────────────────────────────
function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color = '#94a3b8') {
  ctx.fillStyle = color;
  ctx.font = '10px "Courier New", monospace';
  ctx.fillText(text, x, y);
}

// ─── Component ────────────────────────────────────────────────────────────────
export function BIMViewer({ layers }: { layers: LayerState }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotY, setRotY] = useState(-0.48);
  const [rotX, setRotX] = useState(0.32);
  const [zoom, setZoom] = useState(50);
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const drawRef = useRef<() => void>(() => {});

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width === 0 || canvas.height === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2 + 10;
    const cy = H / 2 + 50;

    // ── Background ────────────────────────────────────────────────────────────
    ctx.fillStyle = '#0d1b2a';
    ctx.fillRect(0, 0, W, H);

    // Subtle gradient overlay for depth feel
    const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.7);
    bg.addColorStop(0, 'rgba(20,40,80,0.3)');
    bg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // ── Ground grid ───────────────────────────────────────────────────────────
    const gridExtent = 8;
    ctx.strokeStyle = '#1a2d45';
    ctx.lineWidth = 0.7;
    for (let g = -gridExtent; g <= gridExtent; g++) {
      const a = project([g, 0, -gridExtent], rotY, rotX, zoom, cx, cy);
      const b = project([g, 0,  gridExtent], rotY, rotX, zoom, cx, cy);
      ctx.beginPath(); ctx.moveTo(a.sx, a.sy); ctx.lineTo(b.sx, b.sy); ctx.stroke();
      const c = project([-gridExtent, 0, g], rotY, rotX, zoom, cx, cy);
      const d = project([ gridExtent, 0, g], rotY, rotX, zoom, cx, cy);
      ctx.beginPath(); ctx.moveTo(c.sx, c.sy); ctx.lineTo(d.sx, d.sy); ctx.stroke();
    }

    // ── Coordinate axes ───────────────────────────────────────────────────────
    const origin = project([-3, 0, 2], rotY, rotX, zoom, cx, cy);
    const axisLen = 2;
    const axes: [Vec3, string, string][] = [
      [[-3 + axisLen, 0, 2], '#ef4444', 'X'],
      [[-3, axisLen, 2],     '#22c55e', 'Y'],
      [[-3, 0, 2 + axisLen], '#3b82f6', 'Z'],
    ];
    axes.forEach(([v, color, lbl]) => {
      const p = project(v, rotY, rotX, zoom, cx, cy);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(origin.sx, origin.sy); ctx.lineTo(p.sx, p.sy); ctx.stroke();
      ctx.fillStyle = color;
      ctx.font = 'bold 10px monospace';
      ctx.fillText(lbl, p.sx + 3, p.sy + 3);
    });

    // ── Floor shadow silhouette ───────────────────────────────────────────────
    if (layers.structure) {
      ctx.fillStyle = 'rgba(37,99,235,0.05)';
      ctx.beginPath();
      const corners = [VERTS[0], VERTS[1], VERTS[2], VERTS[3]];
      corners.forEach((v, i) => {
        const p = project(v, rotY, rotX, zoom, cx, cy);
        if (i === 0) ctx.moveTo(p.sx, p.sy); else ctx.lineTo(p.sx, p.sy);
      });
      ctx.closePath(); ctx.fill();
    }

    // ── Edge groups ───────────────────────────────────────────────────────────
    EDGE_GROUPS.forEach(group => {
      if (!layers[group.layer]) return;
      ctx.strokeStyle = group.color;
      ctx.lineWidth = group.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      group.edges.forEach(([ai, bi]) => {
        if (ai >= VERTS.length || bi >= VERTS.length) return;
        const pa = project(VERTS[ai], rotY, rotX, zoom, cx, cy);
        const pb = project(VERTS[bi], rotY, rotX, zoom, cx, cy);
        ctx.beginPath(); ctx.moveTo(pa.sx, pa.sy); ctx.lineTo(pb.sx, pb.sy); ctx.stroke();
      });

      // Structural node dots
      if (group.dot) {
        const nodeIndices = [0, 1, 2, 3, 4, 5, 6, 7];
        nodeIndices.forEach(i => {
          const p = project(VERTS[i], rotY, rotX, zoom, cx, cy);
          ctx.fillStyle = '#60a5fa';
          ctx.beginPath(); ctx.arc(p.sx, p.sy, 3, 0, Math.PI * 2); ctx.fill();
        });
      }
    });

    // ── Door cross detail ─────────────────────────────────────────────────────
    if (layers.openings) {
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 0.8;
      ctx.setLineDash([3, 2]);
      DOOR_CROSS.forEach(([ai, bi]) => {
        const pa = project(VERTS[ai], rotY, rotX, zoom, cx, cy);
        const pb = project(VERTS[bi], rotY, rotX, zoom, cx, cy);
        ctx.beginPath(); ctx.moveTo(pa.sx, pa.sy); ctx.lineTo(pb.sx, pb.sy); ctx.stroke();
      });
      WIN_CROSSES.forEach(crosses => {
        crosses.forEach(([ai, bi]) => {
          const pa = project(VERTS[ai], rotY, rotX, zoom, cx, cy);
          const pb = project(VERTS[bi], rotY, rotX, zoom, cx, cy);
          ctx.beginPath(); ctx.moveTo(pa.sx, pa.sy); ctx.lineTo(pb.sx, pb.sy); ctx.stroke();
        });
      });
      ctx.setLineDash([]);
    }

    // ── Dimension lines ───────────────────────────────────────────────────────
    if (layers.structure) {
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 0.8;
      ctx.setLineDash([4, 3]);

      // Width dimension (6m along x, below front wall)
      const d1 = project([-3, -0.5, 2], rotY, rotX, zoom, cx, cy);
      const d2 = project([ 3, -0.5, 2], rotY, rotX, zoom, cx, cy);
      ctx.beginPath(); ctx.moveTo(d1.sx, d1.sy); ctx.lineTo(d2.sx, d2.sy); ctx.stroke();
      const dmid = project([0, -0.5, 2], rotY, rotX, zoom, cx, cy);
      label(ctx, '6m', dmid.sx - 8, dmid.sy + 12, '#64748b');

      // Height dimension (3m along y, beside left wall)
      const h1 = project([-3.5, 0, -2], rotY, rotX, zoom, cx, cy);
      const h2 = project([-3.5, 3, -2], rotY, rotX, zoom, cx, cy);
      ctx.beginPath(); ctx.moveTo(h1.sx, h1.sy); ctx.lineTo(h2.sx, h2.sy); ctx.stroke();
      const hmid = project([-3.5, 1.5, -2], rotY, rotX, zoom, cx, cy);
      label(ctx, '3m', hmid.sx - 20, hmid.sy + 4, '#64748b');

      ctx.setLineDash([]);
    }

    // ── Info panel (top-left) ─────────────────────────────────────────────────
    ctx.fillStyle = 'rgba(13,27,42,0.85)';
    ctx.fillRect(12, 12, 190, 62);
    ctx.strokeStyle = '#1e3a5f';
    ctx.lineWidth = 1;
    ctx.strokeRect(12, 12, 190, 62);

    label(ctx, 'Huntara Type A  ·  IFC 2x3', 20, 30, '#94a3b8');
    label(ctx, '6m × 4m × 3m  ·  Skala 1:50', 20, 46, '#64748b');

    ctx.fillStyle = '#22c55e';
    ctx.font = 'bold 9px monospace';
    ctx.fillText('● TERHUBUNG · Revit 2025', 20, 62);
  }, [rotY, rotX, zoom, layers]);

  // Keep drawRef up to date
  useEffect(() => { drawRef.current = draw; }, [draw]);

  // Redraw on state changes
  useEffect(() => { draw(); }, [draw]);

  // Canvas resize observer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const resize = () => {
      canvas.width  = parent.clientWidth;
      canvas.height = parent.clientHeight;
      drawRef.current();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(parent);
    return () => ro.disconnect();
  }, []);

  // ── Mouse handlers ────────────────────────────────────────────────────────
  const onMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    setRotY(r => r + dx * 0.008);
    setRotX(r => Math.max(-0.05, Math.min(1.2, r + dy * 0.008)));
  };
  const onMouseUp = () => { isDragging.current = false; };

  return (
    <div className="relative w-full h-full" style={{ minHeight: 420 }}>
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing select-none"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      />

      {/* Floating controls — bottom right */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-1.5">
        {[
          { icon: ZoomIn,    tip: 'Zoom in',    fn: () => setZoom(z => Math.min(90, z + 7)) },
          { icon: ZoomOut,   tip: 'Zoom out',   fn: () => setZoom(z => Math.max(20, z - 7)) },
          { icon: RotateCcw, tip: 'Reset view', fn: () => { setRotY(-0.48); setRotX(0.32); setZoom(50); } },
          { icon: Maximize2, tip: 'Fullscreen', fn: () => {} },
        ].map(({ icon: Icon, tip, fn }) => (
          <button
            key={tip}
            title={tip}
            onClick={fn}
            className="w-8 h-8 bg-slate-800/90 hover:bg-slate-700 border border-slate-600 text-slate-300 hover:text-white rounded-lg flex items-center justify-center transition-colors"
          >
            <Icon className="w-3.5 h-3.5" />
          </button>
        ))}
      </div>

      {/* View label — top right */}
      <div className="absolute top-3 right-3">
        <div className="bg-slate-800/90 border border-slate-600 rounded-lg px-3 py-1.5 text-xs text-slate-400 font-mono">
          Perspektif 3D · Drag untuk rotasi
        </div>
      </div>
    </div>
  );
}
