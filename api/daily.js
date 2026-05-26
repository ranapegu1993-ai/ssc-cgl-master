// ============================================================
// api/daily.js — Daily Content Generator
// Runs on GET (from app) and on cron trigger (daily 6 AM IST)
// Sources:
//   1. Wikimedia "On This Day" API  → History / GK questions
//   2. PIB RSS (pib.gov.in)          → Current affairs questions
//   3. Date-seeded procedural gen    → Quant / Reasoning questions
//   4. Wikipedia extract API         → Concept of the Day
// All stored in Vercel KV: key = "daily:YYYY-MM-DD"
// ============================================================

import { kv } from '@vercel/kv';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json',
};

// ── SEEDED RANDOM HELPERS ──────────────────────────────────────
function hashSeed(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) { h = Math.imul(31, h) + str.charCodeAt(i) | 0; }
  return Math.abs(h);
}

function seededRand(seed, min, max) {
  const x = Math.sin(seed + 1) * 10000;
  return min + Math.floor((x - Math.floor(x)) * (max - min + 1));
}

function shuffle(arr, seed) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = seededRand(seed + i, 0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── PROCEDURAL MATH QUESTION GENERATOR ────────────────────────
function generateMathQuestions(dateStr) {
  const base = hashSeed(dateStr);
  const questions = [];

  // Template 1 — Percentage
  {
    const cp = seededRand(base, 400, 1200);
    const pctArr = [5,8,10,12,15,18,20,25];
    const pct = pctArr[seededRand(base + 1, 0, pctArr.length - 1)];
    const sp = Math.round(cp * (1 + pct / 100));
    const wrong1 = sp + seededRand(base + 2, 10, 50);
    const wrong2 = sp - seededRand(base + 3, 10, 40);
    const wrong3 = Math.round(cp * (1 + (pct + 5) / 100));
    const opts = shuffle([sp, wrong1, wrong2, wrong3].map(v => `₹${v}`), base + 4);
    const ans = opts.indexOf(`₹${sp}`);
    questions.push({
      id: `dq_pct_${dateStr}`, subject: 'quantitative', topic: 'Profit and Loss', lvl: 2,
      q: `A shopkeeper buys an article for ₹${cp} and sells it at a profit of ${pct}%. What is the selling price?`,
      opts, ans, exp: `SP = CP × (1 + ${pct}/100) = ${cp} × ${(1 + pct/100).toFixed(2)} = ₹${sp}`
    });
  }

  // Template 2 — Simple Interest
  {
    const p = seededRand(base + 10, 3, 15) * 1000;
    const rArr = [4, 5, 6, 7, 8, 10, 12, 15];
    const r = rArr[seededRand(base + 11, 0, rArr.length - 1)];
    const t = seededRand(base + 12, 2, 5);
    const si = Math.round(p * r * t / 100);
    const wrong1 = si + seededRand(base + 13, 50, 200);
    const wrong2 = si - seededRand(base + 14, 50, 150);
    const wrong3 = Math.round(p * r * (t + 1) / 100);
    const opts = shuffle([si, wrong1, wrong2, wrong3].map(v => `₹${v}`), base + 15);
    const ans = opts.indexOf(`₹${si}`);
    questions.push({
      id: `dq_si_${dateStr}`, subject: 'quantitative', topic: 'Simple and Compound Interest', lvl: 2,
      q: `Find the Simple Interest on ₹${p} at ${r}% per annum for ${t} years.`,
      opts, ans, exp: `SI = P×R×T/100 = ${p}×${r}×${t}/100 = ₹${si}`
    });
  }

  // Template 3 — Time and Work
  {
    const a = seededRand(base + 20, 6, 18);
    const b = seededRand(base + 21, 8, 24);
    const lcm = a * b;
    const combined = (a * b) / (a + b);
    const combinedFrac = combined % 1 === 0 ? `${combined}` : `${Math.floor(combined * (a + b) / Math.gcd ? '' : '')}`;
    const num = a * b, den = a + b;
    const g = gcd(num, den);
    const dispNum = num / g, dispDen = den / g;
    const displayAns = dispDen === 1 ? `${dispNum} days` : `${dispNum}/${dispDen} days`;
    const wrong1 = `${seededRand(base + 22, Math.ceil(combined) - 2, Math.ceil(combined) + 2)} days`;
    const wrong2 = `${Math.round(combined + 2)} days`;
    const wrong3 = `${Math.round(combined - 1)} days`;
    const opts = shuffle([displayAns, wrong1, wrong2, wrong3], base + 23);
    const ans = opts.indexOf(displayAns);
    questions.push({
      id: `dq_tw_${dateStr}`, subject: 'quantitative', topic: 'Time and Work', lvl: 2,
      q: `A can complete a job in ${a} days and B can complete it in ${b} days. In how many days will they finish it working together?`,
      opts, ans, exp: `Combined rate = 1/${a} + 1/${b} = (${a}+${b})/(${a}×${b}) = ${a + b}/${a * b}. Days = ${a * b}/${a + b} = ${displayAns}`
    });
  }

  // Template 4 — Train / Speed
  {
    const speed_kmh = seededRand(base + 30, 4, 16) * 10; // 40-160 km/h
    const speed_ms = Math.round(speed_kmh * 1000 / 3600);
    const trainLen = seededRand(base + 31, 3, 12) * 50; // 150-600m
    const platformLen = seededRand(base + 32, 2, 8) * 50; // 100-400m
    const time = Math.round((trainLen + platformLen) / speed_ms);
    const wrong1 = `${Math.round(speed_kmh + 10)} km/h`;
    const wrong2 = `${Math.round(speed_kmh - 10)} km/h`;
    const wrong3 = `${Math.round(speed_kmh + 20)} km/h`;
    const correctAns = `${speed_kmh} km/h`;
    const opts = shuffle([correctAns, wrong1, wrong2, wrong3], base + 33);
    const ans = opts.indexOf(correctAns);
    questions.push({
      id: `dq_spd_${dateStr}`, subject: 'quantitative', topic: 'Speed Distance Time', lvl: 2,
      q: `A train of length ${trainLen}m crosses a platform of length ${platformLen}m in ${time} seconds. What is the speed of the train?`,
      opts, ans, exp: `Total distance = ${trainLen}+${platformLen} = ${trainLen + platformLen}m. Speed = ${trainLen + platformLen}/${time} m/s = ${speed_ms}×18/5 = ${speed_kmh} km/h`
    });
  }

  // Template 5 — Number Series / Reasoning
  {
    const start = seededRand(base + 40, 2, 8);
    const diff = seededRand(base + 41, 3, 9);
    const series = [start, start + diff, start + 2 * diff, start + 3 * diff, start + 4 * diff];
    const next = start + 5 * diff;
    const wrong1 = next + diff;
    const wrong2 = next - diff;
    const wrong3 = next + 2;
    const opts = shuffle([next, wrong1, wrong2, wrong3].map(String), base + 42);
    const ans = opts.indexOf(String(next));
    questions.push({
      id: `dq_ns_${dateStr}`, subject: 'reasoning', topic: 'Number Series', lvl: 1,
      q: `Find the next number in the series: ${series.join(', ')}, ?`,
      opts, ans, exp: `The series increases by ${diff} each time. ${series[series.length - 1]} + ${diff} = ${next}`
    });
  }

  return questions;
}

function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }

// ── WIKIMEDIA "ON THIS DAY" ────────────────────────────────────
async function fetchWikiHistory(month, day) {
  const url = `https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/events/${month}/${day}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'SSCCGLMaster/1.0 (Educational; contact@sscprep.com)' },
    signal: AbortSignal.timeout(7000),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.events || []).slice(0, 12);
}

function makeHistoryQuestions(events, dateStr) {
  const base = hashSeed(dateStr + 'history');
  const shuffled = shuffle(events, base);
  const questions = [];

  for (let i = 0; i < Math.min(4, shuffled.length); i++) {
    const ev = shuffled[i];
    const text = ev.text || '';
    const year = ev.year;
    if (!text || !year) continue;

    // Pattern A — Year question
    if (i % 2 === 0) {
      const correctYear = String(year);
      const wrongYears = [year - 2, year + 2, year - 1, year + 3, year + 1, year - 3]
        .filter(y => y > 1800 && y < 2024)
        .slice(0, 3)
        .map(String);
      if (wrongYears.length < 3) continue;
      const opts = shuffle([correctYear, ...wrongYears], base + i * 7);
      const ans = opts.indexOf(correctYear);
      const shortText = text.length > 90 ? text.slice(0, 90) + '...' : text;
      questions.push({
        id: `dq_hist_yr_${dateStr}_${i}`, subject: 'general_awareness',
        topic: 'Modern History', lvl: 2,
        q: `In which year did the following event take place: "${shortText}"`,
        opts, ans, exp: `This event occurred in ${year}. ${text.slice(0, 120)}`,
      });
    } else {
      // Pattern B — Event description question
      const pages = ev.pages || [];
      if (!pages.length) continue;
      const title = pages[0]?.titles?.normalized || pages[0]?.title || '';
      if (!title || title.length < 4) continue;
      const otherTitles = shuffled
        .filter((_, j) => j !== i)
        .map(e => (e.pages?.[0]?.titles?.normalized || e.pages?.[0]?.title || ''))
        .filter(t => t && t.length > 3)
        .slice(0, 3);
      if (otherTitles.length < 3) continue;
      const opts = shuffle([title, ...otherTitles], base + i * 11);
      const ans = opts.indexOf(title);
      const shortText = text.length > 80 ? text.slice(0, 80) + '...' : text;
      questions.push({
        id: `dq_hist_ev_${dateStr}_${i}`, subject: 'general_awareness',
        topic: 'Modern History', lvl: 2,
        q: `On this day in history (${year}): "${shortText}". What is this event primarily associated with?`,
        opts, ans, exp: `${text}`,
      });
    }
  }
  return questions;
}

// ── PIB CURRENT AFFAIRS ────────────────────────────────────────
async function fetchPIBNews() {
  const url = 'https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=3';
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 SSCCGLMaster/1.0' },
    signal: AbortSignal.timeout(7000),
  });
  if (!res.ok) return [];
  const xml = await res.text();
  const items = [];
  const re = /<item>[\s\S]*?<title><!\[CDATA\[(.*?)\]\]><\/title>[\s\S]*?<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>[\s\S]*?<\/item>/g;
  let m;
  while ((m = re.exec(xml)) !== null && items.length < 15) {
    const title = m[1]?.trim();
    const desc = m[2]?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200);
    if (title && title.length > 10) items.push({ title, desc: desc || '' });
  }
  return items;
}

function makeCurrentAffairsQuestions(items, dateStr) {
  const base = hashSeed(dateStr + 'pib');
  if (items.length < 4) return [];
  const shuffled = shuffle(items, base);
  const questions = [];

  for (let i = 0; i < Math.min(3, shuffled.length - 3); i++) {
    const item = shuffled[i];
    const title = item.title;
    // Extract key phrase (first ~50 chars)
    const keyPhrase = title.slice(0, 60);
    const correct = title.slice(0, 55) + (title.length > 55 ? '...' : '');
    const wrongs = shuffled.slice(i + 1, i + 4).map(it => it.title.slice(0, 55) + (it.title.length > 55 ? '...' : ''));
    if (wrongs.length < 3) continue;
    const opts = shuffle([correct, ...wrongs], base + i * 13);
    const ans = opts.indexOf(correct);
    questions.push({
      id: `dq_ca_${dateStr}_${i}`, subject: 'general_awareness',
      topic: 'Current Affairs', lvl: 2,
      q: `Which of the following is a recent news headline from the Government of India press releases?`,
      opts, ans, exp: `Source: PIB (Press Information Bureau, Government of India). "${title}". ${item.desc}`,
    });
  }
  return questions;
}

// ── CONCEPT OF THE DAY ─────────────────────────────────────────
async function fetchConceptOfDay(events, dateStr) {
  // Use the first wiki event's main page to get a concept
  const base = hashSeed(dateStr);
  if (!events.length) return null;

  // Pick a page from the wiki events
  const ev = events[base % events.length];
  const pages = ev?.pages || [];
  if (!pages.length) return null;

  const pageTitle = pages[0]?.titles?.canonical || pages[0]?.title;
  if (!pageTitle) return null;

  try {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageTitle)}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'SSCCGLMaster/1.0' },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      title: data.title,
      summary: data.extract?.slice(0, 600) || '',
      thumbnail: data.thumbnail?.source || null,
      url: data.content_urls?.desktop?.page || null,
      topic: 'Modern History',
      icon: '📖',
    };
  } catch {
    return null;
  }
}

// ── MAIN HANDLER ──────────────────────────────────────────────
export default async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(200).end();

  const now = new Date();
  // IST = UTC + 5:30
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(now.getTime() + istOffset);
  const today = istNow.toISOString().split('T')[0]; // YYYY-MM-DD in IST

  const isRefresh = req.query?.refresh === 'true';

  // Return cached if available and not a forced refresh
  if (!isRefresh) {
    try {
      const cached = await kv.get(`daily:${today}`);
      if (cached?.questions?.length) {
        return res.status(200).json({ ...cached, cached: true });
      }
    } catch { /* KV not connected yet — proceed to generate */ }
  }

  // Generate fresh daily content
  const month = istNow.getMonth() + 1; // 1-12
  const day = istNow.getDate();

  let historyEvents = [];
  let pibNews = [];

  // Fetch sources in parallel with fallback
  try {
    [historyEvents, pibNews] = await Promise.allSettled([
      fetchWikiHistory(month, day),
      fetchPIBNews(),
    ]).then(results => results.map(r => r.status === 'fulfilled' ? r.value : []));
  } catch { /* continue with empty */ }

  // Build question sets
  const mathQs    = generateMathQuestions(today);
  const historyQs = makeHistoryQuestions(historyEvents, today);
  const currentQs = makeCurrentAffairsQuestions(pibNews, today);

  // Combine: prefer real scraped content, pad with math
  const combined = [...historyQs, ...currentQs, ...mathQs];
  const seed = hashSeed(today);
  const questions = shuffle(combined, seed).slice(0, 10);

  // Concept of the Day
  const concept = await fetchConceptOfDay(historyEvents, today).catch(() => null);

  const dailyData = {
    date: today,
    displayDate: istNow.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    questions,
    concept,
    sources: {
      history: historyQs.length,
      currentAffairs: currentQs.length,
      math: mathQs.length,
    },
    generatedAt: new Date().toISOString(),
    cached: false,
  };

  // Store in KV (expires after 30 hours so cron regenerates fresh each day)
  try {
    await kv.set(`daily:${today}`, dailyData, { ex: 108000 });
  } catch { /* KV not set up — still return data */ }

  return res.status(200).json(dailyData);
}
