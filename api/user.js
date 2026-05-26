// api/user.js — Vercel Serverless Function
// Reads and writes user data using Vercel KV (free Redis-backed storage)
// Endpoint: GET /api/user?uid=dulip  |  POST /api/user { uid, data }

import { kv } from '@vercel/kv';

const VALID_UIDS = ['dulip', 'udit', 'rana'];

export default async function handler(req, res) {
  // CORS headers — allow the browser to call this from any origin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // ── GET: load user data ──────────────────────────────────────
  if (req.method === 'GET') {
    const uid = (req.query.uid || '').toLowerCase();
    if (!VALID_UIDS.includes(uid)) return res.status(200).json(null);

    try {
      const data = await kv.get(`user:${uid}`);
      return res.status(200).json(data ?? null);
    } catch (err) {
      console.error('KV GET error:', err);
      return res.status(200).json(null); // graceful fallback
    }
  }

  // ── POST: save user data ─────────────────────────────────────
  if (req.method === 'POST') {
    const { uid, data } = req.body || {};

    if (!uid || !VALID_UIDS.includes(uid) || !data) {
      return res.status(400).json({ error: 'Missing uid or data' });
    }

    try {
      await kv.set(`user:${uid}`, data);
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('KV SET error:', err);
      return res.status(500).json({ error: 'Storage error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
