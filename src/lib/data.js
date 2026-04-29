import { supabase, SUPABASE_READY } from './supabase';

const TABLE = 'incidents';
const BUCKET = 'incident-photos';

// ─────────────────────────────────────────────────────────────────
// LOCAL FALLBACK — for prototype use without Supabase env vars
// ─────────────────────────────────────────────────────────────────
const LS_KEY = 'jhagadia_incidents_local_v1';
const localFallback = {
  load: () => {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; }
  },
  save: (arr) => { try { localStorage.setItem(LS_KEY, JSON.stringify(arr)); } catch {} },
};

// ─────────────────────────────────────────────────────────────────
// FETCH ALL INCIDENTS
// ─────────────────────────────────────────────────────────────────
export async function fetchIncidents() {
  if (!SUPABASE_READY) return localFallback.load();
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('submitted_at', { ascending: false });
  if (error) {
    console.error('[fetchIncidents]', error);
    return [];
  }
  return data || [];
}

// ─────────────────────────────────────────────────────────────────
// UPLOAD PHOTO TO SUPABASE STORAGE
// Returns a public URL. The bucket must be created as PUBLIC.
// ─────────────────────────────────────────────────────────────────
export async function uploadPhoto(file, incidentId) {
  if (!SUPABASE_READY) {
    // For local fallback we just keep base64 in the row
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = `${incidentId}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: true,
    contentType: file.type,
  });
  if (error) { console.error('[uploadPhoto]', error); return null; }
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data?.publicUrl || null;
}

// ─────────────────────────────────────────────────────────────────
// CREATE A NEW INCIDENT
// After successful insert, calls the /api/notify endpoint to send
// the area HOD email (server-side via Vercel function).
// ─────────────────────────────────────────────────────────────────
export async function createIncident(incident) {
  const id = 'INC-' + Date.now().toString(36).toUpperCase() + '-' + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  const submittedAt = new Date().toISOString();

  // 1. Upload photo (if any)
  let photoUrl = null;
  if (incident.photoFile) {
    photoUrl = await uploadPhoto(incident.photoFile, id);
  }

  // 2. Insert the row
  const row = {
    id,
    submitted_at: submittedAt,
    reporter_name: incident.reporterName,
    area: incident.area,
    category: incident.category,
    severity: incident.severity,
    location: incident.location,
    description: incident.description,
    immediate_action: incident.immediateAction || null,
    photo_url: photoUrl,
    feedback: null,
    feedback_at: null,
    feedback_by: null,
    status: 'Open',
  };

  if (!SUPABASE_READY) {
    const cur = localFallback.load();
    cur.unshift(row);
    localFallback.save(cur);
    return row;
  }

  const { data, error } = await supabase.from(TABLE).insert(row).select().single();
  if (error) { console.error('[createIncident]', error); throw error; }

  // 3. Trigger email notification (fire-and-forget; failure logged but doesn't block UI)
  try {
    await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ incident: data }),
    });
  } catch (e) {
    console.warn('[createIncident] notify failed (non-fatal)', e);
  }

  return data;
}

// ─────────────────────────────────────────────────────────────────
// MANUALLY ADD FEEDBACK (used in the dashboard's "test feedback" UI;
// in production, feedback comes via inbound email webhook)
// ─────────────────────────────────────────────────────────────────
export async function addFeedback(incidentId, feedback, feedbackBy) {
  const patch = {
    feedback,
    feedback_by: feedbackBy,
    feedback_at: new Date().toISOString(),
    status: 'Acknowledged',
  };
  if (!SUPABASE_READY) {
    const cur = localFallback.load();
    const idx = cur.findIndex(i => i.id === incidentId);
    if (idx >= 0) { cur[idx] = { ...cur[idx], ...patch }; localFallback.save(cur); return cur[idx]; }
    return null;
  }
  const { data, error } = await supabase.from(TABLE).update(patch).eq('id', incidentId).select().single();
  if (error) { console.error('[addFeedback]', error); throw error; }
  return data;
}

// ─────────────────────────────────────────────────────────────────
// REAL-TIME SUBSCRIPTION
// Pushes INSERT and UPDATE events to the dashboard the instant they
// happen in the database. No polling.
// ─────────────────────────────────────────────────────────────────
export function subscribeToIncidents({ onInsert, onUpdate }) {
  if (!SUPABASE_READY) {
    // Fallback: poll localStorage every 1.5s when there's no Supabase
    let prev = JSON.stringify(localFallback.load());
    const id = setInterval(() => {
      const cur = localFallback.load();
      const curStr = JSON.stringify(cur);
      if (curStr !== prev) {
        prev = curStr;
        onInsert?.(); // crude but works for the fallback
      }
    }, 1500);
    return () => clearInterval(id);
  }

  const channel = supabase
    .channel('incidents-realtime')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: TABLE }, (payload) => {
      onInsert?.(payload.new);
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: TABLE }, (payload) => {
      onUpdate?.(payload.new);
    })
    .subscribe();

  return () => supabase.removeChannel(channel);
}

// ─────────────────────────────────────────────────────────────────
// CLEAR ALL — demo-only utility
// ─────────────────────────────────────────────────────────────────
export async function clearAll() {
  if (!SUPABASE_READY) { localFallback.save([]); return; }
  const { error } = await supabase.from(TABLE).delete().neq('id', '___never___');
  if (error) console.error('[clearAll]', error);
}
