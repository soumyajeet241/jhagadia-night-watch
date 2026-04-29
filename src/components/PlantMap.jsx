import React, { useMemo, useState } from 'react';
import { Flag, X, Camera, MessageSquare, Clock, AlertTriangle } from 'lucide-react';
import { PLANT_AREAS, CATEGORIES } from '../lib/config';

// ─── Colour palette matching the actual plant layout legend ───────
const C = {
  caustic:  '#6B7C0A',  // dark olive — Caustic Soda group
  power:    '#5B21B6',  // purple — Power Plant
  alcl:     '#B91C1C',  // red — Aluminium Chloride
  ech:      '#166534',  // dark green — ECH Plant
  h2o2:     '#4D7C0F',  // green — H2O2 Plant
  office:   '#B45309',  // amber — Office / Admin
  parking:  '#1E40AF',  // dark blue — Parking / Open
  water:    '#0369A1',  // blue — Water / Reservoir
  waste:    '#6D28D9',  // violet — Waste / Landfill
  utility:  '#374151',  // dark grey — Utility / Store
  road:     '#1E3A8A',  // navy — Roads
};

// ─── Zone definitions ─────────────────────────────────────────────
// Each zone: { key (matches config), label, x, y, w, h, fill }
// The map canvas is 1800 × 1040. Zones are rectangles for clarity.
const ZONES = [
  // ── North strip (Landfill / Parking / H2 Filling / Utilities) ──
  { key:'solid_landfill',    label:'Solid Secured\nLandfill 1-5',  x:20,  y:20,  w:220, h:100, fill:C.waste   },
  { key:'parking',           label:'Vehicle\nParking',             x:260, y:20,  w:130, h:100, fill:C.parking  },
  { key:'h2_filling',        label:'H2 Filling\nStation',          x:410, y:20,  w:130, h:100, fill:C.caustic  },
  { key:'effluent_storage',  label:'Effluent Water\nStorage',      x:560, y:20,  w:150, h:100, fill:C.utility  },
  { key:'switchyard_66kv',   label:'66 KV\nSwitch Yard',          x:730, y:20,  w:140, h:100, fill:C.utility  },
  { key:'store',             label:'Central\nStore',               x:890, y:20,  w:120, h:100, fill:C.office   },
  { key:'canteen_workshop',  label:'Canteen /\nWorkshop / QAD',    x:1030,y:20,  w:170, h:100, fill:C.office   },
  { key:'admin_block',       label:'Admin\nBuilding',              x:1220,y:20,  w:150, h:100, fill:C.office   },
  { key:'main_gate',         label:'Main Gate\n& Security',        x:1390,y:20,  w:140, h:100, fill:C.office   },

  // ── West block — Water & Waste ──
  { key:'raw_water_reservoir',label:'Raw Water\nReservoir',        x:20,  y:145, w:220, h:180, fill:C.water   },
  { key:'fire_water',        label:'Fire Water\nReservoir',        x:20,  y:345, w:220, h:120, fill:C.water   },
  { key:'wwtp',              label:'WWTP',                         x:20,  y:485, w:100, h:100, fill:C.ech     },

  // ── West-centre — ECH / H2O2 / AlCl ──
  { key:'h2o2_plant',        label:'H2O2 Plant',                   x:140, y:485, w:120, h:130, fill:C.h2o2   },
  { key:'ech_plant',         label:'ECH Plant',                    x:280, y:485, w:120, h:130, fill:C.ech    },
  { key:'alcl_plant',        label:'Aluminium\nChloride Plant',    x:420, y:485, w:140, h:130, fill:C.alcl   },
  { key:'h2o2_tank_farm',    label:'H2O2 Tank\nFarm & Warehouse',  x:140, y:635, w:180, h:110, fill:C.h2o2   },
  { key:'hcl_plant',         label:'HCL Plant\n& Tank Farm',       x:340, y:635, w:150, h:110, fill:C.ech    },
  { key:'ech_tank_farm',     label:'ECH & Glycerine\nTank Farm',   x:510, y:635, w:160, h:110, fill:C.ech    },

  // ── Centre — Fuel & Chlorine handling ──
  { key:'fuel_storage',      label:'Fuel Storage',                 x:260, y:145, w:200, h:320, fill:C.power  },
  { key:'cl2_bottling_2',    label:'CL2 Bottling\nArea-2',         x:480, y:145, w:130, h:120, fill:C.caustic },
  { key:'fire_water',        label:'Fire Pump\nHouse',             x:480, y:285, w:130, h:80,  fill:C.water  },

  // ── H2 group ──
  { key:'h2_compressors',    label:'H2 Compressor\nHouses 1-3',    x:630, y:145, w:160, h:120, fill:C.caustic },
  { key:'h2_holders',        label:'H2 Gas Holders\n& Blower',     x:630, y:285, w:160, h:130, fill:C.caustic },

  // ── Power block ──
  { key:'power_plant_3',     label:'Power Plant 3',                x:260, y:360, w:180, h:110, fill:C.power  },
  { key:'power_plant_office',label:'Power Plant\nOffice',          x:460, y:360, w:140, h:110, fill:C.power  },
  { key:'power_plant_1',     label:'Power Plant 1',                x:260, y:485, w:180, h:120, fill:C.power  },
  { key:'power_plant_2',     label:'Power Plant 2',                x:260, y:620, w:180, h:125, fill:C.power  },
  { key:'cooling_tower',     label:'Cooling Tower\nfor Power',     x:460, y:485, w:140, h:100, fill:C.power  },
  { key:'fuel_storage',      label:'Cooling Tower\nProcess',       x:460, y:600, w:140, h:80,  fill:C.power  },

  // ── Chlorine east ──
  { key:'cl2_st_tanks',      label:'CL2 ST\nTanks',               x:810, y:145, w:110, h:100, fill:C.caustic },
  { key:'cl2_liquefaction',  label:'CL2\nLiquefaction',            x:810, y:265, w:110, h:90,  fill:C.caustic },
  { key:'vaporizer',         label:'Vaporizer\nArea',              x:940, y:145, w:130, h:100, fill:C.caustic },
  { key:'cl2_bottling_1',    label:'CL2 Bottling\nArea-1',         x:940, y:265, w:130, h:90,  fill:C.caustic },
  { key:'tank_farm_filling', label:'Tank Farm &\nFilling Station',  x:1090,y:145, w:170, h:210, fill:C.caustic },

  // ── DM / Utility / Flaker ──
  { key:'dm_plant',          label:'DM Plant\n& Utility',          x:810, y:375, w:130, h:100, fill:C.caustic },
  { key:'utility_area',      label:'Utility\nArea',                x:810, y:485, w:130, h:100, fill:C.caustic },
  { key:'flaker_plant',      label:'Flaker Plant\n& Warehouse',    x:810, y:595, w:130, h:110, fill:C.caustic },

  // ── Caustic south ──
  { key:'caustic_concentration',label:'Caustic Soda\nConcentration', x:960, y:375, w:160, h:100, fill:C.caustic },
  { key:'caustic_soda',      label:'Caustic Soda\nPlant',          x:960, y:485, w:160, h:110, fill:C.caustic },
  { key:'hypo_cl2_compressor',label:'Hypo & CL2\nCompressor',      x:960, y:605, w:160, h:100, fill:C.caustic },

  // ── Brine & Ion Exchange ──
  { key:'raw_material_storage',label:'Raw Material\nStorage',       x:1140,y:375, w:160, h:120, fill:C.caustic },
  { key:'salt_saturator',    label:'Salt\nSaturator',               x:1140,y:505, w:130, h:80,  fill:C.caustic },
  { key:'primary_brine',     label:'Primary Brine\nPurification\n1350 TPD', x:1140,y:600, w:180, h:130, fill:C.caustic },
  { key:'anss_plant',        label:'ANSS\nPlant',                   x:1340,y:375, w:100, h:110, fill:C.caustic },
  { key:'srs_plant',         label:'SRS\nPlant',                    x:1340,y:500, w:100, h:100, fill:C.caustic },
  { key:'ion_exchange',      label:'Ion Exchange\nColumn Area',     x:1340,y:615, w:100, h:120, fill:C.caustic },

  // ── Cell houses & Brine south ──
  { key:'cellhouse_1350',    label:'1350 TPD\nCell House',          x:960, y:720, w:240, h:110, fill:C.caustic },
  { key:'cellhouse_850',     label:'850 TPD\nCell House',           x:630, y:760, w:160, h:100, fill:C.caustic },
  { key:'secondary_brine',   label:'Secondary\nBrine Purification', x:1220,y:720, w:170, h:110, fill:C.caustic },
  { key:'cl2_washing',       label:'CL2 Washing\n& Hypo',           x:800, y:760, w:140, h:100, fill:C.caustic },
];

// Deduplicate by key (some zones have duplicate keys for distinct labels — keep last)
const ZONE_MAP = {};
ZONES.forEach(z => { ZONE_MAP[z.key] = z; });
const UNIQUE_ZONES = Object.values(ZONE_MAP);

export default function PlantMap({ incidents, onAreaClick, pulseIds = new Set() }) {
  const incidentsByKey = useMemo(() => {
    const m = {};
    PLANT_AREAS.forEach(a => { m[a.key] = []; });
    const nameToKey = Object.fromEntries(PLANT_AREAS.map(a => [a.name, a.key]));
    incidents.forEach(inc => {
      const key = nameToKey[inc.area];
      if (key && m[key] !== undefined) m[key].push(inc);
    });
    return m;
  }, [incidents]);

  const [hoverKey, setHoverKey] = useState(null);

  return (
    <div style={{ background: 'var(--bg-3)', border: '1px solid var(--line)', borderRadius: '4px', overflow: 'hidden' }}>
      {/* Header */}
      <div className="px-5 py-3 flex items-center justify-between flex-wrap gap-3"
           style={{ background: 'linear-gradient(135deg, var(--surface-2) 0%, var(--bg-2) 100%)', borderBottom: '2px solid var(--gold)' }}>
        <div>
          <div style={{ color: 'var(--gold)', fontFamily: 'Arial', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 3 }}>Plant Map View — Live</div>
          <div style={{ color: 'var(--text)', fontFamily: 'Arial', fontSize: 20, fontWeight: 700 }}>DCM Shriram Chemicals · Jhagadia</div>
        </div>
        <div style={{ color: 'var(--text-soft)', fontFamily: 'Arial', fontSize: 13 }}>
          🚩 Red flag = open incidents &nbsp;|&nbsp; 🟢 Green flag = all acknowledged &nbsp;|&nbsp; Click any zone to view details
        </div>
      </div>

      {/* Legend — outside the map, above it, easy to read */}
      <div className="px-5 py-3 flex flex-wrap gap-3" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--line)' }}>
        {[
          { color: C.caustic, label: 'Caustic Soda / Chlorine / Brine' },
          { color: C.power,   label: 'Power Plant / Fuel' },
          { color: C.ech,     label: 'ECH Plant / HCL / WWTP' },
          { color: C.h2o2,    label: 'H2O2 Plant' },
          { color: C.alcl,    label: 'Aluminium Chloride' },
          { color: C.water,   label: 'Water / Reservoir' },
          { color: C.waste,   label: 'Waste / Landfill' },
          { color: C.office,  label: 'Office / Admin / Canteen' },
          { color: C.utility, label: 'Utility / Store / Switchyard' },
          { color: C.parking, label: 'Parking' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-2">
            <div style={{ width: 18, height: 18, background: l.color, borderRadius: 2, border: '1px solid rgba(255,255,255,0.3)', flexShrink: 0 }} />
            <span style={{ color: 'var(--text-soft)', fontFamily: 'Arial', fontSize: 12 }}>{l.label}</span>
          </div>
        ))}
      </div>

      {/* SVG Map */}
      <div className="overflow-auto scroll-thin" style={{ maxHeight: '72vh' }}>
        <svg viewBox="0 0 1560 880" style={{ display: 'block', width: '100%', minWidth: 900, background: '#1B2A6B' }}>
          {/* Background */}
          <rect x="0" y="0" width="1560" height="880" fill="#1B2A6B" />
          <rect x="10" y="10" width="1540" height="860" fill="#1E3A8A" stroke="#FBBF24" strokeWidth="2" rx="4" />

          {/* Gate labels */}
          <text x="780" y="28" textAnchor="middle" fill="#A5B4FC" fontFamily="Arial" fontSize="11" letterSpacing="3">BOUNDARY WALL — MATERIAL GATE 4 (NORTH)</text>
          <text x="780" y="870" textAnchor="middle" fill="#A5B4FC" fontFamily="Arial" fontSize="11" letterSpacing="3">BOUNDARY WALL (SOUTH) — MAIN GATE →</text>
          <text x="14" y="440" textAnchor="middle" fill="#A5B4FC" fontFamily="Arial" fontSize="10" transform="rotate(-90,14,440)">MATERIAL GATE 2 (WEST)</text>
          <text x="1546" y="440" textAnchor="middle" fill="#A5B4FC" fontFamily="Arial" fontSize="10" transform="rotate(90,1546,440)">MATERIAL GATE 1 / 5 (EAST)</text>

          {/* Compass */}
          <g transform="translate(1490,60)">
            <circle r="28" fill="#1B1740" stroke="#FBBF24" strokeWidth="1.5"/>
            <text y="-6" textAnchor="middle" fill="#FBBF24" fontFamily="Arial" fontSize="14" fontWeight="700">N</text>
            <text x="20" y="5" textAnchor="middle" fill="#E0E7FF" fontFamily="Arial" fontSize="10">E</text>
            <text y="18" textAnchor="middle" fill="#E0E7FF" fontFamily="Arial" fontSize="10">S</text>
            <text x="-20" y="5" textAnchor="middle" fill="#E0E7FF" fontFamily="Arial" fontSize="10">W</text>
            <polygon points="0,-18 -3,0 0,-3 3,0" fill="#FBBF24"/>
          </g>

          {/* Zones */}
          {UNIQUE_ZONES.map(zone => {
            const incs = incidentsByKey[zone.key] || [];
            const count = incs.length;
            const hasPending = incs.some(i => !i.feedback);
            const hasPulse = incs.some(i => pulseIds.has(i.id));
            const isHover = hoverKey === zone.key;
            const cx = zone.x + zone.w / 2;
            const cy = zone.y + zone.h / 2;
            const lines = zone.label.split('\n');
            const fontSize = Math.min(13, Math.max(9, zone.w / (lines.reduce((m, l) => Math.max(m, l.length), 0) * 0.62)));

            return (
              <g key={zone.key + zone.x}
                 onMouseEnter={() => setHoverKey(zone.key)}
                 onMouseLeave={() => setHoverKey(null)}
                 onClick={() => count > 0 && onAreaClick?.(zone.key, incs)}
                 style={{ cursor: count > 0 ? 'pointer' : 'default' }}>
                {/* Zone rectangle */}
                <rect x={zone.x} y={zone.y} width={zone.w} height={zone.h}
                      fill={zone.fill}
                      stroke={isHover && count > 0 ? '#FBBF24' : 'rgba(255,255,255,0.25)'}
                      strokeWidth={isHover && count > 0 ? 3 : 1}
                      opacity={count > 0 ? 1 : 0.6}
                      rx="2" />

                {/* Zone label */}
                {lines.map((line, li) => (
                  <text key={li}
                        x={cx}
                        y={cy - ((lines.length - 1) * fontSize * 0.65) + li * fontSize * 1.3}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="white"
                        fontFamily="Arial"
                        fontSize={fontSize}
                        fontWeight="700"
                        style={{ pointerEvents: 'none', userSelect: 'none' }}
                        filter="url(#textShadow)">
                    {line}
                  </text>
                ))}

                {/* Flag if incidents exist */}
                {count > 0 && (
                  <g transform={`translate(${zone.x + zone.w - 22}, ${zone.y + 6})`}
                     className={hasPulse ? 'flag-pulse' : ''}>
                    <rect x="-2" y="0" width="22" height="22" rx="3"
                          fill={hasPending ? '#991B1B' : '#065F46'}
                          stroke={hasPending ? '#F87171' : '#34D399'}
                          strokeWidth="1.5"/>
                    <text x="9" y="15" textAnchor="middle"
                          fill="white" fontFamily="Arial" fontSize="12" fontWeight="800">
                      {count}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Text shadow filter */}
          <defs>
            <filter id="textShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="rgba(0,0,0,0.9)" floodOpacity="0.9"/>
            </filter>
          </defs>
        </svg>
      </div>

      {/* Incident count summary */}
      <div className="px-5 py-2 flex items-center gap-4 flex-wrap" style={{ background: 'var(--bg-3)', borderTop: '1px solid var(--line)' }}>
        <span style={{ color: 'var(--gold)', fontFamily: 'Arial', fontSize: 12, fontWeight: 700 }}>
          {incidents.length} total incidents across {new Set(incidents.map(i => i.area)).size} areas
        </span>
        <span style={{ color: 'var(--red)', fontFamily: 'Arial', fontSize: 12 }}>
          🔴 {incidents.filter(i => !i.feedback).length} awaiting feedback
        </span>
        <span style={{ color: 'var(--green)', fontFamily: 'Arial', fontSize: 12 }}>
          🟢 {incidents.filter(i => i.feedback).length} acknowledged
        </span>
      </div>
    </div>
  );
}

// ─── MapAreaModal ─────────────────────────────────────────────────
export function MapAreaModal({ areaKey, incidents, onClose }) {
  if (!areaKey) return null;
  const area = PLANT_AREAS.find(a => a.key === areaKey);
  const sorted = [...incidents].sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));
  const open = sorted.filter(i => !i.feedback).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(15,12,40,0.88)' }} onClick={onClose}>
      <div className="max-w-3xl w-full max-h-[88vh] overflow-y-auto pop scroll-thin"
           style={{ background: 'var(--surface)', borderRadius: '4px', border: '1px solid var(--gold)' }}
           onClick={e => e.stopPropagation()}>

        {/* Modal header */}
        <div className="px-6 py-5 relative"
             style={{ background: 'linear-gradient(135deg, var(--bg-2) 0%, var(--surface-2) 100%)', borderBottom: '2px solid var(--gold)' }}>
          <button onClick={onClose}
                  className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded">
            <X className="w-4 h-4" style={{ color: 'var(--gold)' }} />
          </button>
          <div className="flex items-center gap-2 mb-2">
            <Flag className="w-4 h-4" style={{ color: 'var(--gold)' }} />
            <span style={{ color: 'var(--gold)', fontFamily: 'Arial', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' }}>
              Plant Zone — All Incidents (Newest First)
            </span>
          </div>
          <div style={{ color: 'var(--text)', fontFamily: 'Arial', fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
            {area?.name}
          </div>
          <div style={{ fontFamily: 'Arial', fontSize: 13, color: 'var(--text-soft)' }}>
            <span style={{ color: 'var(--gold)', fontWeight: 700, fontSize: 18 }}>{sorted.length}</span> total &nbsp;·&nbsp;
            <span style={{ color: 'var(--red)' }}>{open} open</span> &nbsp;·&nbsp;
            <span style={{ color: 'var(--green)' }}>{sorted.length - open} acknowledged</span>
          </div>
        </div>

        {/* Incident cards */}
        <div className="p-5 space-y-4">
          {sorted.map((inc, idx) => (
            <IncidentCard key={inc.id} inc={inc} num={idx + 1} total={sorted.length} />
          ))}
        </div>
      </div>
    </div>
  );
}

function IncidentCard({ inc, num, total }) {
  const cat = CATEGORIES.find(c => c.key === inc.category);
  const sevColors = { Low:'#14532D', Medium:'#713F12', High:'#7F1D1D', Critical:'#4A044E' };
  const sevText   = { Low:'#4ADE80', Medium:'#FCD34D', High:'#F87171', Critical:'#E879F9' };

  return (
    <div style={{
      background: 'var(--bg-3)',
      border: `1px solid ${inc.feedback ? 'var(--green)' : 'var(--red)'}`,
      borderLeftWidth: 4,
      borderRadius: 4,
      padding: '16px',
    }}>
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <span style={{ background: 'var(--gold)', color: 'var(--bg)', fontFamily: 'Arial', fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 3 }}>
          Report {num} of {total}
        </span>
        <span style={{ background: cat?.color, color: 'white', fontFamily: 'Arial', fontSize: 11, padding: '2px 7px', borderRadius: 3 }}>
          {cat?.label}
        </span>
        <span style={{ background: sevColors[inc.severity] || '#333', color: sevText[inc.severity] || 'white', fontFamily: 'Arial', fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 3, border: `1px solid ${sevText[inc.severity] || 'white'}` }}>
          {inc.severity}
        </span>
        <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontFamily: 'Courier New', fontSize: 11 }}>
          {inc.id} · {new Date(inc.submitted_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
        </span>
      </div>

      {/* Fields */}
      <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '6px 12px', fontFamily: 'Arial', fontSize: 13 }}>
        <KV label="Reported by"     value={inc.reporter_name} />
        <KV label="Location"        value={inc.location} />
        <KV label="Description"     value={inc.description} span />
        {inc.immediate_action && <KV label="Immediate action" value={inc.immediate_action} span />}
      </div>

      {/* Photo */}
      {inc.photo_url && (
        <div style={{ marginTop: 12 }}>
          <div style={{ color: 'var(--gold)', fontFamily: 'Arial', fontSize: 11, fontWeight: 700, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Camera size={12} /> PHOTO EVIDENCE — click to open full size
          </div>
          <a href={inc.photo_url} target="_blank" rel="noreferrer">
            <img src={inc.photo_url} alt="evidence"
                 style={{ width: '100%', maxHeight: 260, objectFit: 'contain', background: 'var(--bg-3)', borderRadius: 4, border: '1px solid var(--line)' }} />
          </a>
        </div>
      )}

      {/* Feedback */}
      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
        <div style={{ color: 'var(--gold)', fontFamily: 'Arial', fontSize: 11, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <MessageSquare size={12} /> LEADERSHIP FEEDBACK
        </div>
        {inc.feedback ? (
          <div style={{ background: 'var(--green-bg)', border: '1px solid var(--green)', borderRadius: 4, padding: '10px 14px' }}>
            <div style={{ color: 'var(--text)', fontFamily: 'Arial', fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{inc.feedback}</div>
            <div style={{ color: 'var(--green)', fontFamily: 'Arial', fontSize: 11, marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={11} /> {inc.feedback_by} · {new Date(inc.feedback_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
            </div>
          </div>
        ) : (
          <div style={{ background: 'var(--red-bg)', border: '1px solid var(--red)', borderRadius: 4, padding: '10px 14px', display: 'flex', gap: 8 }}>
            <AlertTriangle size={16} style={{ color: 'var(--gold)', flexShrink: 0, marginTop: 2 }} />
            <div style={{ color: 'var(--text)', fontFamily: 'Arial', fontSize: 13 }}>
              Awaiting acknowledgement from area HOD. Email sent to: <span style={{ color: 'var(--gold)' }}>{inc.area}</span> in-charge.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function KV({ label, value, span }) {
  if (span) return (
    <>
      <div style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: 12, paddingTop: 2 }}>{label}</div>
      <div style={{ color: 'var(--text)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{value}</div>
    </>
  );
  return (
    <>
      <div style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: 12, paddingTop: 2 }}>{label}</div>
      <div style={{ color: 'var(--text)' }}>{value}</div>
    </>
  );
}
