// api/user.js — Vercel Serverless Function (CommonJS)
// GET /api/user?uid=dulip  → load user data from Vercel KV
// POST /api/user { uid, data } → save user data to Vercel KV

const VALID_UIDS = ['dulip', 'udit', 'rana'];

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

module.exports = async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Lazy-load KV — works only when connected on Vercel
  let kv;
  try {
    kv = (await import('@vercel/kv')).kv;
  } catch {
    // KV not connected yet — return null gracefully (localStorage takes over)
    if (req.method === 'GET') return res.status(200).json(null);
    return res.status(200).json({ ok: true, warn: 'KV not connected' });
  }

  if (req.method === 'GET') {
    const uid = (req.query?.uid || '').toLowerCase();
    if (!VALID_UIDS.includes(uid)) return res.status(200).json(null);
    try {
      const data = await kv.get(`user:${uid}`);
      return res.status(200).json(data ?? null);
    } catch {
      return res.status(200).json(null);
    }
  }

  if (req.method === 'POST') {
    const { uid, data } = req.body || {};
    if (!uid || !VALID_UIDS.includes(uid) || !data) {
      return res.status(400).json({ error: 'Missing uid or data' });
    }
    try {
      await kv.set(`user:${uid}`, data);
      return res.status(200).json({ ok: true });
    } catch {
      return res.status(500).json({ error: 'Storage error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
