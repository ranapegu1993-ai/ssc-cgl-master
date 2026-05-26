// api/daily.js — Daily Content Generator (CommonJS)
// GET /api/daily          → returns today's content (cached or fresh)
// GET /api/daily?refresh  → forces a fresh scrape (called by cron)

const VALID_UIDS = ['dulip', 'udit', 'rana'];

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json',
};

// ── Seeded random ──────────────────────────────────────────────
function hashSeed(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
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
function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }

// ── Math question generator ────────────────────────────────────
function generateMathQuestions(dateStr) {
  const base = hashSeed(dateStr);
  const qs = [];

  // Percentage / Profit-Loss
  {
    const cp = seededRand(base, 400, 1200);
    const pcts = [5,8,10,12,15,18,20,25];
    const pct = pcts[seededRand(base+1, 0, pcts.length-1)];
    const sp = Math.round(cp * (1 + pct/100));
    const opts = shuffle([sp, sp+seededRand(base+2,10,50), sp-seededRand(base+3,10,40), Math.round(cp*(1+(pct+5)/100))].map(v=>'₹'+v), base+4);
    qs.push({ id:'dq_pct_'+dateStr, subject:'quantitative', topic:'Profit and Loss', lvl:2,
      q:`A shopkeeper buys an article for ₹${cp} and sells it at ${pct}% profit. Find the selling price.`,
      opts, ans:opts.indexOf('₹'+sp), exp:`SP = ${cp} × ${(1+pct/100).toFixed(2)} = ₹${sp}` });
  }

  // Simple Interest
  {
    const p = seededRand(base+10, 3, 15) * 1000;
    const rs = [4,5,6,7,8,10,12,15];
    const r = rs[seededRand(base+11, 0, rs.length-1)];
    const t = seededRand(base+12, 2, 5);
    const si = Math.round(p*r*t/100);
    const opts = shuffle([si, si+seededRand(base+13,50,200), si-seededRand(base+14,50,150), Math.round(p*r*(t+1)/100)].map(v=>'₹'+v), base+15);
    qs.push({ id:'dq_si_'+dateStr, subject:'quantitative', topic:'Simple and Compound Interest', lvl:2,
      q:`Find Simple Interest on ₹${p} at ${r}% per annum for ${t} years.`,
      opts, ans:opts.indexOf('₹'+si), exp:`SI = ${p}×${r}×${t}/100 = ₹${si}` });
  }

  // Time and Work
  {
    const a = seededRand(base+20, 6, 18);
    const b = seededRand(base+21, 8, 24);
    const n = a*b, d = a+b;
    const g = gcd(n, d);
    const dn = n/g, dd = d/g;
    const ans = dd===1 ? `${dn} days` : `${dn}/${dd} days`;
    const w1 = `${Math.ceil(n/d)+1} days`, w2 = `${Math.ceil(n/d)+2} days`, w3 = `${Math.ceil(n/d)-1} days`;
    const opts = shuffle([ans, w1, w2, w3], base+22);
    qs.push({ id:'dq_tw_'+dateStr, subject:'quantitative', topic:'Time and Work', lvl:2,
      q:`A can do a job in ${a} days and B in ${b} days. Together they finish in:`,
      opts, ans:opts.indexOf(ans), exp:`Combined: 1/${a}+1/${b} = ${d}/${n}, so time = ${n}/${d} = ${ans}` });
  }

  // Speed-Distance
  {
    const kmh = seededRand(base+30, 4, 16)*10;
    const ms = Math.round(kmh*1000/3600);
    const tl = seededRand(base+31, 3, 12)*50;
    const pl = seededRand(base+32, 2, 8)*50;
    const time = Math.round((tl+pl)/ms);
    const correct = `${kmh} km/h`;
    const opts = shuffle([correct, `${kmh+10} km/h`, `${kmh-10} km/h`, `${kmh+20} km/h`], base+33);
    qs.push({ id:'dq_spd_'+dateStr, subject:'quantitative', topic:'Speed Distance Time', lvl:2,
      q:`A ${tl}m train crosses a ${pl}m platform in ${time} seconds. Speed of train?`,
      opts, ans:opts.indexOf(correct), exp:`Distance=${tl+pl}m, Speed=${tl+pl}/${time}=${ms} m/s = ${kmh} km/h` });
  }

  // Number Series
  {
    const s = seededRand(base+40, 2, 8);
    const diff = seededRand(base+41, 3, 9);
    const series = [s, s+diff, s+2*diff, s+3*diff, s+4*diff];
    const next = s+5*diff;
    const opts = shuffle([next, next+diff, next-diff, next+2].map(String), base+42);
    qs.push({ id:'dq_ns_'+dateStr, subject:'reasoning', topic:'Number Series', lvl:1,
      q:`Find the next number: ${series.join(', ')}, ?`,
      opts, ans:opts.indexOf(String(next)), exp:`Series increases by ${diff} each time. Answer: ${next}` });
  }

  return qs;
}

// ── Wikipedia "On This Day" ────────────────────────────────────
async function fetchWikiHistory(month, day) {
  const url = `https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/events/${month}/${day}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'SSCCGLMaster/1.0 (Educational)' },
    signal: AbortSignal.timeout(7000),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.events || []).filter(e => e.year && e.text).slice(0, 12);
}

function makeHistoryQuestions(events, dateStr) {
  const base = hashSeed(dateStr + 'h');
  const shuffled = shuffle(events, base);
  const qs = [];

  for (let i = 0; i < Math.min(4, shuffled.length); i++) {
    const ev = shuffled[i];
    const year = ev.year, text = (ev.text || '').slice(0, 100);
    if (!year || !text) continue;

    if (i % 2 === 0) {
      // Year question
      const yOpts = [year, year-2, year+2, year+1].map(String);
      const opts = shuffle(yOpts, base+i*7);
      const ans = opts.indexOf(String(year));
      qs.push({ id:`dq_hy_${dateStr}_${i}`, subject:'general_awareness', topic:'Modern History', lvl:2,
        q:`In which year did this event occur? "${text}..."`,
        opts, ans, exp:`This event happened in ${year}. ${ev.text}` });
    } else {
      // Topic question using page titles
      const pages = (ev.pages || []).filter(p => p.titles?.normalized || p.title);
      if (!pages.length) continue;
      const title = pages[0].titles?.normalized || pages[0].title;
      const others = shuffled.filter((_,j)=>j!==i).slice(0,3)
        .map(e=>(e.pages?.[0]?.titles?.normalized||e.pages?.[0]?.title||'').slice(0,50))
        .filter(t=>t.length>3);
      if (others.length < 3) continue;
      const opts = shuffle([title.slice(0,50), ...others], base+i*11);
      const ans = opts.indexOf(title.slice(0,50));
      qs.push({ id:`dq_he_${dateStr}_${i}`, subject:'general_awareness', topic:'Modern History', lvl:2,
        q:`"${text.slice(0,80)}..." — this event is associated with:`,
        opts, ans, exp:`${ev.text}` });
    }
  }
  return qs;
}

// ── PIB Current Affairs ────────────────────────────────────────
async function fetchPIBNews() {
  const res = await fetch('https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=3', {
    headers: { 'User-Agent': 'Mozilla/5.0 SSCCGLMaster/1.0' },
    signal: AbortSignal.timeout(7000),
  });
  if (!res.ok) return [];
  const xml = await res.text();
  const items = [];
  const re = /<title><!\[CDATA\[(.*?)\]\]><\/title>[\s\S]*?<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/g;
  let m;
  while ((m = re.exec(xml)) !== null && items.length < 15) {
    const title = m[1]?.trim();
    const desc = m[2]?.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim().slice(0,200);
    if (title && title.length > 10 && !title.includes('PIB')) items.push({ title, desc: desc||'' });
  }
  return items;
}

function makeCurrentAffairsQuestions(items, dateStr) {
  const base = hashSeed(dateStr+'pib');
  if (items.length < 4) return [];
  const shuffled = shuffle(items, base);
  const qs = [];
  for (let i = 0; i < Math.min(3, shuffled.length-3); i++) {
    const item = shuffled[i];
    const correct = item.title.slice(0,55)+(item.title.length>55?'...':'');
    const wrongs = shuffled.slice(i+1,i+4).map(it=>it.title.slice(0,55)+(it.title.length>55?'...':''));
    if (wrongs.length < 3) continue;
    const opts = shuffle([correct,...wrongs], base+i*13);
    const ans = opts.indexOf(correct);
    qs.push({ id:`dq_ca_${dateStr}_${i}`, subject:'general_awareness', topic:'Current Affairs', lvl:2,
      q:`Which of the following is a recent Government of India press release headline?`,
      opts, ans, exp:`Source: PIB (Press Information Bureau). "${item.title}". ${item.desc}` });
  }
  return qs;
}

// ── Concept of the Day (Wikipedia summary) ────────────────────
async function fetchConcept(events, dateStr) {
  if (!events.length) return null;
  const base = hashSeed(dateStr);
  const ev = events[base % events.length];
  const page = (ev.pages||[])[0];
  const title = page?.titles?.canonical || page?.title;
  if (!title) return null;
  try {
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`, {
      headers:{'User-Agent':'SSCCGLMaster/1.0'}, signal: AbortSignal.timeout(6000)
    });
    if (!res.ok) return null;
    const d = await res.json();
    return { title: d.title, summary: (d.extract||'').slice(0,600),
      thumbnail: d.thumbnail?.source||null, url: d.content_urls?.desktop?.page||null, topic:'Modern History', icon:'📖' };
  } catch { return null; }
}

// ── Main handler ──────────────────────────────────────────────
module.exports = async function handler(req, res) {
  Object.entries(CORS).forEach(([k,v])=>res.setHeader(k,v));
  if (req.method === 'OPTIONS') return res.status(200).end();

  // IST date
  const istNow = new Date(Date.now() + 5.5*3600*1000);
  const today = istNow.toISOString().split('T')[0];
  const month = istNow.getUTCMonth()+1, day = istNow.getUTCDate();
  const isRefresh = req.query?.refresh !== undefined;

  // Try cached
  let kv;
  try { kv = (await import('@vercel/kv')).kv; } catch { kv = null; }

  if (!isRefresh && kv) {
    try {
      const cached = await kv.get(`daily:${today}`);
      if (cached?.questions?.length) return res.status(200).json({...cached, cached:true});
    } catch {}
  }

  // Fetch sources in parallel
  let events=[], news=[];
  try {
    const results = await Promise.allSettled([fetchWikiHistory(month,day), fetchPIBNews()]);
    events = results[0].status==='fulfilled' ? results[0].value : [];
    news   = results[1].status==='fulfilled' ? results[1].value : [];
  } catch {}

  const mathQs    = generateMathQuestions(today);
  const historyQs = makeHistoryQuestions(events, today);
  const currentQs = makeCurrentAffairsQuestions(news, today);
  const concept   = await fetchConcept(events, today).catch(()=>null);

  const seed = hashSeed(today);
  const questions = shuffle([...historyQs,...currentQs,...mathQs], seed).slice(0,10);
  const sources = { history:historyQs.length, currentAffairs:currentQs.length, math:mathQs.length };

  const displayDate = istNow.toLocaleDateString('en-IN', {weekday:'long',day:'numeric',month:'long',year:'numeric'});
  const daily = { date:today, displayDate, questions, concept, sources, generatedAt:new Date().toISOString(), cached:false };

  if (kv) {
    try { await kv.set(`daily:${today}`, daily, { ex: 108000 }); } catch {}
  }

  return res.status(200).json(daily);
};
