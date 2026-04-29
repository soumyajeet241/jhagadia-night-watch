import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, AlertTriangle, Camera, MessageSquare, X, Send, Bell,
  MapPin, Search, Filter, Trash2, ChevronRight, Clock, Loader2,
  LayoutGrid, Map,
} from 'lucide-react';
import { PLANT_AREAS, CATEGORIES, AREA_LEADERS } from '../lib/config';
import { fetchIncidents, subscribeToIncidents, addFeedback, clearAll } from '../lib/data';
import PlantMap, { MapAreaModal } from '../components/PlantMap';

// ─────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());
  const [pulseIds, setPulseIds] = useState(new Set());
  const [view, setView] = useState('matrix'); // 'matrix' | 'map'
  const [selected, setSelected] = useState(null);
  const [modalType, setModalType] = useState(null); // 'detail' | 'list' | 'mapArea'
  const [filterArea, setFilterArea] = useState(null);
  const [filterCategory, setFilterCategory] = useState(null);
  const [search, setSearch] = useState('');
  const [mapAreaKey, setMapAreaKey] = useState(null);
  const [mapAreaIncs, setMapAreaIncs] = useState([]);
  const knownIdsRef = useRef(new Set());

  // ── Real-time data ──────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    fetchIncidents().then(data => {
      if (!mounted) return;
      setIncidents(data);
      knownIdsRef.current = new Set(data.map(i => i.id));
      setLoading(false);
    });

    const unsub = subscribeToIncidents({
      onInsert: async (newRow) => {
        if (newRow?.id) {
          if (knownIdsRef.current.has(newRow.id)) return;
          knownIdsRef.current.add(newRow.id);
          setIncidents(prev => [newRow, ...prev]);
          setPulseIds(prev => new Set([...prev, newRow.id]));
          setTimeout(() => setPulseIds(prev => { const n = new Set(prev); n.delete(newRow.id); return n; }), 5000);
        } else {
          const data = await fetchIncidents();
          const newOnes = data.filter(i => !knownIdsRef.current.has(i.id));
          if (newOnes.length) {
            knownIdsRef.current = new Set(data.map(i => i.id));
            setIncidents(data);
            setPulseIds(new Set(newOnes.map(i => i.id)));
            setTimeout(() => setPulseIds(new Set()), 5000);
          }
        }
      },
      onUpdate: (updated) => {
        if (!updated?.id) return;
        setIncidents(prev => prev.map(i => i.id === updated.id ? updated : i));
        setMapAreaIncs(prev => prev.map(i => i.id === updated.id ? updated : i));
      },
    });

    return () => { mounted = false; unsub?.(); };
  }, []);

  // Live clock
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Filtered incidents
  const filtered = useMemo(() => incidents.filter(i =>
    (!filterArea || i.area === filterArea) &&
    (!filterCategory || i.category === filterCategory) &&
    (!search || (i.description + ' ' + i.location + ' ' + (i.reporter_name || '')).toLowerCase().includes(search.toLowerCase()))
  ), [incidents, filterArea, filterCategory, search]);

  // Matrix: area.name → category.key → incidents[]
  const matrix = useMemo(() => {
    const m = {};
    PLANT_AREAS.forEach(a => { m[a.name] = {}; CATEGORIES.forEach(c => { m[a.name][c.key] = []; }); });
    filtered.forEach(inc => { if (m[inc.area]?.[inc.category]) m[inc.area][inc.category].push(inc); });
    return m;
  }, [filtered]);

  const total  = filtered.length;
  const pending   = filtered.filter(i => !i.feedback).length;
  const responded = filtered.filter(i => i.feedback).length;
  const withPhotos = filtered.filter(i => i.photo_url).length;
  const critical  = filtered.filter(i => i.severity === 'Critical').length;

  const openCell = (areaName, catKey) => {
    const list = matrix[areaName][catKey];
    if (!list.length) return;
    if (list.length === 1) { setSelected(list[0]); setModalType('detail'); }
    else { setSelected({ areaName, catKey, list }); setModalType('list'); }
  };

  const handleMapAreaClick = (areaKey, incs) => {
    setMapAreaKey(areaKey);
    setMapAreaIncs(incs);
    setModalType('mapArea');
  };

  const handleFeedback = async (id, fb, by) => {
    const updated = await addFeedback(id, fb, by);
    if (updated) {
      setIncidents(prev => prev.map(i => i.id === id ? updated : i));
      setMapAreaIncs(prev => prev.map(i => i.id === id ? updated : i));
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Clear ALL incidents? This cannot be undone.')) return;
    await clearAll();
    setIncidents([]);
    knownIdsRef.current = new Set();
  };

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen grain" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <div className="h-2 stripes-gold" />

      {/* Header */}
      <div className="sticky top-0 z-30 backdrop-blur-md" style={{ background: 'rgba(30,27,75,0.96)', borderBottom: '1px solid var(--line)' }}>
        <div className="max-w-[1500px] mx-auto px-6 py-4 flex items-center gap-5 flex-wrap">
          <Link to="/" className="w-9 h-9 flex items-center justify-center" style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '4px' }}>
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--gold)' }} />
          </Link>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: 'var(--gold)' }}>Leadership Dashboard · Live</div>
            <div className="font-display font-black text-2xl leading-tight" style={{ color: 'var(--text)' }}>Night Watch / Jhagadia</div>
          </div>

          {/* VIEW TOGGLE */}
          <div className="flex items-center gap-1 px-1 py-1 rounded-md ml-4" style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
            <ViewToggleBtn active={view === 'matrix'} onClick={() => setView('matrix')} icon={<LayoutGrid className="w-4 h-4" />} label="Matrix" />
            <ViewToggleBtn active={view === 'map'}    onClick={() => setView('map')}    icon={<Map    className="w-4 h-4" />} label="Plant Map" />
          </div>

          <div className="ml-auto flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full ticker" style={{ background: 'var(--green)' }} />
              <span className="font-mono text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Real-time</span>
            </div>
            <div className="font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>
              {now.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'medium' })}
            </div>
            <button onClick={handleClearAll} title="Clear all (demo)"
              className="w-8 h-8 flex items-center justify-center"
              style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '4px' }}>
              <Trash2 className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1500px] mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--gold)' }} />
          </div>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              <KPI label="Total reports"     value={total}     accent="var(--gold)" />
              <KPI label="Awaiting feedback" value={pending}   accent="var(--red)"  warn={pending > 0} />
              <KPI label="Closed"            value={responded} accent="var(--green)" sub={total > 0 ? Math.round(responded / total * 100) + '%' : ''} />
              <KPI label="Critical"          value={critical}  accent="#E879F9"     warn={critical > 0} />
              <KPI label="With photo"        value={withPhotos} accent="var(--gold-soft)" />
            </div>

            {/* MATRIX VIEW */}
            {view === 'matrix' && (
              <>
                <SearchBar search={search} setSearch={setSearch}
                  filterArea={filterArea} setFilterArea={setFilterArea}
                  filterCategory={filterCategory} setFilterCategory={setFilterCategory} />
                <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5 mt-5">
                  <MatrixTable matrix={matrix} pulseIds={pulseIds}
                    filterArea={filterArea} filterCategory={filterCategory}
                    setFilterArea={setFilterArea} setFilterCategory={setFilterCategory}
                    openCell={openCell} total={total} />
                  <LiveFeed incidents={filtered} pulseIds={pulseIds}
                    onSelect={inc => { setSelected(inc); setModalType('detail'); }} />
                </div>
              </>
            )}

            {/* MAP VIEW */}
            {view === 'map' && (
              <PlantMap incidents={filtered} onAreaClick={handleMapAreaClick} pulseIds={pulseIds} />
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {modalType === 'mapArea' && (
        <MapAreaModal areaKey={mapAreaKey} incidents={mapAreaIncs}
          onClose={() => { setModalType(null); setMapAreaKey(null); setMapAreaIncs([]); }} />
      )}
      {(modalType === 'list' || modalType === 'detail') && selected && (
        <Modal onClose={() => { setSelected(null); setModalType(null); }}>
          {modalType === 'list'
            ? <ListModal data={selected} onPick={inc => { setSelected(inc); setModalType('detail'); }} />
            : <DetailModal inc={selected} onFeedback={handleFeedback} onClose={() => { setSelected(null); setModalType(null); }} />}
        </Modal>
      )}
    </div>
  );
}

// ─── View Toggle Button ─────────────────────────────────────────
function ViewToggleBtn({ active, onClick, icon, label }) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition"
      style={{
        background: active ? 'var(--gold)' : 'transparent',
        color: active ? 'var(--bg)' : 'var(--text-muted)',
        borderRadius: '4px',
        fontWeight: active ? 700 : 500,
        border: 'none',
      }}>
      {icon}
      {label}
    </button>
  );
}

// ─── Matrix Table ───────────────────────────────────────────────
function MatrixTable({ matrix, pulseIds, filterArea, filterCategory, setFilterArea, setFilterCategory, openCell, total }) {
  return (
    <div className="overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '4px' }}>
      <div className="px-5 py-3 flex items-center justify-between flex-wrap gap-2"
           style={{ background: 'linear-gradient(135deg, var(--surface-2) 0%, var(--bg-2) 100%)', borderBottom: '1px solid var(--gold)' }}>
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: 'var(--gold)' }}>Incident Matrix</div>
          <div className="font-display font-bold text-lg leading-none mt-1" style={{ color: 'var(--text)' }}>Area × Category</div>
        </div>
        <div className="font-mono text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          Click cell · 📎 photo · 💬 feedback
        </div>
      </div>
      <div className="overflow-x-auto scroll-thin">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="text-left px-4 py-3 font-mono text-[10px] uppercase tracking-wider sticky left-0 z-10 min-w-[200px]"
                  style={{ background: 'var(--bg-3)', color: 'var(--text-muted)', borderBottom: '1px solid var(--line)' }}>
                Area ↓ / Category →
              </th>
              {CATEGORIES.map(c => (
                <th key={c.key}
                    onClick={() => setFilterCategory(filterCategory === c.key ? null : c.key)}
                    className="px-2 py-3 text-center cursor-pointer transition"
                    style={{ borderBottom: '1px solid var(--line)', borderLeft: '1px solid var(--line)', opacity: filterCategory && filterCategory !== c.key ? 0.3 : 1, minWidth: 90 }}>
                  <div className="font-mono text-[10px] uppercase tracking-wider" style={{ color: c.color }}>{c.short}</div>
                </th>
              ))}
              <th className="px-3 py-3 font-mono text-[10px] uppercase tracking-wider text-center"
                  style={{ background: 'var(--bg-2)', color: 'var(--gold)', borderBottom: '1px solid var(--line)', borderLeft: '1px solid var(--gold)' }}>
                Σ
              </th>
            </tr>
          </thead>
          <tbody>
            {PLANT_AREAS.map((area, idx) => {
              const rowTotal = CATEGORIES.reduce((s, c) => s + (matrix[area.name]?.[c.key]?.length || 0), 0);
              const isFilteredOut = filterArea && filterArea !== area.name;
              return (
                <tr key={area.key} style={{ opacity: isFilteredOut ? 0.2 : 1, transition: 'opacity 0.2s' }}>
                  <td className="px-4 py-2.5 font-narrow font-medium sticky left-0 z-10 cursor-pointer transition hover:bg-white/5"
                      onClick={() => setFilterArea(filterArea === area.name ? null : area.name)}
                      style={{ background: idx % 2 === 0 ? 'var(--surface)' : 'var(--bg-3)', borderBottom: '1px solid var(--line)', color: 'var(--text-soft)' }}>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--gold)' }} />
                      <span className="text-[12px]">{area.short}</span>
                    </div>
                  </td>
                  {CATEGORIES.map(c => {
                    const list = matrix[area.name]?.[c.key] || [];
                    const count = list.length;
                    const hasPhoto = list.some(i => i.photo_url);
                    const hasFeedback = list.some(i => i.feedback);
                    const hasPending = list.some(i => !i.feedback);
                    const hasPulse = list.some(i => pulseIds.has(i.id));
                    return (
                      <td key={c.key} className="p-1 text-center"
                          style={{ background: idx % 2 === 0 ? 'var(--surface)' : 'var(--bg-3)', borderBottom: '1px solid var(--line)', borderLeft: '1px solid var(--line)' }}>
                        {count > 0 ? (
                          <button onClick={() => openCell(area.name, c.key)}
                            className={`w-full inline-flex flex-col items-center gap-0.5 px-2 py-2 transition hover:scale-105 ${hasPulse ? 'pulse-ring' : ''}`}
                            style={{
                              background: hasPending ? 'var(--red-bg)' : 'var(--green-bg)',
                              border: `1px solid ${hasPending ? 'var(--red)' : 'var(--green)'}`,
                              borderRadius: '4px',
                            }}>
                            <span className="font-display font-black text-xl tabular-nums leading-none"
                                  style={{ color: hasPending ? 'var(--red)' : 'var(--green)' }}>
                              {count}
                            </span>
                            <span className="text-[10px] flex gap-0.5">
                              {hasPhoto && <span>📎</span>}
                              {hasFeedback && <span>💬</span>}
                              {hasPulse && <span style={{ color: 'var(--gold)' }}>●</span>}
                            </span>
                          </button>
                        ) : (
                          <span style={{ color: 'var(--line)' }}>·</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-3 py-2.5 text-center font-display font-black tabular-nums"
                      style={{ background: 'var(--bg-2)', borderBottom: '1px solid var(--line)', borderLeft: '1px solid var(--gold)', color: rowTotal > 0 ? 'var(--gold)' : 'var(--line)' }}>
                    {rowTotal || '·'}
                  </td>
                </tr>
              );
            })}
            <tr>
              <td className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider sticky left-0 z-10"
                  style={{ background: 'var(--surface-2)', color: 'var(--gold)', borderTop: '1px solid var(--gold)' }}>
                Σ Column total
              </td>
              {CATEGORIES.map(c => {
                const t = PLANT_AREAS.reduce((s, a) => s + (matrix[a.name]?.[c.key]?.length || 0), 0);
                return (
                  <td key={c.key} className="py-3 text-center font-display font-black tabular-nums"
                      style={{ background: 'var(--surface-2)', color: t > 0 ? 'var(--text)' : 'var(--line)', borderLeft: '1px solid var(--line)', borderTop: '1px solid var(--gold)' }}>
                    {t || '·'}
                  </td>
                );
              })}
              <td className="py-3 text-center font-display font-black tabular-nums text-xl"
                  style={{ background: 'var(--gold)', color: 'var(--bg)', borderLeft: '1px solid var(--gold)', borderTop: '1px solid var(--gold)' }}>
                {total}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Search / Filter bar ────────────────────────────────────────
function SearchBar({ search, setSearch, filterArea, setFilterArea, filterCategory, setFilterCategory }) {
  return (
    <div className="flex flex-wrap items-center gap-3 p-3" style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '4px' }}>
      <Search className="w-4 h-4" style={{ color: 'var(--gold)' }} />
      <input value={search} onChange={e => setSearch(e.target.value)}
        placeholder="Search descriptions, locations, reporters…"
        className="flex-1 min-w-[200px] outline-none bg-transparent text-sm font-narrow"
        style={{ color: 'var(--text)' }} />
      {(filterArea || filterCategory) && (
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5" style={{ color: 'var(--gold)' }} />
          {filterArea && <Chip label={PLANT_AREAS.find(a => a.name === filterArea)?.short || filterArea} onRemove={() => setFilterArea(null)} />}
          {filterCategory && <Chip label={CATEGORIES.find(c => c.key === filterCategory)?.short} onRemove={() => setFilterCategory(null)} />}
        </div>
      )}
    </div>
  );
}

// ─── Live feed side panel ───────────────────────────────────────
function LiveFeed({ incidents, pulseIds, onSelect }) {
  return (
    <div style={{ background: 'var(--bg-3)', border: '1px solid var(--line)', borderRadius: '4px' }} className="overflow-hidden">
      <div className="px-4 py-3 flex items-center justify-between" style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--gold)' }}>
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: 'var(--gold)' }}>Live Feed</div>
          <div className="font-display font-bold text-base" style={{ color: 'var(--text)' }}>Latest reports</div>
        </div>
        <Bell className="w-4 h-4" style={{ color: 'var(--gold)' }} />
      </div>
      <div className="max-h-[520px] overflow-y-auto scroll-thin">
        {incidents.length === 0 ? (
          <div className="p-8 text-center font-narrow text-sm" style={{ color: 'var(--text-muted)' }}>
            No incidents reported yet. Submit one from the form to see it appear here instantly.
          </div>
        ) : incidents.slice(0, 14).map(inc => {
          const cat = CATEGORIES.find(c => c.key === inc.category);
          const isPulse = pulseIds.has(inc.id);
          return (
            <button key={inc.id} onClick={() => onSelect(inc)}
              className="w-full text-left px-4 py-3 transition hover:bg-white/5"
              style={{ borderBottom: '1px solid var(--line)', background: isPulse ? 'rgba(251,191,36,0.08)' : 'transparent' }}>
              <div className="flex items-start gap-3">
                <div className="w-1 self-stretch flex-shrink-0" style={{ background: cat?.color || 'var(--gold)' }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-mono text-[10px] opacity-60" style={{ color: 'var(--text-soft)' }}>
                      {new Date(inc.submitted_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="font-mono text-[10px] px-1.5 py-0.5" style={{ background: cat?.color, color: 'white', borderRadius: '2px' }}>{cat?.short}</span>
                    {inc.severity === 'Critical' && (
                      <span className="font-mono text-[10px] px-1.5 py-0.5" style={{ background: 'var(--red-bg)', color: 'var(--red)', borderRadius: '2px', border: '1px solid var(--red)', fontWeight: 700 }}>CRIT</span>
                    )}
                    {isPulse && (
                      <span className="font-mono text-[10px] px-1.5 py-0.5 stripes-gold" style={{ color: 'var(--bg)', borderRadius: '2px', fontWeight: 700 }}>NEW</span>
                    )}
                  </div>
                  <div className="font-narrow text-[13px] mb-0.5 leading-snug" style={{ color: 'var(--gold)' }}>
                    {PLANT_AREAS.find(a => a.name === inc.area)?.short || inc.area}
                  </div>
                  <div className="font-narrow text-xs leading-snug line-clamp-2" style={{ color: 'var(--text-muted)' }}>{inc.description}</div>
                  <div className="flex items-center gap-3 mt-1.5 text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                    <span>{inc.reporter_name}</span>
                    {inc.photo_url && <span className="flex items-center gap-1"><Camera className="w-2.5 h-2.5" />photo</span>}
                    {inc.feedback
                      ? <span style={{ color: 'var(--green)' }}>● closed</span>
                      : <span style={{ color: 'var(--red)' }}>● open</span>}
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 mt-1" style={{ color: 'var(--line-soft)' }} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── KPI card ───────────────────────────────────────────────────
function KPI({ label, value, accent, sub, warn }) {
  return (
    <div className="p-4 relative overflow-hidden" style={{ background: 'var(--surface)', border: `1px solid ${warn ? accent : 'var(--line)'}`, borderRadius: '4px' }}>
      {warn && <div className="absolute top-0 right-0 w-1 h-full" style={{ background: accent }} />}
      <div className="font-mono text-[10px] uppercase tracking-[0.15em] mb-2" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className="font-display font-black text-4xl tabular-nums leading-none" style={{ color: accent }}>{value}</div>
      {sub && <div className="font-mono text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>{sub}</div>}
    </div>
  );
}

// ─── Chip ───────────────────────────────────────────────────────
function Chip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider"
          style={{ background: 'var(--surface-2)', color: 'var(--gold)', borderRadius: '4px', border: '1px solid var(--gold)' }}>
      {label}
      <button onClick={onRemove}><X className="w-2.5 h-2.5" /></button>
    </span>
  );
}

// ─── Modal shell ────────────────────────────────────────────────
function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(15,12,40,0.85)' }} onClick={onClose}>
      <div className="max-w-2xl w-full max-h-[88vh] overflow-y-auto pop scroll-thin"
           style={{ background: 'var(--surface)', borderRadius: '4px', border: '1px solid var(--gold)' }}
           onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

// ─── List modal (multiple incidents in one cell) ─────────────────
function ListModal({ data, onPick }) {
  const cat = CATEGORIES.find(c => c.key === data.catKey);
  const area = PLANT_AREAS.find(a => a.name === data.areaName);
  return (
    <div>
      <div className="px-6 py-5" style={{ background: 'linear-gradient(135deg, var(--bg-2) 0%, var(--surface-2) 100%)', borderBottom: '2px solid var(--gold)' }}>
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-1" style={{ color: 'var(--gold)' }}>{data.list.length} incidents</div>
        <div className="font-display font-black text-2xl leading-tight" style={{ color: 'var(--text)' }}>{area?.name}</div>
        <div className="font-narrow text-sm mt-1" style={{ color: 'var(--text-soft)' }}>{cat?.label}</div>
      </div>
      <div className="p-4 space-y-2">
        {data.list.map((inc, i) => (
          <button key={inc.id} onClick={() => onPick(inc)}
            className="w-full p-3 text-left transition hover:bg-white/5"
            style={{ background: 'var(--bg-3)', border: '1px solid var(--line)', borderRadius: '4px' }}>
            <div className="font-mono text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--gold)' }}>
              #{i + 1} · {new Date(inc.submitted_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })} · {inc.id}
            </div>
            <div className="font-narrow text-sm" style={{ color: 'var(--text)' }}>{inc.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Detail modal ───────────────────────────────────────────────
function DetailModal({ inc, onFeedback, onClose }) {
  const cat = CATEGORIES.find(c => c.key === inc.category);
  const [fb, setFb] = useState('');
  const [fbBy, setFbBy] = useState(AREA_LEADERS[inc.area]?.name || 'HOD');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!fb.trim()) return;
    setSubmitting(true);
    await onFeedback(inc.id, fb.trim(), fbBy);
    setSubmitting(false);
    setFb('');
  };

  return (
    <div>
      <div className="px-6 py-5 relative" style={{ background: `linear-gradient(135deg, ${cat?.color}22 0%, var(--bg-2) 100%)`, borderBottom: `2px solid ${cat?.color}` }}>
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded">
          <X className="w-4 h-4" style={{ color: 'var(--gold)' }} />
        </button>
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-1" style={{ color: cat?.color }}>{cat?.label}</div>
        <div className="font-display font-black text-2xl leading-tight mb-1" style={{ color: 'var(--text)' }}>{inc.area}</div>
        <div className="flex items-center gap-3 mt-2 font-mono text-[10px] uppercase tracking-wider flex-wrap" style={{ color: 'var(--text-muted)' }}>
          <span>{inc.id}</span>
          <span>·</span>
          <span>{new Date(inc.submitted_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
          <span className="px-1.5 py-0.5" style={{ background: 'var(--surface-2)', color: 'var(--gold)', borderRadius: '4px' }}>{inc.severity}</span>
        </div>
      </div>

      <div className="p-6 space-y-5">
        <DField label="Reported by"        value={inc.reporter_name} />
        <DField label="Specific location"  value={inc.location} />
        <DField label="Description"        value={inc.description} large />
        {inc.immediate_action && <DField label="Immediate action" value={inc.immediate_action} large />}

        {inc.photo_url && (
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.15em] mb-2 flex items-center gap-1.5" style={{ color: 'var(--gold)' }}>
              <Camera className="w-3 h-3" /> Photo evidence
            </div>
            <a href={inc.photo_url} target="_blank" rel="noreferrer">
              <img src={inc.photo_url} alt="evidence" className="w-full max-h-80 object-contain" style={{ background: 'var(--bg-3)', borderRadius: '4px', border: '1px solid var(--line)' }} />
            </a>
            <div className="font-mono text-[10px] mt-1 text-center" style={{ color: 'var(--text-muted)' }}>Click to open full size ↗</div>
          </div>
        )}

        {/* Feedback */}
        <div className="pt-4 border-t" style={{ borderColor: 'var(--line)' }}>
          <div className="font-mono text-[10px] uppercase tracking-[0.15em] mb-3 flex items-center gap-1.5" style={{ color: 'var(--gold)' }}>
            <MessageSquare className="w-3 h-3" /> Leadership feedback
          </div>
          {inc.feedback ? (
            <div className="p-4" style={{ background: 'var(--green-bg)', border: '1px solid var(--green)', borderRadius: '4px' }}>
              <div className="font-narrow text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text)' }}>{inc.feedback}</div>
              <div className="font-mono text-[10px] mt-3 flex items-center gap-1.5" style={{ color: 'var(--green)' }}>
                <Clock className="w-2.5 h-2.5" /> {inc.feedback_by} · {new Date(inc.feedback_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3 flex items-start gap-2" style={{ background: 'var(--red-bg)', border: '1px solid var(--red)', borderRadius: '4px' }}>
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--gold)' }} />
                <div>
                  <div className="font-narrow text-sm font-medium" style={{ color: 'var(--red)' }}>Awaiting acknowledgement</div>
                  <div className="font-mono text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                    Email sent to: <span style={{ color: 'var(--gold)' }}>{AREA_LEADERS[inc.area]?.email || 'area HOD'}</span>
                  </div>
                  <div className="font-mono text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                    When the HOD replies to that email, their response will appear here automatically.
                  </div>
                </div>
              </div>
              <details>
                <summary className="font-mono text-[10px] uppercase tracking-wider cursor-pointer" style={{ color: 'var(--text-muted)' }}>
                  + Add feedback manually (testing / override)
                </summary>
                <div className="mt-2 space-y-2">
                  <input value={fbBy} onChange={e => setFbBy(e.target.value)} placeholder="Your name (HOD)"
                    className="w-full px-3 py-2 outline-none text-sm font-narrow"
                    style={{ background: 'var(--bg-3)', border: '1px solid var(--line)', borderRadius: '4px', color: 'var(--text)' }} />
                  <textarea value={fb} onChange={e => setFb(e.target.value)} rows={3}
                    placeholder="Type your acknowledgement and corrective action…"
                    className="w-full px-3 py-2 outline-none text-sm font-narrow resize-none"
                    style={{ background: 'var(--bg-3)', border: '1px solid var(--line)', borderRadius: '4px', color: 'var(--text)' }} />
                  <button disabled={!fb.trim() || submitting} onClick={submit}
                    className="w-full py-2.5 flex items-center justify-center gap-2 font-mono text-xs uppercase tracking-wider disabled:opacity-40"
                    style={{ background: 'var(--gold)', color: 'var(--bg)', borderRadius: '4px', border: 'none', fontWeight: 700 }}>
                    {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    Submit feedback
                  </button>
                </div>
              </details>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DField({ label, value, large }) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-[0.15em] mb-1.5" style={{ color: 'var(--gold)' }}>{label}</div>
      <div className={`font-narrow ${large ? 'text-base leading-relaxed' : 'text-sm'} whitespace-pre-wrap`} style={{ color: 'var(--text)' }}>{value}</div>
    </div>
  );
}
