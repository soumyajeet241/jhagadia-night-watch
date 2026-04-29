import React, { useMemo, useState } from 'react';
import { Flag, X, Camera, MessageSquare, Clock, AlertTriangle } from 'lucide-react';
import { PLANT_AREAS, CATEGORIES } from '../lib/config';

// ─────────────────────────────────────────────────────────────────
// Plant zones — drawn as polygons over a 1600×900 canvas.
// Coordinates approximate the Jhagadia plant layout boards.
// Colors match the legend on the actual plant signage.
// ─────────────────────────────────────────────────────────────────
const COL = {
  caustic: '#A2A615',      // olive / yellow-green
  power:   '#7C3AED',      // purple
  alcl:    '#DC2626',      // red
  ech:     '#16A34A',      // dark green
  h2o2:    '#86EFAC',      // light green
  office:  '#F87171',      // salmon
  parking: '#3B82F6',      // bright blue
  water:   '#38BDF8',      // sky blue
  greenA:  '#4ADE80',      // bright green (green belt)
  road:    '#1E3A8A',      // dark navy (roads)
  building:'#FEF3C7',      // pale cream (generic building)
};

// ZONES is keyed by the same `key` as in config.PLANT_AREAS.
// Each zone has polygon points (x,y pairs in viewBox 1600x900),
// a fill color, and a label.
const ZONES = {
  // ── Roads / outline ──
  outline:        { points: '20,170 1540,170 1540,880 20,880', fill: '#1E3A8A', label: '', noClick: true },

  // ── Top row (north) ──
  solid_landfill: { points: '60,180 480,180 480,260 60,260',  fill: COL.parking, label: 'Solid Landfill 1-3' },
  parking:        { points: '500,200 700,200 700,250 500,250', fill: COL.parking, label: 'Vehicle Parking' },
  h2_filling:     { points: '680,180 800,180 800,250 680,250', fill: COL.caustic, label: 'H2 Filling' },
  effluent_storage:{ points: '820,180 940,180 940,250 820,250', fill: COL.building, label: 'Effluent Storage' },
  switchyard_66kv:{ points: '950,180 1060,180 1060,250 950,250', fill: COL.building, label: '66 KV Switchyard' },

  // ── West side ──
  raw_water_reservoir:{ points: '60,290 380,290 380,470 60,470', fill: COL.water, label: 'Raw Water Reservoir' },
  cl2_bottling_2: { points: '270,360 390,360 390,460 270,460', fill: COL.caustic, label: 'CL2 Bottling-2' },
  fire_water:     { points: '460,310 580,310 580,440 460,440', fill: COL.water, label: 'Fire Water' },
  fuel_storage:   { points: '460,450 660,450 660,750 460,750', fill: COL.power, label: 'Fuel Storage' },

  // ── Central-west (ECH/H2O2/AlCl) ──
  h2o2_plant:     { points: '60,640 200,640 200,760 60,760',   fill: COL.h2o2,    label: 'H2O2 Plant' },
  h2o2_tank_farm: { points: '60,770 280,770 280,840 60,840',   fill: COL.h2o2,    label: 'H2O2 Tank Farm' },
  ech_plant:      { points: '290,540 380,540 380,680 290,680', fill: COL.ech,     label: 'ECH Plant' },
  alcl_plant:     { points: '395,540 470,540 470,680 395,680', fill: COL.alcl,    label: 'Aluminium Chloride' },
  hcl_plant:      { points: '290,710 440,710 440,790 290,790', fill: COL.greenA,  label: 'HCL Plant' },
  ech_tank_farm:  { points: '290,795 440,795 440,840 290,840', fill: COL.greenA,  label: 'ECH Tank Farm' },
  wwtp:           { points: '20,640 50,640 50,720 20,720',     fill: COL.greenA,  label: 'WWTP' },

  // ── Center (Power) ──
  power_plant_3:  { points: '680,400 870,400 870,510 680,510', fill: COL.power, label: 'Power Plant 3' },
  power_plant_office:{ points: '870,400 940,400 940,470 870,470', fill: COL.power, label: 'Power Office' },
  power_plant_1:  { points: '680,520 870,520 870,600 680,600', fill: COL.power, label: 'Power Plant 1' },
  power_plant_2:  { points: '680,610 870,610 870,690 680,690', fill: COL.power, label: 'Power Plant 2' },
  cooling_tower:  { points: '680,710 880,710 880,780 680,780', fill: COL.power, label: 'Cooling Tower' },
  dm_plant:       { points: '950,440 1030,440 1030,490 950,490', fill: COL.caustic, label: 'DM Plant' },

  // ── Hydrogen group ──
  h2_compressors: { points: '730,290 860,290 860,360 730,360', fill: COL.caustic, label: 'H2 Compressors' },
  h2_holders:     { points: '760,370 870,370 870,440 760,440', fill: COL.caustic, label: 'H2 Holders' },
  store:          { points: '880,260 960,260 960,310 880,310', fill: COL.office, label: 'Store' },

  // ── Chlorine group (east-center) ──
  cl2_st_tanks:   { points: '930,300 970,300 970,360 930,360',   fill: COL.caustic, label: 'CL2 ST Tanks' },
  cl2_liquefaction:{ points: '950,370 1000,370 1000,440 950,440', fill: COL.caustic, label: 'CL2 Liq.' },
  vaporizer:      { points: '1000,330 1070,330 1070,440 1000,440', fill: COL.caustic, label: 'Vaporizer' },
  cl2_bottling_1: { points: '1080,330 1170,330 1170,440 1080,440', fill: COL.caustic, label: 'CL2 Bottling-1' },
  tank_farm_filling:{ points: '1180,300 1300,300 1300,440 1180,440', fill: COL.caustic, label: 'Tank Farm & Filling' },

  // ── East (Caustic / Brine) ──
  canteen_workshop:{ points: '950,440 1030,440 1030,490 950,490', fill: COL.office, label: 'Canteen / WS' },
  utility_area:   { points: '1080,460 1180,460 1180,540 1080,540', fill: COL.caustic, label: 'Utility' },
  flaker_plant:   { points: '950,500 1030,500 1030,580 950,580', fill: COL.caustic, label: 'Flaker' },
  caustic_concentration:{ points: '930,580 1030,580 1030,660 930,660', fill: COL.caustic, label: 'Caustic Conc.' },
  hypo_cl2_compressor:{ points: '1110,520 1230,520 1230,580 1110,580', fill: COL.caustic, label: 'Hypo & CL2 Comp.' },
  raw_material_storage:{ points: '1320,440 1450,440 1450,580 1320,580', fill: COL.caustic, label: 'Raw Material Storage' },
  primary_brine:  { points: '1240,580 1380,580 1380,690 1240,690', fill: COL.caustic, label: 'Primary Brine 1350' },
  salt_saturator: { points: '1240,540 1340,540 1340,575 1240,575', fill: COL.caustic, label: 'Salt Saturator' },
  anss_plant:     { points: '1385,560 1450,560 1450,605 1385,605', fill: COL.caustic, label: 'ANSS' },
  srs_plant:      { points: '1385,610 1450,610 1450,660 1385,660', fill: COL.caustic, label: 'SRS' },

  // ── South (Cell house, brine purification, admin) ──
  caustic_soda:   { points: '1040,540 1080,540 1080,580 1040,580', fill: COL.caustic, label: 'Caustic Soda' },
  cellhouse_1350: { points: '1020,640 1230,640 1230,720 1020,720', fill: COL.caustic, label: '1350 Cell House' },
  secondary_brine:{ points: '1140,690 1300,690 1300,720 1140,720', fill: COL.caustic, label: 'Secondary Brine' },
  ion_exchange:   { points: '1310,690 1450,690 1450,730 1310,730', fill: COL.caustic, label: 'Ion Exchange' },
  cl2_washing:    { points: '830,690 920,690 920,760 830,760', fill: COL.caustic, label: 'CL2 Washing' },
  cellhouse_850:  { points: '930,710 1010,710 1010,790 930,790', fill: COL.caustic, label: '850 Cell House' },
  admin_block:    { points: '1100,790 1240,790 1240,830 1100,830', fill: COL.office, label: 'Admin' },
  main_gate:      { points: '1430,840 1490,840 1490,880 1430,880', fill: COL.office, label: 'Main Gate' },
};

export default function PlantMap({ incidents, onAreaClick, pulseIds = new Set() }) {
  // Group incidents by area key for fast lookup.
  // Map the area name back to the key.
  const incidentsByAreaKey = useMemo(() => {
    const m = {};
    PLANT_AREAS.forEach(a => { m[a.key] = []; });
    const nameToKey = Object.fromEntries(PLANT_AREAS.map(a => [a.name, a.key]));
    incidents.forEach(inc => {
      const key = nameToKey[inc.area];
      if (key && m[key]) m[key].push(inc);
    });
    return m;
  }, [incidents]);

  const [hoverKey, setHoverKey] = useState(null);

  return (
    <div className="relative w-full" style={{ background: 'var(--bg-3)', borderRadius: '4px', border: '1px solid var(--line)', overflow: 'hidden' }}>
      {/* Header strip */}
      <div className="px-5 py-3 flex items-center justify-between flex-wrap gap-2" style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--line)' }}>
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: 'var(--gold)' }}>Plant Map View</div>
          <div className="font-display font-bold text-lg leading-none mt-1" style={{ color: 'var(--text)' }}>
            DCM Shriram Chemicals · Jhagadia
          </div>
        </div>
        <div className="font-mono text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-soft)' }}>
          🚩 = active incidents · click any zone for details
        </div>
      </div>

      {/* SVG canvas */}
      <div className="overflow-x-auto scroll-thin">
        <svg viewBox="0 0 1600 900" className="w-full block" style={{ minWidth: 900, background: 'linear-gradient(180deg, #1E3A8A 0%, #1E1B4B 100%)' }}>
          {/* Title */}
          <text x="800" y="40" textAnchor="middle" fill="#FBBF24" fontFamily="Archivo" fontSize="32" fontWeight="800" letterSpacing="2">
            DCM SHRIRAM CHEMICALS — JHAGADIA
          </text>
          <text x="800" y="70" textAnchor="middle" fill="#E0E7FF" fontFamily="Archivo Narrow" fontSize="16" letterSpacing="3">
            PLANT LAYOUT
          </text>

          {/* Compass */}
          <g transform="translate(1450, 110)">
            <circle r="32" fill="#1B1740" stroke="#FBBF24" strokeWidth="2"/>
            <text y="-8" textAnchor="middle" fill="#FBBF24" fontSize="14" fontWeight="700">N</text>
            <text x="22" y="6" textAnchor="middle" fill="#A5B4FC" fontSize="10">E</text>
            <text y="20" textAnchor="middle" fill="#A5B4FC" fontSize="10">S</text>
            <text x="-22" y="6" textAnchor="middle" fill="#A5B4FC" fontSize="10">W</text>
            <polygon points="0,-22 -4,0 0,-4 4,0" fill="#FBBF24" />
          </g>

          {/* Plant outline (background) */}
          <rect x="20" y="170" width="1520" height="710" fill="#1E40AF" stroke="#FBBF24" strokeWidth="1.5" rx="4" />

          {/* Boundary wall labels */}
          <text x="800" y="186" textAnchor="middle" fill="#A5B4FC" fontSize="9" letterSpacing="2">— BOUNDARY WALL · MATERIAL GATE 4 —</text>
          <text x="800" y="876" textAnchor="middle" fill="#A5B4FC" fontSize="9" letterSpacing="2">— BOUNDARY WALL —</text>

          {/* Render each zone */}
          {Object.entries(ZONES).map(([key, zone]) => {
            if (zone.noClick) return null;
            const incs = incidentsByAreaKey[key] || [];
            const count = incs.length;
            const hasPending = incs.some(i => !i.feedback);
            const hasPulse = incs.some(i => pulseIds.has(i.id));
            const isHover = hoverKey === key;
            return (
              <g key={key}
                 onMouseEnter={() => setHoverKey(key)}
                 onMouseLeave={() => setHoverKey(null)}
                 onClick={() => count > 0 && onAreaClick?.(key, incs)}
                 style={{ cursor: count > 0 ? 'pointer' : 'default' }}>
                <polygon
                  points={zone.points}
                  fill={zone.fill}
                  stroke={isHover && count > 0 ? '#FBBF24' : '#1B1740'}
                  strokeWidth={isHover && count > 0 ? 3 : 1}
                  opacity={count > 0 ? 1 : 0.55}
                />
                <ZoneLabel zone={zone} />
                {count > 0 && <FlagMarker zone={zone} count={count} pulse={hasPulse} pending={hasPending} />}
              </g>
            );
          })}

          {/* Legend */}
          <g transform="translate(1310, 760)">
            <rect width="220" height="115" fill="#1B1740" stroke="#FBBF24" strokeWidth="1" rx="4" opacity="0.95" />
            <text x="12" y="22" fill="#FBBF24" fontFamily="Archivo" fontWeight="700" fontSize="13" letterSpacing="2">LEGEND</text>
            <LegendSwatch x={12} y={36} color={COL.caustic} label="Caustic Soda Group" />
            <LegendSwatch x={12} y={54} color={COL.power}   label="Power Plant" />
            <LegendSwatch x={12} y={72} color={COL.ech}     label="ECH Plant" />
            <LegendSwatch x={12} y={90} color={COL.h2o2}    label="H2O2 Plant" />
            <LegendSwatch x={12} y={108} color={COL.alcl}   label="Aluminium Chloride" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function ZoneLabel({ zone }) {
  // Compute centroid roughly by averaging polygon points
  const pts = zone.points.split(' ').map(p => p.split(',').map(Number));
  const cx = pts.reduce((s, [x]) => s + x, 0) / pts.length;
  const cy = pts.reduce((s, [, y]) => s + y, 0) / pts.length;
  const w = Math.max(...pts.map(([x]) => x)) - Math.min(...pts.map(([x]) => x));
  if (w < 50) return null; // skip labels on tiny zones
  return (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
          fill="#1B1740" fontFamily="Archivo Narrow" fontWeight="700"
          fontSize={Math.min(14, Math.max(8, w / 12))}
          style={{ pointerEvents: 'none', userSelect: 'none' }}>
      {zone.label}
    </text>
  );
}

function FlagMarker({ zone, count, pulse, pending }) {
  const pts = zone.points.split(' ').map(p => p.split(',').map(Number));
  const cx = pts.reduce((s, [x]) => s + x, 0) / pts.length;
  const cy = pts.reduce((s, [, y]) => s + y, 0) / pts.length;
  return (
    <g transform={`translate(${cx},${cy - 8})`} className={pulse ? 'flag-pulse' : ''}>
      {/* Flag pole */}
      <rect x="-1" y="-26" width="2" height="32" fill="#FBBF24" />
      {/* Flag */}
      <polygon points="1,-26 22,-21 1,-16" fill={pending ? '#F87171' : '#34D399'} stroke="#FBBF24" strokeWidth="1" />
      {/* Count badge */}
      <circle cx="-2" cy="10" r="11" fill="#1B1740" stroke="#FBBF24" strokeWidth="1.5" />
      <text x="-2" y="14" textAnchor="middle" fill="#FBBF24" fontFamily="Archivo" fontWeight="800" fontSize="13">
        {count}
      </text>
    </g>
  );
}

function LegendSwatch({ x, y, color, label }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <rect width="14" height="12" fill={color} stroke="#1B1740" strokeWidth="0.5" />
      <text x="20" y="10" fill="#E0E7FF" fontSize="10" fontFamily="Archivo Narrow">{label}</text>
    </g>
  );
}

// ─────────────────────────────────────────────────────────────────
// MapAreaModal — opened when user clicks a zone with incidents
// Shows ALL incidents for that area, chronologically (newest first),
// with full details, photo and feedback.
// ─────────────────────────────────────────────────────────────────
export function MapAreaModal({ areaKey, incidents, onClose }) {
  if (!areaKey) return null;
  const area = PLANT_AREAS.find(a => a.key === areaKey);
  const sorted = [...incidents].sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));
  const open = sorted.filter(i => !i.feedback).length;
  const closed = sorted.length - open;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,12,40,0.85)' }} onClick={onClose}>
      <div className="max-w-3xl w-full max-h-[88vh] overflow-y-auto pop scroll-thin"
           style={{ background: 'var(--surface)', borderRadius: '4px', border: '1px solid var(--gold)' }}
           onClick={e => e.stopPropagation()}>
        <div className="px-6 py-5 relative" style={{ background: 'linear-gradient(135deg, var(--bg-2) 0%, var(--surface-2) 100%)', borderBottom: '2px solid var(--gold)' }}>
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded">
            <X className="w-4 h-4" style={{ color: 'var(--gold)' }} />
          </button>
          <div className="flex items-center gap-2 mb-2">
            <Flag className="w-4 h-4" style={{ color: 'var(--gold)' }} />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: 'var(--gold)' }}>Plant Zone Report</span>
          </div>
          <div className="font-display font-black text-3xl leading-tight mb-2" style={{ color: 'var(--text)' }}>
            {area?.name}
          </div>
          <div className="flex items-center gap-4 font-mono text-[11px]" style={{ color: 'var(--text-soft)' }}>
            <span><span className="font-display font-bold text-lg" style={{ color: 'var(--gold)' }}>{sorted.length}</span> incidents total</span>
            <span style={{ color: 'var(--red)' }}>● {open} open</span>
            <span style={{ color: 'var(--green)' }}>● {closed} closed</span>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.15em]" style={{ color: 'var(--text-muted)' }}>
            Chronological — newest first
          </div>
          {sorted.map((inc, idx) => (
            <IncidentCard key={inc.id} inc={inc} index={sorted.length - idx} />
          ))}
        </div>
      </div>
    </div>
  );
}

function IncidentCard({ inc, index }) {
  const cat = CATEGORIES.find(c => c.key === inc.category);
  return (
    <div className="rounded p-4" style={{ background: 'var(--bg-3)', border: `1px solid ${inc.feedback ? 'var(--green)' : 'var(--red)'}`, borderLeftWidth: '4px' }}>
      <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-[10px] px-1.5 py-0.5" style={{ background: 'var(--gold)', color: 'var(--bg-3)', borderRadius: '2px', fontWeight: 700 }}>
            #{index}
          </span>
          <span className="font-mono text-[10px] px-1.5 py-0.5" style={{ background: cat?.color, color: 'white', borderRadius: '2px' }}>
            {cat?.short}
          </span>
          {inc.severity === 'Critical' && (
            <span className="font-mono text-[10px] px-1.5 py-0.5" style={{ background: 'var(--red)', color: 'white', borderRadius: '2px', fontWeight: 700 }}>CRITICAL</span>
          )}
          {inc.severity !== 'Critical' && (
            <span className="font-mono text-[10px] px-1.5 py-0.5" style={{ background: 'var(--surface-2)', color: 'var(--text-soft)', borderRadius: '2px' }}>{inc.severity}</span>
          )}
        </div>
        <div className="font-mono text-[10px]" style={{ color: 'var(--text-muted)' }}>
          {new Date(inc.submitted_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} · {inc.id}
        </div>
      </div>

      <div className="space-y-3">
        <KV label="Reported by" value={inc.reporter_name} />
        <KV label="Specific location" value={inc.location} />
        <KV label="Description" value={inc.description} block />
        {inc.immediate_action && <KV label="Immediate action" value={inc.immediate_action} block />}
      </div>

      {inc.photo_url && (
        <div className="mt-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.15em] mb-2 flex items-center gap-1.5" style={{ color: 'var(--gold)' }}>
            <Camera className="w-3 h-3" /> Photo evidence
          </div>
          <a href={inc.photo_url} target="_blank" rel="noreferrer" className="block">
            <img src={inc.photo_url} alt="incident" className="w-full max-h-64 object-contain rounded" style={{ background: 'var(--bg-3)', border: '1px solid var(--line)' }} />
          </a>
        </div>
      )}

      <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--line)' }}>
        <div className="font-mono text-[10px] uppercase tracking-[0.15em] mb-2 flex items-center gap-1.5" style={{ color: 'var(--gold)' }}>
          <MessageSquare className="w-3 h-3" /> Leadership feedback
        </div>
        {inc.feedback ? (
          <div className="p-3 rounded" style={{ background: 'var(--green-bg)', border: '1px solid var(--green)' }}>
            <div className="font-narrow text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text)' }}>{inc.feedback}</div>
            <div className="font-mono text-[10px] mt-2 flex items-center gap-1.5" style={{ color: 'var(--green)' }}>
              <Clock className="w-2.5 h-2.5" /> {inc.feedback_by} · {new Date(inc.feedback_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
            </div>
          </div>
        ) : (
          <div className="p-3 rounded flex items-start gap-2" style={{ background: 'var(--red-bg)', border: '1px solid var(--red)' }}>
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--gold)' }} />
            <div className="font-narrow text-sm" style={{ color: 'var(--text)' }}>Awaiting acknowledgement from area HOD</div>
          </div>
        )}
      </div>
    </div>
  );
}

function KV({ label, value, block }) {
  return (
    <div className={block ? '' : 'flex gap-3'}>
      <div className="font-mono text-[10px] uppercase tracking-[0.15em] flex-shrink-0" style={{ color: 'var(--text-muted)', minWidth: 110 }}>
        {label}
      </div>
      <div className={`font-narrow text-sm whitespace-pre-wrap ${block ? 'mt-1' : ''}`} style={{ color: 'var(--text)' }}>{value}</div>
    </div>
  );
}
