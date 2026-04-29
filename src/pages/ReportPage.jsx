import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, X, Send, CheckCircle2, Loader2 } from 'lucide-react';
import { PLANT_AREAS, CATEGORIES, SEVERITIES, AREA_LEADERS } from '../lib/config';
import { createIncident } from '../lib/data';

const SEV_COLORS = {
  Low:      { bg: '#14532D', border: '#16A34A', text: '#4ADE80' },
  Medium:   { bg: '#713F12', border: '#D97706', text: '#FCD34D' },
  High:     { bg: '#7F1D1D', border: '#DC2626', text: '#F87171' },
  Critical: { bg: '#4A044E', border: '#A21CAF', text: '#E879F9' },
};

export default function ReportPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    reporterName: '',
    area: '',           // stores area.name string
    category: '',
    severity: 'Medium',
    location: '',
    description: '',
    immediateAction: '',
    photoFile: null,
    photoPreview: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null);
  const fileRef = useRef(null);

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const onPhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('Photo must be under 5 MB.'); return; }
    const reader = new FileReader();
    reader.onload = () => { update('photoFile', file); update('photoPreview', reader.result); };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    update('photoFile', null); update('photoPreview', null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const valid = form.reporterName.trim() && form.area && form.category
    && form.location.trim() && form.description.trim().length >= 20;

  const submit = async () => {
    if (!valid || submitting) return;
    setSubmitting(true);
    try {
      const created = await createIncident(form);
      setSubmitted(created);
    } catch (e) {
      alert('Failed to submit. Please try again.\n' + (e?.message || ''));
    } finally { setSubmitting(false); }
  };

  /* ── Success screen ─────────────────────────────────── */
  if (submitted) {
    const leader = AREA_LEADERS[submitted.area];
    const cat = CATEGORIES.find(c => c.key === submitted.category);
    return (
      <div className="min-h-screen flex items-center justify-center p-6 grain" style={{ background: 'var(--bg)' }}>
        <div className="max-w-md w-full pop">
          <div className="p-8" style={{ background: 'var(--surface)', border: '1px solid var(--gold)', borderRadius: '4px' }}>
            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-6" style={{ background: 'var(--green-bg)', border: '2px solid var(--green)' }}>
              <CheckCircle2 className="w-7 h-7" style={{ color: 'var(--green)' }} />
            </div>
            <div className="font-mono text-xs uppercase tracking-[0.2em] mb-2" style={{ color: 'var(--gold)' }}>
              Submitted · {submitted.id}
            </div>
            <h2 className="font-display font-black text-3xl mb-3 leading-tight" style={{ color: 'var(--text)' }}>
              Reported. Logged. Notified.
            </h2>
            <p className="font-narrow text-base mb-6 leading-snug" style={{ color: 'var(--text-soft)' }}>
              Your report is live on the leadership dashboard. An email has been dispatched to{' '}
              <span className="font-mono text-sm" style={{ color: 'var(--gold)' }}>
                {leader?.email || 'area HOD'}
              </span>.
            </p>
            <div className="space-y-2 text-sm font-narrow border-t border-b py-4 mb-6" style={{ borderColor: 'var(--line)' }}>
              <Row label="Area"     value={submitted.area} />
              <Row label="Category" value={cat?.label} />
              <Row label="Severity" value={submitted.severity} />
              <Row label="By"       value={submitted.reporter_name} />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSubmitted(null);
                  setForm({ reporterName: form.reporterName, area: '', category: '', severity: 'Medium', location: '', description: '', immediateAction: '', photoFile: null, photoPreview: null });
                }}
                className="flex-1 py-3 font-mono text-xs uppercase tracking-wider transition hover:opacity-80"
                style={{ background: 'var(--gold)', color: 'var(--bg)', borderRadius: '4px', border: 'none', fontWeight: 700 }}>
                Report another
              </button>
              <button onClick={() => navigate('/')}
                className="flex-1 py-3 font-mono text-xs uppercase tracking-wider transition hover:opacity-80"
                style={{ border: '1px solid var(--line)', color: 'var(--text)', borderRadius: '4px', background: 'transparent' }}>
                Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Form ───────────────────────────────────────────── */
  return (
    <div className="min-h-screen pb-24 grain" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <div className="h-2 stripes-gold" />

      {/* Sticky header */}
      <div className="sticky top-0 z-20 backdrop-blur-md" style={{ background: 'rgba(30,27,75,0.96)', borderBottom: '1px solid var(--line)' }}>
        <div className="max-w-xl mx-auto px-5 py-4 flex items-center gap-4">
          <Link to="/" className="w-9 h-9 flex items-center justify-center" style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '4px' }}>
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--gold)' }} />
          </Link>
          <div className="flex-1">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: 'var(--gold)' }}>Incident Report · Jhagadia</div>
            <div className="font-display font-bold text-lg leading-tight" style={{ color: 'var(--text)' }}>Night Shift Safety Form</div>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-5 py-8 space-y-7">

        {/* Reporter name */}
        <Field label="Your name" required>
          <input value={form.reporterName} onChange={e => update('reporterName', e.target.value)}
            placeholder="e.g. R. Mehta (NDO)"
            className="w-full px-4 py-3 outline-none"
            style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '4px', color: 'var(--text)' }} />
        </Field>

        {/* Plant area */}
        <Field label="Plant area" required>
          <div className="grid grid-cols-2 gap-2">
            {PLANT_AREAS.map(a => {
              const sel = form.area === a.name;
              return (
                <button key={a.key} type="button" onClick={() => update('area', a.name)}
                  className="p-2.5 text-left font-narrow text-xs leading-tight transition hover:opacity-90"
                  style={{
                    background: sel ? 'var(--gold)' : 'var(--surface)',
                    color: sel ? 'var(--bg)' : 'var(--text-soft)',
                    border: `1px solid ${sel ? 'var(--gold)' : 'var(--line)'}`,
                    borderRadius: '4px',
                    fontWeight: sel ? 700 : 400,
                  }}>
                  {a.short}
                </button>
              );
            })}
          </div>
          {form.area && (
            <div className="font-mono text-[11px] mt-1.5" style={{ color: 'var(--gold)' }}>
              ✓ {form.area}
            </div>
          )}
        </Field>

        {/* Category */}
        <Field label="Incident category" required>
          <div className="space-y-2">
            {CATEGORIES.map(c => {
              const Icon = c.icon;
              const sel = form.category === c.key;
              return (
                <button key={c.key} type="button" onClick={() => update('category', c.key)}
                  className="w-full p-3 flex items-center gap-3 text-left transition hover:opacity-90"
                  style={{
                    background: sel ? 'var(--surface-2)' : 'var(--surface)',
                    border: `1px solid ${sel ? c.color : 'var(--line)'}`,
                    borderRadius: '4px',
                  }}>
                  <div className="w-8 h-8 flex items-center justify-center flex-shrink-0" style={{ background: sel ? c.color + '33' : 'var(--bg)', borderRadius: '4px', border: `1px solid ${c.color}` }}>
                    <Icon className="w-4 h-4" style={{ color: c.color }} />
                  </div>
                  <div className="font-narrow text-sm font-medium leading-tight" style={{ color: sel ? 'var(--text)' : 'var(--text-soft)' }}>
                    {c.label}
                  </div>
                  {sel && <CheckCircle2 className="w-4 h-4 ml-auto" style={{ color: c.color }} />}
                </button>
              );
            })}
          </div>
        </Field>

        {/* Severity */}
        <Field label="Severity" required>
          <div className="grid grid-cols-4 gap-2">
            {SEVERITIES.map(s => {
              const sel = form.severity === s;
              const sc = SEV_COLORS[s];
              return (
                <button key={s} type="button" onClick={() => update('severity', s)}
                  className="py-2.5 font-mono text-[11px] uppercase tracking-wider transition hover:opacity-90"
                  style={{
                    background: sel ? sc.bg : 'var(--surface)',
                    color: sel ? sc.text : 'var(--text-muted)',
                    border: `1px solid ${sel ? sc.border : 'var(--line)'}`,
                    borderRadius: '4px',
                    fontWeight: sel ? 700 : 500,
                  }}>
                  {s}
                </button>
              );
            })}
          </div>
        </Field>

        {/* Location */}
        <Field label="Specific location / equipment ID" required hint="e.g. 'Near pump P-204'">
          <input value={form.location} onChange={e => update('location', e.target.value)}
            className="w-full px-4 py-3 outline-none"
            style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '4px', color: 'var(--text)' }} />
        </Field>

        {/* Description */}
        <Field label="Description of observation" required hint={`Min 20 chars · ${form.description.length} typed`}>
          <textarea value={form.description} onChange={e => update('description', e.target.value)} rows={4}
            placeholder="Describe what you observed, where, and when…"
            className="w-full px-4 py-3 outline-none resize-none"
            style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '4px', color: 'var(--text)' }} />
        </Field>

        {/* Immediate action */}
        <Field label="Immediate action taken" hint="Optional">
          <textarea value={form.immediateAction} onChange={e => update('immediateAction', e.target.value)} rows={2}
            className="w-full px-4 py-3 outline-none resize-none"
            style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '4px', color: 'var(--text)' }} />
        </Field>

        {/* Photo */}
        <Field label="Photo evidence" hint="Optional · max 5 MB · JPG / PNG">
          {form.photoPreview ? (
            <div className="relative" style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '4px', padding: '8px' }}>
              <img src={form.photoPreview} alt="evidence" className="w-full h-48 object-cover" style={{ borderRadius: '4px' }} />
              <button type="button" onClick={removePhoto}
                className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center"
                style={{ background: 'var(--red-bg)', border: '1px solid var(--red)', borderRadius: '4px' }}>
                <X className="w-3.5 h-3.5" style={{ color: 'var(--red)' }} />
              </button>
              <div className="font-mono text-[10px] mt-2 truncate" style={{ color: 'var(--text-muted)' }}>{form.photoFile?.name}</div>
            </div>
          ) : (
            <button type="button" onClick={() => fileRef.current?.click()}
              className="w-full p-6 flex flex-col items-center gap-2 transition hover:opacity-80"
              style={{ background: 'var(--surface)', border: '1px dashed var(--line-soft)', borderRadius: '4px' }}>
              <Camera className="w-6 h-6" style={{ color: 'var(--gold)' }} />
              <div className="font-narrow text-sm" style={{ color: 'var(--text-muted)' }}>Tap to take or upload a photo</div>
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={onPhoto} className="hidden" />
        </Field>

        {/* Submit */}
        <div className="pt-4">
          <button disabled={!valid || submitting} onClick={submit} type="button"
            className="w-full py-4 flex items-center justify-center gap-2 font-display font-bold text-base transition disabled:opacity-40"
            style={{
              background: valid && !submitting ? 'var(--gold)' : 'var(--surface)',
              color: valid && !submitting ? 'var(--bg)' : 'var(--text-muted)',
              borderRadius: '4px',
              border: `1px solid ${valid ? 'var(--gold)' : 'var(--line)'}`,
            }}>
            {submitting
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
              : <><Send className="w-4 h-4" /> Submit incident report</>}
          </button>
          {!valid && (
            <div className="font-mono text-[11px] mt-2 text-center" style={{ color: 'var(--text-muted)' }}>
              Fill all required fields (*) to enable submit
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, required, hint, children }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <label className="font-mono text-[11px] uppercase tracking-[0.15em] font-medium" style={{ color: 'var(--gold)' }}>
          {label} {required && <span style={{ color: 'var(--red)' }}>*</span>}
        </label>
        {hint && <span className="font-mono text-[10px]" style={{ color: 'var(--text-muted)' }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4">
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span className="font-medium text-right" style={{ color: 'var(--text)' }}>{value}</span>
    </div>
  );
}
