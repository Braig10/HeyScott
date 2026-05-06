import { useState, useRef, useEffect, useCallback } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

import { C, R, Sh, F } from './constants/design.js';
import { MODULES } from './constants/curriculum.js';
import { SCENARIOS, ALL_CRITERIA, SECTOR_PERSONA_OVERLAYS } from './constants/scenarios.js';
import { PERSONA_VARIANTS, DIFFICULTY_MODIFIERS, SAMPLE_TRANSCRIPT, SCORE_DATA, REV_DATA, WEEKLY_DATA, SENT_DATA, MILESTONES, SKILLS, ANALYSES, ASSESSMENT_SCENARIOS } from './constants/personas.js';

const getSbUrl = () => window._env?.SUPABASE_URL  || "";
const getSbKey = () => window._env?.SUPABASE_ANON_KEY || "";
const COMPANY_ID = "1775cff8-3650-4950-b578-88a24efcdf62";

// PKCE helpers for Supabase email confirmation (Supabase removed Implicit flow)
async function generatePKCEPair() {
  const array = crypto.getRandomValues(new Uint8Array(32));
  const verifier = btoa(String.fromCharCode(...array)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  const challenge = btoa(String.fromCharCode(...new Uint8Array(digest))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
  return { verifier, challenge };
}

// Lightweight Supabase REST client (no npm package needed)
const sb = {
  _token: null,
  _userId: null,
  _refreshToken: null,

  headers(extra={}) {
    const key = getSbKey();
    const h = { "Content-Type": "application/json", "apikey": key, "Authorization": `Bearer ${this._token || key}` };
    return { ...h, ...extra };
  },

  async from(table) {
    const base = `${getSbUrl()}/rest/v1/${table}`;
    const hdrs = this.headers({ "Prefer": "return=representation" });
    const ft = (url, opts={}) => {
      const c = new AbortController();
      const id = setTimeout(()=>c.abort(), 4000);
      return fetch(url, {...opts, signal:c.signal}).finally(()=>clearTimeout(id));
    };
    return {
      async select(cols="*", filters={}) {
        const params = new URLSearchParams({ select: cols, ...filters });
        const r = await ft(`${base}?${params}`, { headers: hdrs });
        return r.json();
      },
      async insert(data) {
        const r = await ft(base, { method:"POST", headers: hdrs, body: JSON.stringify(data) });
        return r.json();
      },
      async upsert(data, onConflict) {
        const url = onConflict ? `${base}?on_conflict=${onConflict}` : base;
        const r = await ft(url, { method:"POST", headers: sb.headers({ "Prefer":"return=representation,resolution=merge-duplicates" }), body: JSON.stringify(data) });
        return r.json();
      },
      async update(data, filters={}) {
        const params = new URLSearchParams(filters);
        const r = await ft(`${base}?${params}`, { method:"PATCH", headers: hdrs, body: JSON.stringify(data) });
        return r.json();
      },
    };
  },

  async signUp(email, password, meta={}) {
    const { verifier, challenge } = await generatePKCEPair();
    localStorage.setItem('pkce_verifier', verifier);
    const c=new AbortController(); setTimeout(()=>c.abort(),5000);
    const r = await fetch(`${getSbUrl()}/auth/v1/signup`, {
      method:"POST", headers: this.headers(),
      body: JSON.stringify({ email, password, data: meta, code_challenge: challenge, code_challenge_method: 'S256' })
    });
    const d = await r.json();
    if(d.access_token) { this._token = d.access_token; this._userId = d.user?.id; }
    return d;
  },

  async exchangeCode(code) {
    const verifier = localStorage.getItem('pkce_verifier');
    localStorage.removeItem('pkce_verifier');
    if(!verifier) return null;
    const r = await fetch(`${getSbUrl()}/auth/v1/token?grant_type=pkce`, {
      method:'POST',
      headers: { 'Content-Type':'application/json', 'apikey': getSbKey() },
      body: JSON.stringify({ auth_code: code, code_verifier: verifier }),
    });
    const d = await r.json();
    if(d.access_token) { this._token = d.access_token; this._userId = d.user?.id; this.saveSession(d.access_token, d.user?.id, d.refresh_token); return d.user || null; }
    return null;
  },

  async signIn(email, password) {
    const c=new AbortController(); setTimeout(()=>c.abort(),5000);
    const r = await fetch(`${getSbUrl()}/auth/v1/token?grant_type=password`, {
      method:"POST", headers: this.headers(),
      body: JSON.stringify({ email, password })
    });
    const d = await r.json();
    if(d.access_token) { this._token = d.access_token; this._userId = d.user?.id; }
    return d;
  },

  async signOut() {
    await fetch(`${getSbUrl()}/auth/v1/logout`, { method:"POST", headers: this.headers() });
    this._token = null; this._userId = null; this._refreshToken = null;
    localStorage.removeItem("sb_session");
    sessionStorage.removeItem("sb_session");
  },

  async getUser() {
    if(!this._token) {
      const raw = localStorage.getItem("sb_session") || sessionStorage.getItem("sb_session");
      if(raw) { const s = JSON.parse(raw); this._token = s.token; this._userId = s.userId; this._refreshToken = s.refreshToken || null; }
    }
    if(!this._token) return null;
    const r = await fetch(`${getSbUrl()}/auth/v1/user`, { headers: this.headers() });
    if(r.status === 401 && this._refreshToken) {
      const rr = await fetch(`${getSbUrl()}/auth/v1/token?grant_type=refresh_token`, {
        method:"POST", headers:{"Content-Type":"application/json","apikey":getSbKey()},
        body: JSON.stringify({refresh_token: this._refreshToken})
      });
      const rd = await rr.json();
      if(rd.access_token) {
        const persist = !!localStorage.getItem("sb_session");
        this.saveSession(rd.access_token, rd.user?.id || this._userId, rd.refresh_token, persist);
        return rd.user || {id: this._userId};
      }
      this._token = null; return null;
    }
    const d = await r.json();
    return d.id ? d : null;
  },

  saveSession(token, userId, refreshToken=null, persist=true) {
    this._token = token; this._userId = userId; this._refreshToken = refreshToken;
    const data = JSON.stringify({ token, userId, refreshToken });
    if(persist) { localStorage.setItem("sb_session", data); sessionStorage.removeItem("sb_session"); }
    else { sessionStorage.setItem("sb_session", data); localStorage.removeItem("sb_session"); }
  },
};

/* ══════════════════════════════════════════════════════════════
   SUPABASE DATA FUNCTIONS
   Each replaces an equivalent localStorage function
══════════════════════════════════════════════════════════════ */

// ── Auth helpers ──────────────────────────────────────────────
async function sbGetCurrentUser() {
  return sb.getUser();
}

async function sbGetProfile(userId) {
  try {
    const t = await sb.from("profiles");
    const rows = await t.select("*", { "user_id": `eq.${userId}` });
    return Array.isArray(rows) && rows.length ? rows[0] : null;
  } catch(e) { return null; }
}

async function sbSaveProfile(userId, profile) {
  try {
    const t = await sb.from("profiles");
    await t.upsert({ user_id: userId, ...profile, updated_at: new Date().toISOString() }, "user_id");
  } catch(e) { console.error("sbSaveProfile:", e); }
}

// ── Lesson completions ────────────────────────────────────────
async function sbLoadCompletedIds(userId) {
  try {
    const t = await sb.from("lesson_completions");
    const rows = await t.select("lesson_id", { "user_id": `eq.${userId}` });
    return Array.isArray(rows) ? rows.map(r => r.lesson_id) : [];
  } catch(e) { return []; }
}

async function sbMarkLessonDone(userId, lessonId, moduleId) {
  try {
    const t = await sb.from("lesson_completions");
    await t.upsert({ user_id: userId, lesson_id: lessonId, module_id: moduleId, completed_at: new Date().toISOString() }, "user_id,lesson_id");
  } catch(e) { console.error("sbMarkLessonDone:", e); }
}

// ── Roleplays ─────────────────────────────────────────────────
async function sbSaveRoleplay(userId, entry) {
  try {
    const t = await sb.from("roleplays");
    await t.insert({
      user_id: userId, company_id: COMPANY_ID,
      scenario_key: entry.scenarioKey, difficulty: entry.difficulty,
      score: entry.score, verdict: entry.verdict,
      coach_summary: entry.coachSummary,
      result_json: entry, saved_at: new Date().toISOString()
    });
  } catch(e) { console.error("sbSaveRoleplay:", e); }
}

async function sbLoadRoleplays(userId) {
  try {
    const t = await sb.from("roleplays");
    const rows = await t.select("*", { "user_id": `eq.${userId}`, "order": "saved_at.desc", "limit": "50" });
    return Array.isArray(rows) ? rows.map(r => r.result_json || r) : [];
  } catch(e) { return []; }
}

// ── Call analyses ─────────────────────────────────────────────
async function sbSaveAnalysis(userId, result, wordCount) {
  try {
    const allB = Object.values(result.behaviours||{}).flat();
    const t = await sb.from("call_analyses");
    await t.insert({
      user_id: userId, company_id: COMPANY_ID,
      verdict: result.verdict,
      behaviours_json: result.behaviours,
      funnel_json: result.funnel,
      call_summary: result.callSummary,
      talk_ratio_recruiter: result.talkRatio?.recruiter,
      talk_ratio_candidate: result.talkRatio?.candidate,
      deepest_funnel_level: result.funnel?.deepestLevel,
      behaviours_present: allB.filter(b=>b.status==="present").length,
      behaviours_total: allB.filter(b=>b.status!=="n/a"&&b.status!=="unknown").length,
      word_count: wordCount,
      analysed_at: new Date().toISOString()
    });
  } catch(e) { console.error("sbSaveAnalysis:", e); }
}

async function sbLoadAnalyses(userId) {
  try {
    const t = await sb.from("call_analyses");
    return await t.select("*", { "user_id": `eq.${userId}`, "order": "analysed_at.desc", "limit": "20" });
  } catch(e) { return []; }
}

// ── Reflections ───────────────────────────────────────────────
async function sbSaveReflection(userId, entry) {
  try {
    const t = await sb.from("reflections");
    await t.insert({ user_id: userId, company_id: COMPANY_ID, prompt: entry.prompt, response: entry.text, saved_at: new Date().toISOString() });
    // Also push to manager inbox
    const inboxT = await sb.from("manager_inbox");
    await inboxT.insert({ company_id: COMPANY_ID, from_user_id: userId, from_name: entry.learner||"Learner", type:"reflection", payload: entry, read: false, created_at: new Date().toISOString() });
  } catch(e) { console.error("sbSaveReflection:", e); }
}

// ── Smart goals ───────────────────────────────────────────────
async function sbSaveSmartGoals(userId, goals) {
  try {
    const t = await sb.from("smart_goals");
    await t.upsert({ user_id: userId, goals_json: goals, generated_at: new Date().toISOString() }, "user_id");
  } catch(e) { console.error("sbSaveSmartGoals:", e); }
}

async function sbLoadSmartGoals(userId) {
  try {
    const t = await sb.from("smart_goals");
    const rows = await t.select("goals_json", { "user_id": `eq.${userId}` });
    return Array.isArray(rows) && rows.length ? rows[0].goals_json : null;
  } catch(e) { return null; }
}

// ── Manager inbox ─────────────────────────────────────────────
async function sbLoadManagerInbox() {
  try {
    const t = await sb.from("manager_inbox");
    return await t.select("*", { "company_id": `eq.${COMPANY_ID}`, "order": "created_at.desc", "limit": "100" });
  } catch(e) { return []; }
}

async function sbMarkInboxRead(id) {
  try {
    const t = await sb.from("manager_inbox");
    await t.update({ read: true }, { "id": `eq.${id}` });
  } catch(e) { console.error("sbMarkInboxRead:", e); }
}

// ── Team data (manager) ───────────────────────────────────────
async function sbLoadTeamData() {
  try {
    const t = await sb.from("users");
    const rows = await t.select("id,name,email,role,created_at", { "company_id": `eq.${COMPANY_ID}`, "role": "eq.learner" });
    return Array.isArray(rows) ? rows : [];
  } catch(e) { return []; }
}

// ── Analytics: behaviour history (per user, per week) ─────────
async function sbLoadBehaviourHistory(companyId) {
  try {
    const t = await sb.from("behaviour_snapshots");
    return await t.select("*", { "company_id": `eq.${companyId}`, "order": "week_ending.desc", "limit": "500" });
  } catch(e) { return []; }
}

// ── Analytics: confidence checks (pre/post roleplay) ──────────
async function sbLoadTeamConfidenceChecks(companyId) {
  try {
    const t = await sb.from("confidence_checks");
    return await t.select("*", { "company_id": `eq.${companyId}`, "order": "checked_at.desc", "limit": "500" });
  } catch(e) { return []; }
}

// ── Analytics: energy check-ins (from journal) ────────────────
async function sbLoadTeamEnergyCheckins(companyId) {
  try {
    const t = await sb.from("energy_checkins");
    return await t.select("*", { "company_id": `eq.${companyId}`, "order": "checked_at.desc", "limit": "500" });
  } catch(e) { return []; }
}

// ── Analytics: session engagement per user per week ───────────
async function sbLoadTeamEngagement(companyId) {
  try {
    const t = await sb.from("session_events");
    return await t.select("user_id,user_name,event_type,created_at", { "company_id": `eq.${companyId}`, "order": "created_at.desc", "limit": "1000" });
  } catch(e) { return []; }
}

// ── Write: save energy check-in from journal ──────────────────
async function sbSaveEnergyCheckin(userId, userName, energy) {
  try {
    const t = await sb.from("energy_checkins");
    await t.insert({ user_id: userId, user_name: userName, company_id: COMPANY_ID, energy, checked_at: new Date().toISOString() });
  } catch(e) { console.error("sbSaveEnergyCheckin:", e); }
}

// ── Write: save confidence check (pre/post roleplay) ─────────
async function sbSaveConfidenceCheck(userId, userName, score, checkType) {
  try {
    const t = await sb.from("confidence_checks");
    await t.insert({ user_id: userId, user_name: userName, company_id: COMPANY_ID, score, check_type: checkType, checked_at: new Date().toISOString() });
  } catch(e) { console.error("sbSaveConfidenceCheck:", e); }
}

// ── LocalStorage fallbacks (keep working while offline) ───────
import { loadProgress, saveProgress, loadCompletedIds, loadTeamData, saveTeamData, loadRoleplays, saveRoleplay, loadSmartGoals, saveSmartGoals, loadReflections, saveReflection, loadManagerInbox, markInboxRead, loadManagerEmail, saveManagerEmail, loadManagerReport, saveManagerReport, saveProfile, loadProfile, clearProfile } from './utils/storage.js';
import { callAPI, parseJSON } from './services/api.js';


/* ══════════════════════════════════════════════════════════════
   MODULE GAP DETECTION
   Runs after onboarding saves a profile. Uses a fast AI check to
   decide if the user's focus area is covered by existing modules.
   If not, fires a notification to admin@heyscott.ai via /api/notify.
   Deduplicates using localStorage so it fires at most once per user.
══════════════════════════════════════════════════════════════ */

// What the current curriculum covers (used for fast pre-check before AI call)
const MODULE_TOPICS_COVERED = [
  "cold call","cold calling","opening","permission frame","mindset",
  "discovery","spin","questioning","situation","problem","implication","need-payoff","funnel",
  "objection","objection handling","rejection","resistance","not interested","happy where",
  "value","communicating value","pitch","pitching","relevance","brief",
  "resilience","confidence","emotional","readiness","consistency","mindset",
  "limited brief","limited information","incomplete brief",
  "specificity","specific","package","compensation","architecture",
  "passive candidate","candidate","recruiter","recruitment","sales","billing",
];

async function checkAndNotifyModuleGap(profile) {
  if (!profile?.focus) return;

  // ── Deduplication: only fire once per unique focus+challenge combo ──
  const dedupKey = "heyscott_gap_notified_v1_" +
    btoa(encodeURIComponent((profile.focus + "|" + (profile.ownChallenge || profile.challenge || "")).slice(0, 80)))
      .replace(/[^a-zA-Z0-9]/g, "").slice(0, 32);
  try { if (localStorage.getItem(dedupKey)) return; } catch(e) {}

  const focus     = (profile.focus || "").toLowerCase();
  const challenge = (profile.ownChallenge || profile.challenge || "").toLowerCase();
  const combined  = focus + " " + challenge;

  // ── Fast pre-check: if clearly a generic recruitment focus, skip AI call ──
  const genericMatch = MODULE_TOPICS_COVERED.filter(t => combined.includes(t));
  // If 3+ generic topics matched AND focus is short/generic, skip
  if (genericMatch.length >= 3 && focus.length < 25) return;

  try {
    // ── AI gap check (fast — haiku, 150 tokens) ──
    const moduleList = MODULES.map(m => `${m.title} (${m.cat})`).join(", ");

    const raw = await callAPI(
      [{
        role: "user",
        content:
`A recruiter just joined HeyScott with this profile:
- Recruitment focus: "${profile.focus}"
- Experience: "${profile.experience || "not stated"}"
- Challenge: "${profile.ownChallenge || profile.challenge || "not stated"}"
- Goal: "${profile.goal || "not stated"}"

Our current curriculum modules: ${moduleList}.

Does this recruiter's specific focus or challenge point to a meaningful gap in our curriculum — something NOT well served by the existing modules? 
Consider: industry-specific needs (e.g. healthcare, legal, engineering), niche methodologies (e.g. executive search, retained, RPO), candidate-type specifics, or BD/client-side skills.
Generic cold-calling and SPIN skills ARE covered — flag gaps only where there's a genuine specialisation mismatch.

Return ONLY valid JSON, no other text:
{"gap":true,"reason":"one sentence explaining what is missing","suggestedModule":"specific module title","priority":"high|medium|low"}
OR if no meaningful gap:
{"gap":false,"reason":"covered","suggestedModule":null,"priority":"low"}`
      }],
      "You are a curriculum strategist for a recruitment training platform. Be conservative — only flag genuine gaps. Return only valid JSON.",
      { max_tokens: 180, temperature: 0 }
    );

    const parsed = parseJSON(raw);
    if (!parsed.gap) return;

    // ── Send notification via /api/notify ──
    const payload = {
      type:           "module_gap",
      userName:       profile.name        || "Unknown",
      userFocus:      profile.focus       || "",
      userChallenge:  profile.ownChallenge || profile.challenge || "",
      userExperience: profile.experience  || "",
      userGoal:       profile.goal        || "",
      reason:         parsed.reason       || "",
      suggestedModule:parsed.suggestedModule || null,
      priority:       parsed.priority     || "medium",
      companyId:      COMPANY_ID,
      timestamp:      new Date().toISOString(),
    };

    const notifyRes = await fetch("/api/notify", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });

    if (notifyRes.ok) {
      // Mark as sent so we don't fire again for this user+focus combo
      try { localStorage.setItem(dedupKey, new Date().toISOString()); } catch(e) {}
      console.info("[module-gap] Notification sent for focus:", profile.focus);
    }

  } catch(e) {
    // Silent fail — never interrupt onboarding for a notification error
    console.warn("[module-gap] Check skipped:", e.message);
  }
}

/* ── Micro components ── */
function NavGuard({go, to}){
  useEffect(()=>{ go(to); },[]);
  return null;
}
function Av({ini,col,sz=32}){
  return <div style={{width:sz,height:sz,borderRadius:"50%",background:col,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:sz*0.33,flexShrink:0,userSelect:"none"}}>{ini}</div>;
}
function LvlBadge({level}){
  const s=level==="beginner"?{bg:C.greenBg,c:C.green}:level==="intermediate"?{bg:C.amberBg,c:C.amber}:{bg:"#DBEAFE",c:"#1E40AF"};
  return <span style={{background:s.bg,color:s.c,borderRadius:999,padding:"2px 10px",fontSize:11,fontWeight:700}}>{level}</span>;
}
function Tag({children,color=C.lavPale,textColor=C.purple}){
  return <span style={{background:color,color:textColor,borderRadius:999,padding:"4px 12px",fontSize:12,fontWeight:600}}>{children}</span>;
}
function Ring({score,sz=80}){
  const r=(sz-10)/2,circ=2*Math.PI*r,off=circ-(score/100)*circ;
  const col=score>=80?C.primary:score>=50?C.navy:"hsl(0,84%,60%)";
  return(
    <svg width={sz} height={sz} style={{transform:"rotate(-90deg)"}}>
      <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke={C.border} strokeWidth={8}/>
      <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke={col} strokeWidth={8} strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round" style={{transition:"stroke-dashoffset 1s ease"}}/>
      <text x={sz/2} y={sz/2} textAnchor="middle" dominantBaseline="middle" style={{transform:`rotate(90deg)`,transformOrigin:`${sz/2}px ${sz/2}px`,fontFamily:"'Instrument Serif',Georgia,serif",fontSize:sz*0.25,fontWeight:800,fill:col}}>{score}</text>
    </svg>
  );
}
function Modal({children,onClose}){
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(20,15,45,0.5)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.white,borderRadius:R.xl,padding:36,maxWidth:520,width:"100%",maxHeight:"90vh",overflowY:"auto"}}>
        {children}
      </div>
    </div>
  );
}

/* ── Top Nav ── */

function TopNav({page, go, userRole, notifCount=2}){
  const link=(id,label)=>(
    <button key={id} onClick={()=>go(id)} style={{height:"100%",padding:"0 4px",fontSize:13,fontWeight:500,cursor:"pointer",border:"none",background:"none",borderBottom:page===id?`2px solid ${C.navy}`:"2px solid transparent",color:page===id?C.navy:C.muted,transition:"all 0.15s"}}>
      {label}
    </button>
  );
  return(
    <header style={{background:C.white,borderBottom:`1px solid ${C.border}`,position:"sticky",top:0,zIndex:50,fontFamily:"'Inter',sans-serif"}}>
      <div style={{display:"flex",alignItems:"center",height:56,padding:"0 24px",gap:0}}>
        <button onClick={()=>go("landing")} style={{fontWeight:800,fontSize:20,color:C.navy,cursor:"pointer",border:"none",background:"none",marginRight:32,flexShrink:0}}>
          Hey<span style={{color:C.purple}}>Scott</span>
        </button>
        <nav style={{display:"flex",alignItems:"flex-end",gap:20,height:"100%"}}>
          {link("learning","Learning")}
          {link("analysis","Ask Scott")}
          {link("progress","Progress")}
        </nav>
        <div style={{flex:1}}/>
        <nav style={{display:"flex",alignItems:"center",gap:14}}>
          {link("analytics","Analytics")}
          {userRole==="manager" && link("team","Manager Portal")}

          <Av ini={userRole==="manager"?"M":"B"} col={userRole==="manager"?"#9B91D8":C.lav} sz={32}/>
        </nav>
      </div>
    </header>
  );
}

/* ── Left Panel ── */
function LeftPanel({go}){
  return(
    <aside style={{width:220,flexShrink:0,display:"flex",flexDirection:"column",gap:18}}>
      <div style={{background:C.navy,borderRadius:R.md,padding:18,color:"#fff"}}>
        <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:2,opacity:0.5,marginBottom:4}}>Overall Progress</div>
        <div style={{fontSize:34,fontWeight:800,marginBottom:10}}>12%</div>
        <div style={{height:5,borderRadius:999,background:"rgba(255,255,255,0.15)",overflow:"hidden"}}>
          <div style={{height:"100%",width:"12%",background:"rgba(255,255,255,0.5)",borderRadius:999}}/>
        </div>
        <div style={{fontSize:11,opacity:0.5,marginTop:6}}>2 of 17 lessons done</div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {[{ic:"⭐",label:"Avg. Score",val:"75"},{ic:"✅",label:"Lessons Done",val:"2"},{ic:"⚡",label:"Day Streak",val:"5"}].map((s,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:32,height:32,borderRadius:5,background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>{s.ic}</div>
            <div><div style={{fontSize:18,fontWeight:800,color:C.navy,lineHeight:1}}>{s.val}</div><div style={{fontSize:11,color:C.muted}}>{s.label}</div></div>
          </div>
        ))}
      </div>
      <div style={{borderTop:`1px solid ${C.border}`}}/>
      <button onClick={()=>go("analysis")} style={{background:C.purple,color:"#fff",border:"none",borderRadius:5,padding:"10px 14px",fontSize:13,fontWeight:700,cursor:"pointer",textAlign:"left"}}>
        🎯 Ask Scott
      </button>
      <div style={{borderTop:`1px solid ${C.border}`}}/>
      {/* Call review progress */}
      {(()=>{
        const reviews = (() => { try { const s = localStorage.getItem("heyscott_reviews_v1"); return s ? JSON.parse(s) : []; } catch(e){ return []; } })();
        const count   = Math.min(reviews.length, 5);
        const pct     = Math.round((count / 5) * 100);
        return(
          <div style={{padding:"2px 0"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:2,color:C.muted}}>Call Reviews</div>
              <div style={{fontSize:10,color:C.muted}}>{count}/5</div>
            </div>
            <div style={{height:6,background:C.bg,borderRadius:999,overflow:"hidden",marginBottom:6}}>
              <div style={{height:"100%",width:`${pct}%`,background:count>=5?C.green:C.purple,borderRadius:999,transition:"width 0.5s"}}/>
            </div>
            <div style={{fontSize:10,color:C.muted,lineHeight:1.4}}>
              {count===0 && "Review a call to start tracking progress"}
              {count>0 && count<5 && `${5-count} more to unlock progress insights`}
              {count>=5 && <span style={{color:C.green,fontWeight:600}}>✓ Progress insights unlocked</span>}
            </div>
          </div>
        );
      })()}
    </aside>
  );
}

/* ── Shell ── */
function Shell({page,go,children,panel=true,userRole}){
  return(
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:"'Inter',sans-serif"}}>
      <TopNav page={page} go={go} userRole={userRole}/>
      {panel?(
        <div style={{display:"flex",minHeight:"calc(100vh - 56px)"}}>
          <div style={{width:256,background:C.bg,borderRight:`1px solid ${C.border}`,padding:24,flexShrink:0}}>
            <LeftPanel go={go}/>
          </div>
          <main style={{flex:1,background:C.bgDeep,padding:32,overflowY:"auto"}}>{children}</main>
        </div>
      ):(
        <main style={{padding:32}}>{children}</main>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   AUTH PAGES
════════════════════════════════════════════════════════════════ */

function AuthLoadingScreen(){
  return(
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}>
      <div style={{fontWeight:800,fontSize:22,color:C.navy}}>Hey<span style={{color:C.purple}}>Scott</span></div>
      <div style={{display:"flex",gap:6}}>{[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:C.purple,animation:"bounce 1s infinite",animationDelay:`${i*0.2}s`}}/>)}</div>
    </div>
  );
}

function AuthCard({children, title, subtitle}){
  return(
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:C.white,borderRadius:16,border:`1px solid ${C.border}`,padding:"36px 32px",width:"100%",maxWidth:420,boxShadow:"0 4px 24px rgba(0,0,0,0.06)"}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{fontWeight:800,fontSize:24,color:C.navy,marginBottom:6}}>Hey<span style={{color:C.purple}}>Scott</span></div>
          {title && <div style={{fontWeight:700,fontSize:18,color:C.navy,marginBottom:4}}>{title}</div>}
          {subtitle && <div style={{fontSize:13,color:C.muted,lineHeight:1.5}}>{subtitle}</div>}
        </div>
        {children}
      </div>
    </div>
  );
}

function LoginPage({go, onAuth}){
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if(!email.trim() || !password) return;
    setLoading(true); setError(null);
    try {
      const d = await sb.signIn(email.trim(), password);
      if(d.error || !d.access_token) { setError(d.error?.message || "Invalid email or password."); return; }
      sb.saveSession(d.access_token, d.user?.id, d.refresh_token, rememberMe);
      const prof = await sbGetProfile(d.user.id);
      await onAuth(d.user, prof?.role || 'learner');
    } catch(e) {
      setError("Connection issue: " + (e?.message || String(e)));
    } finally { setLoading(false); }
  };

  return(
    <AuthCard title="Welcome back" subtitle="Log in to continue your coaching.">
      <form onSubmit={submit} style={{display:"flex",flexDirection:"column",gap:14}}>
        {error && <div style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:8,padding:"10px 14px",fontSize:13,color:"#991B1B"}}>{error}</div>}
        <div>
          <label style={{fontSize:12,fontWeight:600,color:C.muted,display:"block",marginBottom:5}}>Email</label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required
            placeholder="your@email.com"
            style={{width:"100%",border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 14px",fontSize:13,color:C.text,outline:"none",background:C.bg,boxSizing:"border-box"}}/>
        </div>
        <div>
          <label style={{fontSize:12,fontWeight:600,color:C.muted,display:"block",marginBottom:5}}>Password</label>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required
            placeholder="••••••••"
            style={{width:"100%",border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 14px",fontSize:13,color:C.text,outline:"none",background:C.bg,boxSizing:"border-box"}}/>
        </div>
        <label style={{display:"flex",alignItems:"center",gap:8,fontSize:13,color:C.muted,cursor:"pointer",userSelect:"none"}}>
          <input type="checkbox" checked={rememberMe} onChange={e=>setRememberMe(e.target.checked)} style={{accentColor:C.purple,width:14,height:14}}/>
          Keep me logged in
        </label>
        <button type="submit" disabled={loading||!email.trim()||!password}
          style={{background:C.purple,color:"#fff",border:"none",borderRadius:8,padding:"12px",fontWeight:700,fontSize:14,cursor:loading?"not-allowed":"pointer",opacity:loading?0.7:1,marginTop:4}}>
          {loading ? "Logging in…" : "Log in"}
        </button>
      </form>
      <div style={{textAlign:"center",marginTop:20,fontSize:13,color:C.muted}}>
        Don't have an account?{" "}
        <button onClick={()=>go("signup")} style={{background:"none",border:"none",color:C.purple,fontWeight:600,cursor:"pointer",fontSize:13}}>Sign up</button>
      </div>
    </AuthCard>
  );
}

function SignupPage({go, onAuth}){
  const [step, setStep]       = useState("type"); // "type" | "form" | "confirm"
  const [accountType, setAccountType] = useState(null); // "individual" | "manager"
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [inviteLink, setInviteLink] = useState(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteSent, setInviteSent] = useState(false);

  const selectType = (type) => { setAccountType(type); setStep("form"); };

  const submit = async (e) => {
    e.preventDefault();
    if(!name.trim() || !email.trim() || password.length < 6) return;
    setLoading(true); setError(null);
    try {
      const role = accountType === "manager" ? "manager" : "individual";
      const d = await sb.signUp(email.trim(), password, { name: name.trim(), role });
      if(d.error) { setError(d.error.message || "Signup failed — try a different email."); return; }
      // With email confirmation ON, Supabase returns user at top level (d.id), not d.user
      const userId = d.user?.id || d.id;
      if(!userId) { setError("Signup failed — try a different email."); return; }
      const token = d.access_token || d.session?.access_token;
      if(token) {
        // Email confirmation OFF — proceed immediately
        sb.saveSession(token, userId);
        const user = d.user || d;
        await sbSaveProfile(userId, { name: name.trim(), role, focus:"", billings:"", challenge:"", ownChallenge:"" });
        if(accountType === "manager") {
          try {
            const resp = await fetch("/api/create-team", {
              method:"POST", headers:{"Content-Type":"application/json"},
              body: JSON.stringify({ userId, teamName: name.trim()+"'s Team", token })
            });
            const teamData = await resp.json();
            if(teamData.companyId) {
              setCompanyId(teamData.companyId);
              setInviteLink(`${window.location.origin}?company=${teamData.companyId}`);
            }
          } catch(te) { console.error("create-team error:", te); }
          setStep("invite");
        } else {
          await onAuth(user, role);
        }
      } else {
        // Email confirmation ON — save pending data, show "check your email"
        localStorage.setItem('heyscott_pending_signup', JSON.stringify({
          role,
          name: name.trim(),
          teamName: accountType === "manager" ? name.trim()+"'s Team" : undefined,
        }));
        setStep("confirm");
      }
    } catch(e) {
      setError("Connection issue — please try again.");
    } finally { setLoading(false); }
  };

  const sendInvite = async () => {
    if(!inviteEmail.trim() || !companyId) return;
    try {
      await fetch("/api/invite", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ email: inviteEmail.trim(), companyId })
      });
      setInviteSent(true); setInviteEmail("");
      setTimeout(()=>setInviteSent(false), 3000);
    } catch(e) {}
  };

  if(step === "invite"){
    return(
      <AuthCard title="Your team is ready" subtitle="Invite your recruiters to join.">
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          {inviteLink && (
            <div>
              <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:6}}>Shareable invite link</div>
              <div style={{display:"flex",gap:8}}>
                <div style={{flex:1,background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 12px",fontSize:11,color:C.muted,wordBreak:"break-all"}}>{inviteLink}</div>
                <button onClick={()=>navigator.clipboard?.writeText(inviteLink)}
                  style={{background:C.purple,color:"#fff",border:"none",borderRadius:8,padding:"9px 14px",fontSize:12,fontWeight:600,cursor:"pointer",flexShrink:0}}>Copy</button>
              </div>
            </div>
          )}
          <div>
            <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:6}}>Or invite by email</div>
            <div style={{display:"flex",gap:8}}>
              <input type="email" value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)}
                placeholder="recruiter@company.com"
                style={{flex:1,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 12px",fontSize:13,color:C.text,outline:"none",background:C.bg,boxSizing:"border-box"}}/>
              <button onClick={sendInvite} disabled={!inviteEmail.trim()}
                style={{background:inviteEmail.trim()?C.purple:C.border,color:inviteEmail.trim()?"#fff":C.muted,border:"none",borderRadius:8,padding:"9px 14px",fontSize:12,fontWeight:600,cursor:inviteEmail.trim()?"pointer":"not-allowed",flexShrink:0}}>
                {inviteSent ? "Sent!" : "Send"}
              </button>
            </div>
          </div>
          <button onClick={async()=>{ const u = await sb.getUser(); if(u) await onAuth(u, "manager"); }}
            style={{background:C.navy,color:"#fff",border:"none",borderRadius:8,padding:"12px",fontWeight:700,fontSize:14,cursor:"pointer",marginTop:8}}>
            Go to Manager Portal →
          </button>
        </div>
      </AuthCard>
    );
  }

  if(step === "confirm"){
    return(
      <AuthCard title="Check your email" subtitle="We've sent you a confirmation link.">
        <div style={{display:"flex",flexDirection:"column",gap:16,textAlign:"center",padding:"8px 0"}}>
          <div style={{fontSize:40}}>✉️</div>
          <p style={{fontSize:14,color:C.text,margin:0,lineHeight:1.5}}>Click the link we sent to <strong>{email}</strong> to activate your account.</p>
          <p style={{fontSize:12,color:C.muted,margin:0}}>Can't find it? Check your spam folder.</p>
          <button onClick={()=>go("login")}
            style={{background:"none",border:"none",color:C.purple,fontSize:13,fontWeight:600,cursor:"pointer",marginTop:8}}>
            Back to login
          </button>
        </div>
      </AuthCard>
    );
  }

  if(step === "type"){
    return(
      <AuthCard title="Create your account" subtitle="How will you use HeyScott?">
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {[
            {type:"individual", icon:"👤", label:"Individual account", desc:"Just me, practising my skills and tracking progress."},
            {type:"manager",    icon:"👥", label:"Team account",       desc:"I manage a team of recruiters and want to coach them."},
          ].map(opt=>(
            <button key={opt.type} onClick={()=>selectType(opt.type)}
              style={{background:C.bg,border:`2px solid ${C.border}`,borderRadius:12,padding:"16px 18px",textAlign:"left",cursor:"pointer",transition:"all 0.15s",display:"flex",gap:14,alignItems:"flex-start"}}>
              <span style={{fontSize:24,lineHeight:1}}>{opt.icon}</span>
              <div>
                <div style={{fontWeight:700,color:C.navy,fontSize:14,marginBottom:3}}>{opt.label}</div>
                <div style={{fontSize:12,color:C.muted,lineHeight:1.4}}>{opt.desc}</div>
              </div>
            </button>
          ))}
          <div style={{textAlign:"center",marginTop:8,fontSize:13,color:C.muted}}>
            Already have an account?{" "}
            <button onClick={()=>go("login")} style={{background:"none",border:"none",color:C.purple,fontWeight:600,cursor:"pointer",fontSize:13}}>Log in</button>
          </div>
        </div>
      </AuthCard>
    );
  }

  return(
    <AuthCard
      title={accountType==="manager" ? "Set up your team account" : "Create your account"}
      subtitle={accountType==="manager" ? "You'll get an invite link to share with your team." : "Get personalised coaching tailored to you."}>
      <form onSubmit={submit} style={{display:"flex",flexDirection:"column",gap:14}}>
        {error && <div style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:8,padding:"10px 14px",fontSize:13,color:"#991B1B"}}>{error}</div>}
        <div>
          <label style={{fontSize:12,fontWeight:600,color:C.muted,display:"block",marginBottom:5}}>Your name</label>
          <input type="text" value={name} onChange={e=>setName(e.target.value)} required
            placeholder="Alex Chen"
            style={{width:"100%",border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 14px",fontSize:13,color:C.text,outline:"none",background:C.bg,boxSizing:"border-box"}}/>
        </div>
        <div>
          <label style={{fontSize:12,fontWeight:600,color:C.muted,display:"block",marginBottom:5}}>Email</label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required
            placeholder="your@email.com"
            style={{width:"100%",border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 14px",fontSize:13,color:C.text,outline:"none",background:C.bg,boxSizing:"border-box"}}/>
        </div>
        <div>
          <label style={{fontSize:12,fontWeight:600,color:C.muted,display:"block",marginBottom:5}}>Password</label>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={6}
            placeholder="At least 6 characters"
            style={{width:"100%",border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 14px",fontSize:13,color:C.text,outline:"none",background:C.bg,boxSizing:"border-box"}}/>
        </div>
        <button type="submit" disabled={loading||!name.trim()||!email.trim()||password.length<6}
          style={{background:C.purple,color:"#fff",border:"none",borderRadius:8,padding:"12px",fontWeight:700,fontSize:14,cursor:loading?"not-allowed":"pointer",opacity:loading?0.7:1,marginTop:4}}>
          {loading ? "Creating account…" : accountType==="manager" ? "Create team account" : "Create account"}
        </button>
        <button type="button" onClick={()=>setStep("type")}
          style={{background:"none",border:"none",color:C.muted,fontSize:13,cursor:"pointer",textAlign:"center"}}>
          ← Change account type
        </button>
      </form>
    </AuthCard>
  );
}

function InvitePage({go, onAuth}){
  const companyId = new URLSearchParams(window.location.search).get('company');
  const [step, setStep]       = useState("form");
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if(!name.trim() || !email.trim() || password.length < 6) return;
    setLoading(true); setError(null);
    try {
      const d = await sb.signUp(email.trim(), password, { name: name.trim(), role: "learner", company_id: companyId });
      if(d.error) { setError(d.error.message || "Signup failed — try a different email."); return; }
      const userId = d.user?.id || d.id;
      if(!userId) { setError("Signup failed — try a different email."); return; }
      const token = d.access_token || d.session?.access_token;
      if(token) {
        sb.saveSession(token, userId);
        await sbSaveProfile(userId, { name: name.trim(), role: "learner", company_id: companyId, focus:"", billings:"", challenge:"", ownChallenge:"" });
        const user = d.user || d;
        await onAuth(user, "learner");
      } else {
        localStorage.setItem('heyscott_pending_signup', JSON.stringify({
          role: "learner", name: name.trim(), company_id: companyId,
        }));
        setStep("confirm");
      }
    } catch(e) {
      setError("Connection issue — please try again.");
    } finally { setLoading(false); }
  };

  if(step === "confirm"){
    return(
      <AuthCard title="Check your email" subtitle="We've sent you a confirmation link.">
        <div style={{display:"flex",flexDirection:"column",gap:16,textAlign:"center",padding:"8px 0"}}>
          <div style={{fontSize:40}}>✉️</div>
          <p style={{fontSize:14,color:C.text,margin:0,lineHeight:1.5}}>Click the link we sent to <strong>{email}</strong> to activate your account.</p>
          <p style={{fontSize:12,color:C.muted,margin:0}}>Can't find it? Check your spam folder.</p>
          <button onClick={()=>go("login")}
            style={{background:"none",border:"none",color:C.purple,fontSize:13,fontWeight:600,cursor:"pointer",marginTop:8}}>
            Back to login
          </button>
        </div>
      </AuthCard>
    );
  }

  return(
    <AuthCard title="You've been invited" subtitle="Create your account to join your team on HeyScott.">
      <form onSubmit={submit} style={{display:"flex",flexDirection:"column",gap:14}}>
        {error && <div style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:8,padding:"10px 14px",fontSize:13,color:"#991B1B"}}>{error}</div>}
        <div>
          <label style={{fontSize:12,fontWeight:600,color:C.muted,display:"block",marginBottom:5}}>Your name</label>
          <input type="text" value={name} onChange={e=>setName(e.target.value)} required placeholder="Alex Chen"
            style={{width:"100%",border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 14px",fontSize:13,color:C.text,outline:"none",background:C.bg,boxSizing:"border-box"}}/>
        </div>
        <div>
          <label style={{fontSize:12,fontWeight:600,color:C.muted,display:"block",marginBottom:5}}>Email</label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="your@email.com"
            style={{width:"100%",border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 14px",fontSize:13,color:C.text,outline:"none",background:C.bg,boxSizing:"border-box"}}/>
        </div>
        <div>
          <label style={{fontSize:12,fontWeight:600,color:C.muted,display:"block",marginBottom:5}}>Password</label>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={6} placeholder="At least 6 characters"
            style={{width:"100%",border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 14px",fontSize:13,color:C.text,outline:"none",background:C.bg,boxSizing:"border-box"}}/>
        </div>
        <button type="submit" disabled={loading||!name.trim()||!email.trim()||password.length<6}
          style={{background:C.purple,color:"#fff",border:"none",borderRadius:8,padding:"12px",fontWeight:700,fontSize:14,cursor:loading?"not-allowed":"pointer",opacity:loading?0.7:1,marginTop:4}}>
          {loading ? "Joining team…" : "Join team"}
        </button>
      </form>
    </AuthCard>
  );
}

/* ════════════════════════════════════════════════════════════════
   LANDING PAGE — Clean carousel / section scroll
════════════════════════════════════════════════════════════════ */
function Landing({go}){
  const sage=C.primary;
  const sageDark="hsl(140,15%,30%)";

  const steps=[
    {n:"01",title:"Take your diagnostic",desc:"A 5-minute assessment maps your current skill level across cold calling, discovery, and objection handling."},
    {n:"02",title:"Train with AI roleplay",desc:"Practice with realistic personas like The Gatekeeper and The Fence-Sitter. Get instant, specific feedback after every call."},
    {n:"03",title:"Track your growth",desc:"Streaks, milestones, and skill scores update after every session — so you always know exactly what to work on next."},
  ];

  const features=[
    {icon:"🎯",title:"Ask Scott",desc:"Paste a transcript, ask a live coaching question, or review a call. Immediate feedback and scripts you can use right now."},
    {icon:"🎭",title:"AI Roleplay",desc:"Practice with named personas: The Gatekeeper, The Fence-Sitter, and more."},
    {icon:"📈",title:"Progress Tracking",desc:"Milestones, streaks, and skill scores updated after every session."},
    {icon:"👔",title:"Manager Dashboard",desc:"At-risk alerts, team completion rates, and coaching prompts."},
    {icon:"🧠",title:"Resilience Modules",desc:"CBT-backed content for rejection fatigue and market burnout."},
    {icon:"⚡",title:"Quick Mode",desc:"Skip to roleplay in under 8 minutes. TL;DR cards on every lesson."},
  ];

  return(
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:"'Inter',sans-serif"}}>

      {/* Navbar */}
      <header style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 48px",position:"sticky",top:0,background:C.bg,zIndex:10,borderBottom:`1px solid ${C.border}`}}>
        <div style={{display:"flex",alignItems:"center",gap:9}}>
          <div style={{width:30,height:30,background:C.navy,borderRadius:5,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <span style={{color:C.lav,fontSize:12,fontWeight:900,lineHeight:1}}>↗</span>
          </div>
          <span style={{fontWeight:700,fontSize:16,color:C.navy,letterSpacing:-0.2}}>HeyScott</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:24}}>
          <button onClick={()=>go("login")} style={{background:"none",border:"none",color:C.navy,fontSize:14,fontWeight:500,cursor:"pointer",opacity:0.65}}>Log in</button>
          <button onClick={()=>go("signup")}
            style={{background:sage,color:"#fff",border:"none",borderRadius:5,padding:"10px 22px",fontSize:13,fontWeight:600,cursor:"pointer",letterSpacing:0.1,transition:"background 0.15s"}}
            onMouseEnter={e=>e.currentTarget.style.background=sageDark}
            onMouseLeave={e=>e.currentTarget.style.background=sage}>
            Get started
          </button>
        </div>
      </header>

      {/* Hero */}
      <section style={{maxWidth:820,margin:"0 auto",padding:"88px 32px 64px",textAlign:"center"}}>
        <div style={{display:"inline-flex",alignItems:"center",border:`1.5px solid rgba(20,15,45,0.18)`,borderRadius:999,padding:"6px 18px",fontSize:13,color:C.navy,marginBottom:36,letterSpacing:0.1,background:"transparent"}}>
          The AI Coach for 360 Recruiters
        </div>

        <h1 style={{fontFamily:"'Instrument Serif',Georgia,serif",margin:"0 0 22px",lineHeight:1.08,letterSpacing:-1}}>
          <span style={{fontSize:"clamp(46px,6.5vw,80px)",fontWeight:700,color:C.navy,display:"block"}}>Turn Every Call</span>
          <span style={{fontSize:"clamp(46px,6.5vw,80px)",fontWeight:400,fontStyle:"italic",color:"#536471",display:"block"}}>Into Your Next Win</span>
        </h1>

        <p style={{fontSize:17,color:"#6B7280",lineHeight:1.72,maxWidth:520,margin:"0 auto 36px"}}>
          AI coaching built for recruiters — feedback, milestones, and mindset in one place.
        </p>

        <div style={{maxWidth:420,margin:"0 auto"}}>
          <button onClick={()=>go("signup")}
            style={{width:"100%",background:sage,color:"#fff",border:"none",borderRadius:5,padding:"17px 0",fontSize:15,fontWeight:600,cursor:"pointer",letterSpacing:0.2,transition:"background 0.15s"}}
            onMouseEnter={e=>e.currentTarget.style.background=sageDark}
            onMouseLeave={e=>e.currentTarget.style.background=sage}>
            Start your diagnostic
          </button>
          <p style={{fontSize:12,color:"#9CA3AF",marginTop:12,margin:"12px 0 0"}}>Free to start · No credit card needed</p>
        </div>
      </section>

      {/* Social proof */}
      <div style={{textAlign:"center",padding:"0 24px 60px"}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:12,background:C.white,borderRadius:999,padding:"10px 20px",border:`1px solid ${C.border}`}}>
          <div style={{display:"flex"}}>
            {[C.lav,C.lavSoft,C.purple,C.navy,C.muted].map((col,i)=>(
              <div key={i} style={{width:26,height:26,borderRadius:"50%",background:col,border:"2.5px solid #fff",marginLeft:i?-8:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:i>1?"#fff":C.navy,fontWeight:700}}>
                {String.fromCharCode(65+i)}
              </div>
            ))}
          </div>
          <span style={{fontSize:13,color:C.navy,fontWeight:500}}>1,200+ recruiters already improving</span>
        </div>
      </div>

      {/* How it works */}
      <section style={{borderTop:`1px solid ${C.border}`,borderBottom:`1px solid ${C.border}`,padding:"64px 32px"}}>
        <div style={{maxWidth:760,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:52}}>
            <div style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:3,color:C.muted,marginBottom:14}}>How it works</div>
            <div style={{fontFamily:"'Instrument Serif',Georgia,serif",fontSize:"clamp(24px,3.5vw,34px)",fontWeight:600,color:C.navy,letterSpacing:-0.5}}>
              From your first call to your best call
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:40}}>
            {steps.map((s,i)=>(
              <div key={i} style={{textAlign:"center"}}>
                <div style={{fontSize:11,fontWeight:800,color:sage,letterSpacing:2.5,marginBottom:16}}>{s.n}</div>
                <div style={{width:1,height:28,background:C.border,margin:"0 auto 18px"}}/>
                <div style={{fontWeight:700,color:C.navy,fontSize:15,marginBottom:8}}>{s.title}</div>
                <p style={{fontSize:13,color:C.muted,lineHeight:1.7,margin:0}}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats band */}
      <div style={{background:C.navy,padding:"52px 24px"}}>
        <div style={{maxWidth:640,margin:"0 auto",display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:24,textAlign:"center"}}>
          {[{n:"+34%",l:"Faster ramp-up"},{n:"<8 min",l:"To first roleplay"},{n:"6 skills",l:"Tracked per recruiter"}].map((s,i)=>(
            <div key={i}>
              <div style={{fontFamily:"'Instrument Serif',Georgia,serif",fontSize:38,fontWeight:700,color:C.lav,letterSpacing:-1}}>{s.n}</div>
              <div style={{fontSize:13,color:"rgba(255,255,255,0.5)",marginTop:8}}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features grid */}
      <section style={{maxWidth:760,margin:"0 auto",padding:"64px 32px"}}>
        <div style={{textAlign:"center",marginBottom:44}}>
          <div style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:3,color:C.muted,marginBottom:14}}>Features</div>
          <div style={{fontFamily:"'Instrument Serif',Georgia,serif",fontSize:"clamp(24px,3.5vw,34px)",fontWeight:600,color:C.navy,letterSpacing:-0.5}}>
            Built for the recruitment floor
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:14}}>
          {features.map((f,i)=>(
            <div key={i}
              style={{background:C.white,borderRadius:R.lg,padding:"24px 20px",border:`1px solid ${C.border}`,transition:"box-shadow 0.18s,transform 0.18s",cursor:"default"}}
              onMouseEnter={e=>{e.currentTarget.style.boxShadow=Sh.lg;e.currentTarget.style.transform="translateY(-3px)";}}
              onMouseLeave={e=>{e.currentTarget.style.boxShadow=Sh.none;e.currentTarget.style.transform="translateY(0)";}}>
              <div style={{fontSize:24,marginBottom:12}}>{f.icon}</div>
              <div style={{fontWeight:700,color:C.navy,fontSize:14,marginBottom:6}}>{f.title}</div>
              <p style={{fontSize:13,color:C.muted,lineHeight:1.6,margin:0}}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonial */}
      <section style={{background:C.bgDeep,borderTop:`1px solid ${C.border}`,borderBottom:`1px solid ${C.border}`,padding:"60px 32px"}}>
        <div style={{maxWidth:560,margin:"0 auto",textAlign:"center"}}>
          <div style={{fontFamily:"'Instrument Serif',Georgia,serif",fontSize:21,fontWeight:400,fontStyle:"italic",color:C.navy,lineHeight:1.7,marginBottom:28}}>
            "Scott gave me feedback on my cold calls that my manager never had time to give. Within two weeks I was booking 40% more meetings."
          </div>
          <div style={{display:"flex",alignItems:"center",gap:12,justifyContent:"center"}}>
            <div style={{width:38,height:38,borderRadius:"50%",background:C.purple,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:14,flexShrink:0}}>J</div>
            <div style={{textAlign:"left"}}>
              <div style={{fontSize:13,fontWeight:700,color:C.navy}}>Jamie R.</div>
              <div style={{fontSize:12,color:C.muted}}>Senior Recruiter, London</div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{maxWidth:680,margin:"0 auto",padding:"72px 32px 88px",textAlign:"center"}}>
        <div style={{fontFamily:"'Instrument Serif',Georgia,serif",fontSize:"clamp(26px,4vw,40px)",fontWeight:700,color:C.navy,letterSpacing:-0.5,marginBottom:14}}>
          Ready to make better calls?
        </div>
        <p style={{fontSize:16,color:C.muted,lineHeight:1.68,maxWidth:420,margin:"0 auto 36px"}}>
          Start your free diagnostic. No setup. No credit card. Just better calls.
        </p>
        <div style={{maxWidth:420,margin:"0 auto"}}>
          <button onClick={()=>go("signup")}
            style={{width:"100%",background:sage,color:"#fff",border:"none",borderRadius:5,padding:"17px 0",fontSize:15,fontWeight:600,cursor:"pointer",marginBottom:16,transition:"background 0.15s"}}
            onMouseEnter={e=>e.currentTarget.style.background=sageDark}
            onMouseLeave={e=>e.currentTarget.style.background=sage}>
            Start your diagnostic
          </button>
          <div style={{display:"flex",justifyContent:"center",gap:20,fontSize:12,color:"#9CA3AF",flexWrap:"wrap"}}>
            {["Free 7-day trial","Cancel anytime","SOC-2 ready"].map((t,i)=><span key={i}>✓ {t}</span>)}
          </div>
        </div>
      </section>

    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   ONBOARDING — Motivational profiling (C1 from roadmap)
════════════════════════════════════════════════════════════════ */
function Onboarding({go,setProfile,setUserRole}){
  const [step,setStep]=useState(0);
  const [role,setRole]=useState(null);
  const [answers,setAnswers]=useState({exp:null,goal:null,challenge:null});

  const steps=[
    {
      q:"What's your experience level?",
      key:"exp",
      opts:["I'm new to recruitment","I have 1–3 years experience","I'm a seasoned recruiter"],
    },
    {
      q:"What's your primary goal?",
      key:"goal",
      opts:["Improve my conversion rate","Handle objections better","Build candidate relationships","Boost my confidence"],
    },
    {
      q:"What's your biggest challenge right now?",
      key:"challenge",
      opts:["Candidates not responding","Getting past the first objection","Closing placements","Staying motivated"],
    },
  ];

  // Role picker — then hand off to deep Scott profiling
  if(role===null){
    return(
      <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Inter',sans-serif",padding:24}}>
        <div style={{width:"100%",maxWidth:480}}>
          <div style={{background:C.navy,borderRadius:22,padding:28,marginBottom:28,display:"flex",gap:18,alignItems:"center"}}>
            <Av ini="SC" col={C.lavSoft} sz={52}/>
            <div>
              <div style={{fontWeight:800,color:"#fff",fontSize:20,marginBottom:4}}>Hey — I'm Scott.</div>
              <p style={{fontSize:13,color:"rgba(255,255,255,0.65)",lineHeight:1.65}}>Your AI sales coach for recruitment. Let's get you set up properly.</p>
            </div>
          </div>
          <div style={{fontSize:15,fontWeight:700,color:C.navy,marginBottom:16}}>How are you joining?</div>
          <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:20}}>
            {[{r:"learner",label:"I'm a recruiter",desc:"I want to improve my own skills and performance",icon:"🎯"},
              {r:"manager",label:"I'm a manager or team lead",desc:"I want to coach and track my team",icon:"👔"}].map(opt=>(
              <button key={opt.r} onClick={()=>{
                if(opt.r==="manager"){setUserRole("manager");go("manager");}
                else{setRole(opt.r);}
              }}
                style={{background:C.white,border:`2px solid ${C.border}`,borderRadius:18,padding:20,cursor:"pointer",textAlign:"left",transition:"all 0.15s",display:"flex",gap:14,alignItems:"center"}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=C.purple;e.currentTarget.style.background=C.lavPale;}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.background=C.white;}}>
                <span style={{fontSize:28,flexShrink:0}}>{opt.icon}</span>
                <div>
                  <div style={{fontWeight:700,color:C.navy,fontSize:15}}>{opt.label}</div>
                  <div style={{color:C.muted,fontSize:13,marginTop:2}}>{opt.desc}</div>
                </div>
              </button>
            ))}
          </div>
          <button onClick={()=>go("learning")} style={{width:"100%",background:"none",border:"none",color:C.muted,fontSize:13,cursor:"pointer"}}>Skip setup</button>
        </div>
      </div>
    );
  }

  // Recruiter — deep profiling via ScottOnboarding
  return <ScottOnboarding existingProfile={null} onComplete={p=>{setProfile(p);saveProfile(p);setUserRole("learner");go("learning");checkAndNotifyModuleGap(p).catch(()=>{});}}/>;
}

/* ════════════════════════════════════════════════════════════════
   LEARNING
════════════════════════════════════════════════════════════════ */
/* ══════════════════════════════════════════════════════════════
   CONSULTANT JOURNAL — mindset & emotional coaching
══════════════════════════════════════════════════════════════ */

const JOURNAL_STORE = "heyscott_journal_v1";

function loadJournalEntries(){
  try { const s=localStorage.getItem(JOURNAL_STORE); return s?JSON.parse(s):[]; } catch(e){ return []; }
}
function saveJournalEntry(entry){
  try { const a=loadJournalEntries(); a.unshift(entry); localStorage.setItem(JOURNAL_STORE,JSON.stringify(a.slice(0,50))); } catch(e){}
}

// Streak + energy tracking helpers
function getJournalStreak(){
  try {
    const entries = loadJournalEntries();
    if(!entries.length) return 0;
    let streak=1, prev=new Date(entries[0].date).setHours(0,0,0,0);
    for(let i=1;i<entries.length;i++){
      const d=new Date(entries[i].date).setHours(0,0,0,0);
      if(prev-d===86400000){ streak++; prev=d; } else if(prev-d>86400000) break;
    }
    return streak;
  } catch(e){ return 0; }
}

function JournalView({go, profile}){
  const TABS = ["Today","History","Progress"];
  const [tab,   setTab]   = useState("Today");
  const [energy, setEnergy] = useState(null); // 1-5
  const [mode,   setMode]   = useState("idle"); // idle | check-in | chat | done
  const [msgs,   setMsgs]   = useState([]);
  const [input,  setInput]  = useState("");
  const [loading, setLoading] = useState(false);
  const [entry,   setEntry]   = useState(null); // today's saved entry
  const [entries, setEntries] = useState(()=>loadJournalEntries());
  const chatRef = useRef(null);
  const inputRef = useRef(null);

  const streak = getJournalStreak();
  const todayStr = new Date().toISOString().slice(0,10);
  const todayEntry = entries.find(e=>e.date?.startsWith(todayStr));

  useEffect(()=>{ if(chatRef.current) chatRef.current.scrollTop=chatRef.current.scrollHeight; },[msgs]);

  const SYSTEM = `You are Scott — a performance psychology coach who works with elite recruiters. You blend sports psychology, cognitive behavioural techniques, and recruitment experience to help people break through what's holding them back.

${profile ? `This recruiter: ${profile.focus}, billing ${profile.billings}. Their stated challenge: "${profile.ownChallenge||profile.challenge}". Weave this into your coaching — make it feel personal.` : ""}

YOUR APPROACH (use these techniques naturally — never name them):
- Cognitive reframing: surface the exact negative self-talk, challenge it, replace with functional dialogue ("I'm going to get rejected" → "each call is data, not a verdict")
- Growth mindset: reframe avoidance as a signal worth being curious about, not a character flaw
- Identity coaching: help them describe who they ARE at their best — use that identity as an anchor
- Emotional awareness: name the feeling precisely before trying to change it
- Visualisation: build a specific, sensory mental image of them performing well
- Cue words: one word they can use to reset mid-call ("breathe", "curious", "peer")
- Pre-call routine: a 60-second ritual that primes their state before dialling

CONVERSATION RULES:
- One question at a time. Wait for the answer before going deeper.
- Use their EXACT words back to them — if they say "I freeze", use "freeze"
- Diagnose before prescribing. Understand the block before offering a tool.
- Be warm and direct. No toxic positivity. No empty validation.
- Arc: acknowledge energy → surface the specific behaviour → get underneath it → reframe → one practical tool → one tiny commitment for today`;

  const startSession = async (energyLevel) => {
    setEnergy(energyLevel);
    setMode("chat");
    setLoading(true);
    const energyLabel = energyLevel<=2?"low — maybe avoidant or drained":energyLevel===3?"moderate — showing up but not fully engaged":"high — ready and motivated";
    try {
      const opener = await callAPI([{
        role:"user",
        content:`My energy today is ${energyLevel}/5 (${energyLabel}). Start the session.`
      }], SYSTEM, {model:"claude-sonnet-4-6", max_tokens:400});
      setMsgs([{role:"assistant",content:opener}]);
    } catch(e) {
      setMsgs([{role:"assistant",content:"I'm having trouble connecting right now. Please try again."}]);
    }
    setLoading(false);
    setTimeout(()=>inputRef.current?.focus(),100);
  };

  const send = async () => {
    if(!input.trim()||loading) return;
    const userMsg = {role:"user",content:input.trim()};
    const newMsgs = [...msgs,userMsg];
    setMsgs(newMsgs); setInput(""); setLoading(true);
    try {
      const reply = await callAPI(
        newMsgs.map(m=>({role:m.role,content:m.content})),
        SYSTEM, {model:"claude-sonnet-4-6", max_tokens:600}
      );
      const updatedMsgs = [...newMsgs,{role:"assistant",content:reply}];
      setMsgs(updatedMsgs);
      setTimeout(()=>inputRef.current?.focus(),100);
      if(updatedMsgs.length>=8 && !entry){
        const saved = {
          date: new Date().toISOString(),
          energy,
          turns: updatedMsgs.length,
          summary: reply.slice(0,120),
          msgs: updatedMsgs,
        };
        saveJournalEntry(saved);
        setEntries(loadJournalEntries());
        setEntry(saved);
      }
    } catch(e) {
      setMsgs([...newMsgs,{role:"assistant",content:"Something went wrong — please try sending again."}]);
    }
    setLoading(false);
  };

  const closeSession = () => {
    if(msgs.length>=4 && !entry){
      const saved = {date:new Date().toISOString(),energy,turns:msgs.length,summary:msgs[msgs.length-1]?.content?.slice(0,120)||"",msgs};
      saveJournalEntry(saved);
      setEntries(loadJournalEntries());
      setEntry(saved);
    }
    setMode("done");
  };

  const energyColor = e => e<=2?"#EF4444":e===3?"#F59E0B":"#22C55E";
  const energyLabel = e => e===1?"Avoidant":e===2?"Low energy":e===3?"Showing up":e===4?"Engaged":"In flow";
  const energyEmoji = e => ["😔","😕","😐","🙂","🔥"][e-1];

  // Progress metrics across entries
  const avgEnergy = entries.length ? Math.round(entries.slice(0,14).reduce((a,e)=>a+(e.energy||3),0)/Math.min(entries.length,14)*10)/10 : null;
  const energyTrend = entries.length>=2 ? (entries[0].energy||3)-(entries[Math.min(4,entries.length-1)].energy||3) : 0;

  return(
    <div style={{animation:"fadeUp 0.3s ease both"}}>
      {/* Tab bar */}
      <div style={{display:"flex",gap:4,marginBottom:20,background:C.white,borderRadius:5,padding:4,border:`1px solid ${C.border}`,width:"fit-content"}}>
        {TABS.map(t=>(
          <button key={t} onClick={()=>setTab(t)}
            style={{padding:"7px 18px",borderRadius:9,border:"none",cursor:"pointer",fontSize:13,fontWeight:600,background:tab===t?C.navy:"none",color:tab===t?"#fff":C.muted,transition:"all 0.15s"}}>
            {t}
          </button>
        ))}
      </div>

      {/* ── TODAY ── */}
      {tab==="Today" && (
        <div>
          {/* Header */}
          <div style={{display:"flex",gap:20,alignItems:"flex-start",marginBottom:20,flexWrap:"wrap"}}>
            <div style={{flex:1}}>
              <h1 style={{fontSize:22,fontWeight:800,color:C.navy,marginBottom:4}}>Consultant Journal</h1>
              <p style={{fontSize:13,color:C.muted,lineHeight:1.6}}>A space to understand what's getting in the way — and build the mindset to move through it.</p>
            </div>
            <div style={{display:"flex",gap:10,flexShrink:0}}>
              {streak>0&&(
                <div style={{background:C.navy,borderRadius:5,padding:"10px 16px",textAlign:"center"}}>
                  <div style={{fontSize:20,fontWeight:900,color:"#fff"}}>{streak}</div>
                  <div style={{fontSize:10,color:"rgba(255,255,255,0.5)"}}>day streak</div>
                </div>
              )}
              {avgEnergy&&(
                <div style={{background:C.white,borderRadius:5,padding:"10px 16px",textAlign:"center",border:`1px solid ${C.border}`}}>
                  <div style={{fontSize:20,fontWeight:900,color:energyColor(Math.round(avgEnergy))}}>{avgEnergy}</div>
                  <div style={{fontSize:10,color:C.muted}}>avg energy</div>
                </div>
              )}
            </div>
          </div>

          {/* Already did today's session */}
          {todayEntry && mode==="idle" && (
            <div style={{background:"#F0FDF4",borderRadius:5,border:"1px solid #BBF7D0",padding:"18px 22px",marginBottom:16}}>
              <div style={{fontSize:11,fontWeight:700,color:C.green,textTransform:"uppercase",letterSpacing:1.5,marginBottom:8}}>✓ Session complete today</div>
              <p style={{fontSize:13,color:"#14532D",lineHeight:1.6,margin:"0 0 12px"}}>{todayEntry.summary}…</p>
              <button onClick={()=>{setMsgs(todayEntry.msgs||[]); setEnergy(todayEntry.energy); setMode("chat");}}
                style={{background:C.green,color:"#fff",border:"none",borderRadius:999,padding:"8px 18px",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                Continue session
              </button>
            </div>
          )}

          {/* Idle — energy check-in */}
          {mode==="idle" && !todayEntry && (
            <div style={{background:C.white,borderRadius:20,border:`1px solid ${C.border}`,padding:"24px 22px"}}>
              <div style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:20}}>
                <Av ini="SC" col={C.lavSoft} sz={38}/>
                <div>
                  <div style={{fontWeight:700,color:C.navy,fontSize:14,marginBottom:4}}>Good to see you.</div>
                  <p style={{fontSize:13,color:C.muted,lineHeight:1.6,margin:0}}>Before we start — how's your energy today? Be honest. This is just for you.</p>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8}}>
                {[1,2,3,4,5].map(e=>(
                  <button key={e} onClick={()=>startSession(e)}
                    style={{background:C.bg,border:`2px solid ${C.border}`,borderRadius:14,padding:"14px 8px",cursor:"pointer",textAlign:"center",transition:"all 0.15s",fontFamily:"'Inter',sans-serif"}}
                    onMouseEnter={ev=>{ev.currentTarget.style.borderColor=energyColor(e);ev.currentTarget.style.background=e<=2?"#FEF2F2":e===3?"#FFFBEB":"#F0FDF4";}}
                    onMouseLeave={ev=>{ev.currentTarget.style.borderColor=C.border;ev.currentTarget.style.background=C.bg;}}>
                    <div style={{fontSize:24,marginBottom:6}}>{energyEmoji(e)}</div>
                    <div style={{fontSize:10,fontWeight:700,color:C.navy}}>{e}/5</div>
                    <div style={{fontSize:9,color:C.muted,marginTop:2}}>{energyLabel(e)}</div>
                  </button>
                ))}
              </div>
              <div style={{marginTop:14,fontSize:11,color:C.muted,textAlign:"center"}}>Your answer shapes the coaching session</div>
            </div>
          )}

          {/* Chat */}
          {mode==="chat" && (
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {/* Energy badge */}
              {energy&&(
                <div style={{display:"flex",gap:8,alignItems:"center",padding:"8px 14px",background:C.bg,borderRadius:5,width:"fit-content"}}>
                  <span style={{fontSize:16}}>{energyEmoji(energy)}</span>
                  <span style={{fontSize:12,color:C.muted}}>Energy today: <strong style={{color:energyColor(energy)}}>{energy}/5 — {energyLabel(energy)}</strong></span>
                </div>
              )}

              {/* Chat area */}
              <div ref={chatRef} style={{background:C.white,borderRadius:5,border:`1px solid ${C.border}`,padding:16,minHeight:360,maxHeight:480,overflowY:"auto",display:"flex",flexDirection:"column",gap:10}}>
                {loading && msgs.length===0 && (
                  <div style={{display:"flex",gap:8,alignItems:"flex-start"}}>
                    <Av ini="SC" col={C.lavSoft} sz={28}/>
                    <div style={{background:C.lavPale,borderRadius:"12px 12px 12px 4px",padding:"10px 14px",border:`1px solid ${C.lavSoft}`}}>
                      <div style={{display:"flex",gap:4}}>{[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:"50%",background:C.purple,animation:"bounce 1s infinite",animationDelay:`${i*0.2}s`}}/>)}</div>
                    </div>
                  </div>
                )}
                {msgs.map((m,i)=>(
                  <div key={i} style={{display:"flex",gap:8,justifyContent:m.role==="user"?"flex-end":"flex-start",alignItems:"flex-start"}}>
                    {m.role==="assistant"&&<Av ini="SC" col={C.lavSoft} sz={28}/>}
                    <div style={{
                      background:m.role==="user"?C.navy:C.lavPale,
                      color:m.role==="user"?"#fff":C.text,
                      borderRadius:m.role==="user"?"14px 14px 4px 14px":"14px 14px 14px 4px",
                      padding:"10px 14px",fontSize:13,lineHeight:1.65,maxWidth:"80%",
                      border:m.role==="assistant"?`1px solid ${C.lavSoft}`:"none",
                      whiteSpace:"pre-wrap",
                    }}>{m.content}</div>
                    {m.role==="user"&&<Av ini="ME" col={C.purple} sz={28}/>}
                  </div>
                ))}
                {loading && msgs.length>0 && (
                  <div style={{display:"flex",gap:8,alignItems:"flex-start"}}>
                    <Av ini="SC" col={C.lavSoft} sz={28}/>
                    <div style={{background:C.lavPale,borderRadius:"14px 14px 14px 4px",padding:"10px 14px",border:`1px solid ${C.lavSoft}`}}>
                      <div style={{display:"flex",gap:4}}>{[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:"50%",background:C.purple,animation:"bounce 1s infinite",animationDelay:`${i*0.2}s`}}/>)}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div style={{display:"flex",gap:8}}>
                <input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)}
                  onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey&&input.trim()){ e.preventDefault(); send(); } }}
                  placeholder="Reply to Scott…"
                  disabled={loading}
                  style={{flex:1,background:C.white,border:`1px solid ${C.border}`,borderRadius:999,padding:"11px 18px",fontSize:13,color:C.text,outline:"none",fontFamily:"'Inter',sans-serif",opacity:loading?0.6:1}}/>
                <button onClick={send} disabled={!input.trim()||loading}
                  style={{background:input.trim()&&!loading?C.purple:C.border,color:input.trim()&&!loading?"#fff":C.muted,border:"none",borderRadius:999,padding:"11px 20px",fontWeight:700,fontSize:13,cursor:input.trim()&&!loading?"pointer":"not-allowed",transition:"all 0.2s"}}>
                  Send
                </button>
              </div>

              {msgs.length>=4 && (
                <button onClick={closeSession}
                  style={{background:"none",border:`1px solid ${C.border}`,borderRadius:999,padding:"8px 20px",fontSize:12,color:C.muted,cursor:"pointer",alignSelf:"flex-start"}}>
                  ✓ End session & save
                </button>
              )}
            </div>
          )}

          {/* Done */}
          {mode==="done" && (
            <div style={{background:C.white,borderRadius:5,border:`1px solid ${C.border}`,padding:"24px 22px",textAlign:"center"}}>
              <div style={{fontSize:32,marginBottom:12}}>✓</div>
              <div style={{fontWeight:800,color:C.navy,fontSize:16,marginBottom:8}}>Session saved</div>
              <p style={{fontSize:13,color:C.muted,marginBottom:20,lineHeight:1.6}}>
                Good work showing up. Consistency here builds the same muscle as consistency on the phones.
              </p>
              <button onClick={()=>{setMode("idle");setMsgs([]);setEnergy(null);setEntry(null);setEntries(loadJournalEntries());setTab("History");}}
                style={{background:C.navy,color:"#fff",border:"none",borderRadius:999,padding:"10px 24px",fontWeight:700,fontSize:13,cursor:"pointer"}}>
                View history
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── HISTORY ── */}
      {tab==="History" && (
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <h2 style={{fontSize:16,fontWeight:800,color:C.navy,marginBottom:4}}>Session history</h2>
          {entries.length===0 ? (
            <div style={{background:C.white,borderRadius:14,border:`1px solid ${C.border}`,padding:32,textAlign:"center"}}>
              <div style={{fontSize:28,marginBottom:8}}>📓</div>
              <div style={{fontWeight:700,color:C.navy,marginBottom:4}}>No sessions yet</div>
              <div style={{fontSize:13,color:C.muted}}>Complete your first check-in under Today.</div>
            </div>
          ) : entries.map((e,i)=>(
            <div key={i} style={{background:C.white,borderRadius:14,border:`1px solid ${C.border}`,padding:"14px 18px"}}>
              <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:e.summary?8:0}}>
                <span style={{fontSize:18}}>{energyEmoji(e.energy||3)}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,fontWeight:700,color:C.navy}}>{new Date(e.date).toLocaleDateString("en-AU",{weekday:"short",day:"numeric",month:"short"})}</div>
                  <div style={{fontSize:11,color:C.muted}}>{e.turns||0} exchanges · energy {e.energy||"?"}/5</div>
                </div>
                <div style={{width:10,height:10,borderRadius:"50%",background:energyColor(e.energy||3),flexShrink:0}}/>
              </div>
              {e.summary&&<p style={{fontSize:12,color:C.muted,lineHeight:1.55,margin:0,fontStyle:"italic"}}>"{e.summary}…"</p>}
            </div>
          ))}
        </div>
      )}

      {/* ── PROGRESS ── */}
      {tab==="Progress" && (
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <h2 style={{fontSize:16,fontWeight:800,color:C.navy}}>Your mindset metrics</h2>

          {entries.length < 3 ? (
            <div style={{background:C.lavPale,borderRadius:14,border:`1px solid ${C.lavSoft}`,padding:"16px 20px",fontSize:13,color:C.purple,lineHeight:1.6}}>
              Complete 3 sessions to unlock your progress trends. Consistency is the data point.
            </div>
          ) : (
            <>
              {/* Energy trend */}
              <div style={{background:C.white,borderRadius:5,border:`1px solid ${C.border}`,padding:"18px 22px"}}>
                <div style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1.5,marginBottom:14}}>Energy trend — last {Math.min(entries.length,14)} sessions</div>
                <div style={{display:"flex",gap:4,alignItems:"flex-end",height:60}}>
                  {entries.slice(0,14).reverse().map((e,i)=>{
                    const h=Math.round(((e.energy||3)/5)*60);
                    const col=energyColor(e.energy||3);
                    return(<div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                      <div style={{width:"100%",height:h,background:col,borderRadius:"4px 4px 0 0",transition:"height 0.4s",minHeight:4}}/>
                      <div style={{fontSize:8,color:C.muted}}>{new Date(e.date).toLocaleDateString("en-AU",{day:"numeric",month:"numeric"}).replace("/","/")}</div>
                    </div>);
                  })}
                </div>
                <div style={{display:"flex",justifyContent:"space-between",marginTop:10,fontSize:12}}>
                  <span style={{color:C.muted}}>Avg: <strong style={{color:energyColor(Math.round(avgEnergy||3))}}>{avgEnergy}/5</strong></span>
                  <span style={{color:energyTrend>0?C.green:energyTrend<0?C.red:C.muted,fontWeight:600}}>
                    {energyTrend>0?"↑ Trending up":energyTrend<0?"↓ Trending down":"→ Holding steady"}
                  </span>
                </div>
              </div>

              {/* Consistency */}
              <div style={{background:C.white,borderRadius:5,border:`1px solid ${C.border}`,padding:"18px 22px"}}>
                <div style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1.5,marginBottom:12}}>Consistency</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
                  {[
                    {label:"Total sessions",  val:entries.length,      icon:"📓"},
                    {label:"Current streak",  val:`${streak}d`,        icon:"🔥"},
                    {label:"Avg session depth",val:`${Math.round(entries.reduce((a,e)=>a+(e.turns||4),0)/entries.length)} turns`, icon:"💬"},
                  ].map((s,i)=>(
                    <div key={i} style={{background:C.bg,borderRadius:5,padding:"12px 14px",textAlign:"center"}}>
                      <div style={{fontSize:22,marginBottom:4}}>{s.icon}</div>
                      <div style={{fontSize:20,fontWeight:900,color:C.navy,lineHeight:1}}>{s.val}</div>
                      <div style={{fontSize:10,color:C.muted,marginTop:3}}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Scott's read */}
              <div style={{background:C.navy,borderRadius:14,padding:"16px 20px",display:"flex",gap:12,alignItems:"flex-start"}}>
                <Av ini="SC" col={C.lavSoft} sz={32}/>
                <div>
                  <div style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:1.5,marginBottom:4}}>Scott's read</div>
                  <p style={{fontSize:13,color:"rgba(255,255,255,0.85)",lineHeight:1.65,margin:0}}>
                    {entries.length>=7 && avgEnergy>=4 ? "Consistent and high-energy. The habit is forming — this is exactly how mental fitness builds." :
                     entries.length>=7 && avgEnergy<3  ? "Showing up even on low-energy days. That consistency matters more than any individual session." :
                     streak>=5                         ? `${streak}-day streak. This is the work most people skip. Keep going.` :
                     "You're building the habit. Each session adds data about your patterns — and data is the first step to changing them."}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function buildCurriculumPlan(profile) {
  if(!profile?.challenge) return null;
  const b = profile.billings || "";
  const issenior = b.includes("1m") || b.includes("1M") || b.includes("500");
  const seedVariant = profile.seedVariant ?? Math.floor(Math.random()*6);

  // Map challenge → priority module sequence (by MODULES index)
  const challengeMap = {
    "Starting conversations":    [0,1,8,2,3,6,7,4,5],
    "Discovery":                 [1,8,0,2,3,6,7,4,5],
    "Handling objections":       [2,0,1,3,6,7,8,4,5],
    "Closing":                   [3,2,1,0,8,6,7,4,5],
    "Confidence and consistency":[4,0,1,2,3,6,7,8,5],
  };
  const order = challengeMap[profile.challenge] || [...Array(MODULES.length).keys()];
  const orderedModules = order.map(i=>MODULES[i]).filter(Boolean);

  // Unlock first 3, rest gated (seniors get 4 unlocked)
  const unlockCount = issenior ? 4 : 3;

  const weeksToGoal = profile.goalDate
    ? Math.max(1, Math.round((new Date(profile.goalDate)-new Date())/(1000*60*60*24*7)))
    : 8;
  const roleplaysPerWeek = Math.max(1, Math.ceil((orderedModules.length*2)/weeksToGoal));

  return { orderedModules, unlockCount, seedVariant, weeksToGoal, roleplaysPerWeek };
}

function Learning({go,setMod,profile}){
  const [view,setView]=useState("path");
  const [customRP,setCustomRP]=useState(null); // {input, loading, scenario, preview}

  // If redirected from post-roleplay confidence check, open journal tab
  useEffect(()=>{
    try {
      if(localStorage.getItem("heyscott_goto_journal")==="1"){
        localStorage.removeItem("heyscott_goto_journal");
        setView("journal");
      }
    } catch(e){}
  },[]);
  const [tab,setTab]=useState("All");
  const [quickMode,setQuickMode]=useState(false);
  const [showPath,setShowPath]=useState(false); // "Choose Your Path" interstitial

  // If a custom scenario is ready and confirmed, render the roleplay directly
  if(customRP?.scenario && customRP?.confirmed){
    const fakeLesson = {id:"custom", title:customRP.scenario.skillFocus||"Custom Practice", type:"roleplay", scenarioKey:"__custom__"};
    return(
      <RoleplayView
        lesson={fakeLesson} mod={null} go={go}
        profile={profile}
        customScenario={customRP.scenario}
        onBack={()=>setCustomRP(null)}
        onJournal={()=>setCustomRP(null)}
      />
    );
  }

  const generateCustomRP = async (input) => {
    setCustomRP(p=>({...p,loading:true}));
    const sectorCtx = profile?.focus ? ` The recruiter works in ${profile.focus}.` : "";
    const prompt = `You are Scott, a recruitment sales coach. A recruiter wants to practice a custom roleplay scenario they've described. Generate a realistic candidate persona and scenario for them.

Recruiter's request: "${input}"${sectorCtx}

Return ONLY this JSON (no markdown):
{
  "skillFocus": "short label for what's being practiced",
  "difficulty": "beginner|intermediate|advanced",
  "moduleContext": "Custom Practice",
  "preview": "2 sentences: who the candidate is and what the recruiter should focus on",
  "coachObjectives": ["objective 1", "objective 2", "objective 3"],
  "brief": {
    "briefType": "full",
    "industry": "inferred from context",
    "role": "specific role title",
    "company": "realistic company name and brief description",
    "package": "realistic salary range",
    "location": "realistic location",
    "whyRelevant": "why this opportunity is relevant to the candidate"
  },
  "candidate": {
    "name": "realistic full name",
    "ini": "initials (2 letters)",
    "col": "#7C6FCD",
    "title": "current role at current company",
    "company": "current company",
    "tenure": "X years",
    "personality": "2 sentences on personality",
    "hook": "what makes them moveable — their hidden frustration or motivation"
  },
  "system": "You are playing [full name], [their title] at [their company]. [2-3 sentences about their work situation and what they have not told anyone]. PERSONALITY: [their communication style in 2 sentences]. RESPONSE STYLE: Keep initial responses SHORT — 1 to 2 sentences. Warm up only if the recruiter earns it. Sound completely natural — use contractions and hesitations. React to what they actually say. CALL FLOW: [brief description of how the call should develop]. Opening line when picked up: [write their first words naturally, no quotes needed]",
  "activeCriteria": ["openingHook", "discoveryDepth"]
}`;
    try {
      const resp = await callAPI([{role:"user",content:prompt}],null,{model:"claude-sonnet-4-6",max_tokens:1600,temperature:0.7});
      const parsed = parseJSON(resp);
      if(parsed?.candidate && parsed?.system){
        setCustomRP({input, loading:false, scenario:parsed, preview:parsed.preview, confirmed:false});
      } else {
        setCustomRP({input,loading:false,error:"Couldn't build that scenario — try describing it differently."});
      }
    } catch(e){
      const msg = e?.message || "";
      const display = msg.includes("timed out") ? "Request timed out — please try again."
        : msg.includes("not valid JSON") ? "Couldn't parse the scenario — please try again."
        : msg.includes("API error") || msg.includes("overloaded") ? "API busy — wait a moment and try again."
        : "Couldn't build that scenario — please try again.";
      setCustomRP({input,loading:false,error:display});
      console.error("[customRP]", e);
    }
  };

  const modTabs=["All","Onboarding","Skills","Mindset"];
  const plan = buildCurriculumPlan(profile);
  const orderedForDisplay = plan?.orderedModules || MODULES;
  const filtered=tab==="All"?orderedForDisplay:orderedForDisplay.filter(m=>m.cat===tab);
  const rec=MODULES.find(m=>m.rec);
  const profRec = plan ? plan.orderedModules[0] : (
    profile?.challenge==="Handling objections"?MODULES[2]:
    profile?.challenge==="Confidence and consistency"?MODULES[4]:
    profile?.challenge==="Discovery"?MODULES[1]:
    profile?.challenge==="Closing"?MODULES[3]:
    profile?.challenge==="Starting conversations"?MODULES[0]:rec
  );

  const ModCard=({m})=>(
    <div onClick={()=>!m.locked&&(setMod(m),go("module"))}
      style={{background:C.white,borderRadius:18,border:`1px solid ${m.locked?C.border:C.border}`,padding:20,cursor:m.locked?"not-allowed":"pointer",opacity:m.locked?0.55:1,position:"relative",transition:"box-shadow 0.2s"}}
      onMouseEnter={e=>{if(!m.locked)e.currentTarget.style.boxShadow=Sh.sm}}
      onMouseLeave={e=>e.currentTarget.style.boxShadow=Sh.none}>
      {m.isNew&&<div style={{position:"absolute",top:14,right:14,background:C.purple,color:"#fff",borderRadius:999,padding:"2px 10px",fontSize:11,fontWeight:700}}>NEW</div>}
      <div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap"}}>
        <LvlBadge level={m.level}/>
        <Tag>{m.cat}</Tag>
        {m.locked&&<span style={{marginLeft:"auto",fontSize:14}}>🔒</span>}
      </div>
      <div style={{fontWeight:700,fontSize:14,color:C.navy,marginBottom:6,lineHeight:1.35}}>{m.title}</div>
      <p style={{fontSize:12,color:C.muted,lineHeight:1.5,marginBottom:12,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{m.desc}</p>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",fontSize:12,color:C.muted}}>
        <span>🕐 {m.dur} · {m.count} lessons</span>
        {!m.locked&&<span style={{color:C.purple,fontWeight:600}}>Start →</span>}
      </div>
      {m.pct>0&&<div style={{marginTop:10,height:4,background:C.bg,borderRadius:999,overflow:"hidden"}}><div style={{height:"100%",width:`${m.pct}%`,background:C.purple,borderRadius:999}}/></div>}
    </div>
  );

  return(
    <Shell page="learning" go={go} userRole="learner">
      <div style={{animation:"fadeUp 0.35s ease both"}}>
        {/* Quick mode toggle + view tabs */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24,flexWrap:"wrap",gap:12}}>
          <div style={{display:"flex",gap:8}}>
            {[["path","Learning Path"],["journal","Consultant Journal"]].map(([v,l])=>(
              <button key={v} onClick={()=>setView(v)} style={{padding:"7px 16px",borderRadius:999,border:`1px solid ${C.border}`,background:view===v?C.navy:C.white,color:view===v?"#fff":C.muted,fontSize:13,fontWeight:600,cursor:"pointer",transition:"all 0.15s"}}>{l}</button>
            ))}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:12,color:C.muted}}>Quick Mode</span>
            <button onClick={()=>setQuickMode(q=>!q)}
              style={{width:42,height:24,borderRadius:999,background:quickMode?C.purple:C.border,border:"none",cursor:"pointer",position:"relative",transition:"background 0.2s"}}>
              <div style={{position:"absolute",top:3,left:quickMode?20:3,width:18,height:18,borderRadius:"50%",background:"#fff",transition:"left 0.2s"}}/>
            </button>
            <span style={{fontSize:11,color:quickMode?C.purple:C.muted,fontWeight:600}}>{quickMode?"ON — Jump to roleplay":"OFF"}</span>
          </div>
        </div>

        {/* Personalised banner if profile exists */}
        {profile?.challenge&&(
          <div style={{background:C.navy,borderRadius:R.md,padding:"16px 20px",marginBottom:16,display:"flex",gap:14,alignItems:"flex-start"}}>
            <Av ini="SC" col={C.lavSoft} sz={34}/>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,color:"#fff",fontSize:13,marginBottom:4}}>
                Coaching path built for you
              </div>
              <div style={{fontSize:12,color:"rgba(255,255,255,0.65)",lineHeight:1.6,marginBottom:6}}>
                Challenge: <strong style={{color:"rgba(255,255,255,0.9)"}}>{profile.challenge}</strong>
                {profile.timelineMonths&&<> &middot; <strong style={{color:"rgba(255,255,255,0.9)"}}>{profile.timelineMonths}m timeline</strong></>}
                {profile.assessmentLabel&&<> &middot; <strong style={{color:"rgba(255,255,255,0.9)"}}>{profile.assessmentLabel}</strong></>}
              </div>
              {profile.ownChallenge&&<div style={{fontSize:12,color:"rgba(255,255,255,0.45)",fontStyle:"italic",marginBottom:6}}>"{profile.ownChallenge.slice(0,90)}{profile.ownChallenge.length>90?"…":""}"</div>}
              {profRec&&<div style={{fontSize:12,color:C.lav,fontWeight:600}}>Start with: {profRec.title} →</div>}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:6,flexShrink:0}}>
              <button onClick={()=>go("onboarding")}
                style={{background:"none",border:"1px solid rgba(255,255,255,0.25)",color:"rgba(255,255,255,0.6)",borderRadius:999,padding:"4px 12px",fontSize:11,fontWeight:600,cursor:"pointer"}}>
                Update goals
              </button>
              <button onClick={()=>{clearProfile();go("onboarding");}}
                style={{background:"none",border:"1px solid rgba(239,68,68,0.4)",color:"rgba(239,68,68,0.7)",borderRadius:999,padding:"4px 12px",fontSize:11,fontWeight:600,cursor:"pointer"}}>
                Reset goals
              </button>
            </div>
          </div>
        )}
        {!profile?.challenge&&(
          <div style={{background:C.lavPale,border:`1px solid ${C.lavSoft}`,borderRadius:14,padding:"13px 18px",marginBottom:16,display:"flex",alignItems:"center",gap:12}}>
            <Av ini="SC" col={C.lavSoft} sz={30}/>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:700,color:C.navy,marginBottom:2}}>Set up your coaching profile</div>
              <div style={{fontSize:12,color:C.muted}}>Scott tailors everything to your situation — takes about 3 minutes.</div>
            </div>
            <button onClick={()=>go("onboarding")}
              style={{background:C.purple,color:"#fff",border:"none",borderRadius:999,padding:"8px 16px",fontSize:12,fontWeight:700,cursor:"pointer",flexShrink:0}}>
              Set up →
            </button>
          </div>
        )}

        {view==="path"&&(
          <>
            <h1 style={{fontSize:22,fontWeight:800,color:C.navy,marginBottom:4}}>Your Learning Path</h1>
            <p style={{color:C.muted,fontSize:13,marginBottom:18}}>Complete modules to unlock new skills. Roleplays gate your progression.</p>

            {/* Filter tabs */}
            <div style={{display:"flex",gap:6,marginBottom:20,flexWrap:"wrap"}}>
              {modTabs.map(t=>(
                <button key={t} onClick={()=>setTab(t)} style={{padding:"6px 14px",borderRadius:999,border:`1px solid ${C.border}`,background:tab===t?C.navy:C.white,color:tab===t?"#fff":C.muted,fontSize:12,fontWeight:500,cursor:"pointer"}}>{t}</button>
              ))}
            </div>

            {/* Custom Roleplay — Practice anything */}
            {tab==="All"&&(
              <div style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:18,padding:"18px 20px",marginBottom:18}}>
                <div style={{display:"flex",gap:12,alignItems:"flex-start",marginBottom:12}}>
                  <div style={{width:38,height:38,borderRadius:5,background:C.lavPale,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>🎭</div>
                  <div>
                    <div style={{fontWeight:700,color:C.navy,fontSize:14,marginBottom:2}}>Practice anything — custom roleplay</div>
                    <div style={{fontSize:12,color:C.muted,lineHeight:1.5}}>Tell Scott what you want to practice and he'll build a scenario on the spot. Sector-matched, fully scored.</div>
                  </div>
                </div>
                {(!customRP || customRP.error) && (
                  <div style={{display:"flex",gap:8}}>
                    <input
                      placeholder={`e.g. "A guarded ${profile?.focus||"finance"} candidate who keeps saying they're happy where they are"`}
                      defaultValue={customRP?.input||""}
                      id="custom-rp-input"
                      style={{flex:1,background:C.bg,border:`1.5px solid ${C.border}`,borderRadius:999,padding:"9px 14px",fontSize:13,color:C.text,outline:"none",fontFamily:"'Inter',sans-serif"}}
                      onKeyDown={e=>{ if(e.key==="Enter"&&e.target.value.trim()) generateCustomRP(e.target.value.trim()); }}
                    />
                    <button onClick={()=>{ const el=document.getElementById("custom-rp-input"); if(el?.value?.trim()) generateCustomRP(el.value.trim()); }}
                      style={{background:C.purple,color:"#fff",border:"none",borderRadius:999,padding:"9px 18px",fontSize:13,fontWeight:700,cursor:"pointer",flexShrink:0}}>
                      Create →
                    </button>
                  </div>
                )}
                {customRP?.error && <div style={{fontSize:12,color:C.red,marginTop:6}}>{customRP.error}</div>}
                {customRP?.loading && <div style={{fontSize:13,color:C.muted,marginTop:8}}>Scott is building your scenario…</div>}
                {customRP?.scenario && !customRP.confirmed && (
                  <div style={{marginTop:10,background:C.lavPale,borderRadius:5,padding:"12px 14px",border:`1px solid ${C.lavSoft}`}}>
                    <div style={{fontSize:11,fontWeight:700,color:C.purple,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Scott's scenario</div>
                    <p style={{fontSize:13,color:C.navy,lineHeight:1.6,margin:"0 0 10px"}}>{customRP.preview}</p>
                    <div style={{display:"flex",gap:8}}>
                      <button onClick={()=>setCustomRP(p=>({...p,confirmed:true}))}
                        style={{background:C.purple,color:"#fff",border:"none",borderRadius:999,padding:"8px 18px",fontSize:13,fontWeight:700,cursor:"pointer"}}>
                        Start roleplay →
                      </button>
                      <button onClick={()=>setCustomRP(null)}
                        style={{background:"none",border:`1px solid ${C.border}`,color:C.muted,borderRadius:999,padding:"8px 14px",fontSize:12,cursor:"pointer"}}>
                        Change it
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Recommended banner */}
            {tab==="All"&&profRec&&(
              <div style={{background:C.navy,borderRadius:20,padding:24,color:"#fff",display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18,gap:16,flexWrap:"wrap"}}>
                <div style={{flex:1,minWidth:200}}>
                  <Tag color="rgba(196,188,238,0.25)" textColor={C.lav}>RECOMMENDED</Tag>
                  <h2 style={{fontSize:18,fontWeight:700,marginTop:10,marginBottom:6}}>{profRec.title}</h2>
                  <p style={{opacity:0.6,fontSize:13,marginBottom:10,lineHeight:1.5}}>{profRec.desc}</p>
                  <div style={{fontSize:12,opacity:0.5}}>🕐 {profRec.dur} · {profRec.count} lessons</div>
                </div>
                <button onClick={()=>{setMod(profRec);go("module");}} style={{flexShrink:0,background:C.lav,color:C.navy,border:"none",borderRadius:999,padding:"11px 22px",fontWeight:800,fontSize:13,cursor:"pointer"}}>▶ Start</button>
              </div>
            )}

            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:16}}>
              {filtered.map(m=><ModCard key={m.id} m={m}/>)}
            </div>
          </>
        )}

        {view==="journal"&&(
          <JournalView go={go} profile={profile}/>
        )}

        
        {/* "Choose Your Path" interstitial modal (B2) */}
        {showPath&&(
          <Modal onClose={()=>setShowPath(false)}>
            <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:2,color:C.muted,marginBottom:8}}>Module 1 Complete 🎉</div>
            <h2 style={{fontSize:22,fontWeight:800,color:C.navy,marginBottom:8}}>Choose Your Path</h2>
            <p style={{color:C.muted,fontSize:13,lineHeight:1.6,marginBottom:24}}>Great work finishing the first module. How would you like to continue?</p>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {[{ic:"▶",t:"Continue to Module 2",d:"Keep the momentum going with Consultative Recruiting.",action:()=>{setShowPath(false);setMod(MODULES[1]);go("module");}},
                {ic:"📚",t:"Explore the Training Library",d:"Deep-dive into theory on this topic before moving on.",action:()=>setShowPath(false)},
                {ic:"🎭",t:"Practice with another roleplay",d:"Repeat the roleplay with a different candidate persona.",action:()=>setShowPath(false)}].map((opt,i)=>(
                <button key={i} onClick={opt.action} style={{background:C.bg,border:`1.5px solid ${C.border}`,borderRadius:14,padding:"14px 16px",cursor:"pointer",textAlign:"left",transition:"border-color 0.15s"}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor=C.purple}
                  onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
                  <div style={{fontWeight:700,color:C.navy,fontSize:14,marginBottom:3}}>{opt.ic} {opt.t}</div>
                  <div style={{fontSize:13,color:C.muted}}>{opt.d}</div>
                </button>
              ))}
            </div>
          </Modal>
        )}
      </div>
    </Shell>
  );
}

/* ════════════════════════════════════════════════════════════════
   MODULE DETAIL
════════════════════════════════════════════════════════════════ */

/* ══════════════════════════════════════════════════════════════
   MODULE DETAIL — lesson list with theory-first gating
══════════════════════════════════════════════════════════════ */
function ModuleDetail({mod, go, quickMode, profile=null}){
  const firstRoleplay = mod.lessons?.find(l=>l.type==="roleplay");
  const [sel,setSel] = useState(quickMode ? firstRoleplay : null);
  const [gateModal,setGateModal] = useState(false);
  // Merge persisted completions with lesson.done flags
  const [completedIds,setCompletedIds] = useState(()=>{
    const persisted = loadCompletedIds();
    const fromData = mod.lessons?.filter(l=>l.done).map(l=>l.id)||[];
    return [...new Set([...persisted, ...fromData])];
  });

  const markDone = (lessonId) => {
    setCompletedIds(prev => {
      if(prev.includes(lessonId)) return prev;
      const next = [...prev, lessonId];
      saveProgress(next);
      return next;
    });
  };

  // Roleplay locks only if prior readings not done AND the roleplay itself has never been completed
  const isLocked = (lesson, idx) => {
    if(lesson.type !== "roleplay") return false;
    if(completedIds.includes(lesson.id)) return false; // never re-lock once done
    const priorReadings = mod.lessons.slice(0, idx).filter(l => l.type === "reading");
    return priorReadings.some(l => !completedIds.includes(l.id));
  };

  const isDone = (lesson) => completedIds.includes(lesson.id) || lesson.done;

  const handleJournalRedirect = () => {
    // Signal Learning to switch to journal tab on next render
    try { localStorage.setItem("heyscott_goto_journal","1"); } catch(e){}
    setSel(null);
    go("learning");
  };

  if(sel?.type==="roleplay") return(
    <RoleplayView
      lesson={sel} mod={mod} go={go}
      profile={profile}
      onBack={()=>setSel(null)}
      onComplete={()=>{markDone(sel.id);setSel(null);}}
      onJournal={handleJournalRedirect}
    />
  );

  if(sel?.type==="reading") return(
    <ReadingView
      lesson={sel} mod={mod} go={go}
      onBack={()=>setSel(null)}
      onComplete={()=>{
        markDone(sel.id);
        // Auto-advance to next lesson
        const idx = mod.lessons.findIndex(l=>l.id===sel.id);
        const next = mod.lessons[idx+1];
        if(next && !isLocked(next, idx+1)) setSel(next);
        else setSel(null);
      }}
    />
  );

  const diffColor = mod.level==="advanced"?"#DBEAFE":mod.level==="intermediate"?"#FEF3C7":C.greenBg;
  const diffText = mod.level==="advanced"?"#1E40AF":mod.level==="intermediate"?"#92400E":C.green;

  return(
    <Shell page="learning" go={go} userRole="learner">
      <div style={{animation:"fadeUp 0.35s ease both"}}>

        {/* Top bar */}
        <div style={{display:"flex",alignItems:"center",gap:12,background:C.white,borderRadius:14,padding:"12px 18px",border:`1px solid ${C.border}`,marginBottom:20}}>
          <button onClick={()=>go("learning")} style={{background:"none",border:"none",cursor:"pointer",fontSize:18,color:C.muted,lineHeight:1}}>←</button>
          <div style={{flex:1}}>
            <div style={{fontWeight:800,fontSize:16,color:C.navy}}>{mod.title}</div>
            <div style={{fontSize:12,color:C.muted,marginTop:1}}>🕐 {mod.dur} · {mod.count} lessons · <span style={{textTransform:"capitalize"}}>{mod.level}</span></div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:12,fontWeight:700,color:C.purple}}>{Math.round((completedIds.length/mod.lessons.length)*100)}%</div>
              <div style={{width:56,height:4,background:C.bg,borderRadius:999,overflow:"hidden",marginTop:4}}>
                <div style={{height:"100%",width:`${Math.round((completedIds.length/mod.lessons.length)*100)}%`,background:C.purple,borderRadius:999,transition:"width 0.4s"}}/>
              </div>
            </div>
            <span style={{background:diffColor,color:diffText,borderRadius:999,padding:"3px 10px",fontSize:10,fontWeight:700,textTransform:"capitalize"}}>{mod.level}</span>
          </div>
        </div>

        {/* Module overview card */}
        <div style={{background:C.navy,borderRadius:18,padding:24,marginBottom:18}}>
          <p style={{fontSize:14,color:"rgba(255,255,255,0.8)",lineHeight:1.75,marginBottom:16}}>{mod.desc}</p>
          <div style={{background:"rgba(255,255,255,0.08)",borderRadius:5,padding:"11px 16px",display:"flex",alignItems:"flex-start",gap:10}}>
            <span style={{fontSize:15}}>📐</span>
            <div>
              <div style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:1.5,marginBottom:3}}>How this module works</div>
              <p style={{fontSize:12,color:"rgba(255,255,255,0.65)",lineHeight:1.6}}>Read each lesson in order — the theory builds on itself. Roleplays unlock after you complete the reading above them. Score 65+ on the roleplay to advance to the next module.</p>
            </div>
          </div>
        </div>

        {/* Lesson list — the main UI */}
        <div style={{background:C.white,borderRadius:18,border:`1px solid ${C.border}`,overflow:"hidden",marginBottom:18}}>
          <div style={{padding:"18px 22px 12px",borderBottom:`1px solid ${C.bg}`}}>
            <div style={{fontSize:10,fontWeight:800,textTransform:"uppercase",letterSpacing:2,color:C.muted}}>What you'll learn</div>
          </div>
          {mod.lessons.map((lesson,idx)=>{
            const done = isDone(lesson);
            const locked = isLocked(lesson, idx);
            const isRP = lesson.type==="roleplay";

            return(
              <button key={lesson.id}
                onClick={()=>{ if(locked){setGateModal(true);} else {setSel(lesson);} }}
                style={{
                  width:"100%",display:"flex",alignItems:"center",gap:14,
                  padding:"16px 22px",background:"none",border:"none",
                  borderBottom:idx<mod.lessons.length-1?`1px solid ${C.bg}`:"none",
                  cursor:locked?"not-allowed":"pointer",textAlign:"left",
                  transition:"background 0.12s",
                  opacity:locked?0.5:1
                }}
                onMouseEnter={e=>{ if(!locked) e.currentTarget.style.background=C.bg; }}
                onMouseLeave={e=>{ e.currentTarget.style.background="none"; }}>

                {/* Step number / done state */}
                <div style={{
                  width:36,height:36,borderRadius:"50%",flexShrink:0,
                  background:done?C.purple:isRP?C.lavPale:C.bg,
                  border:done?`2px solid ${C.purple}`:isRP?`2px solid ${C.lavSoft}`:`2px solid ${C.border}`,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:done?14:13,fontWeight:800,
                  color:done?"#fff":isRP?C.purple:C.muted
                }}>
                  {done ? "✓" : locked ? "🔒" : isRP ? "🎭" : idx+1}
                </div>

                {/* Label */}
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,color:C.navy,fontSize:14,lineHeight:1.3}}>{lesson.title}</div>
                  <div style={{fontSize:11,color:C.muted,marginTop:3,display:"flex",alignItems:"center",gap:6}}>
                    <span>{isRP ? "🎭 Roleplay" : "📖 Reading"}</span>
                    <span>·</span>
                    <span>{lesson.dur}</span>
                    {isRP && (
                      <>
                        <span>·</span>
                        <span style={{color:C.purple,fontWeight:600}}>Score 65+ to advance</span>
                      </>
                    )}
                    {locked && (
                      <>
                        <span>·</span>
                        <span style={{color:C.amber,fontWeight:600}}>Complete readings above first</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Caret */}
                {!locked && (
                  <span style={{color:C.muted,fontSize:14,flexShrink:0}}>›</span>
                )}
              </button>
            );
          })}
        </div>

        {/* CTA */}
        {!completedIds.length && (
          <button onClick={()=>setSel(mod.lessons[0])}
            style={{background:C.navy,color:"#fff",border:"none",borderRadius:999,padding:"14px 28px",fontWeight:800,fontSize:14,cursor:"pointer",width:"100%"}}>
            ▶ Start Module
          </button>
        )}

        {/* Gate modal */}
        {gateModal&&(
          <Modal onClose={()=>setGateModal(false)}>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:40,marginBottom:12}}>🔒</div>
              <h3 style={{fontSize:20,fontWeight:800,color:C.navy,marginBottom:8}}>Finish the reading first</h3>
              <p style={{color:C.muted,fontSize:14,lineHeight:1.65,marginBottom:20}}>
                Roleplays are gated — you need to read the theory above before you practice it. Complete the reading lessons, then come back to apply what you've learned.
              </p>
              <button onClick={()=>setGateModal(false)}
                style={{background:C.navy,color:"#fff",border:"none",borderRadius:999,padding:"11px 24px",fontWeight:700,cursor:"pointer"}}>
                Got it
              </button>
            </div>
          </Modal>
        )}
      </div>
    </Shell>
  );
}


/* ══════════════════════════════════════════════════════════════
   READING VIEW — theory content with TL;DR, key points, reflection
══════════════════════════════════════════════════════════════ */
function ReadingView({lesson, mod, go, onBack, onComplete}){
  const [section,setSection]=useState("main");
  const [showPreCheck,setShowPreCheck]=useState(false);
  const c = lesson.content||{};
  return(
    <Shell page="learning" go={go} userRole="learner">
      <button onClick={onBack} style={{color:C.muted,background:"none",border:"none",cursor:"pointer",fontSize:13,marginBottom:20}}>← Back to Module</button>
      <div style={{maxWidth:680}}>
        {/* Header */}
        <div style={{background:C.white,borderRadius:20,border:`1px solid ${C.border}`,padding:28,marginBottom:18}}>
          <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:14,flexWrap:"wrap"}}>
            <span style={{background:C.lavPale,color:C.purple,borderRadius:999,padding:"3px 12px",fontSize:11,fontWeight:700}}>📖 Reading · {lesson.dur}</span>
            <span style={{background:C.bg,color:C.muted,borderRadius:999,padding:"3px 12px",fontSize:11,fontWeight:600}}>{mod.title}</span>
          </div>
          <h1 style={{fontSize:22,fontWeight:800,color:C.navy,marginBottom:12}}>{lesson.title}</h1>
          {/* TL;DR */}
          <div style={{background:C.navy,borderRadius:14,padding:18}}>
            <div style={{fontSize:10,fontWeight:800,textTransform:"uppercase",letterSpacing:2,color:"rgba(255,255,255,0.4)",marginBottom:6}}>TL;DR</div>
            <p style={{fontSize:14,color:"rgba(255,255,255,0.88)",lineHeight:1.7,fontWeight:500}}>{c.tldr||"Core concept for this lesson."}</p>
          </div>
        </div>

        {/* Theory content */}
        {c.theory&&(
          <div style={{background:C.white,borderRadius:18,border:`1px solid ${C.border}`,padding:28,marginBottom:16}}>
            <div style={{fontSize:10,fontWeight:800,textTransform:"uppercase",letterSpacing:2,color:C.muted,marginBottom:16}}>The Concept</div>
            {c.theory.split("\n\n").map((para,i)=>(
              <p key={i} style={{fontSize:14,color:C.text,lineHeight:1.85,marginBottom:14}}>{para}</p>
            ))}
          </div>
        )}

        {/* Key points */}
        {c.keyPoints?.length>0&&(
          <div style={{background:C.white,borderRadius:18,border:`1px solid ${C.border}`,padding:24,marginBottom:16}}>
            <div style={{fontSize:10,fontWeight:800,textTransform:"uppercase",letterSpacing:2,color:C.muted,marginBottom:16}}>Key Takeaways</div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {c.keyPoints.map((pt,i)=>(
                <div key={i} style={{display:"flex",gap:12,alignItems:"flex-start"}}>
                  <div style={{width:24,height:24,borderRadius:"50%",background:C.lavPale,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:C.purple,flexShrink:0,marginTop:1}}>{i+1}</div>
                  <p style={{fontSize:14,color:C.text,lineHeight:1.65}}>{pt}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reflection */}
        {c.reflection&&(
          <div style={{background:"#FFF7ED",borderRadius:18,border:"1px solid #FED7AA",padding:24,marginBottom:20}}>
            <div style={{fontSize:10,fontWeight:800,textTransform:"uppercase",letterSpacing:2,color:"#C2410C",marginBottom:10}}>Reflection Exercise</div>
            <p style={{fontSize:14,color:"#7C2D12",lineHeight:1.75,marginBottom:14}}>{c.reflection}</p>
            <textarea rows={4} placeholder="Write your thoughts here..."
              style={{width:"100%",background:"rgba(255,255,255,0.7)",border:"1px solid #FED7AA",borderRadius:5,padding:12,fontSize:13,color:C.text,outline:"none",resize:"none",fontFamily:"'Inter',sans-serif",boxSizing:"border-box"}}/>
          </div>
        )}

        {showPreCheck ? (
          <ConfidenceCheck
            type="pre"
            lessonTitle={lesson.title}
            onComplete={()=>{ setShowPreCheck(false); onComplete(); }}
            onJournal={()=>{ setShowPreCheck(false); onComplete(); go("learning"); }}
          />
        ) : (
          <button onClick={()=>setShowPreCheck(true)}
            style={{background:C.navy,color:"#fff",border:"none",borderRadius:999,padding:"13px 28px",fontWeight:800,fontSize:14,cursor:"pointer",width:"100%"}}>
            ✓ Mark Complete & Continue
          </button>
        )}
      </div>
    </Shell>
  );
}

/* ══════════════════════════════════════════════════════════════
   CONFIDENCE CHECK — pre and post roleplay surveys
══════════════════════════════════════════════════════════════ */
function ConfidenceCheck({type, lessonTitle, aiScore, onComplete, onJournal}){
  // type: "pre" | "post"
  const questions = type==="pre" ? [
    {id:"understood",   label:"How confident are you that you understood the training material?"},
    {id:"comfortable",  label:"How comfortable do you feel applying these learnings on a real call?"},
    {id:"ready",        label:"How confident do you feel going into this roleplay?"},
  ] : [
    {id:"applied",      label:"How confident did you feel applying your learnings during the roleplay?"},
    {id:"selfVsAI",     label:"How well do you feel you did vs the feedback from Scott?"},
    {id:"progress",     label:"How do you feel about your progress overall?"},
  ];

  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const allAnswered = questions.every(q => answers[q.id]);
  const avg = allAnswered
    ? Math.round(Object.values(answers).reduce((a,b)=>a+b,0)/questions.length*10)/10
    : null;

  const ratingLabel = r => ["","Not at all","Slightly","Somewhat","Mostly","Very confident"][r]||"";
  const ratingColor = r => r<=2?"#EF4444":r===3?"#F59E0B":"#22C55E";
  const ratingBg    = r => r<=2?"#FEF2F2":r===3?"#FFFBEB":"#F0FDF4";

  const handleSubmit = () => {
    setSubmitted(true);
    // Save to localStorage
    try {
      const KEY = "heyscott_confidence_v1";
      const existing = JSON.parse(localStorage.getItem(KEY)||"[]");
      existing.unshift({
        type, lessonTitle, answers, avg,
        aiScore: aiScore||null,
        date: new Date().toISOString(),
      });
      localStorage.setItem(KEY, JSON.stringify(existing.slice(0,100)));
    } catch(e){}
  };

  if(submitted){
    const needsSupport = type==="post" && avg <= 3;
    return(
      <div style={{background:C.white,borderRadius:20,border:`1px solid ${C.border}`,padding:"28px 24px",maxWidth:520,margin:"0 auto",textAlign:"center",animation:"fadeUp 0.3s ease both"}}>
        <div style={{fontSize:36,marginBottom:12}}>{needsSupport?"💙":"⭐"}</div>
        <div style={{fontWeight:800,color:C.navy,fontSize:18,marginBottom:8}}>
          {type==="pre" ? "Great — let's go." : needsSupport ? "That honesty takes courage." : "Well done."}
        </div>
        <div style={{fontSize:13,color:C.muted,lineHeight:1.65,marginBottom:8}}>
          {type==="pre" && "Your self-awareness going in sharpens what you take out. Good luck."}
          {type==="post" && !needsSupport && `You averaged ${avg}/5. Keep building on what worked.`}
          {type==="post" && needsSupport && `You averaged ${avg}/5. That gap between where you are and where you want to be is exactly what the Consultant Journal is for.`}
        </div>
        {/* Show individual answers */}
        <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:20,textAlign:"left"}}>
          {questions.map(q=>(
            <div key={q.id} style={{display:"flex",gap:10,alignItems:"center",background:C.bg,borderRadius:5,padding:"8px 14px"}}>
              <div style={{width:28,height:28,borderRadius:5,background:ratingBg(answers[q.id]),border:`1px solid`,borderColor:answers[q.id]<=2?"#FECACA":answers[q.id]===3?"#FDE68A":"#BBF7D0",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:14,color:ratingColor(answers[q.id]),flexShrink:0}}>
                {answers[q.id]}
              </div>
              <div style={{fontSize:12,color:C.text,lineHeight:1.45}}>{q.label}</div>
            </div>
          ))}
        </div>
        {needsSupport ? (
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            <button onClick={onJournal}
              style={{background:C.purple,color:"#fff",border:"none",borderRadius:999,padding:"12px 24px",fontWeight:700,fontSize:14,cursor:"pointer"}}>
              Open Consultant Journal →
            </button>
            <button onClick={onComplete}
              style={{background:"none",border:`1px solid ${C.border}`,borderRadius:999,padding:"10px 24px",fontWeight:600,fontSize:13,color:C.muted,cursor:"pointer"}}>
              Return to module
            </button>
          </div>
        ) : (
          <button onClick={onComplete}
            style={{background:C.navy,color:"#fff",border:"none",borderRadius:999,padding:"12px 28px",fontWeight:700,fontSize:14,cursor:"pointer",width:"100%"}}>
            {type==="pre" ? "Start roleplay →" : "Return to module ✓"}
          </button>
        )}
      </div>
    );
  }

  return(
    <div style={{background:C.white,borderRadius:20,border:`1px solid ${C.border}`,padding:"28px 24px",maxWidth:520,margin:"0 auto",animation:"fadeUp 0.3s ease both"}}>
      <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:6}}>
        <span style={{background:type==="pre"?C.lavPale:"#F0FDF4",color:type==="pre"?C.purple:C.green,borderRadius:999,padding:"3px 12px",fontSize:11,fontWeight:700}}>
          {type==="pre" ? "Pre-Roleplay Check-in" : "Post-Roleplay Check-in"}
        </span>
      </div>
      <h2 style={{fontSize:18,fontWeight:800,color:C.navy,marginBottom:4}}>
        {type==="pre" ? "How are you feeling?" : "How did that go?"}
      </h2>
      <p style={{fontSize:13,color:C.muted,marginBottom:22,lineHeight:1.55}}>
        {type==="pre"
          ? "Rate yourself honestly — there's no right answer. This helps Scott tailor what comes next."
          : "Be honest with yourself. This isn't graded — it's data about where you are."}
      </p>

      <div style={{display:"flex",flexDirection:"column",gap:18}}>
        {questions.map(q=>(
          <div key={q.id}>
            <div style={{fontSize:13,fontWeight:600,color:C.navy,marginBottom:10,lineHeight:1.45}}>{q.label}</div>
            <div style={{display:"flex",gap:6}}>
              {[1,2,3,4,5].map(r=>{
                const selected = answers[q.id]===r;
                return(
                  <button key={r} onClick={()=>setAnswers(prev=>({...prev,[q.id]:r}))}
                    style={{flex:1,padding:"10px 4px",borderRadius:5,border:`2px solid ${selected?ratingColor(r):C.border}`,background:selected?ratingBg(r):C.bg,cursor:"pointer",transition:"all 0.15s",fontFamily:"'Inter',sans-serif"}}>
                    <div style={{fontSize:18,fontWeight:900,color:selected?ratingColor(r):C.muted,lineHeight:1}}>{r}</div>
                    {selected&&<div style={{fontSize:9,color:ratingColor(r),marginTop:3,fontWeight:600,lineHeight:1.2}}>{ratingLabel(r)}</div>}
                  </button>
                );
              })}
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:4,fontSize:10,color:C.muted,padding:"0 2px"}}>
              <span>Not at all</span><span>Very confident</span>
            </div>
          </div>
        ))}
      </div>

      <button onClick={handleSubmit} disabled={!allAnswered}
        style={{width:"100%",marginTop:22,background:allAnswered?C.purple:C.border,color:allAnswered?"#fff":C.muted,border:"none",borderRadius:999,padding:"13px",fontWeight:700,fontSize:14,cursor:allAnswered?"pointer":"not-allowed",transition:"all 0.2s"}}>
        Submit →
      </button>
    </div>
  );
}


/* ══════════════════════════════════════════════════════════════
   ROLEPLAY VIEW — Brief → Split-panel call → Framework debrief
══════════════════════════════════════════════════════════════ */
import RoleplayView, { pushRoleplayToManager } from './components/RoleplayView.jsx';
import ManagerDashboard from './components/ManagerDashboard.jsx';

/* ══ SMART GOALS PANEL ══ */
function SmartGoalsPanel({profile}) {
  const [goals, setGoals] = useState(()=>loadSmartGoals());
  const [generating, setGenerating] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const roleplays = loadRoleplays();
  const cycleCount = roleplays.length % 3 || (roleplays.length > 0 ? 3 : 0);
  const totalCycles = Math.floor(roleplays.length / 3);
  const priorityStyle = (p) =>
    p==="immediate" ? {bg:"#FEE2E2",c:C.red,border:"#FECACA",label:"Requires immediate attention",icon:"🔴"} :
    p==="important" ? {bg:"#FEF3C7",c:C.amber,border:"#FDE68A",label:"Important — secondary",icon:"🟡"} :
                      {bg:C.lavPale,c:C.purple,border:C.lavSoft,label:"Developing — monitor",icon:"🟢"};
  const arcTraj = (t) =>
    t==="positive" ? {c:C.green,label:"Positive trajectory",icon:"📈"} :
    t==="developing" ? {c:C.purple,label:"Developing steadily",icon:"🔄"} :
                       {c:C.red,label:"Needs reset",icon:"⚠️"};
  if(roleplays.length===0) return (
    <div style={{background:C.white,borderRadius:14,border:`1px solid ${C.border}`,padding:22,textAlign:"center"}}>
      <div style={{fontSize:28,marginBottom:8}}>🎯</div>
      <div style={{fontWeight:700,color:C.navy,fontSize:14,marginBottom:4}}>SMART Development Goals</div>
      <div style={{fontSize:13,color:C.muted,lineHeight:1.6}}>Complete 3 roleplays and Scott will generate personalised SMART goals based on your actual performance patterns.</div>
      <div style={{marginTop:14,display:"flex",justifyContent:"center",gap:8}}>
        {[1,2,3].map(n=>(<div key={n} style={{width:32,height:32,borderRadius:"50%",background:C.bg,border:`2px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:C.muted}}>{n}</div>))}
      </div>
    </div>
  );
  if(roleplays.length < 3 && !goals) return (
    <div style={{background:C.white,borderRadius:14,border:`1px solid ${C.border}`,padding:22}}>
      <div style={{fontWeight:700,color:C.navy,fontSize:14,marginBottom:10}}>🎯 SMART Goals — in progress</div>
      <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8}}>
        {[1,2,3].map(n=>(<div key={n} style={{width:32,height:32,borderRadius:"50%",background:n<=roleplays.length?C.purple:C.bg,border:`2px solid ${n<=roleplays.length?C.purple:C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:n<=roleplays.length?"#fff":C.muted}}>{n<=roleplays.length?"✓":n}</div>))}
        <span style={{fontSize:12,color:C.muted,marginLeft:4}}>{3-roleplays.length} more roleplay{3-roleplays.length!==1?"s":""} to unlock goals</span>
      </div>
      <div style={{height:6,background:C.bg,borderRadius:999,overflow:"hidden"}}><div style={{height:"100%",width:`${(roleplays.length/3)*100}%`,background:C.purple,borderRadius:999,transition:"width 0.4s"}}/></div>
    </div>
  );
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div>
          <div style={{fontWeight:800,color:C.navy,fontSize:16}}>🎯 SMART Development Goals</div>
          <div style={{fontSize:12,color:C.muted,marginTop:2}}>Cycle {totalCycles} · {roleplays.length} total roleplays · {cycleCount}/3 in current cycle</div>
        </div>
        {roleplays.length >= 3 && (<button onClick={()=>generateSmartGoals(roleplays,profile,setGoals,setGenerating)} disabled={generating} style={{background:generating?C.bg:C.navy,color:generating?C.muted:"#fff",border:`1px solid ${generating?C.border:C.navy}`,borderRadius:999,padding:"7px 16px",fontSize:12,fontWeight:700,cursor:generating?"not-allowed":"pointer"}}>{generating?"Generating…":"↻ Regenerate"}</button>)}
      </div>
      {generating && (<div style={{background:C.lavPale,borderRadius:14,padding:"18px 20px",marginBottom:14,display:"flex",gap:12,alignItems:"center"}}><div style={{display:"flex",gap:4}}>{[0,1,2].map(i=><div key={i} style={{width:7,height:7,borderRadius:"50%",background:C.purple,animation:"bounce 1s infinite",animationDelay:`${i*0.15}s`}}/>)}</div><span style={{fontSize:13,color:C.purple}}>Scott is reviewing your last 3 roleplays…</span></div>)}
      {goals && !generating && (<>
        {goals.cycleGoals?.map((g,i)=>{
          const ps=priorityStyle(g.priority); const isOpen=expanded===i;
          return (<div key={i} style={{background:C.white,borderRadius:14,border:`1px solid ${ps.border}`,marginBottom:10,overflow:"hidden"}}>
            <button onClick={()=>setExpanded(isOpen?null:i)} style={{width:"100%",background:"none",border:"none",padding:"14px 18px",cursor:"pointer",textAlign:"left",display:"flex",gap:12,alignItems:"center"}}>
              <span style={{fontSize:16,flexShrink:0}}>{ps.icon}</span>
              <div style={{flex:1}}><div style={{fontWeight:700,color:C.navy,fontSize:14}}>{g.title}</div><div style={{fontSize:11,color:ps.c,fontWeight:600,marginTop:2}}>{ps.label}</div></div>
              <span style={{fontSize:14,color:C.muted,transform:isOpen?"rotate(90deg)":"none",transition:"transform 0.2s"}}>›</span>
            </button>
            {isOpen && (<div style={{padding:"0 18px 18px",borderTop:`1px solid ${ps.border}`}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:14,marginBottom:12}}>
                {[{label:"Specific",val:g.specific,icon:"🎯"},{label:"Measurable",val:g.measurable,icon:"📊"},{label:"Achievable",val:g.achievable,icon:"✓"},{label:"Relevant",val:g.relevant,icon:"⚡"}].map(({label,val,icon})=>(<div key={label} style={{background:C.bg,borderRadius:5,padding:"10px 13px"}}><div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>{icon} {label}</div><div style={{fontSize:12,color:C.text,lineHeight:1.55}}>{val}</div></div>))}
              </div>
              <div style={{background:C.bg,borderRadius:5,padding:"8px 12px",marginBottom:12}}><span style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1}}>⏱ Time-bound: </span><span style={{fontSize:12,color:C.text}}>{g.timebound}</span></div>
              <div style={{background:C.lavPale,borderRadius:5,padding:"10px 14px",display:"flex",gap:10,alignItems:"flex-start"}}><Av ini="SC" col={C.lavSoft} sz={26}/><p style={{fontSize:12,color:C.navy,lineHeight:1.65,margin:0,fontStyle:"italic"}}>"{g.coachNote}"</p></div>
            </div>)}
          </div>);
        })}
        {goals.longTermArc && (<div style={{background:C.navy,borderRadius:14,padding:"16px 20px",marginTop:14}}>
          <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:10}}><span style={{fontSize:16}}>{arcTraj(goals.longTermArc.trajectory).icon}</span><div><div style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.45)",textTransform:"uppercase",letterSpacing:1.5,marginBottom:1}}>Long-term arc</div><div style={{fontSize:12,fontWeight:600,color:arcTraj(goals.longTermArc.trajectory).c}}>{arcTraj(goals.longTermArc.trajectory).label}</div></div></div>
          <p style={{fontSize:13,color:"rgba(255,255,255,0.8)",lineHeight:1.65,marginBottom:10}}>{goals.longTermArc.pattern}</p>
          <div style={{background:"rgba(255,255,255,0.07)",borderRadius:5,padding:"10px 14px",marginBottom:8}}><div style={{fontSize:10,color:"rgba(255,255,255,0.4)",fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>3-month goal</div><p style={{fontSize:12,color:"rgba(255,255,255,0.85)",lineHeight:1.55,margin:0}}>{goals.longTermArc.arcGoal}</p></div>
          <div style={{background:"rgba(196,188,238,0.15)",borderRadius:5,padding:"10px 14px"}}><div style={{fontSize:10,color:C.lav,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>Signal to watch for</div><p style={{fontSize:12,color:"rgba(255,255,255,0.7)",lineHeight:1.55,margin:0}}>{goals.longTermArc.signalToWatch}</p></div>
        </div>)}
      </>)}
    </div>
  );
}


/* ══════════════════════════════════════════════════════════════
   BASELINE ASSESSMENT — 3 LIVE ROLEPLAY SCENARIOS
   Methodology applied internally; no framework names shown to user.
══════════════════════════════════════════════════════════════ */

function AssessmentFlow({onComplete, onBack}){
  const [phase, setPhase] = useState('intro');
  const [scIdx, setScIdx] = useState(0);
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [scores, setScores] = useState([]);
  const [scoring, setScoring] = useState(false);
  const [smartGoals, setSmartGoals] = useState(null);
  const [goalsLoading, setGoalsLoading] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const chatRef = useRef(null);
  const inputRef = useRef(null);
  const sc = ASSESSMENT_SCENARIOS[scIdx];

  useEffect(()=>{
    if(chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  },[msgs]);

  const startChat = async () => {
    setPhase('chat'); setChatLoading(true);
    try {
      const opening = await callAPI([{role:"user",content:"[Call begins]"}], sc.system, {max_tokens:100,temperature:1});
      setMsgs([{role:"ai",content:opening}]);
    } catch(e){ setMsgs([{role:"ai",content:"Hi — what's this about?"}]); }
    setChatLoading(false);
    setTimeout(()=>inputRef.current?.focus(),100);
  };

  const send = async () => {
    const text = input.trim();
    if(!text||chatLoading) return;
    const newMsgs = [...msgs,{role:"user",content:text}];
    setMsgs(newMsgs); setInput(''); setChatLoading(true);
    try {
      const hist = newMsgs.map(m=>({role:m.role==="ai"?"assistant":"user",content:m.content}));
      const reply = await callAPI(hist, sc.system, {max_tokens:150,temperature:1});
      setMsgs(prev=>[...prev,{role:"ai",content:reply}]);
    } catch(e){ setMsgs(prev=>[...prev,{role:"ai",content:"Sorry — say again?"}]); }
    setChatLoading(false);
    setTimeout(()=>inputRef.current?.focus(),100);
  };

  const endCall = async () => {
    setPhase('scoring'); setScoring(true);
    const transcript = msgs.map(m=>`${m.role==="user"?"Recruiter":"Candidate"}: ${m.content}`).join('\n');
    const scoringPrompt = `You are assessing a recruiter's cold candidate call. Score the recruiter (not the candidate) on 5 dimensions, 1–5 each.

Candidate: ${sc.name}, ${sc.title} at ${sc.company}. ${sc.context}

Transcript:
${transcript}

Dimensions:
- openingPitch (1-5): Specific, candidate-relevant opener. Earned the right to continue before pitching.
- rapport (1-5): Matched candidate's energy. Adapted tone as the call developed.
- openQuestions (1-5): Asked open-ended questions that drew out genuine responses, not yes/no.
- discovery (1-5): Uncovered what's actually driving this person — frustrations, ambitions — beyond salary and tenure.
- closing (1-5): Closed on a specific, low-friction next step (a brief, a call, a date) rather than leaving it open.

IMPORTANT: Do not mention any framework or methodology names in your feedback. Plain language only.

Return ONLY valid JSON:
{"openingPitch":N,"rapport":N,"openQuestions":N,"discovery":N,"closing":N,"standout":"1 sentence on biggest strength","gap":"1 sentence on single biggest area to work on"}`;
    try {
      const res = await callAPI([{role:"user",content:scoringPrompt}],null,{max_tokens:350,temperature:0});
      const parsed = parseJSON(res);
      const newScores = [...scores,parsed];
      setScores(newScores);
      if(scIdx<2){ setPhase('between'); }
      else { setPhase('goals'); await buildSmartGoals(newScores); }
    } catch(e){
      const fb = {openingPitch:2,rapport:2,openQuestions:2,discovery:2,closing:2,standout:"Completed the scenario.",gap:"Keep practising to get clearer feedback."};
      const newScores = [...scores,fb]; setScores(newScores);
      if(scIdx<2){ setPhase('between'); } else { setPhase('results'); }
    }
    setScoring(false);
  };

  const buildSmartGoals = async (allScores) => {
    setGoalsLoading(true);
    const totals = {openingPitch:0,rapport:0,openQuestions:0,discovery:0,closing:0};
    allScores.forEach(s=>Object.keys(totals).forEach(k=>{ totals[k]+=(s[k]||0); }));
    const avgs = Object.fromEntries(Object.entries(totals).map(([k,v])=>[k,Math.round(v/3*10)/10]));
    const total = Object.values(avgs).reduce((a,b)=>a+b,0);
    const skillLevel = total<=8?'beginner':total<=12?'intermediate':'advanced';
    const dimLabels = {openingPitch:"opening and first impression",rapport:"building connection and adapting tone",openQuestions:"asking open questions",discovery:"uncovering real motivations and frustrations",closing:"closing on a clear next step"};
    const sorted = Object.entries(avgs).sort((a,b)=>a[1]-b[1]);
    const goalsPrompt = `You are Scott, an AI coach for recruiters. Write SMART development goals based on this 3-scenario assessment.

Scores (average out of 5 across 3 scenarios):
${Object.entries(avgs).map(([k,v])=>`- ${dimLabels[k]}: ${v}/5`).join('\n')}

Write 3 goals in Scott's voice — warm, direct, actionable. Never use methodology or framework names. Plain language only.

Return ONLY valid JSON:
{"immediate":{"title":"5 words max","goal":"2-3 sentences: exact behaviour, how to measure it, why it matters. Scott speaking directly."},"important":{"title":"5 words max","goal":"2-3 sentences on the second gap."},"arc":{"pattern":"1 sentence: the recurring tendency across all 3 scenarios","goal":"1 sentence: what this looks like when mastered"}}`;
    try {
      const res = await callAPI([{role:"user",content:goalsPrompt}],null,{max_tokens:600,temperature:0.3});
      const parsed = parseJSON(res);
      setSmartGoals({...parsed,avgs,skillLevel});
    } catch(e){
      setSmartGoals({avgs,skillLevel,immediate:{title:"Focus on your opening",goal:"Start each call with something specific about the person you're calling. That one change will make the rest of the conversation easier."},important:{title:"Ask more, tell less",goal:"Your instinct is to pitch. The goal is to stay curious longer before you do."},arc:{pattern:"You complete the scenarios but play it safe under pressure.",goal:"The version of you that stays calm when pushed is already in there — the work is making that the default."}});
    }
    setGoalsLoading(false);
    setPhase('results');
  };

  const finish = () => {
    const skillLevel = smartGoals?.skillLevel || 'beginner';
    onComplete({skillLevel, assessmentScores:scores, smartGoals});
  };

  const dimLabels = {openingPitch:"Opening",rapport:"Rapport",openQuestions:"Open questions",discovery:"Discovery",closing:"Closing"};

  if(phase==='intro') return(
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"'Inter',sans-serif"}}>
      <div style={{maxWidth:520,width:"100%"}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:13,marginBottom:24}}>← Back</button>
        <div style={{background:C.white,borderRadius:20,padding:"32px 28px",border:`1px solid ${C.border}`}}>
          <div style={{fontSize:11,fontWeight:700,color:C.purple,textTransform:"uppercase",letterSpacing:1.5,marginBottom:12}}>Baseline Assessment</div>
          <h2 style={{fontSize:20,fontWeight:800,color:C.navy,marginBottom:8,lineHeight:1.3}}>3 live scenarios to find where you are</h2>
          <p style={{fontSize:14,color:C.muted,lineHeight:1.6,marginBottom:24}}>You'll have 3 short candidate calls — each one a bit tougher than the last. Scott will assess what you do well and where to focus first. Takes about 10 minutes.</p>
          <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:28}}>
            {ASSESSMENT_SCENARIOS.map((s,i)=>(
              <div key={s.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",background:C.bg,borderRadius:5,border:`1px solid ${C.border}`}}>
                <div style={{width:34,height:34,borderRadius:"50%",background:s.col,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#fff",flexShrink:0}}>{s.ini}</div>
                <div><div style={{fontSize:13,fontWeight:700,color:C.navy}}>{s.name}</div><div style={{fontSize:12,color:C.muted}}>{s.title} · {s.company}</div></div>
                <div style={{marginLeft:"auto",fontSize:11,color:C.muted,background:C.secondary,borderRadius:999,padding:"3px 10px"}}>Scenario {i+1}</div>
              </div>
            ))}
          </div>
          <button onClick={()=>setPhase('brief')} style={{width:"100%",background:C.purple,color:"#fff",border:"none",borderRadius:999,padding:"13px",fontWeight:700,fontSize:14,cursor:"pointer"}}>Start assessment →</button>
        </div>
      </div>
    </div>
  );

  if(phase==='brief') return(
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"'Inter',sans-serif"}}>
      <div style={{maxWidth:520,width:"100%"}}>
        <div style={{display:"flex",gap:4,marginBottom:24}}>
          {ASSESSMENT_SCENARIOS.map((_,i)=>(
            <div key={i} style={{flex:1,height:4,borderRadius:999,background:i<scIdx?C.purple:i===scIdx?"#A78BFA":C.border}}/>
          ))}
        </div>
        <div style={{background:C.white,borderRadius:20,padding:"28px",border:`1px solid ${C.border}`}}>
          <div style={{fontSize:11,fontWeight:700,color:C.purple,textTransform:"uppercase",letterSpacing:1.5,marginBottom:12}}>Scenario {sc.level}</div>
          <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:20,paddingBottom:20,borderBottom:`1px solid ${C.border}`}}>
            <div style={{width:48,height:48,borderRadius:"50%",background:sc.col,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:"#fff",flexShrink:0}}>{sc.ini}</div>
            <div><div style={{fontSize:16,fontWeight:800,color:C.navy}}>{sc.name}</div><div style={{fontSize:13,color:C.muted}}>{sc.title} · {sc.company}</div></div>
          </div>
          <div style={{fontSize:12,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Your brief</div>
          <p style={{fontSize:14,color:C.text,lineHeight:1.65,marginBottom:24}}>{sc.context}</p>
          <button onClick={startChat} style={{width:"100%",background:C.purple,color:"#fff",border:"none",borderRadius:999,padding:"13px",fontWeight:700,fontSize:14,cursor:"pointer"}}>Make the call →</button>
        </div>
      </div>
    </div>
  );

  if(phase==='chat'){
    const isMobileView = typeof window !== "undefined" && window.innerWidth < 768;
    return(
    <div style={{height:"100vh",background:C.bg,display:"flex",flexDirection:"column",fontFamily:"'Inter',sans-serif"}}>

      {/* Full-width header */}
      <div style={{background:C.white,borderBottom:`1px solid ${C.border}`,padding:"12px 20px",display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
        {isMobileView&&(
          <button onClick={()=>setShowPanel(v=>!v)} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:5,padding:"5px 8px",cursor:"pointer",fontSize:11,fontWeight:700,color:C.muted,marginRight:4}}>
            {showPanel?"✕ Hide":"☰ Brief"}
          </button>
        )}
        <div style={{width:36,height:36,borderRadius:"50%",background:sc.col,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#fff",flexShrink:0}}>{sc.ini}</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:14,fontWeight:700,color:C.navy}}>{sc.name}</div>
          <div style={{fontSize:12,color:C.muted}}>{sc.title}</div>
        </div>
        <div style={{fontSize:11,color:C.muted,background:C.secondary,borderRadius:999,padding:"3px 10px",marginRight:8,whiteSpace:"nowrap"}}>Scenario {sc.level}</div>
        <button onClick={endCall} disabled={msgs.length<2||chatLoading}
          style={{background:msgs.length>=2&&!chatLoading?"#FEE2E2":"#f3f4f6",color:msgs.length>=2&&!chatLoading?"#991B1B":C.muted,border:"none",borderRadius:999,padding:"8px 16px",fontWeight:700,fontSize:12,cursor:msgs.length>=2&&!chatLoading?"pointer":"not-allowed",whiteSpace:"nowrap"}}>
          End call
        </button>
      </div>

      {/* Body: left panel + chat */}
      <div style={{flex:1,display:"flex",overflow:"hidden",position:"relative"}}>

        {/* Left panel */}
        <div style={{
          width: isMobileView ? "100%" : 280,
          display: (!isMobileView || showPanel) ? "flex" : "none",
          flexDirection:"column",
          gap:16,
          background:C.white,
          borderRight: isMobileView ? "none" : `1px solid ${C.border}`,
          borderBottom: isMobileView ? `1px solid ${C.border}` : "none",
          padding:"20px 16px",
          overflowY:"auto",
          flexShrink:0,
          position: isMobileView ? "absolute" : "static",
          top: 0, left: 0, right: 0, zIndex: isMobileView ? 30 : "auto",
          boxShadow: isMobileView ? "0 4px 16px rgba(0,0,0,0.08)" : "none",
        }}>

          {/* Scenario progress */}
          <div>
            <div style={{display:"flex",gap:4,marginBottom:10}}>
              {ASSESSMENT_SCENARIOS.map((_,i)=>(
                <div key={i} style={{flex:1,height:4,borderRadius:999,background:i<scIdx?C.purple:i===scIdx?C.purple:C.border,opacity:i<scIdx?0.45:i===scIdx?1:0.2}}/>
              ))}
            </div>
            <div style={{fontSize:9,fontWeight:700,color:C.purple,textTransform:"uppercase",letterSpacing:1.5}}>Assessment · Scenario {sc.level}</div>
          </div>

          <div style={{borderTop:`1px solid ${C.border}`}}/>

          {/* Who you're calling */}
          <div>
            <div style={{fontSize:9,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1.5,marginBottom:10}}>Who you're calling</div>
            <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:10}}>
              <div style={{width:40,height:40,borderRadius:"50%",background:sc.col,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:14,flexShrink:0}}>{sc.ini}</div>
              <div>
                <div style={{fontWeight:800,color:C.navy,fontSize:14}}>{sc.name}</div>
                <div style={{fontSize:11,color:C.muted,lineHeight:1.4}}>{sc.title}</div>
                <div style={{fontSize:11,color:C.muted}}>{sc.company}</div>
              </div>
            </div>
          </div>

          <div style={{borderTop:`1px solid ${C.border}`}}/>

          {/* The opportunity */}
          <div>
            <div style={{fontSize:9,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1.5,marginBottom:8}}>Your brief</div>
            <p style={{fontSize:12,color:C.text,lineHeight:1.65,margin:0}}>{sc.context}</p>
          </div>

          <div style={{borderTop:`1px solid ${C.border}`}}/>

          {/* Scored on */}
          <div>
            <div style={{fontSize:9,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1.5,marginBottom:10}}>Scored on</div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {["Opening","Rapport","Open questions","Discovery","Closing"].map((dim,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{width:5,height:5,borderRadius:"50%",background:C.purple,flexShrink:0}}/>
                  <span style={{fontSize:12,color:C.text}}>{dim}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: messages + input */}
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0}}>
          <div ref={chatRef} style={{flex:1,overflowY:"auto",padding:"20px",display:"flex",flexDirection:"column",gap:12}}>
            {chatLoading&&msgs.length===0 && <div style={{fontSize:13,color:C.muted,textAlign:"center",marginTop:40}}>Connecting…</div>}
            {msgs.map((m,i)=>(
              <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",alignItems:"flex-start",gap:8}}>
                {m.role==="ai" && <div style={{width:28,height:28,borderRadius:"50%",background:sc.col,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:"#fff",flexShrink:0,marginTop:2}}>{sc.ini}</div>}
                <div style={{maxWidth:"75%",background:m.role==="user"?C.purple:C.white,color:m.role==="user"?"#fff":C.text,padding:"10px 14px",borderRadius:m.role==="user"?"18px 18px 4px 18px":"18px 18px 18px 4px",fontSize:13,lineHeight:1.5,border:m.role==="ai"?`1px solid ${C.border}`:"none"}}>{m.content}</div>
              </div>
            ))}
            {chatLoading&&msgs.length>0 && <div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:28,height:28,borderRadius:"50%",background:sc.col,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:"#fff"}}>{sc.ini}</div><div style={{fontSize:13,color:C.muted}}>…</div></div>}
          </div>
          <div style={{background:C.white,borderTop:`1px solid ${C.border}`,padding:"12px 20px",flexShrink:0}}>
            <div style={{display:"flex",gap:10}}>
              <input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}}
                placeholder="What do you say?" disabled={chatLoading||msgs.length===0}
                style={{flex:1,border:`1px solid ${C.border}`,borderRadius:999,padding:"10px 16px",fontSize:13,outline:"none",background:C.bg,color:C.text,fontFamily:"'Inter',sans-serif"}}/>
              <button onClick={send} disabled={!input.trim()||chatLoading}
                style={{background:input.trim()&&!chatLoading?C.purple:C.border,color:input.trim()&&!chatLoading?"#fff":C.muted,border:"none",borderRadius:999,padding:"10px 20px",fontWeight:700,fontSize:13,cursor:input.trim()&&!chatLoading?"pointer":"not-allowed"}}>
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    );
  }

  if(phase==='scoring') return(
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"'Inter',sans-serif"}}>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:13,color:C.muted,marginBottom:12}}>Scott is reviewing that call…</div>
        <div style={{width:40,height:3,background:C.purple,borderRadius:999,margin:"0 auto"}}/>
      </div>
    </div>
  );

  if(phase==='between'){
    const last = scores[scores.length-1];
    return(
      <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"'Inter',sans-serif"}}>
        <div style={{maxWidth:480,width:"100%"}}>
          <div style={{background:C.white,borderRadius:20,padding:"28px",border:`1px solid ${C.border}`,marginBottom:12}}>
            <div style={{fontSize:11,fontWeight:700,color:C.purple,textTransform:"uppercase",letterSpacing:1.5,marginBottom:16}}>Scenario {scIdx+1} complete</div>
            {last && (<>
              <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:16}}>
                {Object.entries(dimLabels).map(([k,label])=>(
                  <div key={k} style={{background:C.bg,borderRadius:5,padding:"6px 12px",border:`1px solid ${C.border}`,fontSize:12}}>
                    <span style={{color:C.muted}}>{label}: </span>
                    <span style={{fontWeight:700,color:last[k]>=4?C.green:last[k]>=3?C.navy:C.red}}>{last[k]}/5</span>
                  </div>
                ))}
              </div>
              {last.standout && <p style={{fontSize:13,color:C.green,marginBottom:6,lineHeight:1.5}}>✓ {last.standout}</p>}
              {last.gap && <p style={{fontSize:13,color:C.muted,lineHeight:1.5}}>→ {last.gap}</p>}
            </>)}
          </div>
          <button onClick={()=>{setScIdx(i=>i+1);setMsgs([]);setInput('');setPhase('brief');}}
            style={{width:"100%",background:C.purple,color:"#fff",border:"none",borderRadius:999,padding:"13px",fontWeight:700,fontSize:14,cursor:"pointer"}}>
            Next scenario →
          </button>
        </div>
      </div>
    );
  }

  if(phase==='goals'||goalsLoading) return(
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"'Inter',sans-serif"}}>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:13,color:C.muted,marginBottom:12}}>Scott is building your learning path…</div>
        <div style={{width:40,height:3,background:C.purple,borderRadius:999,margin:"0 auto"}}/>
      </div>
    </div>
  );

  if(phase==='results'&&smartGoals){
    const {avgs,skillLevel,immediate,important,arc} = smartGoals;
    const lc = skillLevel==='advanced'?{bg:"#DBEAFE",text:"#1E40AF"}:skillLevel==='intermediate'?{bg:"#FEF9C3",text:"#854D0E"}:{bg:"#DCFCE7",text:"#166534"};
    return(
      <div style={{minHeight:"100vh",background:C.bg,padding:"32px 24px",fontFamily:"'Inter',sans-serif"}}>
        <div style={{maxWidth:560,margin:"0 auto"}}>
          <div style={{background:C.white,borderRadius:20,padding:"28px",border:`1px solid ${C.border}`,marginBottom:16}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
              <div>
                <div style={{fontSize:11,fontWeight:700,color:C.purple,textTransform:"uppercase",letterSpacing:1.5,marginBottom:4}}>Assessment complete</div>
                <h2 style={{fontSize:20,fontWeight:800,color:C.navy,margin:0}}>Your baseline</h2>
              </div>
              <div style={{background:lc.bg,color:lc.text,borderRadius:999,padding:"6px 16px",fontWeight:700,fontSize:13,textTransform:"capitalize"}}>{skillLevel}</div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {Object.entries(dimLabels).map(([k,label])=>(
                <div key={k} style={{background:C.bg,borderRadius:5,padding:"10px 14px",border:`1px solid ${C.border}`}}>
                  <div style={{fontSize:11,color:C.muted,marginBottom:2}}>{label}</div>
                  <div style={{fontSize:18,fontWeight:800,color:avgs[k]>=4?C.green:avgs[k]>=3?C.navy:C.red}}>{avgs[k]}<span style={{fontSize:12,fontWeight:400,color:C.muted}}>/5</span></div>
                </div>
              ))}
            </div>
          </div>
          <div style={{background:C.white,borderRadius:20,padding:"28px",border:`1px solid ${C.border}`,marginBottom:16}}>
            <div style={{fontSize:11,fontWeight:700,color:C.purple,textTransform:"uppercase",letterSpacing:1.5,marginBottom:16}}>Your goals from Scott</div>
            <div style={{marginBottom:16,paddingBottom:16,borderBottom:`1px solid ${C.border}`}}>
              <div style={{fontSize:11,fontWeight:700,color:C.amber,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>Focus now</div>
              <div style={{fontSize:13,fontWeight:700,color:C.navy,marginBottom:6}}>{immediate.title}</div>
              <p style={{fontSize:13,color:C.text,lineHeight:1.65,margin:0}}>{immediate.goal}</p>
            </div>
            <div style={{marginBottom:16,paddingBottom:16,borderBottom:`1px solid ${C.border}`}}>
              <div style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>Next 2 weeks</div>
              <div style={{fontSize:13,fontWeight:700,color:C.navy,marginBottom:6}}>{important.title}</div>
              <p style={{fontSize:13,color:C.text,lineHeight:1.65,margin:0}}>{important.goal}</p>
            </div>
            <div>
              <div style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>The bigger picture</div>
              <p style={{fontSize:13,color:C.muted,lineHeight:1.65,margin:0}}>{arc.pattern} {arc.goal}</p>
            </div>
          </div>
          <button onClick={finish} style={{width:"100%",background:C.purple,color:"#fff",border:"none",borderRadius:999,padding:"13px",fontWeight:700,fontSize:14,cursor:"pointer"}}>
            Build my learning path →
          </button>
        </div>
      </div>
    );
  }

  return null;
}

/* ══════════════════════════════════════════════════════════════
   SCOTT ONBOARDING
══════════════════════════════════════════════════════════════ */
function ScottOnboarding({onComplete, existingProfile=null}){
  const [step, setStep] = useState(existingProfile ? 1 : 0);
  const [showAssessment, setShowAssessment] = useState(false);
  const [assessmentDone, setAssessmentDone] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState(null);
  const [profile, setProfile] = useState(existingProfile || {
    name:"", focus:"", billings:"", challenge:"", ownChallenge:"", biggestWin:"",
    goalDate:"", seedVariant: Math.floor(Math.random()*6),
  });

  const update = (k,v) => setProfile(p=>({...p,[k]:v}));

  const sectorOptions = Object.keys(SECTOR_PERSONA_OVERLAYS).filter(k=>k!=="Generic");
  const challengeOptions = ["Starting conversations","Discovery","Handling objections","Closing","Confidence and consistency"];

  const steps = [
    {id:"name",    label:"Your name",            field:"name",       placeholder:"e.g. Alex Chen"},
    {id:"focus",   label:"Your recruitment sector", field:"focus",   placeholder:"e.g. Tech & Engineering, Accounting & Finance",
     options: sectorOptions},
    {id:"billing", label:"Annual billings",       field:"billings",  placeholder:"e.g. $250k, $500k+"},
    {id:"challenge",label:"What do you most want to improve?", field:"challenge", placeholder:"Choose your focus area",
     options: challengeOptions},
    {id:"ownWords",label:"In your own words — what's making this hard?",field:"ownChallenge",placeholder:"Be honest — this is just for Scott"},
    {id:"goal",    label:"When do you want to see improvement by?",field:"goalDate",placeholder:"e.g. 3 months, by end of quarter",
     subtext:"Scott will build your weekly pace around this."},
  ];

  if(showAssessment) return(
    <AssessmentFlow
      onComplete={(result)=>{ setAssessmentResult(result); setAssessmentDone(true); setShowAssessment(false); }}
      onBack={()=>setShowAssessment(false)}
    />
  );

  const currentStep = steps[step];
  const isLast = step === steps.length - 1;
  const canContinue = currentStep ? profile[currentStep.field]?.trim().length > 0 : false;

  return(
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"'Inter',sans-serif"}}>
      <div style={{maxWidth:480,width:"100%"}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{width:52,height:52,borderRadius:5,background:C.purple,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px",fontSize:22}}>🎯</div>
          <h1 style={{fontSize:22,fontWeight:800,color:C.navy,marginBottom:4}}>Set up your coaching profile</h1>
          <p style={{fontSize:13,color:C.muted}}>Scott will use this to personalise every piece of feedback.</p>
        </div>

        <div style={{display:"flex",gap:4,marginBottom:28}}>
          {steps.map((_,i)=>(
            <div key={i} style={{flex:1,height:4,borderRadius:999,background:i<=step?C.purple:C.border,transition:"background 0.3s"}}/>
          ))}
        </div>

        {currentStep && (
          <div style={{background:C.white,borderRadius:20,padding:"28px 24px 24px",border:`1px solid ${C.border}`,marginBottom:16}}>
            <div style={{fontSize:11,fontWeight:700,color:C.purple,textTransform:"uppercase",letterSpacing:1.5,marginBottom:8}}>Step {step+1} of {steps.length}</div>
            <label style={{display:"block",fontSize:15,fontWeight:700,color:C.navy,marginBottom:4}}>{currentStep.label}</label>
            {currentStep.subtext && <div style={{fontSize:12,color:C.muted,marginBottom:12}}>{currentStep.subtext}</div>}
            {!currentStep.subtext && <div style={{marginBottom:12}}/>}
            {currentStep.options ? (
              <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                {currentStep.options.map(opt=>{
                  const active = profile[currentStep.field]===opt;
                  return(
                    <button key={opt} onClick={()=>update(currentStep.field,opt)}
                      style={{background:active?C.purple:C.bg,color:active?"#fff":C.text,border:`2px solid ${active?C.purple:C.border}`,borderRadius:999,padding:"8px 16px",fontSize:13,fontWeight:active?700:400,cursor:"pointer",transition:"all 0.15s",fontFamily:"'Inter',sans-serif"}}>
                      {opt}
                    </button>
                  );
                })}
              </div>
            ) : (
              <input
                value={profile[currentStep.field]||""}
                onChange={e=>update(currentStep.field,e.target.value)}
                onKeyDown={e=>{ if(e.key==="Enter" && canContinue){ isLast ? (!assessmentDone ? setShowAssessment(true) : onComplete({...profile, skillLevel: assessmentResult?.skillLevel||'beginner', assessmentScores: assessmentResult?.assessmentScores||[], smartGoals: assessmentResult?.smartGoals||null})) : setStep(s=>s+1); }}}
                placeholder={currentStep.placeholder}
                autoFocus
                style={{width:"100%",background:C.bg,border:`2px solid ${C.border}`,borderRadius:5,padding:"12px 16px",fontSize:14,color:C.text,outline:"none",fontFamily:"'Inter',sans-serif",boxSizing:"border-box",transition:"border-color 0.2s"}}
              />
            )}
          </div>
        )}

        {isLast && assessmentDone && (
          <div style={{background:"#F0FDF4",borderRadius:5,padding:"10px 14px",border:"1px solid #BBF7D0",marginBottom:14,fontSize:12,color:C.green,fontWeight:600}}>
            ✓ Baseline assessment complete
          </div>
        )}

        <button
          onClick={()=>{
            if(!canContinue) return;
            if(isLast){
              if(!assessmentDone){ setShowAssessment(true); return; }
              onComplete({...profile, skillLevel: assessmentResult?.skillLevel||'beginner', assessmentScores: assessmentResult?.assessmentScores||[], smartGoals: assessmentResult?.smartGoals||null});
            } else {
              setStep(s=>s+1);
            }
          }}
          disabled={!canContinue}
          style={{width:"100%",background:canContinue?C.purple:C.border,color:canContinue?"#fff":C.muted,border:"none",borderRadius:999,padding:"13px",fontWeight:700,fontSize:14,cursor:canContinue?"pointer":"not-allowed",transition:"all 0.2s"}}>
          {isLast ? "Build my learning path →" : "Continue →"}
        </button>

        {step > 0 && (
          <button onClick={()=>setStep(s=>s-1)} style={{width:"100%",background:"none",border:"none",color:C.muted,fontSize:13,cursor:"pointer",marginTop:10}}>
            ← Back
          </button>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   ANALYSIS
══════════════════════════════════════════════════════════════ */
function Analysis({go, profile:appProfile=null, userId=null}){
  const isMobile = useWindowWidth() < 768;
  const effectiveProfile = appProfile || loadProfile();
  // ── ASK SCOTT state ──
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput]     = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatRef = useRef(null);
  const chatInputRef = useRef(null);

  useEffect(()=>{
    if(chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  },[chatHistory]);

  // ── ASK SCOTT — live coaching ──
  const sendCoachMessage = async (text) => {
    if(!text?.trim() || chatLoading) return;
    setChatLoading(true);
    const userMsg = {role:"user", content:text.trim()};
    const newHistory = [...chatHistory, userMsg];
    setChatHistory(newHistory);
    setChatInput("");

    const systemPrompt = `You are Scott — a senior recruitment coach with 20 years placing top talent. You've seen every objection, every freeze-up, every missed opportunity. Your coaching is warm, direct, and immediately actionable.

${effectiveProfile ? `This recruiter: ${effectiveProfile.focus}, billing ${effectiveProfile.billings}. Their challenge: "${effectiveProfile.ownChallenge||effectiveProfile.challenge}". Reference this when relevant.` : ""}

HOW YOU COACH:
- SPIN Selling: you help them move from situation → problem → implication → need-payoff questions
- Challenger approach: teach them to reframe the candidate's thinking, not just respond to it
- Emotional intelligence: acknowledge the candidate's state before trying to change it
- When they share a specific line or situation, respond to THAT specifically — not generically
- Always include one exact script: "Try this: [exact words]"
- If they're stuck on mindset (fear of rejection, procrastination), address the feeling first then the tactic
- Keep responses to 3-4 short paragraphs. They're between calls.
- Never say "great question" or start with sycophancy. Just answer.

RESPONSE STRUCTURE:
- Write 3-4 focused paragraphs, each making one distinct point
- First paragraph: acknowledge the exact situation or feeling they described — make them feel heard before fixing anything
- Middle paragraphs: give the insight or reframe, then the tactic
- Always end with a concrete script line formatted as: Try this: "[exact words to say]"
- Be specific to what they just shared — never give advice that could apply to anyone`;

    try {
      const messages = newHistory.slice(-10).map(m => ({role:m.role, content:m.content}));
      const resp = await callAPI(messages, systemPrompt, {model:"claude-sonnet-4-6", max_tokens:800, temperature:0.7});
      setChatHistory(prev => [...prev, {role:"assistant", content:resp}]);
    } catch(e){
      setChatHistory(prev => [...prev, {role:"assistant", content:`⚠ ${e.message || "Connection issue — try again in a moment."}`}]);
    } finally {
      setChatLoading(false);
    }
    setTimeout(() => chatInputRef.current?.focus(), 100);
  };

  const STARTER_PROMPTS = [
    "A candidate just said 'I'm happy where I am' — what do I say?",
    "How do I open a cold call without sounding scripted?",
    "They keep saying they'll 'think about it' — how do I get a commitment?",
    "My discovery questions feel robotic — how do I make them feel natural?",
    "Candidate went cold after my first pitch — how do I recover?",
  ];

  return(
    <Shell page="analysis" go={go} userRole="learner">
      <div style={{maxWidth:820,padding:isMobile?"0 4px":0}}>

        {/* Page header */}
        <div style={{marginBottom:20}}>
          <h1 style={{fontSize:22,fontWeight:800,color:C.navy,marginBottom:4}}>Ask Scott</h1>
          <p style={{color:C.muted,fontSize:13}}>Ask Scott anything — what to say, how to handle an objection, why a call went cold.</p>
        </div>

          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {/* Context strip */}
            <div style={{background:C.lavPale,borderRadius:14,border:`1px solid ${C.lavSoft}`,padding:"12px 16px",display:"flex",gap:10,alignItems:"flex-start"}}>
              <Av ini="SC" col={C.lavSoft} sz={32}/>
              <div>
                <div style={{fontWeight:700,color:C.navy,fontSize:13,marginBottom:2}}>Scott — live coaching</div>
                <div style={{fontSize:12,color:C.purple,lineHeight:1.55}}>Ask anything — what to say right now, how to handle a specific objection, why a call went cold. I'll ask one question if I need to, then give you something you can use immediately.</div>
              </div>
            </div>

            {/* Chat area */}
            <div ref={chatRef} style={{background:C.white,borderRadius:5,border:`1px solid ${C.border}`,padding:"16px",minHeight:320,maxHeight:500,overflowY:"auto",display:"flex",flexDirection:"column",gap:10}}>
              {chatHistory.length===0 && (
                <div style={{display:"flex",flexDirection:"column",gap:8,paddingTop:8}}>
                  <div style={{fontSize:12,color:C.muted,marginBottom:4}}>Start with a question, or try one of these:</div>
                  {STARTER_PROMPTS.map((p,i)=>(
                    <button key={i} onClick={()=>sendCoachMessage(p)}
                      style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:5,padding:"9px 14px",textAlign:"left",fontSize:12,color:C.text,cursor:"pointer",fontFamily:"'Inter',sans-serif",transition:"background 0.15s"}}>
                      {p}
                    </button>
                  ))}
                </div>
              )}
              {chatHistory.map((m,i)=>(
                <div key={i} style={{display:"flex",gap:8,justifyContent:m.role==="user"?"flex-end":"flex-start",alignItems:"flex-start"}}>
                  {m.role==="assistant"&&<Av ini="SC" col={C.lavSoft} sz={28}/>}
                  <div style={{
                    background:m.role==="user"?C.navy:C.lavPale,
                    color:m.role==="user"?"#fff":C.text,
                    borderRadius:m.role==="user"?"14px 14px 4px 14px":"14px 14px 14px 4px",
                    padding:"10px 14px",fontSize:13,lineHeight:1.65,maxWidth:"82%",
                    border:m.role==="assistant"?`1px solid ${C.lavSoft}`:"none",
                    whiteSpace:"pre-wrap",
                  }}>{m.content}</div>
                  {m.role==="user"&&<Av ini="ME" col={C.purple} sz={28}/>}
                </div>
              ))}
              {chatLoading&&(
                <div style={{display:"flex",gap:8,alignItems:"flex-start"}}>
                  <Av ini="SC" col={C.lavSoft} sz={28}/>
                  <div style={{background:"rgba(237,233,254,0.5)",borderRadius:"14px 14px 14px 4px",padding:"10px 14px",border:`1px solid ${C.lavSoft}`}}>
                    <div style={{display:"flex",gap:4}}>{[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:"50%",background:C.purple,animation:"bounce 1s infinite",animationDelay:`${i*0.2}s`}}/>)}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div style={{display:"flex",gap:8}}>
              <input
                ref={chatInputRef}
                value={chatInput}
                onChange={e=>setChatInput(e.target.value)}
                onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey&&chatInput.trim()){ e.preventDefault(); sendCoachMessage(chatInput); } }}
                placeholder="Ask Scott anything — what to say, how to handle an objection, why a call went cold…"
                disabled={chatLoading}
                style={{flex:1,background:C.white,border:`1px solid ${C.border}`,borderRadius:999,padding:"11px 18px",fontSize:13,color:C.text,outline:"none",fontFamily:"'Inter',sans-serif",opacity:chatLoading?0.6:1}}
              />
              <button onClick={()=>{ if(chatInput.trim()) sendCoachMessage(chatInput); }}
                disabled={!chatInput.trim()||chatLoading}
                style={{background:chatInput.trim()&&!chatLoading?C.purple:C.border,color:chatInput.trim()&&!chatLoading?"#fff":C.muted,border:"none",borderRadius:999,padding:"11px 20px",fontWeight:700,fontSize:13,cursor:chatInput.trim()&&!chatLoading?"pointer":"not-allowed",transition:"all 0.2s",whiteSpace:"nowrap"}}>
                Send
              </button>
            </div>
            {chatHistory.length>0&&(
              <button onClick={()=>setChatHistory([])} style={{background:"none",border:"none",color:C.muted,fontSize:12,cursor:"pointer",alignSelf:"flex-start"}}>
                ← Start new conversation
              </button>
            )}
          </div>
      </div>
    </Shell>
  );
}


function Progress({go}){
  const profile    = loadProfile();
  const roleplays  = loadRoleplays();
  const completedIds = loadCompletedIds();
  const goals      = loadSmartGoals();
  const [genGoals, setGenGoals] = useState(goals);
  const [generating, setGenerating] = useState(false);

  const totalModules = MODULES.length;
  const completedModules = MODULES.filter(m=>m.lessons?.every(l=>completedIds.includes(l.id))).length;
  const totalLessons = MODULES.reduce((a,m)=>(m.lessons?.length||0)+a,0);
  const completedLessons = completedIds.length;

  const avgScore = roleplays.length
    ? Math.round(roleplays.reduce((a,r)=>a+r.score,0)/roleplays.length)
    : null;

  const recentRPs = [...roleplays].reverse().slice(0,5);

  const verdictColor = (v) =>
    v==="Strong Performance"?C.green:v==="On Track"?C.purple:C.red;

  return(
    <Shell page="progress" go={go} userRole="learner">
      <div style={{maxWidth:760}}>
        <div style={{marginBottom:24}}>
          <h1 style={{fontSize:22,fontWeight:800,color:C.navy,marginBottom:4}}>Your Progress</h1>
          <p style={{color:C.muted,fontSize:13}}>Track your learning and roleplay performance over time.</p>
        </div>

        {/* Stats strip */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:24}}>
          {[
            {label:"Modules complete",val:`${completedModules}/${totalModules}`,icon:"📚"},
            {label:"Lessons done",    val:`${completedLessons}/${totalLessons}`,icon:"✓"},
            {label:"Roleplays",       val:roleplays.length,                      icon:"🎭"},
            {label:"Avg score",       val:avgScore!==null?avgScore:"—",          icon:"🎯"},
          ].map((s,i)=>(
            <div key={i} style={{background:C.white,borderRadius:14,border:`1px solid ${C.border}`,padding:18,textAlign:"center"}}>
              <div style={{fontSize:22,marginBottom:4}}>{s.icon}</div>
              <div style={{fontSize:22,fontWeight:900,color:C.navy,lineHeight:1}}>{s.val}</div>
              <div style={{fontSize:11,color:C.muted,marginTop:4}}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Module progress */}
        <div style={{background:C.white,borderRadius:5,border:`1px solid ${C.border}`,padding:22,marginBottom:20}}>
          <div style={{fontSize:13,fontWeight:700,color:C.navy,marginBottom:16}}>Module progress</div>
          {MODULES.map(mod=>{
            const done = mod.lessons?.filter(l=>completedIds.includes(l.id)).length||0;
            const total = mod.lessons?.length||0;
            const pct = total ? Math.round((done/total)*100) : 0;
            return(
              <div key={mod.id} style={{marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <span style={{fontSize:13,color:C.text,fontWeight:pct===100?700:400}}>{mod.title}</span>
                  <span style={{fontSize:12,color:pct===100?C.green:C.muted,fontWeight:600}}>{done}/{total}</span>
                </div>
                <div style={{height:6,background:C.bg,borderRadius:999,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${pct}%`,background:pct===100?C.green:C.purple,borderRadius:999,transition:"width 0.4s"}}/>
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent roleplays */}
        {recentRPs.length > 0 && (
          <div style={{background:C.white,borderRadius:5,border:`1px solid ${C.border}`,padding:22,marginBottom:20}}>
            <div style={{fontSize:13,fontWeight:700,color:C.navy,marginBottom:16}}>Recent roleplays</div>
            {recentRPs.map((rp,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:14,padding:"10px 0",borderBottom:i<recentRPs.length-1?`1px solid ${C.bg}`:"none"}}>
                <Ring score={rp.score} sz={44}/>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:600,color:C.navy}}>{rp.scenarioKey}</div>
                  <div style={{fontSize:11,color:C.muted,marginTop:2}}>{rp.difficulty} · {rp.savedAt?new Date(rp.savedAt).toLocaleDateString():""}</div>
                </div>
                <span style={{fontSize:12,fontWeight:700,color:verdictColor(rp.verdict)}}>{rp.verdict}</span>
              </div>
            ))}
          </div>
        )}

        {/* SMART Goals */}
        <SmartGoalsPanel profile={profile}/>
      </div>
    </Shell>
  );
}

/* ══════════════════════════════════════════════════════════════
   ANALYTICS
══════════════════════════════════════════════════════════════ */
function Analytics({go}){
  const isMobile = useWindowWidth() < 768;
  const roleplays  = loadRoleplays();
  const reflections = loadReflections();

  const avgByDiff = (diff) => {
    const filtered = roleplays.filter(r=>r.difficulty===diff);
    return filtered.length ? Math.round(filtered.reduce((a,r)=>a+r.score,0)/filtered.length) : null;
  };

  const frameworkAvg = () => {
    const all = roleplays.flatMap(r=>r.frameworks||[]);
    const byName = {};
    all.forEach(f=>{ if(!byName[f.name]){byName[f.name]=[];} byName[f.name].push(f.score); });
    return Object.entries(byName).map(([name,scores])=>({
      name, avg: Math.round(scores.reduce((a,s)=>a+s,0)/scores.length), count: scores.length
    })).sort((a,b)=>a.avg-b.avg);
  };

  const fwAvgs = frameworkAvg();

  return(
    <Shell page="analytics" go={go} userRole="learner">
      <div style={{maxWidth:760}}>
        <div style={{marginBottom:24}}>
          <h1 style={{fontSize:22,fontWeight:800,color:C.navy,marginBottom:4}}>Analytics</h1>
          <p style={{color:C.muted,fontSize:13}}>Patterns and trends across your roleplay history.</p>
        </div>

        {roleplays.length === 0 ? (
          <div style={{background:C.white,borderRadius:5,border:`1px solid ${C.border}`,padding:48,textAlign:"center"}}>
            <div style={{fontSize:32,marginBottom:10}}>📊</div>
            <div style={{fontWeight:700,color:C.navy,fontSize:15,marginBottom:6}}>No data yet</div>
            <div style={{fontSize:13,color:C.muted}}>Complete roleplays to see your performance patterns here.</div>
          </div>
        ) : (
          <>
            {/* Score by difficulty */}
            <div style={{background:C.white,borderRadius:5,border:`1px solid ${C.border}`,padding:22,marginBottom:16}}>
              <div style={{fontSize:13,fontWeight:700,color:C.navy,marginBottom:16}}>Average score by difficulty</div>
              {["beginner","intermediate","advanced"].map(d=>{
                const avg = avgByDiff(d);
                if(avg===null) return null;
                const col = avg>=75?C.green:avg>=60?C.purple:C.red;
                return(
                  <div key={d} style={{display:"flex",alignItems:"center",gap:14,marginBottom:10}}>
                    <div style={{width:90,fontSize:12,color:C.text,textTransform:"capitalize",fontWeight:600}}>{d}</div>
                    <div style={{flex:1,height:10,background:C.bg,borderRadius:999,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${avg}%`,background:col,borderRadius:999,transition:"width 0.5s"}}/>
                    </div>
                    <div style={{width:36,fontSize:13,fontWeight:700,color:col,textAlign:"right"}}>{avg}</div>
                  </div>
                );
              })}
            </div>

            {/* Framework averages */}
            {fwAvgs.length > 0 && (
              <div style={{background:C.white,borderRadius:5,border:`1px solid ${C.border}`,padding:22,marginBottom:16}}>
                <div style={{fontSize:13,fontWeight:700,color:C.navy,marginBottom:16}}>Framework performance (lowest first)</div>
                {fwAvgs.map((fw,i)=>{
                  const col = fw.avg>=75?C.green:fw.avg>=60?C.amber:C.red;
                  return(
                    <div key={i} style={{display:"flex",alignItems:"center",gap:14,marginBottom:10}}>
                      <div style={{flex:1,fontSize:12,color:C.text}}>{fw.name}</div>
                      <div style={{width:120,height:8,background:C.bg,borderRadius:999,overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${fw.avg}%`,background:col,borderRadius:999}}/>
                      </div>
                      <div style={{width:32,fontSize:12,fontWeight:700,color:col,textAlign:"right"}}>{fw.avg}</div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Score trend */}
            <div style={{background:C.white,borderRadius:5,border:`1px solid ${C.border}`,padding:22}}>
              <div style={{fontSize:13,fontWeight:700,color:C.navy,marginBottom:16}}>Score trend (last {Math.min(10,roleplays.length)} roleplays)</div>
              <div style={{display:"flex",gap:6,alignItems:"flex-end",height:60}}>
                {[...roleplays].slice(-10).map((rp,i)=>{
                  const h = Math.max(6,Math.round((rp.score/100)*60));
                  const col = rp.score>=75?C.green:rp.score>=60?C.purple:C.red;
                  return(
                    <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                      <div style={{fontSize:9,color:C.muted}}>{rp.score}</div>
                      <div style={{width:"100%",height:h,background:col,borderRadius:4,transition:"height 0.4s"}}/>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </Shell>
  );
}


/* ══════════════════════════════════════════════════════════════
   ADMIN WIZARD
══════════════════════════════════════════════════════════════ */
function AdminWizard({go}){
  const [step, setStep] = useState(1);
  const [data, setData] = useState({voice:"", objections:["","",""], values:"", avoid:""});
  const [done, setDone] = useState(false);
  const update = (k,v) => setData(p=>({...p,[k]:v}));

  const steps = [
    {n:1, title:"Your firm's voice",       desc:"How do you want recruiters to sound on calls?",         field:"voice",      placeholder:"e.g. Peer-level, not vendor. Confident, warm. Never scripted."},
    {n:2, title:"Common objections",       desc:"The 3 objections your team faces most.",                field:"objections", type:"multi"},
    {n:3, title:"Non-negotiable values",   desc:"What behaviours or standards define your firm?",        field:"values",     placeholder:"e.g. Always confirm the role before pitching. Never promise what you can't deliver."},
    {n:4, title:"What to avoid",           desc:"Language, approaches, or habits you want eliminated.",  field:"avoid",      placeholder:"e.g. Avoid 'just checking in'. Never lead with salary."},
  ];

  const save = () => {
    try { localStorage.setItem("heyscott_admin_v1", JSON.stringify({...data, savedAt:new Date().toISOString()})); } catch(e){}
    setDone(true);
  };

  if(done) return(
    <Shell page="team" go={go} userRole="manager" panel={false}>
      <div style={{maxWidth:480,margin:"60px auto",textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:16}}>✅</div>
        <h2 style={{fontWeight:800,color:C.navy,marginBottom:8}}>Coaching context saved</h2>
        <p style={{fontSize:13,color:C.muted,lineHeight:1.65,marginBottom:24}}>Your firm's language, values, and objection patterns have been saved. AI roleplays and analysis will now incorporate this context.</p>
        <button onClick={()=>go("team")} style={{background:C.purple,color:"#fff",border:"none",borderRadius:999,padding:"12px 28px",fontWeight:700,fontSize:14,cursor:"pointer"}}>
          Go to Manager Dashboard →
        </button>
      </div>
    </Shell>
  );

  const current = steps[step-1];

  return(
    <Shell page="team" go={go} userRole="manager" panel={false}>
      <div style={{maxWidth:520,margin:"0 auto"}}>
        <button onClick={()=>go("team")} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:13,marginBottom:24}}>← Back to Dashboard</button>
        <h1 style={{fontSize:22,fontWeight:800,color:C.navy,marginBottom:4}}>Firm Coaching Setup</h1>
        <p style={{fontSize:13,color:C.muted,marginBottom:24}}>Configure how Scott coaches your team. This context is injected into all AI feedback and roleplays.</p>

        <div style={{display:"flex",gap:4,marginBottom:24}}>
          {steps.map(s=><div key={s.n} style={{flex:1,height:4,borderRadius:999,background:s.n<=step?C.purple:C.border,transition:"background 0.3s"}}/>)}
        </div>

        <div style={{background:C.white,borderRadius:5,border:`1px solid ${C.border}`,padding:"24px 22px",marginBottom:16}}>
          <div style={{fontSize:11,fontWeight:700,color:C.purple,textTransform:"uppercase",letterSpacing:1.5,marginBottom:6}}>Step {step} of {steps.length}</div>
          <div style={{fontSize:16,fontWeight:700,color:C.navy,marginBottom:4}}>{current.title}</div>
          <div style={{fontSize:13,color:C.muted,marginBottom:16}}>{current.desc}</div>

          {current.type==="multi" ? (
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {data.objections.map((obj,i)=>(
                <input key={i} value={obj}
                  onChange={e=>{ const arr=[...data.objections]; arr[i]=e.target.value; update("objections",arr); }}
                  placeholder={`Objection ${i+1} — e.g. "I'm happy where I am"`}
                  style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:5,padding:"11px 14px",fontSize:13,color:C.text,outline:"none",fontFamily:"'Inter',sans-serif"}}
                />
              ))}
            </div>
          ) : (
            <textarea value={data[current.field]||""} onChange={e=>update(current.field,e.target.value)}
              placeholder={current.placeholder} rows={4}
              style={{width:"100%",background:C.bg,border:`1px solid ${C.border}`,borderRadius:5,padding:"11px 14px",fontSize:13,color:C.text,outline:"none",resize:"vertical",fontFamily:"'Inter',sans-serif",boxSizing:"border-box"}}
            />
          )}
        </div>

        <div style={{display:"flex",gap:10}}>
          {step > 1 && <button onClick={()=>setStep(s=>s-1)} style={{flex:1,background:"none",border:`1px solid ${C.border}`,borderRadius:999,padding:"12px",fontSize:13,fontWeight:600,color:C.muted,cursor:"pointer"}}>← Back</button>}
          <button
            onClick={step===steps.length ? save : ()=>setStep(s=>s+1)}
            style={{flex:2,background:C.purple,color:"#fff",border:"none",borderRadius:999,padding:"12px",fontWeight:700,fontSize:14,cursor:"pointer"}}>
            {step===steps.length ? "Save coaching context ✓" : "Continue →"}
          </button>
        </div>
      </div>
    </Shell>
  );
}


/* ══════════════════════════════════════════════════════════════
   APP — main router
══════════════════════════════════════════════════════════════ */
export default function App(){
  const [page, setPage]           = useState("landing");
  const [profile, setProfile]     = useState(()=>loadProfile());
  const [userRole, setUserRole]   = useState("learner");
  const [currentMod, setCurrentMod] = useState(null);
  const [quickMode, setQuickMode] = useState(false);
  const [user, setUser]           = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const go = (p, opts={}) => {
    if(opts.mod) setCurrentMod(opts.mod);
    if(opts.quick!==undefined) setQuickMode(opts.quick);
    setPage(p); window.scrollTo(0,0);
  };

  useEffect(()=>{
    (async()=>{
      // PKCE email confirmation callback: Supabase redirects back with ?code=
      const urlParams = new URLSearchParams(window.location.search);
      const authCode = urlParams.get('code');
      if(authCode){
        window.history.replaceState(null, '', window.location.pathname);
        try {
          const u = await sb.exchangeCode(authCode);
          if(u){
            setUser(u);
            let pending = null;
            try { pending = JSON.parse(localStorage.getItem('heyscott_pending_signup') || 'null'); } catch {}
            localStorage.removeItem('heyscott_pending_signup');
            const role = pending?.role || 'individual';
            setUserRole(role);
            let p = await sbGetProfile(u.id);
            if(!p && pending){
              await sbSaveProfile(u.id, { name: pending.name || '', role, focus:"", billings:"", challenge:"", ownChallenge:"", ...(pending.company_id ? {company_id: pending.company_id} : {}) });
              if(role === 'manager' && pending.teamName){
                try {
                  const tok = sb._token;
                  await fetch('/api/create-team', {
                    method:'POST', headers:{'Content-Type':'application/json'},
                    body: JSON.stringify({ userId: u.id, teamName: pending.teamName, token: tok }),
                  });
                } catch {}
              }
              p = await sbGetProfile(u.id);
            }
            if(p) setProfile(p);
            go(role === 'manager' ? 'team' : 'setup');
            setAuthLoading(false);
            return;
          }
        } catch {}
        go('landing');
        setAuthLoading(false);
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const inviteCompany = params.get('company');
      if(inviteCompany){ go('invite'); setAuthLoading(false); return; }

      try {
        const u = await sb.getUser();
        if(u){
          setUser(u);
          const p = await sbGetProfile(u.id);
          if(p){
            setProfile(p);
            setUserRole(p.role || 'learner');
            go(p.role==='manager' ? 'team' : 'learning');
          } else {
            const local = loadProfile();
            if(local?.name){ setProfile(local); sbSaveProfile(u.id, local).catch(()=>{}); go('learning'); }
            else { go('setup'); }
          }
        } else {
          go('landing');
        }
      } catch(e) {
        go('landing');
      }
      setAuthLoading(false);
    })();
  }, []);

  const handleAuth = async (u, role) => {
    setUser(u);
    setUserRole(role || 'learner');
    const p = await sbGetProfile(u.id);
    if(p){ setProfile(p); go(role==='manager' ? 'team' : 'learning'); }
    else {
      const local = loadProfile();
      if(local?.name){ setProfile(local); sbSaveProfile(u.id, local).catch(()=>{}); go('learning'); }
      else { go('setup'); }
    }
  };

  const handleProfileSave = (p) => {
    saveProfile(p);
    setProfile(p);
    go("learning");
    // Fire-and-forget gap check — never blocks navigation
    checkAndNotifyModuleGap(p).catch(()=>{});
  };

  return (
    <div style={{fontFamily:"'Inter',sans-serif",background:C.bg,minHeight:"100vh"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes blink{0%,90%,100%{transform:scaleY(1)}95%{transform:scaleY(0.1)}}
        @keyframes soundwave{from{transform:scaleY(0.3)}to{transform:scaleY(1)}}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:#E4DDD6;border-radius:999px}
      `}</style>

      {authLoading && <AuthLoadingScreen/>}
      {!authLoading && page==="landing"    && <Landing go={go}/>}
      {!authLoading && page==="login"      && <LoginPage go={go} onAuth={handleAuth}/>}
      {!authLoading && page==="signup"     && <SignupPage go={go} onAuth={handleAuth}/>}
      {!authLoading && page==="invite"     && <InvitePage go={go} onAuth={handleAuth}/>}
      {!authLoading && page==="onboarding" && <Onboarding go={go} setProfile={setProfile} setUserRole={setUserRole}/>}
      {!authLoading && page==="setup"      && <ScottOnboarding onComplete={handleProfileSave} existingProfile={profile}/>}
      {!authLoading && page==="learning"   && <Learning go={go} setMod={m=>setCurrentMod(m)} profile={profile}/>}
      {!authLoading && page==="module"     && currentMod && <ModuleDetail mod={currentMod} go={go} quickMode={quickMode} profile={profile}/>}
      {!authLoading && page==="analysis"   && <Analysis go={go} profile={profile}/>}
      {!authLoading && page==="progress"   && <Progress go={go}/>}
      {!authLoading && page==="analytics"  && <Analytics go={go}/>}
      {!authLoading && page==="team"       && userRole==="manager" && <ManagerDashboard go={go}/>}
      {!authLoading && page==="team"       && userRole!=="manager" && <NavGuard go={go} to="learning"/>}
      {!authLoading && page==="admin"      && <AdminWizard go={go}/>}
    </div>
  );
}
