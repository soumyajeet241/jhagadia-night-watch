// Vercel serverless function — POST /api/notify
// Sends an email to the area HOD when a new incident is created.
//
// Required env vars on Vercel:
//   RESEND_API_KEY   — your Resend API key
//   FROM_EMAIL       — the sending address (e.g. alerts@<your-id>.resend.app)
//   REPLY_TO_DOMAIN  — the inbound domain (e.g. <your-id>.resend.app)
//   PUBLIC_SITE_URL  — the deployed site URL (used in email links)

import { Resend } from 'resend';

// Area → leader mapping. Keep this in sync with src/lib/config.js.
// (We duplicate it here because the API runs server-side and can't import from src/.)
const AREA_LEADERS = {
  'Caustic Soda Plant':              { name: 'HOD — Caustic Soda',     email: 'caustic.hod@example.com' },
  'Power Plant':                     { name: 'HOD — Power Plant',      email: 'power.hod@example.com' },
  'Aluminium Chloride Plant':        { name: 'HOD — Al. Chloride',     email: 'alcl.hod@example.com' },
  'ECH Plant':                       { name: 'HOD — ECH',              email: 'ech.hod@example.com' },
  'H2O2 Plant':                      { name: 'HOD — H2O2',             email: 'h2o2.hod@example.com' },
  'Raw Material Storage & Handling': { name: 'HOD — Raw Materials',    email: 'rawmat.hod@example.com' },
  'ANSS Plant':                      { name: 'HOD — ANSS',             email: 'anss.hod@example.com' },
  'SRS Plant':                       { name: 'HOD — SRS',              email: 'srs.hod@example.com' },
  'Primary Brine Purification':      { name: 'HOD — Primary Brine',    email: 'brine1.hod@example.com' },
  'Secondary Brine Purification':    { name: 'HOD — Secondary Brine',  email: 'brine2.hod@example.com' },
  'Ion Exchange Column Area':        { name: 'HOD — Ion Exchange',     email: 'ionx.hod@example.com' },
  'Salt Saturator':                  { name: 'HOD — Salt Saturator',   email: 'salt.hod@example.com' },
  'Office & Non-Production Area':    { name: 'Admin Head',             email: 'admin.hod@example.com' },
  'Parking & Open Sky Area':         { name: 'Security Head',          email: 'security.hod@example.com' },
};

const CATEGORY_LABELS = {
  unsafe: 'Unsafe Condition',
  sleep: 'Sleeping Personnel',
  ppe: 'PPE Non-Compliance',
  infra: 'Infrastructural Improvement Required',
  operator: 'Non-Availability of Operator at Critical Areas',
  logistics: 'Logistics Improvement Required',
  other: 'Any Other Observation',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.FROM_EMAIL;
  const replyDomain = process.env.REPLY_TO_DOMAIN;
  const siteUrl = process.env.PUBLIC_SITE_URL || '';

  if (!apiKey || !fromEmail || !replyDomain) {
    console.warn('[notify] Email env vars missing; skipping send.');
    return res.status(200).json({ skipped: true, reason: 'env_missing' });
  }

  try {
    const { incident } = req.body || {};
    if (!incident || !incident.id) {
      return res.status(400).json({ error: 'incident payload missing' });
    }

    const leader = AREA_LEADERS[incident.area];
    const recipient = leader?.email;
    if (!recipient) {
      console.warn('[notify] No leader email mapped for area:', incident.area);
      return res.status(200).json({ skipped: true, reason: 'no_recipient' });
    }

    // Reply-To address that routes back to our inbound webhook.
    // Resend forwards anything@<replyDomain> to the configured webhook.
    const replyTo = `incident+${incident.id}@${replyDomain}`;

    const subject = `[Action Needed] Safety Incident ${incident.id} — ${incident.area} — ${CATEGORY_LABELS[incident.category] || incident.category}`;

    const html = renderEmail(incident, leader, siteUrl);

    const resend = new Resend(apiKey);
    const result = await resend.emails.send({
      from: `Night Watch <${fromEmail}>`,
      to: recipient,
      replyTo,
      subject,
      html,
    });

    if (result.error) {
      console.error('[notify] resend error:', result.error);
      return res.status(500).json({ error: 'email_send_failed', detail: result.error });
    }

    return res.status(200).json({ ok: true, recipient, id: result.data?.id });
  } catch (err) {
    console.error('[notify] exception:', err);
    return res.status(500).json({ error: 'internal_error', message: err.message });
  }
}

function renderEmail(incident, leader, siteUrl) {
  const cat = CATEGORY_LABELS[incident.category] || incident.category;
  const submitted = new Date(incident.submitted_at).toLocaleString('en-IN', {
    dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata',
  });
  const sevColor = { Low: '#15803D', Medium: '#B45309', High: '#C2410C', Critical: '#991B1B' }[incident.severity] || '#6B645B';

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F4F1EA;font-family:Arial,sans-serif;color:#14110F;">
  <div style="max-width:600px;margin:0 auto;background:#FBF9F4;">
    <div style="background:#1A1D22;padding:20px 24px;color:#fff;">
      <div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;opacity:0.6;margin-bottom:6px;">Night Watch · Action Needed</div>
      <div style="font-size:24px;font-weight:bold;">Safety Incident Reported</div>
      <div style="font-size:13px;opacity:0.7;margin-top:4px;font-family:monospace;">${incident.id}</div>
    </div>

    <div style="padding:24px;">
      <p style="margin:0 0 16px 0;line-height:1.5;">
        Hello ${leader?.name || 'HOD'},<br><br>
        A safety incident has just been reported at the <strong>${incident.area}</strong> during night shift.
        Your acknowledgement and any corrective action are needed.
      </p>

      <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin:20px 0;font-size:14px;">
        <tr><td style="padding:8px 12px;background:#EBE7DD;width:40%;color:#6B645B;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Reported at</td><td style="padding:8px 12px;border-bottom:1px solid #D9D2C5;">${submitted}</td></tr>
        <tr><td style="padding:8px 12px;background:#EBE7DD;color:#6B645B;font-size:12px;text-transform:uppercase;letter-spacing:1px;">By</td><td style="padding:8px 12px;border-bottom:1px solid #D9D2C5;">${escapeHtml(incident.reporter_name)}</td></tr>
        <tr><td style="padding:8px 12px;background:#EBE7DD;color:#6B645B;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Area</td><td style="padding:8px 12px;border-bottom:1px solid #D9D2C5;"><strong>${escapeHtml(incident.area)}</strong></td></tr>
        <tr><td style="padding:8px 12px;background:#EBE7DD;color:#6B645B;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Category</td><td style="padding:8px 12px;border-bottom:1px solid #D9D2C5;">${escapeHtml(cat)}</td></tr>
        <tr><td style="padding:8px 12px;background:#EBE7DD;color:#6B645B;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Severity</td><td style="padding:8px 12px;border-bottom:1px solid #D9D2C5;color:${sevColor};font-weight:bold;">${incident.severity}</td></tr>
        <tr><td style="padding:8px 12px;background:#EBE7DD;color:#6B645B;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Location</td><td style="padding:8px 12px;border-bottom:1px solid #D9D2C5;">${escapeHtml(incident.location)}</td></tr>
      </table>

      <h3 style="font-size:13px;text-transform:uppercase;letter-spacing:1.5px;color:#6B645B;margin:20px 0 6px 0;">Description</h3>
      <p style="margin:0;line-height:1.6;background:#FEF3C7;padding:12px;border-left:3px solid #D97706;">${escapeHtml(incident.description)}</p>

      ${incident.immediate_action ? `
        <h3 style="font-size:13px;text-transform:uppercase;letter-spacing:1.5px;color:#6B645B;margin:20px 0 6px 0;">Immediate Action Taken</h3>
        <p style="margin:0;line-height:1.6;">${escapeHtml(incident.immediate_action)}</p>
      ` : ''}

      ${incident.photo_url ? `
        <h3 style="font-size:13px;text-transform:uppercase;letter-spacing:1.5px;color:#6B645B;margin:20px 0 6px 0;">Photo evidence</h3>
        <a href="${incident.photo_url}" target="_blank" style="display:inline-block;margin-bottom:8px;">
          <img src="${incident.photo_url}" alt="Incident photo" style="max-width:100%;height:auto;border-radius:2px;border:1px solid #D9D2C5;"/>
        </a>
      ` : ''}

      <div style="background:#FEE2E2;border:1px solid #FCA5A5;padding:14px;margin:24px 0;border-radius:2px;">
        <p style="margin:0;color:#991B1B;font-weight:bold;">Reply to this email with your acknowledgement and any corrective action.</p>
        <p style="margin:6px 0 0 0;font-size:13px;color:#7C2D12;">Your reply will be captured automatically and shown on the leadership dashboard. <strong>Do not change the subject line.</strong></p>
      </div>

      ${siteUrl ? `<p style="text-align:center;margin:20px 0;"><a href="${siteUrl}/dashboard" style="display:inline-block;background:#D97706;color:#fff;padding:10px 20px;text-decoration:none;border-radius:2px;font-weight:bold;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Open dashboard</a></p>` : ''}
    </div>

    <div style="padding:14px 24px;background:#EBE7DD;font-size:11px;color:#6B645B;text-align:center;">
      DCM Shriram Chemicals · Jhagadia · Bharuch · Night Shift Safety System
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(s) {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
