// ─────────────────────────────────────────────────────────────────
// PLANT CONFIG — single source of truth.
//
// Each area now has:
//   - key        : stable slug used in the database
//   - name       : full display name
//   - short      : abbreviation for tight spaces
//   - mapCoords  : { x, y } in the SVG viewBox (1600x900) for the map view
//
// Edit this file once, the entire app updates dynamically.
// ─────────────────────────────────────────────────────────────────

import {
  AlertTriangle, Shield, Activity, User, ChevronRight, FileText,
} from 'lucide-react';

// Plant zones derived from the Jhagadia plant layout boards.
// X/Y coordinates correspond to the 1600x900 SVG plant map.
export const PLANT_AREAS = [
  // ── Caustic Soda complex (east side) ──
  { key: 'caustic_soda',        name: 'Caustic Soda Plant',          short: 'Caustic Soda',     mapCoords: { x: 1080, y: 540 } },
  { key: 'cellhouse_1350',      name: '1350 TPD Cell House',         short: '1350 Cell House',  mapCoords: { x: 1100, y: 660 } },
  { key: 'cellhouse_850',       name: '850 TPD Cell House',          short: '850 Cell House',   mapCoords: { x: 980,  y: 720 } },
  { key: 'caustic_concentration', name: 'Caustic Soda Concentration',  short: 'Caustic Conc.',    mapCoords: { x: 950,  y: 580 } },
  { key: 'flaker_plant',        name: 'Flaker Plant & Warehouse',    short: 'Flaker',           mapCoords: { x: 970,  y: 510 } },

  // ── Brine ──
  { key: 'primary_brine',       name: 'Primary Brine Purification (1350TPD)', short: 'Primary Brine',  mapCoords: { x: 1300, y: 580 } },
  { key: 'secondary_brine',     name: 'Secondary Brine Purification', short: 'Secondary Brine', mapCoords: { x: 1180, y: 690 } },
  { key: 'salt_saturator',      name: 'Salt Saturator',              short: 'Salt Saturator',   mapCoords: { x: 1280, y: 540 } },
  { key: 'ion_exchange',        name: 'Ion Exchange Column Area',    short: 'Ion Exchange',     mapCoords: { x: 1380, y: 700 } },
  { key: 'anss_plant',          name: 'ANSS Plant',                  short: 'ANSS',             mapCoords: { x: 1400, y: 580 } },
  { key: 'srs_plant',           name: 'SRS Plant',                   short: 'SRS',              mapCoords: { x: 1400, y: 620 } },

  // ── Chlorine handling ──
  { key: 'cl2_bottling_1',      name: 'CL2 Bottling Area-1',         short: 'CL2 Bottling-1',   mapCoords: { x: 1080, y: 360 } },
  { key: 'cl2_bottling_2',      name: 'Chlorine Bottling Area-2',    short: 'CL2 Bottling-2',   mapCoords: { x: 320,  y: 410 } },
  { key: 'cl2_liquefaction',    name: 'CL2 Liquefaction',            short: 'CL2 Liquefaction', mapCoords: { x: 970,  y: 400 } },
  { key: 'vaporizer',           name: 'Vaporizer Area',              short: 'Vaporizer',        mapCoords: { x: 1020, y: 360 } },
  { key: 'tank_farm_filling',   name: 'Tank Farm & Filling Station', short: 'Tank Farm',        mapCoords: { x: 1230, y: 330 } },
  { key: 'cl2_st_tanks',        name: 'CL2 ST Tanks',                short: 'CL2 ST Tanks',     mapCoords: { x: 950,  y: 320 } },
  { key: 'hypo_cl2_compressor', name: 'Hypo & CL2 Compressor Area',  short: 'Hypo & CL2 Comp.', mapCoords: { x: 1180, y: 540 } },
  { key: 'cl2_washing',         name: 'CL2 Washing & Hypo Area',     short: 'CL2 Washing',      mapCoords: { x: 870,  y: 690 } },

  // ── Hydrogen ──
  { key: 'h2_filling',          name: 'H2 Filling Station',          short: 'H2 Filling',       mapCoords: { x: 720,  y: 200 } },
  { key: 'h2_compressors',      name: 'H2 Compressor Houses (1, 2, 3)', short: 'H2 Compressors', mapCoords: { x: 800,  y: 290 } },
  { key: 'h2_holders',          name: 'Hydrogen Gas Holders & Blower Area', short: 'H2 Holders', mapCoords: { x: 800,  y: 380 } },

  // ── Power & Utility ──
  { key: 'power_plant_1',       name: 'Power Plant — Unit 1',        short: 'Power 1',          mapCoords: { x: 720,  y: 530 } },
  { key: 'power_plant_2',       name: 'Power Plant — Unit 2',        short: 'Power 2',          mapCoords: { x: 700,  y: 620 } },
  { key: 'power_plant_3',       name: 'Power Plant — Unit 3',        short: 'Power 3',          mapCoords: { x: 720,  y: 460 } },
  { key: 'power_plant_office',  name: 'Power Plant Office',          short: 'Power Office',     mapCoords: { x: 800,  y: 440 } },
  { key: 'cooling_tower',       name: 'Cooling Tower for Power',     short: 'Cooling Tower',    mapCoords: { x: 750,  y: 720 } },
  { key: 'fuel_storage',        name: 'Fuel Storage',                short: 'Fuel Storage',     mapCoords: { x: 580,  y: 600 } },
  { key: 'dm_plant',            name: 'DM Plant & Utility Area',     short: 'DM Plant',         mapCoords: { x: 950,  y: 470 } },
  { key: 'utility_area',        name: 'Utility Area',                short: 'Utility',          mapCoords: { x: 1150, y: 480 } },

  // ── ECH / H2O2 / Aluminium Chloride (west side) ──
  { key: 'ech_plant',           name: 'ECH Plant',                   short: 'ECH',              mapCoords: { x: 360,  y: 600 } },
  { key: 'h2o2_plant',          name: 'H2O2 Plant',                  short: 'H2O2',             mapCoords: { x: 130,  y: 700 } },
  { key: 'h2o2_tank_farm',      name: 'H2O2 Tank Farm & Warehouse',  short: 'H2O2 Tank Farm',   mapCoords: { x: 200,  y: 780 } },
  { key: 'alcl_plant',          name: 'Aluminium Chloride Plant',    short: 'Al. Chloride',     mapCoords: { x: 440,  y: 600 } },
  { key: 'hcl_plant',           name: 'HCL Plant & Tank Farm',       short: 'HCL',              mapCoords: { x: 360,  y: 770 } },
  { key: 'ech_tank_farm',       name: 'ECH & Glycerine Tank Farm',   short: 'ECH Tank Farm',    mapCoords: { x: 280,  y: 800 } },

  // ── Water & Effluent ──
  { key: 'raw_water_reservoir', name: 'Raw Water Reservoir',         short: 'Raw Water',        mapCoords: { x: 200,  y: 380 } },
  { key: 'fire_water',          name: 'Fire Water Reservoir & Pump House', short: 'Fire Water', mapCoords: { x: 540,  y: 370 } },
  { key: 'effluent_storage',    name: 'Effluent Water Storage',      short: 'Effluent',         mapCoords: { x: 590,  y: 200 } },
  { key: 'wwtp',                name: 'WWTP (Waste Water Treatment Plant)', short: 'WWTP',     mapCoords: { x: 60,   y: 670 } },

  // ── Waste / Storage ──
  { key: 'solid_landfill',      name: 'Solid Secured Landfill Area', short: 'Landfill',         mapCoords: { x: 280,  y: 230 } },
  { key: 'raw_material_storage',name: 'Raw Material Storage & Handling', short: 'Raw Material', mapCoords: { x: 1370, y: 460 } },
  { key: 'store',               name: 'Central Store',               short: 'Store',            mapCoords: { x: 920,  y: 280 } },

  // ── Common / non-production ──
  { key: 'switchyard_66kv',     name: '66 KV Switch Yard',           short: '66KV Switchyard',  mapCoords: { x: 690,  y: 200 } },
  { key: 'admin_block',         name: 'Admin Building',              short: 'Admin',            mapCoords: { x: 1180, y: 800 } },
  { key: 'main_gate',           name: 'Main Gate & Security',        short: 'Main Gate',        mapCoords: { x: 1460, y: 870 } },
  { key: 'canteen_workshop',    name: 'Canteen / Mech. Workshop / QAD', short: 'Canteen / WS',  mapCoords: { x: 1010, y: 460 } },
  { key: 'parking',             name: 'Vehicle Parking & Truck Bay', short: 'Parking',          mapCoords: { x: 580,  y: 200 } },
];

// Convenience lookup
export const AREA_BY_KEY = Object.fromEntries(PLANT_AREAS.map(a => [a.key, a]));

// ─── Categories ─────────────────────────────────────────
export const CATEGORIES = [
  { key: 'unsafe',    label: 'Unsafe Condition',                              short: 'Unsafe',     icon: AlertTriangle, color: '#F87171' },
  { key: 'sleep',     label: 'Sleeping Personnel',                            short: 'Sleeping',   icon: User,          color: '#FCA5A5' },
  { key: 'ppe',       label: 'PPE Non-Compliance',                            short: 'PPE',        icon: Shield,        color: '#FBBF24' },
  { key: 'infra',     label: 'Infrastructural Improvement Required',          short: 'Infra',      icon: Activity,      color: '#34D399' },
  { key: 'operator',  label: 'Non-Availability of Operator at Critical Areas',short: 'Op. Absent', icon: User,          color: '#F472B6' },
  { key: 'logistics', label: 'Logistics Improvement Required',                short: 'Logistics',  icon: ChevronRight,  color: '#60A5FA' },
  { key: 'other',     label: 'Any Other Observation',                         short: 'Other',      icon: FileText,      color: '#A5B4FC' },
];

export const SEVERITIES = ['Low', 'Medium', 'High', 'Critical'];

// ─── AREA → LEADER MAPPING ──────────────────────────────
// In production, replace these with real HOD email addresses.
// Each PLANT_AREAS key MUST have an entry here.
const _defaultLeader = (key, name) => ({ name: 'HOD — ' + name, email: key.replace(/_/g,'') + '.hod@example.com' });

export const AREA_LEADERS = Object.fromEntries(
  PLANT_AREAS.map(a => [a.name, _defaultLeader(a.key, a.short)])
);

export const PLANT_HEAD_EMAIL = 'plant.head@example.com';
export const ESCALATION_EMAIL = 'plant.head@example.com';
