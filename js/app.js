// ============================================================
// SSC CGL MASTER — FULL PLEDGE EDITION
// Gamified · Database-backed · Fun to learn
// ============================================================

// ── STATE ────────────────────────────────────────────────────
const STATE = {
  currentUser: null, view: 'login', params: {},
  currentTest: null, currentAnswers: {}, currentQuestionIndex: 0,
  timerInterval: null, timeLeft: 0, testStartTime: null,
  bookmarked: new Set(), confidenceMap: {},
  lastAnalysis: null, lastResult: null, lastAnswers: {},
  flashcardIndex: 0, flashcardTopicIndex: 0, flashcardFlipped: false,
  dailyContent: null, dailyLoading: false,
};

// ── USERS ────────────────────────────────────────────────────
const USERS = {
  dulip: { id:'dulip', name:'Dulip Pegu',  role:'candidate', avatar:'DP', color:'#6366F1', email:'dulip@sscprep.com', password:'SSCprep@dulip.2026' },
  udit:  { id:'udit',  name:'Udit Doley',  role:'candidate', avatar:'UD', color:'#0EA5E9', email:'udit@sscprep.com',  password:'SSCprep@udit.2026'  },
  rana:  { id:'rana',  name:'Rana Pegu',   role:'examiner',  avatar:'RP', color:'#8B5CF6', email:'rana@sscprep.com',  password:'SSCprep@rana.2026'  },
};
const CREDENTIALS = {};
Object.values(USERS).forEach(u => { CREDENTIALS[u.email.toLowerCase()] = u; });

// ── GAMIFICATION ─────────────────────────────────────────────
const LEVEL_XP = [0,100,250,450,700,1000,1350,1750,2200,2700,3250,3900,4600,5400,6300];
const LEVEL_TITLES = ['Newcomer','Learner','Student','Scholar','Practitioner',
  'Expert','Champion','Master','Elite','Legend','Grand Master','Supreme','Prodigy','Genius','SSC Titan'];
const LEVEL_ICONS = ['🌱','📖','✏️','🎓','💡','⭐','🏅','🏆','💎','🔥','⚡','🌟','🎯','🧠','👑'];

function getLevelInfo(xp) {
  let level = 1;
  for (let i = 0; i < LEVEL_XP.length; i++) { if (xp >= LEVEL_XP[i]) level = i + 1; }
  level = Math.min(level, LEVEL_XP.length);
  const cur = LEVEL_XP[level-1] || 0;
  const nxt = LEVEL_XP[level] || LEVEL_XP[LEVEL_XP.length-1];
  const pct = level >= LEVEL_XP.length ? 100 : Math.round((xp-cur)/(nxt-cur)*100);
  return { level, title: LEVEL_TITLES[level-1], icon: LEVEL_ICONS[level-1], pct, cur, nxt, xp };
}

function calcXPGain(analysis, testType, streak) {
  const base = analysis.correct * 10 - analysis.wrong * 2;
  const bonus = testType === 'full' ? 50 : testType === 'daily' ? 30 : 20;
  const dailyMult = testType === 'daily' ? 2 : 1;  // 2× XP for daily challenge
  const streakMult = streak >= 7 ? 1.5 : streak >= 3 ? 1.2 : 1;
  return Math.max(0, Math.round((base + bonus) * dailyMult * streakMult));
}

const BADGES = {
  first_step:    { icon:'🎯', name:'First Step',    desc:'Completed your first test' },
  hat_trick:     { icon:'🎩', name:'Hat Trick',      desc:'Completed 3 tests' },
  committed:     { icon:'💪', name:'Committed',      desc:'Completed 10 tests' },
  marathon:      { icon:'🏃', name:'Marathon',       desc:'Completed 25 tests' },
  streak_3:      { icon:'🔥', name:'On Fire',        desc:'3-day study streak' },
  streak_7:      { icon:'⚡', name:'Lightning',      desc:'7-day streak — incredible!' },
  streak_14:     { icon:'🌟', name:'Unstoppable',    desc:'14-day streak — legend!' },
  ace:           { icon:'🏆', name:'Ace',            desc:'Scored 90%+ on a full test' },
  perfectionist: { icon:'💎', name:'Perfectionist',  desc:'Scored 100% on any test' },
  rising_star:   { icon:'⭐', name:'Rising Star',    desc:'Earned 500 XP' },
  star_student:  { icon:'🌠', name:'Star Student',   desc:'Earned 1,000 XP' },
  night_owl:     { icon:'🦉', name:'Night Owl',      desc:'Studied late at night' },
};

function checkNewBadges(data) {
  const prev = new Set(data.badges || []);
  const earned = new Set(prev);
  const fresh = [];
  const add = (k) => { if (!prev.has(k)) { earned.add(k); fresh.push(k); } };
  if (data.totalTests >= 1)  add('first_step');
  if (data.totalTests >= 3)  add('hat_trick');
  if (data.totalTests >= 10) add('committed');
  if (data.totalTests >= 25) add('marathon');
  if ((data.streak||0) >= 3)  add('streak_3');
  if ((data.streak||0) >= 7)  add('streak_7');
  if ((data.streak||0) >= 14) add('streak_14');
  if ((data.results||[]).some(r => r.testType==='full' && parseFloat(r.percentage)>=90)) add('ace');
  if ((data.results||[]).some(r => parseFloat(r.percentage)>=99.9)) add('perfectionist');
  if ((data.xp||0)>=500)  add('rising_star');
  if ((data.xp||0)>=1000) add('star_student');
  const h = new Date().getHours();
  if (h>=22||h<4) add('night_owl');
  return { earned:[...earned], fresh };
}

// ── SERVER SYNC (Netlify Blobs) ───────────────────────────────
const API_URL = '/api/user';
let _debounce = {};

const EMPTY_USER = (uid) => ({
  id:uid, results:[], streak:0, lastActive:null,
  totalTests:0, totalCorrect:0, totalAttempted:0,
  topicScores:{}, timeLog:{}, xp:0, badges:[],
});

function ls(key, val) {
  if (val===undefined) { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } }
  localStorage.setItem(key, JSON.stringify(val));
}
function getUserData(uid) { return ls(`user_${uid}`) || EMPTY_USER(uid); }
function saveUserData(uid, data) {
  ls(`user_${uid}`, data);
  clearTimeout(_debounce[uid]);
  _debounce[uid] = setTimeout(() => {
    fetch(API_URL, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({uid,data}) })
      .catch(()=>{});
  }, 1500);
}

async function pullFromServer(uid) {
  try {
    const res = await fetch(`${API_URL}?uid=${uid}`);
    if (!res.ok) return;
    const srv = await res.json();
    if (!srv) return;
    const loc = ls(`user_${uid}`);
    const srvTests = srv.totalTests||0, locTests = loc ? (loc.totalTests||0) : 0;
    if (srvTests > locTests) ls(`user_${uid}`, srv);
    else if (locTests > srvTests && loc) {
      fetch(API_URL, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({uid,data:loc})}).catch(()=>{});
    }
  } catch {}
}

function forceSyncNow() {
  const uid = STATE.currentUser?.id; if (!uid) return;
  const btn = document.getElementById('sync-btn');
  if (btn) { btn.textContent='⏳'; btn.disabled=true; }
  fetch(API_URL, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({uid,data:getUserData(uid)})})
    .then(()=>{ if(btn){btn.textContent='✅';setTimeout(()=>{btn.textContent='☁️';btn.disabled=false;},2000);} })
    .catch(()=>{ if(btn){btn.textContent='❌';btn.disabled=false;} });
}

// ── TOAST SYSTEM ─────────────────────────────────────────────
function toast(msg, type='info', duration=3200) {
  const container = document.getElementById('toast-root') || (() => {
    const d = document.createElement('div'); d.id='toast-root';
    document.body.appendChild(d); return d;
  })();
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.innerHTML = msg;
  container.appendChild(t);
  requestAnimationFrame(() => t.classList.add('toast-show'));
  setTimeout(() => { t.classList.remove('toast-show'); setTimeout(()=>t.remove(), 350); }, duration);
}

function badgeToast(badgeKey) {
  const b = BADGES[badgeKey]; if (!b) return;
  toast(`<span style="font-size:1.3rem">${b.icon}</span> <div><strong>Badge Unlocked!</strong><br>${b.name}</div>`, 'badge', 4000);
}

// ── CONFETTI ─────────────────────────────────────────────────
function launchConfetti(score) {
  if (parseFloat(score) < 75) return;
  let canvas = document.getElementById('confetti-canvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'confetti-canvas';
    canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999;';
    document.body.appendChild(canvas);
  }
  canvas.width = window.innerWidth; canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');
  const cols = ['#6366F1','#0EA5E9','#F59E0B','#22C55E','#EF4444','#8B5CF6','#EC4899','#FFD93D'];
  const particles = Array.from({length:160},()=>({
    x: Math.random()*canvas.width, y: -20-Math.random()*canvas.height/2,
    color: cols[Math.floor(Math.random()*cols.length)],
    w: 6+Math.random()*8, h: 3+Math.random()*5,
    vx: (Math.random()-.5)*3, vy: 2+Math.random()*4,
    angle: Math.random()*Math.PI*2, spin: (Math.random()-.5)*.15, life:1
  }));
  let start = Date.now();
  function draw() {
    const elapsed = Date.now()-start;
    if (elapsed>4000) { ctx.clearRect(0,0,canvas.width,canvas.height); canvas.remove(); return; }
    ctx.clearRect(0,0,canvas.width,canvas.height);
    particles.forEach(p => {
      p.y+=p.vy; p.x+=p.vx; p.angle+=p.spin; p.vy+=.05;
      if(p.y>canvas.height){p.y=-20;p.x=Math.random()*canvas.width;}
      ctx.save(); ctx.globalAlpha=Math.max(0,1-elapsed/3800);
      ctx.translate(p.x+p.w/2,p.y+p.h/2); ctx.rotate(p.angle);
      ctx.fillStyle=p.color; ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);
      ctx.restore();
    });
    requestAnimationFrame(draw);
  }
  draw();
}

// ── TIMER ─────────────────────────────────────────────────────
function startTimer(seconds, onTick, onEnd) {
  clearInterval(STATE.timerInterval); STATE.timeLeft=seconds;
  STATE.timerInterval = setInterval(()=>{
    STATE.timeLeft--; onTick(STATE.timeLeft);
    if(STATE.timeLeft<=0){ clearInterval(STATE.timerInterval); onEnd(); }
  },1000);
}
function stopTimer(){ clearInterval(STATE.timerInterval); }
function formatTime(s){ const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),ss=s%60;
  if(h>0) return `${h}:${String(m).padStart(2,'0')}:${String(ss).padStart(2,'0')}`;
  return `${String(m).padStart(2,'0')}:${String(ss).padStart(2,'0')}`; }

// ── ROUTER ────────────────────────────────────────────────────
function navigate(view, params={}) {
  STATE.view=view; STATE.params=params; render(); window.scrollTo(0,0);
}

const VIEWS = ['login','dashboard','fullTests','topicTests','preTest','test',
  'results','concepts','flashcards','examiner','profile','revision'];

function render() {
  const app=document.getElementById('app');
  const fn = {
    login:      ()=>{ app.innerHTML=renderLogin();      bindLogin(); },
    dashboard:  ()=>{ app.innerHTML=renderDashboard();  bindDashboard(); },
    fullTests:  ()=>{ app.innerHTML=renderFullTests();  },
    topicTests: ()=>{ app.innerHTML=renderTopicTests(); },
    preTest:    ()=>{ app.innerHTML=renderPreTest();    },
    test:       ()=>{ app.innerHTML=renderTest();       bindTest(); },
    results:    ()=>{ app.innerHTML=renderResults();    bindResults(); },
    concepts:   ()=>{ app.innerHTML=renderConceptPage(); },
    flashcards: ()=>{ app.innerHTML=renderFlashcards(); bindFlashcards(); },
    examiner:   ()=>{ app.innerHTML=renderExaminer();   },
    profile:    ()=>{ app.innerHTML=renderProfile();    bindProfile(); },
    revision:   ()=>{ app.innerHTML=renderRevision();   },
    dailyTest:  ()=>{ app.innerHTML=renderDailyTest();  bindDailyTest(); },
    dailyConcept:()=>{ app.innerHTML=renderDailyConcept(); },
  };
  (fn[STATE.view]||fn.login)();
}

// ── ANALYSIS ENGINE ───────────────────────────────────────────
function analyzeResults(answers, questions) {
  const topicStats={};
  let correct=0,wrong=0,unattempted=0;
  questions.forEach((q,i)=>{
    const t=q.topic||'General', s=q.subject||'General';
    if(!topicStats[t]) topicStats[t]={topic:t,subject:s,correct:0,wrong:0,unattempted:0,total:0};
    topicStats[t].total++;
    const ans=answers[i];
    if(ans===undefined||ans===null){ unattempted++; topicStats[t].unattempted++; }
    else if(ans===q.ans){ correct++; topicStats[t].correct++; }
    else { wrong++; topicStats[t].wrong++; }
  });
  const score=Math.max(0,correct*2-wrong*.5), maxScore=questions.length*2;
  const percentage=(score/maxScore*100).toFixed(1);
  const topicArray=Object.values(topicStats).map(t=>({
    ...t,
    accuracy:t.total>0?Math.round(t.correct/t.total*100):0,
    weakScore:t.total>0?(1-t.correct/t.total)*(1+t.wrong/(t.total||1)):0
  })).sort((a,b)=>b.weakScore-a.weakScore);
  return {
    correct,wrong,unattempted,
    score:score.toFixed(1),maxScore,percentage,
    topicArray,
    weakTopics: topicArray.filter(t=>t.accuracy<60),
    strongTopics: topicArray.filter(t=>t.accuracy>=80),
    grade: grade(parseFloat(percentage)),
    improvement: topicArray.filter(t=>t.accuracy<60).slice(0,5).map((t,i)=>`Priority ${i+1}: "${t.topic}" — ${t.accuracy}% accuracy`)
  };
}

function grade(pct){
  if(pct>=90) return {label:'Excellent',color:'#22C55E',emoji:'🏆',msg:"Outstanding! You're SSC CGL ready!"};
  if(pct>=75) return {label:'Good',color:'#6366F1',emoji:'⭐',msg:"Great work! Keep this momentum going!"};
  if(pct>=60) return {label:'Average',color:'#F59E0B',emoji:'📈',msg:"Decent score! A bit more practice and you'll ace it!"};
  if(pct>=40) return {label:'Below Average',color:'#F97316',emoji:'📚',msg:"You're building your foundation. Keep studying!"};
  return {label:'Needs Work',color:'#EF4444',emoji:'💪',msg:"Every expert was once a beginner. Don't give up!"};
}

function saveResult(uid, testInfo, analysis, answers) {
  const data = getUserData(uid);
  const xpGain = calcXPGain(analysis, testInfo.type, data.streak||0);
  const prevXP = data.xp||0;
  const prevLevel = getLevelInfo(prevXP).level;
  data.xp = prevXP + xpGain;
  const newLevel = getLevelInfo(data.xp).level;

  const result = {
    id:Date.now(), testId:testInfo.id, testTitle:testInfo.title,
    testType:testInfo.type, topic:testInfo.topic||null,
    score:analysis.score, maxScore:analysis.maxScore, percentage:analysis.percentage,
    correct:analysis.correct, wrong:analysis.wrong, unattempted:analysis.unattempted,
    grade:analysis.grade.label, weakTopics:analysis.weakTopics.map(t=>t.topic),
    timestamp:new Date().toISOString(),
    timeTaken: STATE.testStartTime ? Math.floor((Date.now()-STATE.testStartTime)/1000) : 0,
    answers:Object.assign({},answers||{}), xpGain,
  };

  data.results = [result, ...(data.results||[])].slice(0,100);
  data.totalTests = (data.totalTests||0)+1;
  data.totalCorrect = (data.totalCorrect||0)+analysis.correct;
  data.totalAttempted = (data.totalAttempted||0)+analysis.correct+analysis.wrong;
  analysis.weakTopics.forEach(t=>{
    if(!data.topicScores) data.topicScores={};
    if(!data.topicScores[t.topic]) data.topicScores[t.topic]={weak:0,attempts:0};
    data.topicScores[t.topic].weak++; data.topicScores[t.topic].attempts++;
  });

  const {earned,fresh} = checkNewBadges(data);
  data.badges = earned;
  saveUserData(uid, data);

  // Show badge toasts after a small delay
  fresh.forEach((bk,i) => setTimeout(()=>badgeToast(bk), 1800+i*700));
  if (newLevel > prevLevel) setTimeout(()=>toast(`${LEVEL_ICONS[newLevel-1]} Level Up! You're now <strong>Level ${newLevel} — ${LEVEL_TITLES[newLevel-1]}</strong>!`,'levelup',5000), 1000);

  return { ...result, xpGain };
}

function updateStreak(uid) {
  const data=getUserData(uid);
  const today=new Date().toDateString(), yesterday=new Date(Date.now()-86400000).toDateString();
  if(data.lastActive===today) return data;
  data.streak = data.lastActive===yesterday ? (data.streak||0)+1 : 1;
  data.lastActive=today;
  saveUserData(uid,data); return data;
}

// ── SHELL COMPONENTS ──────────────────────────────────────────
function topbar(title='', showHome=true) {
  const u=STATE.currentUser;
  const lv=getLevelInfo(getUserData(u?.id||'').xp||0);
  return `
  <header class="topbar">
    <div class="topbar-left">
      ${showHome?`<button class="icon-btn" onclick="navigate('dashboard')" title="Home">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
        </svg></button>`:''}
      <span class="logo-mark">🎯 SSC CGL Master</span>
    </div>
    ${title?`<div class="topbar-title">${title}</div>`:'<div></div>'}
    <div class="topbar-right">
      <button id="sync-btn" class="sync-pill" onclick="forceSyncNow()" title="Sync to cloud">☁️</button>
      <div class="user-pill" onclick="navigate('profile')">
        <div class="u-avatar" style="background:${u?.color||'#6366F1'}">${u?.avatar||'?'}</div>
        <div class="u-info">
          <span class="u-name">${u?.name.split(' ')[0]||''}</span>
          <span class="u-level">${lv.icon} Lv.${lv.level}</span>
        </div>
      </div>
    </div>
  </header>`;
}

const QUOTES=[
  "The expert in anything was once a beginner.",
  "Success is the sum of small efforts repeated day in and day out.",
  "SSC CGL is not just an exam, it's a gateway to your dreams.",
  "Hard work beats talent when talent doesn't work hard.",
  "Consistency is the key to cracking SSC CGL.",
  "Don't count the days, make the days count.",
  "Every day is a new opportunity to improve your score.",
  "Focus on progress, not perfection.",
  "The difference between try and triumph is just a little umph.",
];
function rq(){ return QUOTES[new Date().getDay()%QUOTES.length]; }
function greeting(){ const h=new Date().getHours(); return h<12?'Good Morning':h<17?'Good Afternoon':'Good Evening'; }

// ══════════════════════════════════════════════════════════════
//  VIEW: LOGIN
// ══════════════════════════════════════════════════════════════
function renderLogin(){
  return `
  <div class="login-wrap">
    <div class="login-bg-shapes">
      <div class="shape s1"></div><div class="shape s2"></div><div class="shape s3"></div>
    </div>
    <div class="login-card">
      <div class="login-brand">
        <div class="login-logo-ring">🎯</div>
        <h1>SSC CGL Master</h1>
        <p>India's smartest exam prep platform</p>
      </div>

      <div class="login-features">
        <div class="lf-item"><span>📋</span>50 Full Papers</div>
        <div class="lf-item"><span>📚</span>50 Topic Tests</div>
        <div class="lf-item"><span>🏆</span>12 Achievements</div>
        <div class="lf-item"><span>☁️</span>Cloud Sync</div>
      </div>

      <div class="login-form-wrap">
        <div class="form-group">
          <label>Email Address</label>
          <input type="email" id="login-email" class="form-input" placeholder="yourname@sscprep.com" autocomplete="email" spellcheck="false"/>
        </div>
        <div class="form-group">
          <label>Password</label>
          <div class="pw-field">
            <input type="password" id="login-password" class="form-input" placeholder="••••••••••••" autocomplete="current-password"/>
            <button class="pw-eye" type="button" onclick="togglePW()">👁</button>
          </div>
        </div>
        <div class="login-error-box" id="login-error" style="display:none"></div>
        <button class="btn-login" onclick="attemptLogin()">Sign In <span>→</span></button>
      </div>

      <div class="login-hint-panel">
        <div class="hint-label">🔑 Click to auto-fill credentials</div>
        ${Object.values(USERS).map(u=>`
          <div class="hint-row" onclick="fillCreds('${u.email}','${u.password}')">
            <div class="hint-av" style="background:${u.color}">${u.avatar}</div>
            <div class="hint-info">
              <strong>${u.name}</strong>
              <span>${u.email}</span>
            </div>
            <span class="hint-tag ${u.role}">${u.role==='examiner'?'👨‍💼 Examiner':'📝 Candidate'}</span>
          </div>`).join('')}
      </div>
      <div class="login-quote">"${rq()}"</div>
    </div>
  </div>`;
}

function bindLogin(){
  document.getElementById('login-password')?.addEventListener('keydown',e=>e.key==='Enter'&&attemptLogin());
  document.getElementById('login-email')?.addEventListener('keydown',e=>e.key==='Enter'&&document.getElementById('login-password')?.focus());
}
function togglePW(){ const i=document.getElementById('login-password'); if(i) i.type=i.type==='password'?'text':'password'; }
function fillCreds(email,pw){
  const e=document.getElementById('login-email'), p=document.getElementById('login-password');
  if(e)e.value=email; if(p)p.value=pw;
  document.getElementById('login-error').style.display='none';
}
function showLoginError(msg){
  const el=document.getElementById('login-error');
  if(!el)return; el.textContent='⚠️ '+msg; el.style.display='block';
  el.style.animation='none'; el.offsetHeight; el.style.animation='shake .4s ease';
}
function attemptLogin(){
  const email=(document.getElementById('login-email')?.value||'').trim().toLowerCase();
  const password=(document.getElementById('login-password')?.value||'').trim();
  document.getElementById('login-error').style.display='none';
  if(!email) return showLoginError('Please enter your email.');
  if(!password) return showLoginError('Please enter your password.');
  const user=CREDENTIALS[email];
  if(!user) return showLoginError('No account found with this email.');
  if(password!==user.password) return showLoginError('Incorrect password. Please try again.');
  const btn=document.querySelector('.btn-login');
  if(btn){btn.textContent='⏳ Syncing...';btn.disabled=true;}
  STATE.currentUser=user;
  pullFromServer(user.id).then(()=>{ updateStreak(user.id); navigate(user.role==='examiner'?'examiner':'dashboard'); });
}

// ══════════════════════════════════════════════════════════════
//  VIEW: DASHBOARD
// ══════════════════════════════════════════════════════════════
function renderDashboard(){
  const u=STATE.currentUser, data=getUserData(u.id);
  const lv=getLevelInfo(data.xp||0);
  const streak=data.streak||0, totalTests=data.totalTests||0;
  const acc=data.totalAttempted>0?Math.round(data.totalCorrect/data.totalAttempted*100):0;
  const recent=(data.results||[]).slice(0,5);
  const fullDone=(data.results||[]).filter(r=>r.testType==='full').length;
  const topicDone=(data.results||[]).filter(r=>r.testType==='topic').length;
  const myBadges=(data.badges||[]).slice(0,6);
  const weakTopics=Object.entries(data.topicScores||{}).sort((a,b)=>b[1].weak-a[1].weak).slice(0,3);

  // Build peer XP for leaderboard mini
  const peerUid = u.id==='dulip'?'udit':'dulip';
  const peerData = getUserData(peerUid);
  const peerLv = getLevelInfo(peerData.xp||0);
  const myXP=data.xp||0, peerXP=peerData.xp||0, maxXP=Math.max(myXP,peerXP,100);

  return `
  ${topbar('',false)}
  <div class="dashboard">

    <!-- WELCOME HERO -->
    <div class="hero-card">
      <div class="hero-left">
        <div class="hero-greeting">${greeting()}, ${u.name.split(' ')[0]}! 👋</div>
        <div class="hero-quote">"${rq()}"</div>
        <div class="xp-bar-row">
          <div class="xp-bar-wrap">
            <div class="xp-bar-fill" style="width:${lv.pct}%"></div>
          </div>
          <span class="xp-label">${lv.icon} Lv.${lv.level} · ${myXP} XP</span>
        </div>
      </div>
      <div class="hero-right">
        <div class="streak-orb">
          <div class="streak-num" data-count="${streak}">${streak}</div>
          <div>🔥 Day Streak</div>
        </div>
        <button id="sync-btn" class="sync-pill" onclick="forceSyncNow()" title="Sync data">☁️</button>
      </div>
    </div>

    <!-- STATS STRIP -->
    <div class="stats-strip">
      <div class="ss-item"><div class="ss-val" data-count="${totalTests}">${totalTests}</div><div class="ss-lbl">Tests Done</div></div>
      <div class="ss-item"><div class="ss-val">${acc}%</div><div class="ss-lbl">Accuracy</div></div>
      <div class="ss-item"><div class="ss-val">${recent[0]?recent[0].percentage+'%':'—'}</div><div class="ss-lbl">Last Score</div></div>
      <div class="ss-item"><div class="ss-val">${lv.title}</div><div class="ss-lbl">Rank</div></div>
    </div>

    <!-- QUICK ACTIONS -->
    <div class="quick-grid">
      <div class="qcard qc-full" onclick="navigate('fullTests')">
        <div class="qc-icon">📋</div>
        <div class="qc-title">Full Mock Tests</div>
        <div class="qc-sub">50 papers · Level 1→5</div>
        <div class="qc-progress-wrap"><div class="qc-progress" style="width:${fullDone/50*100}%"></div></div>
        <div class="qc-meta">${fullDone}/50 completed · 100 Qs · 60 min</div>
        <div class="qc-arrow">→</div>
      </div>
      <div class="qcard qc-topic" onclick="navigate('topicTests')">
        <div class="qc-icon">📚</div>
        <div class="qc-title">Topic Tests</div>
        <div class="qc-sub">50 papers · Chapter focus</div>
        <div class="qc-progress-wrap"><div class="qc-progress" style="width:${topicDone/50*100}%"></div></div>
        <div class="qc-meta">${topicDone}/50 completed · 20 Qs · 20 min</div>
        <div class="qc-arrow">→</div>
      </div>
      <div class="qcard qc-rev" onclick="navigate('revision')">
        <div class="qc-icon">🔄</div>
        <div class="qc-title">Smart Revision</div>
        <div class="qc-sub">AI-powered weak area drill</div>
        <div class="qc-meta">${weakTopics.length} weak topics found</div>
        <div class="qc-arrow">→</div>
      </div>
      <div class="qcard qc-flash" onclick="navigate('flashcards')">
        <div class="qc-icon">🃏</div>
        <div class="qc-title">Flashcards</div>
        <div class="qc-sub">Flip-through concepts</div>
        <div class="qc-meta">All topics · Quick review</div>
        <div class="qc-arrow">→</div>
      </div>
    </div>

    <!-- BADGES -->
    ${myBadges.length?`
    <div class="section-card">
      <div class="sc-header"><h3>🏅 Your Badges</h3><button class="link-btn" onclick="navigate('profile')">See all →</button></div>
      <div class="badge-strip">
        ${myBadges.map(bk=>{ const b=BADGES[bk]; return b?`<div class="badge-chip" title="${b.desc}"><span>${b.icon}</span>${b.name}</div>`:''; }).join('')}
      </div>
    </div>`:''}

    <!-- DAILY CHALLENGE CARD -->
    ${renderDailyCard()}

    <!-- MINI LEADERBOARD -->
    <div class="section-card">
      <div class="sc-header"><h3>⚔️ You vs ${USERS[peerUid].name.split(' ')[0]}</h3></div>
      <div class="lb-row">
        <div class="lb-player">
          <div class="lb-av" style="background:${u.color}">${u.avatar}</div>
          <div class="lb-pname">${u.name.split(' ')[0]}</div>
          <div class="lb-bar-wrap"><div class="lb-bar" style="width:${myXP/maxXP*100}%;background:${u.color}"></div></div>
          <div class="lb-xp">${myXP} XP · Lv.${lv.level}</div>
        </div>
        <div class="lb-vs">VS</div>
        <div class="lb-player">
          <div class="lb-av" style="background:${USERS[peerUid].color}">${USERS[peerUid].avatar}</div>
          <div class="lb-pname">${USERS[peerUid].name.split(' ')[0]}</div>
          <div class="lb-bar-wrap"><div class="lb-bar" style="width:${peerXP/maxXP*100}%;background:${USERS[peerUid].color}"></div></div>
          <div class="lb-xp">${peerXP} XP · Lv.${peerLv.level}</div>
        </div>
      </div>
    </div>

    <!-- WEAK TOPICS -->
    ${weakTopics.length?`
    <div class="section-card warn-card">
      <div class="sc-header"><h3>⚠️ Focus Areas</h3><button class="link-btn" onclick="navigate('revision')">Practice →</button></div>
      ${weakTopics.map(([t,s])=>`
        <div class="weak-row">
          <span class="weak-name">${t}</span>
          <div class="weak-bar-wrap"><div class="weak-bar" style="width:${Math.min(100,s.weak*15)}%"></div></div>
          <span class="weak-cnt">${s.weak}× missed</span>
        </div>`).join('')}
    </div>`:''}

    <!-- RECENT RESULTS -->
    ${recent.length?`
    <div class="section-card">
      <div class="sc-header"><h3>📜 Recent Results</h3></div>
      ${recent.map(r=>{const g=grade(parseFloat(r.percentage));return`
        <div class="result-row">
          <div class="rr-left">
            <div class="rr-title">${r.testTitle}</div>
            <div class="rr-date">${new Date(r.timestamp).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</div>
          </div>
          <div class="rr-right">
            <div class="score-pill" style="background:${g.color}22;color:${g.color}">${r.percentage}%</div>
            <div class="rr-xp">+${r.xpGain||0} XP</div>
          </div>
        </div>`;}).join('')}
    </div>`:`
    <div class="empty-state">
      <div class="es-icon">🚀</div>
      <div class="es-title">Ready to Begin?</div>
      <div class="es-sub">Take your first test to start earning XP and badges!</div>
      <button class="btn-primary" onclick="navigate('fullTests')">Start First Test</button>
    </div>`}

  </div>`;
}

function bindDashboard(){
  // Animate counters
  document.querySelectorAll('[data-count]').forEach(el=>{
    const target=parseInt(el.dataset.count)||0;
    if(target===0)return;
    let start=0; const step=Math.ceil(target/30);
    const iv=setInterval(()=>{ start=Math.min(start+step,target); el.textContent=start; if(start>=target)clearInterval(iv); },40);
  });

  // Fetch daily content and refresh the daily card when ready
  if (!STATE.dailyContent && !STATE.dailyLoading) {
    STATE.dailyLoading = true;
    fetchDailyContent().then(data => {
      STATE.dailyLoading = false;
      if (data && STATE.view === 'dashboard') {
        // Update just the daily card without full re-render
        const placeholder = document.querySelector('.daily-card');
        if (placeholder) {
          const wrapper = document.createElement('div');
          wrapper.innerHTML = renderDailyCard();
          placeholder.replaceWith(wrapper.firstElementChild);
        }
      }
    }).catch(() => { STATE.dailyLoading = false; });
  }
}

// ══════════════════════════════════════════════════════════════
//  VIEW: FULL TESTS
// ══════════════════════════════════════════════════════════════
function renderFullTests(){
  const data=getUserData(STATE.currentUser.id);
  const attempted=new Set((data.results||[]).map(r=>r.testId));
  const levels=[
    {range:[1,10],label:'Foundation',desc:'Basic concepts. Perfect start.',color:'#22C55E',icon:'🌱'},
    {range:[11,25],label:'Intermediate',desc:'Standard SSC CGL difficulty.',color:'#6366F1',icon:'📈'},
    {range:[26,35],label:'Advanced',desc:'Higher difficulty questions.',color:'#F59E0B',icon:'⚡'},
    {range:[36,45],label:'Expert',desc:'Near actual exam level.',color:'#F97316',icon:'🔥'},
    {range:[46,50],label:'Champion',desc:'Toughest papers. Exam warriors only.',color:'#EF4444',icon:'🏆'},
  ];
  const done=Array.from(attempted).filter(id=>id.startsWith('full_')).length;
  return `
  ${topbar('Full Mock Tests')}
  <div class="tests-page">
    <div class="page-hero">
      <h2>📋 Full Mock Tests</h2>
      <p>100 questions · 60 minutes · All 4 subjects · -0.5 negative marking</p>
      <div class="hero-prog-row">
        <div class="hero-prog-wrap"><div class="hero-prog-fill" style="width:${done/50*100}%"></div></div>
        <span>${done}/50 completed</span>
      </div>
    </div>
    ${levels.map(lv=>{
      const nums=Array.from({length:lv.range[1]-lv.range[0]+1},(_,i)=>lv.range[0]+i);
      return `
      <div class="level-block">
        <div class="level-header" style="--lc:${lv.color}">
          <span class="level-icon">${lv.icon}</span>
          <div><div class="level-title" style="color:${lv.color}">${lv.label}</div><div class="level-desc">${lv.desc}</div></div>
          <div class="level-badge" style="background:${lv.color}22;color:${lv.color}">Papers ${lv.range[0]}–${lv.range[1]}</div>
        </div>
        <div class="paper-grid">
          ${nums.map(num=>{
            const id=`full_${num}`, att=attempted.has(id);
            const res=(data.results||[]).find(r=>r.testId===id);
            return `<div class="paper-tile ${att?'done':''}">
              <div class="pt-num">Paper ${num}</div>
              ${att&&res?`
                <div class="pt-score" style="color:${lv.color}">${res.percentage}%</div>
                <div class="pt-grade">${res.grade}</div>
                <div class="pt-btns">
                  <button onclick="viewPastResult('full_${num}')" class="pt-btn view">View</button>
                  <button onclick="startFlow('full',${num})" class="pt-btn retry">Retry</button>
                </div>
              `:`<button class="pt-start-btn" onclick="startFlow('full',${num})">Start →</button>`}
            </div>`;
          }).join('')}
        </div>
      </div>`;
    }).join('')}
  </div>`;
}

// ══════════════════════════════════════════════════════════════
//  VIEW: TOPIC TESTS
// ══════════════════════════════════════════════════════════════
function renderTopicTests(){
  const data=getUserData(STATE.currentUser.id);
  const attempted=new Set((data.results||[]).map(r=>r.testId));
  const subjects={
    quantitative:{label:'Quantitative Aptitude',icon:'🔢',color:'#6366F1'},
    reasoning:{label:'Reasoning & Intelligence',icon:'🧠',color:'#0EA5E9'},
    english:{label:'English Comprehension',icon:'📖',color:'#8B5CF6'},
    general_awareness:{label:'General Awareness',icon:'🌍',color:'#F59E0B'},
  };
  let num=1; const sections=[];
  for(const [k,meta] of Object.entries(subjects)){
    const topics=Object.keys(QUESTION_BANK[k]||{});
    sections.push({...meta,papers:topics.map(t=>({num:num++,topic:t,id:`topic_${num-1}`}))});
  }
  return `
  ${topbar('Topic Tests')}
  <div class="tests-page">
    <div class="page-hero">
      <h2>📚 Topic-Wise Tests</h2>
      <p>20 questions · 20 minutes · Deep focus on one topic · Concepts unlock after low score</p>
    </div>
    ${sections.map(sec=>`
    <div class="level-block">
      <div class="level-header" style="--lc:${sec.color}">
        <span class="level-icon">${sec.icon}</span>
        <div><div class="level-title" style="color:${sec.color}">${sec.label}</div><div class="level-desc">${sec.papers.length} topic papers</div></div>
      </div>
      <div class="topic-grid">
        ${sec.papers.map(p=>{
          const att=attempted.has(p.id);
          const res=(data.results||[]).find(r=>r.testId===p.id);
          return `<div class="topic-tile ${att?'done':''}">
            <div class="tt-name">${p.topic}</div>
            ${att&&res?`
              <div class="tt-score" style="color:${sec.color}">${res.percentage}%</div>
              ${parseFloat(res.percentage)<60?'<div class="tt-badge">📖 Study Tip</div>':''}
              <div class="pt-btns">
                <button onclick="viewPastResult('topic_${p.num}')" class="pt-btn view">View</button>
                <button onclick="startFlow('topic',${p.num})" class="pt-btn retry">Retry</button>
              </div>
            `:`<button class="tt-start" onclick="startFlow('topic',${p.num})">Start →</button>`}
          </div>`;
        }).join('')}
      </div>
    </div>`).join('')}
  </div>`;
}

// ══════════════════════════════════════════════════════════════
//  TEST FLOW
// ══════════════════════════════════════════════════════════════
function startFlow(type, num){
  STATE.currentTest = getPaperMeta(type, num);
  STATE.timeLeft = 0;
  navigate('preTest');
}

function renderPreTest(){
  const p=STATE.currentTest;
  const dist = p.type==='full'
    ? [['🔢 Quant','25 Qs'],['🧠 Reasoning','25 Qs'],['📖 English','25 Qs'],['🌍 GK','25 Qs']]
    : [[p.topic||'Topic',`${p.questions.length} Qs`]];
  return `
  ${topbar('Instructions')}
  <div class="pretest-wrap">
    <div class="pretest-card">
      <div class="pretest-top">
        <div class="pretest-icon">📋</div>
        <h2>${p.title}</h2>
        <div class="pretest-chips">
          <span>⏱ ${formatTime(p.duration)}</span>
          <span>📝 ${p.questions.length} Questions</span>
          <span>💯 ${p.totalMarks} Marks</span>
        </div>
      </div>
      <div class="pretest-body">
        <div class="pretest-rules">
          <h3>📋 Rules</h3>
          <ul>${p.instructions.map(i=>`<li>${i}</li>`).join('')}
            <li>✅ +2 marks correct · ❌ –0.5 marks wrong</li>
            <li>🔖 Bookmark questions for review</li>
          </ul>
        </div>
        <div class="pretest-dist">
          <h3>📊 Distribution</h3>
          ${dist.map(([s,q])=>`<div class="dist-row"><span>${s}</span><strong>${q}</strong></div>`).join('')}
        </div>
      </div>
      <div class="pretest-foot">
        <button class="btn-outline" onclick="navigate('${p.type==='full'?'fullTests':'topicTests'}')">← Back</button>
        <button class="btn-primary lg" onclick="startTest()">🚀 Begin Test</button>
      </div>
    </div>
  </div>`;
}

function startTest(){
  STATE.currentAnswers={}; STATE.currentQuestionIndex=0;
  STATE.bookmarked=new Set(); STATE.confidenceMap={};
  STATE.testStartTime=Date.now(); navigate('test');
}

// ══════════════════════════════════════════════════════════════
//  VIEW: TEST INTERFACE
// ══════════════════════════════════════════════════════════════
function renderTest(){
  const p=STATE.currentTest, qi=STATE.currentQuestionIndex, q=p.questions[qi], total=p.questions.length;
  const answered=Object.keys(STATE.currentAnswers).length;
  const subColors={quantitative:'#6366F1',reasoning:'#0EA5E9',english:'#8B5CF6',general_awareness:'#F59E0B'};
  const subIcons={quantitative:'🔢',reasoning:'🧠',english:'📖',general_awareness:'🌍'};
  const color=subColors[q.subject]||'#6366F1', icon=subIcons[q.subject]||'❓';
  const ans=STATE.currentAnswers[qi], bk=STATE.bookmarked.has(qi), conf=STATE.confidenceMap[qi];
  return `
  <div class="test-wrap">
    <!-- Header -->
    <div class="test-hdr">
      <div class="test-hdr-l">
        <div class="test-title-sm">${p.title}</div>
        <div class="test-prog-row">
          <div class="test-prog-bar"><div class="test-prog-fill" style="width:${answered/total*100}%"></div></div>
          <span class="test-prog-txt">${answered}/${total}</span>
        </div>
      </div>
      <div class="timer-box" id="timer-box">
        <span class="timer-icon">⏱</span>
        <span class="timer-val" id="timerDisplay">--:--</span>
      </div>
      <button class="btn-submit" onclick="confirmSubmit()">Submit</button>
    </div>

    <!-- Layout -->
    <div class="test-layout">
      <!-- Main -->
      <div class="test-main">
        <div class="q-card">
          <div class="q-meta">
            <span class="q-num-badge">Q.${qi+1}<span>/${total}</span></span>
            <span class="q-subject" style="color:${color}">${icon} ${q.topic}</span>
            <button class="bk-btn ${bk?'active':''}" onclick="toggleBk(${qi})">${bk?'🔖':'📌'}</button>
          </div>
          <div class="q-text">${q.q}</div>
          <div class="options">
            ${q.opts.map((opt,oi)=>`
              <div class="opt ${ans===oi?'selected':''}" onclick="pickAnswer(${qi},${oi})">
                <div class="opt-letter ${ans===oi?'active':''}">${String.fromCharCode(65+oi)}</div>
                <div class="opt-text">${opt}</div>
                ${ans===oi?'<div class="opt-check">✓</div>':''}
              </div>`).join('')}
          </div>
          <div class="q-actions">
            <button class="conf-btn ${conf==='sure'?'sure':''}" onclick="setConf(${qi},'sure')">✅ Confident</button>
            <button class="conf-btn ${conf==='unsure'?'unsure':''}" onclick="setConf(${qi},'unsure')">❓ Unsure</button>
            ${ans!==undefined?`<button class="conf-btn clear" onclick="clearAns(${qi})">✕ Clear</button>`:''}
          </div>
        </div>
      </div>

      <!-- Palette sidebar -->
      <div class="test-sidebar">
        <div class="palette-card">
          <div class="pal-title">Question Palette</div>
          <div class="pal-legend">
            <span><span class="pal-dot answered"></span>Answered</span>
            <span><span class="pal-dot bookmarked"></span>Bookmarked</span>
          </div>
          <div class="pal-grid">
            ${p.questions.map((_, i)=>{
              const a=STATE.currentAnswers[i], b=STATE.bookmarked.has(i);
              let cls='pal-num'; if(i===qi) cls+=' current'; else if(b) cls+=' bookmarked'; else if(a!==undefined) cls+=' answered';
              return `<button class="${cls}" onclick="jumpQ(${i})">${i+1}</button>`;
            }).join('')}
          </div>
        </div>
      </div>
    </div>

    <!-- Nav -->
    <div class="test-nav" id="test-nav">
      ${buildNavHTML(qi,total)}
    </div>
  </div>`;
}

function buildNavHTML(qi,total){
  return `
    <button class="btn-outline" onclick="prevQ()" ${qi===0?'disabled':''}>← Prev</button>
    <span class="nav-counter">${qi+1} / ${total}</span>
    <button class="btn-primary" onclick="${qi===total-1?'confirmSubmit()':'nextQ()'}">
      ${qi===total-1?'📋 Review & Submit':'Next →'}
    </button>`;
}

function bindTest(){
  const p=STATE.currentTest;
  startTimer(STATE.timeLeft>0?STATE.timeLeft:p.duration,(t)=>{
    STATE.timeLeft=t;
    const el=document.getElementById('timerDisplay'), box=document.getElementById('timer-box');
    if(el) el.textContent=formatTime(t);
    if(box){ box.classList.toggle('urgent',t<=300); box.classList.toggle('critical',t<=60); }
  },()=>submitTest(true));
}

function updateTestDOM(qi){
  const p=STATE.currentTest, total=p.questions.length, q=p.questions[qi];
  const main=document.querySelector('.test-main'), sidebar=document.querySelector('.test-sidebar');
  if(!main) return;
  const subColors={quantitative:'#6366F1',reasoning:'#0EA5E9',english:'#8B5CF6',general_awareness:'#F59E0B'};
  const subIcons={quantitative:'🔢',reasoning:'🧠',english:'📖',general_awareness:'🌍'};
  const color=subColors[q.subject]||'#6366F1', icon=subIcons[q.subject]||'❓';
  const ans=STATE.currentAnswers[qi], bk=STATE.bookmarked.has(qi), conf=STATE.confidenceMap[qi];
  const answered=Object.keys(STATE.currentAnswers).length;
  main.innerHTML=`
    <div class="q-card">
      <div class="q-meta">
        <span class="q-num-badge">Q.${qi+1}<span>/${total}</span></span>
        <span class="q-subject" style="color:${color}">${icon} ${q.topic}</span>
        <button class="bk-btn ${bk?'active':''}" onclick="toggleBk(${qi})">${bk?'🔖':'📌'}</button>
      </div>
      <div class="q-text">${q.q}</div>
      <div class="options">
        ${q.opts.map((opt,oi)=>`
          <div class="opt ${ans===oi?'selected':''}" onclick="pickAnswer(${qi},${oi})">
            <div class="opt-letter ${ans===oi?'active':''}">${String.fromCharCode(65+oi)}</div>
            <div class="opt-text">${opt}</div>
            ${ans===oi?'<div class="opt-check">✓</div>':''}
          </div>`).join('')}
      </div>
      <div class="q-actions">
        <button class="conf-btn ${conf==='sure'?'sure':''}" onclick="setConf(${qi},'sure')">✅ Confident</button>
        <button class="conf-btn ${conf==='unsure'?'unsure':''}" onclick="setConf(${qi},'unsure')">❓ Unsure</button>
        ${ans!==undefined?`<button class="conf-btn clear" onclick="clearAns(${qi})">✕ Clear</button>`:''}
      </div>
    </div>`;
  if(sidebar) sidebar.innerHTML=`<div class="palette-card">
    <div class="pal-title">Question Palette</div>
    <div class="pal-legend">
      <span><span class="pal-dot answered"></span>Answered</span>
      <span><span class="pal-dot bookmarked"></span>Bookmarked</span>
    </div>
    <div class="pal-grid">
      ${p.questions.map((_,i)=>{
        const a=STATE.currentAnswers[i], b=STATE.bookmarked.has(i);
        let cls='pal-num'; if(i===qi) cls+=' current'; else if(b) cls+=' bookmarked'; else if(a!==undefined) cls+=' answered';
        return `<button class="${cls}" onclick="jumpQ(${i})">${i+1}</button>`;
      }).join('')}
    </div>
  </div>`;
  const fill=document.querySelector('.test-prog-fill'), txt=document.querySelector('.test-prog-txt');
  if(fill) fill.style.width=(answered/total*100)+'%';
  if(txt) txt.textContent=`${answered}/${total}`;
  const nav=document.getElementById('test-nav');
  if(nav) nav.innerHTML=buildNavHTML(qi,total);
}

function pickAnswer(qi,oi){ STATE.currentAnswers[qi]=oi; updateTestDOM(qi); }
function clearAns(qi){ delete STATE.currentAnswers[qi]; updateTestDOM(qi); }
function toggleBk(qi){ STATE.bookmarked.has(qi)?STATE.bookmarked.delete(qi):STATE.bookmarked.add(qi); updateTestDOM(qi); }
function setConf(qi,lv){ STATE.confidenceMap[qi]=STATE.confidenceMap[qi]===lv?undefined:lv; updateTestDOM(qi); }
function prevQ(){ if(STATE.currentQuestionIndex>0){ STATE.currentQuestionIndex--; updateTestDOM(STATE.currentQuestionIndex); }}
function nextQ(){ const t=STATE.currentTest.questions.length; if(STATE.currentQuestionIndex<t-1){ STATE.currentQuestionIndex++; updateTestDOM(STATE.currentQuestionIndex); }}
function jumpQ(i){ STATE.currentQuestionIndex=i; updateTestDOM(i); }

function confirmSubmit(){
  const answered=Object.keys(STATE.currentAnswers).length, total=STATE.currentTest.questions.length;
  const left=total-answered;
  if(left>0){
    const m=document.createElement('div'); m.className='modal-overlay';
    m.innerHTML=`<div class="modal-box">
      <div class="modal-top">⚠️ Submit Test?</div>
      <p>You have <strong>${left}</strong> unanswered question${left>1?'s':''} out of ${total}.</p>
      <div class="modal-actions">
        <button class="btn-outline" onclick="closeModal()">← Keep Reviewing</button>
        <button class="btn-danger" onclick="submitTest(false)">Submit Anyway</button>
      </div></div>`;
    document.body.appendChild(m);
  } else { submitTest(false); }
}

function closeModal(){ document.querySelector('.modal-overlay')?.remove(); }

function submitTest(timeUp=false){
  closeModal(); stopTimer();
  const p=STATE.currentTest, answers=Object.assign({},STATE.currentAnswers);
  const analysis=analyzeResults(answers,p.questions);
  const result=saveResult(STATE.currentUser.id,p,analysis,answers);
  STATE.lastAnalysis=analysis; STATE.lastResult=result; STATE.lastAnswers=answers;
  navigate('results');
}

// ══════════════════════════════════════════════════════════════
//  VIEW: RESULTS
// ══════════════════════════════════════════════════════════════
function renderResults(){
  const a=STATE.lastAnalysis, r=STATE.lastResult, p=STATE.currentTest, g=a.grade;
  const xpGain=r.xpGain||0;
  return `
  ${topbar('Results')}
  <div class="results-page">

    <!-- Score Hero -->
    <div class="score-hero" style="--gc:${g.color}">
      <div class="score-emoji">${g.emoji}</div>
      <div class="score-pct" style="color:${g.color}">${a.percentage}%</div>
      <div class="score-label" style="color:${g.color}">${g.label}</div>
      <div class="score-msg">${g.msg}</div>
      <div class="score-chips">
        <span class="sc correct">✅ ${a.correct} Correct</span>
        <span class="sc wrong">❌ ${a.wrong} Wrong</span>
        <span class="sc skip">⬜ ${a.unattempted} Skipped</span>
        <span class="sc time">⏱ ${formatTime(r.timeTaken||0)}</span>
      </div>
      <div class="xp-gain-badge">
        <span>+${xpGain} XP Earned!</span>
      </div>
    </div>

    <!-- Topic Analysis -->
    <div class="section-card">
      <div class="sc-header"><h3>📊 Topic-Wise Breakdown</h3></div>
      ${a.topicArray.slice(0,15).map(t=>`
        <div class="ta-row">
          <div class="ta-name">${t.topic}</div>
          <div class="ta-bar-wrap"><div class="ta-bar" style="width:${t.accuracy}%;background:${t.accuracy>=70?'#22C55E':t.accuracy>=40?'#F59E0B':'#EF4444'}"></div></div>
          <div class="ta-stat">
            <span class="ta-c">✅${t.correct}</span>
            <span class="ta-w">❌${t.wrong}</span>
            <span class="ta-pct" style="background:${t.accuracy>=70?'#22C55E22':t.accuracy>=40?'#F59E0B22':'#EF444422'};color:${t.accuracy>=70?'#22C55E':t.accuracy>=40?'#F59E0B':'#EF4444'}">${t.accuracy}%</span>
          </div>
        </div>`).join('')}
    </div>

    <!-- Action Plan -->
    ${a.weakTopics.length?`
    <div class="section-card warn-card">
      <div class="sc-header"><h3>🎯 Priority Action Plan</h3></div>
      <ol class="action-list">
        ${a.improvement.map(tip=>`<li>${tip}</li>`).join('')}
      </ol>
      <div class="action-btns">
        <button class="btn-primary" onclick="navigate('flashcards')">📖 Study Concepts</button>
        <button class="btn-outline" onclick="navigate('revision')">🔄 Smart Revision</button>
      </div>
    </div>
    <div class="section-card">
      <div class="sc-header"><h3>💡 Concepts for Weak Areas</h3></div>
      ${a.weakTopics.slice(0,3).map(wt=>{
        const c=getConceptForTopic(wt.topic); if(!c) return '';
        return `<div class="mini-concept">
          <div class="mc-head" onclick="this.parentNode.classList.toggle('open')">
            <span>${c.icon} ${wt.topic}</span>
            <span class="mc-acc">Accuracy: ${wt.accuracy}%</span>
            <span class="mc-arrow">▼</span>
          </div>
          <div class="mc-body">
            ${c.concepts.map(sec=>`<div class="mc-sec"><strong>${sec.title}</strong><div>${sec.content}</div></div>`).join('')}
          </div>
        </div>`;
      }).join('')}
    </div>`:'<div class="section-card success-card"><h3>🏆 Perfect Topic Coverage!</h3><p>You scored above 60% on all topics. Outstanding performance!</p></div>'}

    <!-- Question Review -->
    <div class="section-card">
      <div class="sc-header"><h3>📝 Question Review</h3><span class="sc-sub">First 20 questions</span></div>
      ${p.questions.slice(0,20).map((q,i)=>{
        const ua=STATE.lastAnswers[i], correct=ua===q.ans, skipped=ua===undefined;
        return `<div class="review-item ${correct?'ok':skipped?'skip':'bad'}">
          <div class="ri-head">
            <span class="ri-num">Q.${i+1}</span>
            <span class="ri-topic">${q.topic}</span>
            <span>${correct?'✅':skipped?'⬜':'❌'}</span>
          </div>
          <div class="ri-q">${q.q}</div>
          <div class="ri-opts">
            ${q.opts.map((opt,oi)=>`<div class="ri-opt ${oi===q.ans?'correct':oi===ua&&!correct?'wrong':''}">
              ${String.fromCharCode(65+oi)}. ${opt}${oi===q.ans?' ✓':''}${oi===ua&&!correct?' ✗':''}
            </div>`).join('')}
          </div>
          ${!correct?`<div class="ri-exp">💡 ${q.exp}</div>`:''}
        </div>`;
      }).join('')}
      ${p.questions.length>20?`<div class="review-more">…and ${p.questions.length-20} more questions</div>`:''}
    </div>

    <div class="results-foot">
      <button class="btn-primary" onclick="navigate('dashboard')">🏠 Dashboard</button>
      <button class="btn-outline" onclick="retake()">🔄 Retake</button>
      ${p.type==='topic'?`<button class="btn-outline" onclick="navigate('concepts')">📖 Concepts</button>`:''}
    </div>
  </div>`;
}

function bindResults(){
  launchConfetti(STATE.lastResult?.percentage||0);
}

function retake(){
  STATE.currentAnswers={}; STATE.currentQuestionIndex=0; STATE.timeLeft=0;
  STATE.bookmarked=new Set(); STATE.confidenceMap={};
  STATE.testStartTime=Date.now(); navigate('test');
}

function viewPastResult(testId){
  const data=getUserData(STATE.currentUser.id);
  const result=(data.results||[]).find(r=>r.testId===testId);
  if(!result){ toast('Result not found.','error'); return; }
  const parts=testId.split('_'), type=parts[0], num=parseInt(parts[1]);
  STATE.currentTest=getPaperMeta(type,num);
  STATE.lastAnswers=result.answers||{};
  STATE.currentAnswers=result.answers||{};
  STATE.lastResult=result;
  STATE.lastAnalysis=analyzeResults(result.answers||{},STATE.currentTest.questions);
  navigate('results');
}

// ══════════════════════════════════════════════════════════════
//  VIEW: CONCEPTS
// ══════════════════════════════════════════════════════════════
function renderConceptPage(){
  const weak=STATE.lastAnalysis?STATE.lastAnalysis.weakTopics.map(t=>t.topic):[];
  return `
  ${topbar('Concept Library')}
  <div class="concept-page">
    <div class="page-hero"><h2>📚 Concept Library</h2><p>Formulas, shortcuts, and explanations for every SSC CGL topic</p></div>
    ${weak.length?`<div class="section-card warn-card"><h3>⚠️ Study these first — based on your last test</h3></div>`:''}
    ${Object.entries(CONCEPTS).map(([topic,c])=>`
      <div class="concept-card ${weak.includes(topic)?'priority':''}">
        <div class="cc-head" onclick="this.parentNode.classList.toggle('open')">
          <div class="cc-title"><span class="cc-icon">${c.icon}</span><div><div class="cc-name">${topic}</div><div class="cc-sub">${c.subject}</div></div></div>
          <div class="cc-right">
            ${weak.includes(topic)?'<span class="priority-chip">Priority</span>':''}
            <span class="cc-arrow">▼</span>
          </div>
        </div>
        <div class="cc-body">
          ${c.concepts.map((s,i)=>`${i>0?'<hr class="concept-hr">':''}<div class="cc-section"><div class="cc-stitle">${s.title}</div><div class="cc-content">${s.content}</div></div>`).join('')}
        </div>
      </div>`).join('')}
  </div>`;
}

// ══════════════════════════════════════════════════════════════
//  VIEW: FLASHCARDS
// ══════════════════════════════════════════════════════════════
function renderFlashcards(){
  const topics=Object.keys(CONCEPTS);
  const topicIdx=STATE.flashcardTopicIndex%topics.length;
  const topic=topics[topicIdx], c=CONCEPTS[topic];
  const cardIdx=STATE.flashcardIndex%c.concepts.length, card=c.concepts[cardIdx];
  return `
  ${topbar('Flashcards')}
  <div class="flashcard-page">
    <div class="page-hero"><h2>🃏 Concept Flashcards</h2><p>Tap the card to flip · Navigate through topics</p></div>
    <div class="topic-selector">
      ${topics.map((t,i)=>`<button class="ts-btn ${i===topicIdx?'active':''}" onclick="flashTopic(${i})">${CONCEPTS[t].icon} ${t}</button>`).join('')}
    </div>
    <div class="fc-container">
      <div class="fc ${STATE.flashcardFlipped?'flipped':''}" onclick="flipCard()">
        <div class="fc-front">
          <div class="fc-label">${c.icon} ${topic}</div>
          <div class="fc-q">${card.title}</div>
          <div class="fc-hint">Tap to reveal →</div>
        </div>
        <div class="fc-back">
          <div class="fc-label">${c.icon} ${topic}</div>
          <div class="fc-ans">${card.content}</div>
        </div>
      </div>
    </div>
    <div class="fc-nav">
      <button class="btn-outline" onclick="prevCard()">← Prev</button>
      <span class="fc-count">${cardIdx+1} / ${c.concepts.length}</span>
      <button class="btn-primary" onclick="nextCard()">Next →</button>
    </div>
  </div>`;
}

function bindFlashcards(){}
function flipCard(){ STATE.flashcardFlipped=!STATE.flashcardFlipped; render(); }
function nextCard(){
  const topics=Object.keys(CONCEPTS), c=CONCEPTS[topics[STATE.flashcardTopicIndex%topics.length]];
  STATE.flashcardIndex=(STATE.flashcardIndex+1)%c.concepts.length; STATE.flashcardFlipped=false; render();
}
function prevCard(){
  const topics=Object.keys(CONCEPTS), c=CONCEPTS[topics[STATE.flashcardTopicIndex%topics.length]];
  STATE.flashcardIndex=(STATE.flashcardIndex-1+c.concepts.length)%c.concepts.length; STATE.flashcardFlipped=false; render();
}
function flashTopic(i){ STATE.flashcardTopicIndex=i; STATE.flashcardIndex=0; STATE.flashcardFlipped=false; render(); }

// ══════════════════════════════════════════════════════════════
//  VIEW: SMART REVISION
// ══════════════════════════════════════════════════════════════
function renderRevision(){
  const data=getUserData(STATE.currentUser.id);
  const topicErrors={};
  (data.results||[]).forEach(r=>(r.weakTopics||[]).forEach(t=>{ topicErrors[t]=(topicErrors[t]||0)+1; }));
  const weak=Object.entries(topicErrors).sort((a,b)=>b[1]-a[1]).slice(0,12);
  return `
  ${topbar('Smart Revision')}
  <div class="revision-page">
    <div class="page-hero"><h2>🔄 Smart Revision</h2><p>AI-powered practice from your weakest areas — sorted by frequency of mistakes</p></div>
    ${weak.length?`
    <div class="section-card">
      <div class="sc-header"><h3>📊 Your Weak Areas</h3><span class="sc-sub">Ranked by mistakes</span></div>
      <div class="rev-list">
        ${weak.map(([t,cnt],i)=>{const c=getConceptForTopic(t);return`
          <div class="rev-row">
            <div class="rev-rank">#${i+1}</div>
            <div class="rev-info">
              <div class="rev-name">${c?c.icon:'📝'} ${t}</div>
              <div class="rev-bar-wrap"><div class="rev-bar" style="width:${Math.min(100,cnt*12)}%"></div></div>
              <div class="rev-cnt">Missed ${cnt} time${cnt>1?'s':''}</div>
            </div>
            <div class="rev-btns">
              <button class="pt-btn view" onclick="startRevision('${t}')">Practice</button>
              <button class="pt-btn retry" onclick="studyConcept('${t}')">Concepts</button>
            </div>
          </div>`;}).join('')}
      </div>
    </div>
    <div class="section-card">
      <div class="sc-header"><h3>📅 3-Day Study Plan</h3></div>
      ${['Today','Tomorrow','Day 3'].map((d,i)=>`
        <div class="sp-row">
          <div class="sp-day">${d}</div>
          <div class="sp-task">Focus: ${weak[i]?weak[i][0]:'Full Mock Test — maintain gains'}</div>
        </div>`).join('')}
    </div>`:`
    <div class="empty-state">
      <div class="es-icon">🌟</div>
      <div class="es-title">No weak areas yet!</div>
      <div class="es-sub">Take a few tests and we'll identify exactly where you need work.</div>
      <button class="btn-primary" onclick="navigate('fullTests')">Take a Test</button>
    </div>`}
  </div>`;
}

function startRevision(topic){
  const allQ=[];
  for(const [subj,topics] of Object.entries(QUESTION_BANK))
    for(const [t,qs] of Object.entries(topics))
      if(t===topic) qs.forEach(q=>allQ.push({...q,topic:t,subject:subj}));
  if(!allQ.length){ toast('No questions found for this topic.','error'); return; }
  STATE.currentTest={id:`rev_${topic}_${Date.now()}`,title:`Revision: ${topic}`,type:'topic',topic,
    questions:allQ,duration:1200,totalMarks:allQ.length*2,negativeMarking:.5,instructions:[`Revision: ${topic}`,`${allQ.length} questions`,'20 minutes']};
  STATE.currentAnswers={}; STATE.currentQuestionIndex=0; STATE.bookmarked=new Set();
  STATE.confidenceMap={}; STATE.testStartTime=Date.now(); STATE.timeLeft=0;
  navigate('test');
}
function studyConcept(topic){ STATE.conceptTopic=topic; navigate('concepts'); }

// ══════════════════════════════════════════════════════════════
//  VIEW: PROFILE
// ══════════════════════════════════════════════════════════════
function renderProfile(){
  const u=STATE.currentUser, data=getUserData(u.id);
  const lv=getLevelInfo(data.xp||0), results=data.results||[];
  const allBadges=Object.keys(BADGES), earned=new Set(data.badges||[]);
  return `
  ${topbar('My Profile')}
  <div class="profile-page">
    <div class="profile-hero" style="--uc:${u.color}">
      <div class="ph-av" style="background:${u.color}">${u.avatar}</div>
      <div class="ph-name">${u.name}</div>
      <div class="ph-role">${u.role==='candidate'?'📝 SSC CGL Candidate':'👨‍💼 Examiner'}</div>
      <div class="ph-level">${lv.icon} Level ${lv.level} — ${lv.title}</div>
      <div class="ph-xp-row">
        <div class="ph-xp-bar"><div class="ph-xp-fill" style="width:${lv.pct}%"></div></div>
        <span>${lv.xp} / ${lv.nxt} XP</span>
      </div>
    </div>
    <div class="stats-strip">
      <div class="ss-item"><div class="ss-val">${data.totalTests||0}</div><div class="ss-lbl">Tests</div></div>
      <div class="ss-item"><div class="ss-val">${data.totalCorrect||0}</div><div class="ss-lbl">Correct</div></div>
      <div class="ss-item"><div class="ss-val">${data.totalAttempted>0?Math.round(data.totalCorrect/data.totalAttempted*100)+'%':'—'}</div><div class="ss-lbl">Accuracy</div></div>
      <div class="ss-item"><div class="ss-val">🔥${data.streak||0}</div><div class="ss-lbl">Streak</div></div>
    </div>
    <div class="section-card">
      <div class="sc-header"><h3>🏅 Achievements</h3><span class="sc-sub">${earned.size}/${allBadges.length} unlocked</span></div>
      <div class="badge-grid">
        ${allBadges.map(bk=>{const b=BADGES[bk],have=earned.has(bk);return`
          <div class="badge-item ${have?'earned':'locked'}">
            <div class="badge-icon">${have?b.icon:'🔒'}</div>
            <div class="badge-name">${b.name}</div>
            <div class="badge-desc">${b.desc}</div>
          </div>`;}).join('')}
      </div>
    </div>
    ${results.length?`
    <div class="section-card">
      <div class="sc-header"><h3>📜 Test History</h3></div>
      ${results.slice(0,20).map(r=>{const g=grade(parseFloat(r.percentage));return`
        <div class="result-row">
          <div class="rr-left"><div class="rr-title">${r.testTitle}</div><div class="rr-date">${new Date(r.timestamp).toLocaleDateString('en-IN')}</div></div>
          <div class="rr-right">
            <div class="score-pill" style="background:${g.color}22;color:${g.color}">${r.percentage}%</div>
            <div class="rr-xp">+${r.xpGain||0} XP</div>
          </div>
        </div>`;}).join('')}
    </div>`:''}
    <div class="profile-foot">
      <button class="btn-outline danger" onclick="clearData()">🗑 Clear History</button>
      <button class="btn-outline" onclick="navigate('login')">🚪 Switch User</button>
    </div>
  </div>`;
}

function bindProfile(){}
function clearData(){
  if(confirm('Delete all test history? This cannot be undone.')) {
    saveUserData(STATE.currentUser.id,EMPTY_USER(STATE.currentUser.id));
    navigate('profile'); toast('History cleared.','info');
  }
}

// ══════════════════════════════════════════════════════════════
//  VIEW: EXAMINER
// ══════════════════════════════════════════════════════════════
function renderExaminer(){
  const candidates=['dulip','udit'];
  const datas=candidates.map(id=>({...USERS[id],data:getUserData(id)}));
  const maxXP=Math.max(...datas.map(d=>d.data.xp||0),1);
  return `
  ${topbar('Examiner Panel',false)}
  <div class="examiner-page">
    <div class="page-hero">
      <h2>👨‍💼 Examiner Dashboard</h2>
      <p>Monitor candidate performance, progress, and weak areas in real time</p>
    </div>

    <!-- Candidate Cards -->
    <div class="examiner-grid">
      ${datas.map(({id,name,avatar,color,data})=>{
        const lv=getLevelInfo(data.xp||0);
        const acc=data.totalAttempted>0?Math.round(data.totalCorrect/data.totalAttempted*100):0;
        const weakAreas=Object.entries(data.topicScores||{}).sort((a,b)=>b[1].weak-a[1].weak).slice(0,4);
        return`<div class="ex-card">
          <div class="ex-card-top">
            <div class="ex-av" style="background:${color}">${avatar}</div>
            <div class="ex-info">
              <div class="ex-name">${name}</div>
              <div class="ex-level">${lv.icon} Lv.${lv.level} ${lv.title}</div>
              <div class="ex-streak">🔥 ${data.streak||0} day streak</div>
            </div>
          </div>
          <div class="ex-xp-row">
            <div class="ex-xp-bar"><div class="ex-xp-fill" style="width:${(data.xp||0)/maxXP*100}%;background:${color}"></div></div>
            <span>${data.xp||0} XP</span>
          </div>
          <div class="ex-stats">
            <div class="ex-stat"><span>${data.totalTests||0}</span>Tests</div>
            <div class="ex-stat"><span>${acc}%</span>Accuracy</div>
            <div class="ex-stat"><span>${data.results&&data.results[0]?data.results[0].percentage+'%':'—'}</span>Last Score</div>
            <div class="ex-stat"><span>${(data.badges||[]).length}</span>Badges</div>
          </div>
          ${weakAreas.length?`
          <div class="ex-weak">
            <div class="ex-weak-title">⚠️ Weak Areas</div>
            ${weakAreas.map(([t,s])=>`<div class="ex-weak-row"><span>${t}</span><span class="ex-weak-cnt">${s.weak}×</span></div>`).join('')}
          </div>`:'<div class="ex-empty">No weak areas detected yet</div>'}
          <button class="btn-outline full-w mt" onclick="showCandidateReport('${id}')">View Full Report →</button>
        </div>`;
      }).join('')}
    </div>

    <!-- XP Leaderboard -->
    <div class="section-card">
      <div class="sc-header"><h3>🏆 XP Leaderboard</h3></div>
      ${datas.sort((a,b)=>(b.data.xp||0)-(a.data.xp||0)).map(({name,avatar,color,data},i)=>{
        const lv=getLevelInfo(data.xp||0);
        return`<div class="lb-full-row">
          <div class="lb-rank ${i===0?'gold':'silver'}">${i===0?'🥇':'🥈'}</div>
          <div class="lb-av" style="background:${color}">${avatar}</div>
          <div class="lb-details">
            <div class="lb-nm">${name}</div>
            <div class="lb-bar-wrap"><div class="lb-bar" style="width:${(data.xp||0)/maxXP*100}%;background:${color}"></div></div>
          </div>
          <div class="lb-score">${lv.icon} Lv.${lv.level} · ${data.xp||0} XP</div>
        </div>`;}).join('')}
    </div>

    <!-- Comparison Table -->
    <div class="section-card">
      <div class="sc-header"><h3>📊 Head-to-Head Comparison</h3></div>
      <div class="comparison-table">
        <table>
          <thead><tr><th>Metric</th>${datas.map(d=>`<th>${d.name.split(' ')[0]}</th>`).join('')}</tr></thead>
          <tbody>
            ${['Tests Taken','Overall Accuracy','Current Streak','XP Earned','Level','Badges Earned'].map((m,mi)=>`
            <tr><td>${m}</td>${datas.map(({data})=>{
              const vals=[
                data.totalTests||0,
                data.totalAttempted>0?Math.round(data.totalCorrect/data.totalAttempted*100)+'%':'N/A',
                (data.streak||0)+' days',
                (data.xp||0)+' XP',
                'Level '+getLevelInfo(data.xp||0).level,
                (data.badges||[]).length+' / '+Object.keys(BADGES).length
              ]; return`<td>${vals[mi]}</td>`;}).join('')}</tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div class="examiner-foot">
      <button class="btn-outline" onclick="navigate('login')">🚪 Logout</button>
    </div>
  </div>`;
}

function showCandidateReport(uid){
  const u=USERS[uid], data=getUserData(uid), lv=getLevelInfo(data.xp||0);
  const m=document.createElement('div'); m.className='modal-overlay';
  m.innerHTML=`<div class="modal-box large">
    <div class="modal-top">
      <div class="u-avatar" style="background:${u.color}">${u.avatar}</div>
      <span>${u.name} — Full Report</span>
      <button class="icon-btn" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-scroll">
      <div class="stats-strip compact">
        <div class="ss-item"><div class="ss-val">${data.totalTests||0}</div><div class="ss-lbl">Tests</div></div>
        <div class="ss-item"><div class="ss-val">${data.totalCorrect||0}</div><div class="ss-lbl">Correct</div></div>
        <div class="ss-item"><div class="ss-val">${data.xp||0}</div><div class="ss-lbl">XP</div></div>
        <div class="ss-item"><div class="ss-val">${lv.icon}${lv.level}</div><div class="ss-lbl">Level</div></div>
      </div>
      <h4>Test History</h4>
      ${(data.results||[]).slice(0,20).map(r=>{const g=grade(parseFloat(r.percentage));return`
        <div class="result-row"><div class="rr-left"><div class="rr-title">${r.testTitle}</div><div class="rr-date">${new Date(r.timestamp).toLocaleDateString('en-IN')}</div></div>
        <div class="rr-right"><div class="score-pill" style="background:${g.color}22;color:${g.color}">${r.percentage}%</div></div></div>`;}).join('')||'<p>No tests taken yet.</p>'}
      <h4>Persistent Weak Areas</h4>
      ${Object.entries(data.topicScores||{}).sort((a,b)=>b[1].weak-a[1].weak).slice(0,8).map(([t,s])=>`
        <div class="ex-weak-row"><span>${t}</span><span class="ex-weak-cnt">${s.weak} recurring</span></div>`).join('')||'<p>None yet.</p>'}
    </div>
  </div>`;
  document.body.appendChild(m);
  m.addEventListener('click',e=>{ if(e.target===m) closeModal(); });
}

// ── INIT ─────────────────────────────────────────────────────

// ══════════════════════════════════════════════════════════════
//  DAILY CHALLENGE — Fetch, Views, Logic
// ══════════════════════════════════════════════════════════════

// ─── Fetch daily content from /api/daily ─────────────────────
async function fetchDailyContent() {
  if (STATE.dailyContent) return STATE.dailyContent;
  try {
    const res = await fetch('/api/daily', { signal: AbortSignal.timeout(12000) });
    if (!res.ok) return null;
    const data = await res.json();
    STATE.dailyContent = data;
    return data;
  } catch {
    return null;
  }
}

// ─── Daily card on dashboard ──────────────────────────────────
function renderDailyCard() {
  const d = STATE.dailyContent;
  const uid = STATE.currentUser?.id;
  const data = getUserData(uid || '');
  const today = new Date().toISOString().split('T')[0];
  const doneToday = (data.results || []).some(r => r.testId === `daily_${today}`);

  if (!d && STATE.dailyLoading) return `
    <div class="section-card daily-card loading-card">
      <div class="dc-loading">⏳ Loading today's challenge...</div>
    </div>`;

  if (!d) return `
    <div class="section-card daily-card offline-card">
      <div class="sc-header"><h3>📅 Daily Challenge</h3><span class="dc-offline">Offline</span></div>
      <p>Connect to the internet to load today's questions scraped from current affairs.</p>
    </div>`;

  const sources = d.sources || {};
  const sourceTags = [
    sources.history > 0 ? `${sources.history} History` : null,
    sources.currentAffairs > 0 ? `${sources.currentAffairs} Current Affairs` : null,
    sources.math > 0 ? `${sources.math} Maths` : null,
  ].filter(Boolean).join(' · ');

  return `
    <div class="section-card daily-card ${doneToday ? 'done' : 'active'}">
      <div class="sc-header">
        <h3>📅 Daily Challenge</h3>
        ${doneToday ? '<span class="dc-done-tag">✅ Completed</span>' : '<span class="dc-xp-tag">2× XP Bonus!</span>'}
      </div>
      <div class="dc-date">${d.displayDate || today}</div>
      <div class="dc-meta">
        <span>📝 ${d.questions?.length || 0} Questions</span>
        <span>🌐 ${sourceTags || 'Mixed Topics'}</span>
        <span>⏱ ~10 min</span>
      </div>
      ${d.concept ? `
        <div class="dc-concept-preview" onclick="navigate('dailyConcept')">
          <span>💡 <strong>Concept of the Day:</strong> ${d.concept.title}</span>
          <span class="dc-read">Read →</span>
        </div>` : ''}
      <div class="dc-actions">
        ${doneToday
          ? `<button class="btn-outline" onclick="viewPastResult('daily_${today}')">View Result</button>`
          : `<button class="btn-primary" onclick="startDailyChallenge()">Start Challenge →</button>`}
        ${d.concept ? `<button class="btn-outline" onclick="navigate('dailyConcept')">📖 Today's Concept</button>` : ''}
      </div>
    </div>`;
}

// ─── Start the daily test ─────────────────────────────────────
function startDailyChallenge() {
  const d = STATE.dailyContent;
  if (!d?.questions?.length) { toast('Daily content not loaded yet.', 'error'); return; }
  const today = new Date().toISOString().split('T')[0];
  STATE.currentTest = {
    id: `daily_${today}`,
    title: `Daily Challenge — ${d.displayDate || today}`,
    type: 'daily',
    topic: 'Mixed',
    questions: d.questions,
    duration: 600, // 10 minutes
    totalMarks: d.questions.length * 2,
    negativeMarking: 0.5,
    instructions: [
      `${d.questions.length} questions from today's current affairs & maths`,
      '10 minutes time limit',
      '+2 per correct, -0.5 per wrong',
      '2× XP bonus for daily challenge!',
    ],
  };
  STATE.currentAnswers = {}; STATE.currentQuestionIndex = 0;
  STATE.bookmarked = new Set(); STATE.confidenceMap = {};
  STATE.testStartTime = Date.now(); STATE.timeLeft = 0;
  navigate('test');
}

// ─── Full daily test page ─────────────────────────────────────
function renderDailyTest() {
  const d = STATE.dailyContent;
  const today = new Date().toISOString().split('T')[0];
  if (!d?.questions?.length) return `
    ${topbar('Daily Challenge')}
    <div class="tests-page">
      <div class="empty-state">
        <div class="es-icon">📅</div>
        <div class="es-title">No daily content yet</div>
        <div class="es-sub">Check back once the internet connection is available.</div>
        <button class="btn-primary" onclick="navigate('dashboard')">← Dashboard</button>
      </div>
    </div>`;

  const sources = d.sources || {};
  const data = getUserData(STATE.currentUser?.id || '');
  const doneToday = (data.results || []).some(r => r.testId === `daily_${today}`);
  const lastResult = (data.results || []).find(r => r.testId === `daily_${today}`);

  return `
  ${topbar('Daily Challenge')}
  <div class="tests-page">
    <div class="page-hero daily-hero">
      <div class="dh-badge">📅 DAILY</div>
      <h2>${d.displayDate || today}</h2>
      <p>Freshly scraped from today's current affairs, history &amp; SSC maths</p>
      <div class="dh-source-tags">
        ${sources.history > 0 ? `<span class="src-tag wiki">🏛 ${sources.history} Wikipedia History</span>` : ''}
        ${sources.currentAffairs > 0 ? `<span class="src-tag pib">🏛 ${sources.currentAffairs} PIB Current Affairs</span>` : ''}
        ${sources.math > 0 ? `<span class="src-tag math">🔢 ${sources.math} Maths</span>` : ''}
      </div>
    </div>

    <div class="section-card">
      <div class="sc-header"><h3>📝 Today's Questions</h3><span class="dc-xp-tag">2× XP</span></div>
      <div class="daily-q-preview">
        ${d.questions.map((q, i) => `
          <div class="dqp-row">
            <span class="dqp-num">${i + 1}</span>
            <div class="dqp-info">
              <div class="dqp-q">${q.q.slice(0, 80)}${q.q.length > 80 ? '...' : ''}</div>
              <div class="dqp-topic">${q.topic} · ${q.subject}</div>
            </div>
          </div>`).join('')}
      </div>
      <div style="margin-top:1rem">
        ${doneToday && lastResult
          ? `<div class="dc-result-banner">
              <div>✅ Completed! Score: <strong>${lastResult.percentage}%</strong> · XP: <strong>+${lastResult.xpGain || 0}</strong></div>
              <button class="btn-outline" onclick="viewPastResult('daily_${today}')">View Details</button>
            </div>`
          : `<button class="btn-primary lg" onclick="startDailyChallenge()">🚀 Start Challenge — 10 min</button>`}
      </div>
    </div>

    ${d.concept ? `
    <div class="section-card">
      <div class="sc-header"><h3>💡 Concept of the Day</h3></div>
      <div class="concept-of-day">
        ${d.concept.thumbnail ? `<img src="${d.concept.thumbnail}" alt="${d.concept.title}" class="cod-img" onerror="this.remove()"/>` : ''}
        <div class="cod-content">
          <div class="cod-title">${d.concept.title}</div>
          <div class="cod-text">${d.concept.summary}</div>
          ${d.concept.url ? `<a href="${d.concept.url}" target="_blank" rel="noopener" class="cod-link">Read full article →</a>` : ''}
        </div>
      </div>
    </div>` : ''}
  </div>`;
}

function bindDailyTest() {}

// ─── Concept of the Day standalone view ──────────────────────
function renderDailyConcept() {
  const d = STATE.dailyContent;
  const concept = d?.concept;
  if (!concept) return `
    ${topbar('Concept of the Day')}
    <div class="tests-page">
      <div class="empty-state">
        <div class="es-icon">💡</div>
        <div class="es-title">No concept loaded</div>
        <button class="btn-primary" onclick="navigate('dashboard')">← Dashboard</button>
      </div>
    </div>`;

  return `
  ${topbar('Concept of the Day')}
  <div class="concept-page">
    <div class="page-hero" style="background:linear-gradient(135deg,#0EA5E9,#0284C7)">
      <h2>💡 Concept of the Day</h2>
      <p>${d.displayDate || ''}</p>
    </div>
    <div class="section-card">
      <div class="concept-of-day large">
        ${concept.thumbnail ? `<img src="${concept.thumbnail}" alt="${concept.title}" class="cod-img large" onerror="this.remove()"/>` : ''}
        <div class="cod-content">
          <div class="cod-title large">${concept.title}</div>
          <div class="cod-topic-tag">${concept.topic}</div>
          <div class="cod-text">${concept.summary}</div>
          ${concept.url ? `<a href="${concept.url}" target="_blank" rel="noopener" class="cod-link">📖 Read full Wikipedia article →</a>` : ''}
        </div>
      </div>
    </div>
    <div class="section-card">
      <div class="sc-header"><h3>📝 Test Your Knowledge</h3></div>
      <p>Take today's Daily Challenge to answer questions based on this concept and current affairs.</p>
      <div style="margin-top:.75rem">
        <button class="btn-primary" onclick="navigate('dailyTest')">Take Daily Challenge →</button>
      </div>
    </div>
  </div>`;
}

window.addEventListener('DOMContentLoaded', () => {
  // All functions are already global (top-level function declarations).
  // Just call render() — no eval tricks needed.
  render();
});
