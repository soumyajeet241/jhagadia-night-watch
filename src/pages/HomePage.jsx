import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Smartphone, Monitor, ChevronRight } from 'lucide-react';
import { fetchIncidents, subscribeToIncidents } from '../lib/data';

export default function HomePage() {
  const [count, setCount] = useState(null);

  useEffect(() => {
    let mounted = true;
    fetchIncidents().then(d => mounted && setCount(d.length));
    const unsub = subscribeToIncidents({
      onInsert: () => fetchIncidents().then(d => mounted && setCount(d.length)),
      onUpdate: () => fetchIncidents().then(d => mounted && setCount(d.length)),
    });
    return () => { mounted = false; unsub?.(); };
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden grain" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <div className="h-3 stripes-gold" />

      <div className="max-w-5xl mx-auto px-6 pt-12 pb-20">
        <div className="flex items-start justify-between mb-16 slide-up flex-wrap gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-sm flex items-center justify-center" style={{ background: 'var(--gold)' }}>
                <Shield className="w-5 h-5" style={{ color: 'var(--bg)' }} />
              </div>
              <div className="font-mono text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--gold)' }}>
                Plant Safety System
              </div>
            </div>
            <h1 className="font-display font-black leading-[0.9] mb-4 text-6xl md:text-7xl">
              <span style={{ color: 'var(--text)' }}>Night</span><br />
              <span className="text-gold-grad">Watch</span>
              <span className="text-2xl align-top ml-2 font-mono font-normal" style={{ color: 'var(--text-muted)' }}>·01</span>
            </h1>
            <p className="font-narrow text-xl max-w-md leading-snug" style={{ color: 'var(--text-soft)' }}>
              Real-time night-shift safety incident reporting and leadership dashboard for DCM Shriram Chemicals — Jhagadia Plant.
            </p>
          </div>
          <div className="text-right">
            <div className="font-mono text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
              Incidents on record
            </div>
            <div className="font-display font-black text-6xl tabular-nums text-gold-grad">
              {count === null ? '—' : count.toString().padStart(3, '0')}
            </div>
            <div className="flex items-center gap-1.5 justify-end mt-2 text-xs font-mono">
              <span className="w-1.5 h-1.5 rounded-full ticker" style={{ background: 'var(--green)' }} />
              <span style={{ color: 'var(--text-muted)' }}>SYSTEM LIVE</span>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-5 mb-12">
          <Link to="/report"
            className="group relative text-left p-8 transition-all hover:translate-y-[-2px] slide-up block"
            style={{ background: 'var(--surface)', color: 'var(--text)', animationDelay: '0.1s', borderRadius: '4px', border: '1px solid var(--line)', textDecoration: 'none' }}>
            <div className="absolute top-0 right-0 h-1 w-1/3 stripes-gold" />
            <Smartphone className="w-7 h-7 mb-6" style={{ color: 'var(--gold)' }} />
            <div className="font-mono text-xs uppercase tracking-[0.2em] mb-2" style={{ color: 'var(--gold)' }}>For Workers / NDOs</div>
            <div className="font-display font-bold text-4xl mb-3 leading-tight" style={{ color: 'var(--text)' }}>Report an<br />Incident</div>
            <div className="font-narrow text-base max-w-xs" style={{ color: 'var(--text-soft)' }}>
              Mobile-friendly form. Photo optional. Sends to area leadership the moment you submit.
            </div>
            <div className="flex items-center gap-2 mt-6 font-mono text-xs uppercase tracking-wider group-hover:gap-3 transition-all" style={{ color: 'var(--gold)' }}>
              Open form <ChevronRight className="w-4 h-4" />
            </div>
          </Link>

          <Link to="/dashboard"
            className="group relative text-left p-8 transition-all hover:translate-y-[-2px] slide-up block"
            style={{ background: 'linear-gradient(135deg, var(--surface-2) 0%, var(--bg-2) 100%)', color: 'var(--text)', animationDelay: '0.2s', borderRadius: '4px', border: '1px solid var(--gold)', textDecoration: 'none' }}>
            <div className="absolute top-0 right-0 h-1 w-1/3" style={{ background: 'var(--gold)' }} />
            <Monitor className="w-7 h-7 mb-6" style={{ color: 'var(--gold)' }} />
            <div className="font-mono text-xs uppercase tracking-[0.2em] mb-2" style={{ color: 'var(--gold)' }}>For Leadership</div>
            <div className="font-display font-bold text-4xl mb-3 leading-tight" style={{ color: 'var(--text)' }}>Live<br />Dashboard</div>
            <div className="font-narrow text-base max-w-xs" style={{ color: 'var(--text-soft)' }}>
              Matrix view + plant map view. Updates the instant a report is submitted.
            </div>
            <div className="flex items-center gap-2 mt-6 font-mono text-xs uppercase tracking-wider group-hover:gap-3 transition-all" style={{ color: 'var(--gold)' }}>
              Open dashboard <ChevronRight className="w-4 h-4" />
            </div>
          </Link>
        </div>

        <div className="border-t pt-8" style={{ borderColor: 'var(--line)' }}>
          <div className="font-mono text-xs uppercase tracking-[0.2em] mb-4" style={{ color: 'var(--gold)' }}>How it works</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm font-narrow">
            <ArchStep n="01" title="Submit"   desc="Worker fills the mobile form with optional photo." />
            <ArchStep n="02" title="Persist"  desc="Saved to Supabase Postgres in real-time." />
            <ArchStep n="03" title="Notify"   desc="Resend emails the Area HOD instantly." />
            <ArchStep n="04" title="Display"  desc="Dashboard updates push-style — no refresh." />
          </div>
        </div>
      </div>
    </div>
  );
}

function ArchStep({ n, title, desc }) {
  return (
    <div className="border-l-2 pl-3" style={{ borderColor: 'var(--gold)' }}>
      <div className="font-mono text-xs mb-1" style={{ color: 'var(--gold)' }}>{n}</div>
      <div className="font-display font-bold text-base mb-1" style={{ color: 'var(--text)' }}>{title}</div>
      <div className="leading-snug" style={{ color: 'var(--text-muted)' }}>{desc}</div>
    </div>
  );
}
