// Vercel serverless function — POST /api/inbound
// Resend posts to this endpoint whenever an email is sent to our
// inbound domain. We parse out the incident ID from the To address
// (incident+<ID>@<domain>) and write the reply body into Supabase
// as feedback for that incident.
//
// Required env vars on Vercel:
//   SUPABASE_URL              — your Supabase project URL
//   SUPABASE_SERVICE_ROLE_KEY — service role key (bypasses RLS for the update)
//   RESEND_WEBHOOK_SECRET     — (optional) for signature verification

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error('[inbound] missing Supabase env vars');
    return res.status(500).json({ error: 'server_misconfigured' });
  }

  try {
    const event = req.body;
    if (!event || event.type !== 'email.received') {
      return res.status(200).json({ ignored: true, reason: 'wrong_type', got: event?.type });
    }

    const data = event.data || {};
    const to = Array.isArray(data.to) ? data.to[0] : data.to;
    const from = data.from || '';
    const subject = data.subject || '';
    const text = data.text || data.plain || '';
    const html = data.html || '';

    // 1. Extract incident ID from the To address (preferred): incident+<ID>@<domain>
    let incidentId = null;
    if (to && typeof to === 'string') {
      const m = to.match(/incident\+([A-Z0-9-]+)@/i);
      if (m) incidentId = m[1].toUpperCase();
    }

    // 2. Fallback: pull from subject "[Action Needed] Safety Incident <ID> — …"
    if (!incidentId && subject) {
      const m = subject.match(/INC-[A-Z0-9-]+/i);
      if (m) incidentId = m[0].toUpperCase();
    }

    if (!incidentId) {
      console.warn('[inbound] could not extract incident ID', { to, subject });
      return res.status(200).json({ ignored: true, reason: 'no_id' });
    }

    // 3. Skip auto-replies / out-of-office
    if (/^(automatic reply|out of office|auto-reply)/i.test(subject)) {
      console.log('[inbound] skipping auto-reply for', incidentId);
      return res.status(200).json({ ignored: true, reason: 'auto_reply' });
    }

    // 4. Clean the reply body: strip quoted thread, keep only the new content
    const cleanText = cleanReply(text || htmlToText(html));
    if (!cleanText.trim()) {
      console.warn('[inbound] empty reply body for', incidentId);
      return res.status(200).json({ ignored: true, reason: 'empty_body' });
    }

    // 5. Extract the sender's display name (or fall back to email)
    let senderName = from;
    const m = from.match(/^(.*?)<(.+)>$/);
    if (m) {
      senderName = m[1].trim().replace(/^"|"$/g, '') || m[2].trim();
    }

    // 6. Update the row in Supabase
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // If a previous feedback already exists, append the new one with a separator.
    const { data: existing } = await supabase
      .from('incidents').select('feedback').eq('id', incidentId).single();

    let combined = cleanText;
    if (existing?.feedback) {
      combined = existing.feedback + '\n\n— — — — —\n' + cleanText;
    }

    const { error } = await supabase
      .from('incidents')
      .update({
        feedback: combined,
        feedback_by: senderName,
        feedback_at: new Date().toISOString(),
        status: 'Acknowledged',
      })
      .eq('id', incidentId);

    if (error) {
      console.error('[inbound] supabase update error', error);
      return res.status(500).json({ error: 'db_update_failed', detail: error.message });
    }

    return res.status(200).json({ ok: true, incidentId, feedbackBy: senderName });
  } catch (err) {
    console.error('[inbound] exception', err);
    return res.status(500).json({ error: 'internal_error', message: err.message });
  }
}

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────

// Strip quoted/forwarded thread so only the new reply text remains.
function cleanReply(raw) {
  if (!raw) return '';
  let t = String(raw);

  // Remove common quote markers that start a quoted block.
  const quoteMarkers = [
    /\nOn .+ wrote:[\s\S]*$/m,                // "On <date> <name> wrote:"
    /\n-----Original Message-----[\s\S]*$/i,  // Outlook desktop
    /\n_{2,}\s*From:[\s\S]*$/i,                // line of underscores then "From:"
    /\nFrom:.*?(\n|$)[\s\S]*$/m,              // crude fallback
    /\n>{1,}.*$/m,                             // > quoted lines
  ];
  for (const re of quoteMarkers) {
    const m = t.match(re);
    if (m) {
      const idx = t.indexOf(m[0]);
      if (idx > 0) t = t.slice(0, idx);
    }
  }

  // Trim trailing signature blocks separated by "-- " on its own line.
  const sigIdx = t.search(/\n-- \n/);
  if (sigIdx > 0) t = t.slice(0, sigIdx);

  return t.trim();
}

function htmlToText(html) {
  if (!html) return '';
  return String(html)
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}
