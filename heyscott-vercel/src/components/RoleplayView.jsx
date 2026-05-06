import { useState, useRef, useEffect } from 'react';
import { C, R, Sh, F } from '../constants/design.js';
import { SCENARIOS, ALL_CRITERIA, SECTOR_PERSONA_OVERLAYS } from '../constants/scenarios.js';
import { PERSONA_VARIANTS, DIFFICULTY_MODIFIERS } from '../constants/personas.js';
import { callAPI, parseJSON } from '../services/api.js';
import { loadRoleplays, saveRoleplay } from '../utils/storage.js';

export function RoleplayView({lesson, mod, go, onBack, userLevel="beginner", profile=null, onJournal=null, customScenario=null}){
  const isMobile = useWindowWidth() < 768;
  const [phase, setPhase] = useState("brief");
  const [showPostCheck, setShowPostCheck] = useState(false);
  const [showBrief, setShowBrief] = useState(false);
  const [msgs, setMsgs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [turns, setTurns] = useState(0);
  const [result, setResult] = useState(null);
  const [activeDebriefTab, setActiveDebriefTab] = useState("overview");
  const [avatarState, setAvatarState] = useState("idle");
  const [transcript, setTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [micError, setMicError] = useState(null);
  const [textInput, setTextInput] = useState("");
  const [isMuted, setIsMuted] = useState(false);

  const recognitionRef  = useRef(null);
  const synthRef        = useRef(window.speechSynthesis);
  const messagesRef     = useRef(null);
  const processingRef   = useRef(false);
  const finalRef        = useRef("");
  const silenceTimer    = useRef(null);
  const isRecordingRef  = useRef(false);
  const isMutedRef      = useRef(false);

  const scenarioKey = lesson?.scenarioKey || "opening_beginner";
  const scenario = customScenario || SCENARIOS[scenarioKey] || SCENARIOS["opening_beginner"];
  const baseCand = scenario.candidate;
  const _rpOverlay = profile?.focus ? (SECTOR_PERSONA_OVERLAYS[profile.focus] || null) : null;
  const _rpVariant = PERSONA_VARIANTS[profile?.seedVariant ?? 0] || PERSONA_VARIANTS[0];
  const _sectorPersona = _rpOverlay?.personas?.[ _rpVariant.companyIdx % (_rpOverlay.personas?.length || 1)];
  const cand = _sectorPersona ? {
    ...baseCand,
    name: _sectorPersona.name,
    ini: _sectorPersona.ini,
    col: _sectorPersona.col,
    title: _sectorPersona.title,
    company: _sectorPersona.company,
    tenure: _sectorPersona.tenure,
    hook: _sectorPersona.hook,
  } : baseCand;
  const brief = scenario.brief;

  useEffect(()=>{
    if(messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  },[msgs]);

  useEffect(()=>{ return ()=>{ synthRef.current?.cancel(); _stopRec(); }; },[]);

  // ── SPEECH SYNTHESIS — respects mute ──
  const speak = (text, onEnd) => {
    if(isMutedRef.current){
      setAvatarState("idle");
      onEnd?.();
      return;
    }
    synthRef.current?.cancel();
    const doSpeak = () => {
      const utter = new SpeechSynthesisUtterance(text);
      const voices = synthRef.current?.getVoices() || [];
      const v = voices.find(v=>v.name.includes("Google") && v.lang.startsWith("en")) ||
                voices.find(v=>v.lang.startsWith("en-AU") || v.lang.startsWith("en-GB")) ||
                voices.find(v=>v.lang.startsWith("en"));
      if(v) utter.voice = v;
      utter.rate = 0.9; utter.pitch = cand.voicePitch||1.0; utter.volume = 1;
      utter.onstart = ()=>{ if(isMutedRef.current){ synthRef.current?.cancel(); setAvatarState("idle"); onEnd?.(); return; } setAvatarState("speaking"); };
      utter.onend   = ()=>{ setAvatarState("idle"); onEnd?.(); };
      utter.onerror = ()=>{ setAvatarState("idle"); onEnd?.(); };
      synthRef.current?.speak(utter);
    };
    const voices = synthRef.current?.getVoices()||[];
    if(voices.length) doSpeak();
    else { if(synthRef.current) synthRef.current.onvoiceschanged = doSpeak; setTimeout(doSpeak, 200); }
  };

  const toggleMute = () => {
    const next = !isMuted;
    isMutedRef.current = next;
    setIsMuted(next);
    if(next){
      synthRef.current?.cancel(); // cuts speech mid-word immediately
      setAvatarState("idle");
    }
  };

  // ── INTERNAL STOP ──
  const _stopRec = () => {
    clearTimeout(silenceTimer.current);
    try { recognitionRef.current?.abort(); } catch(e){}
    recognitionRef.current = null;
    isRecordingRef.current = false;
    setIsRecording(false);
  };

  // ── SEND ACCUMULATED SPEECH ──
  const commitSpeech = () => {
    const said = (finalRef.current + " " + transcript).trim();
    _stopRec();
    finalRef.current = "";
    setTranscript("");
    if(said){ setAvatarState("thinking"); sendMessage(said); }
    else setAvatarState("idle");
  };

  // ── TOGGLE MIC ──
  const toggleMic = () => {
    if(callEnded) return;
    // If candidate is speaking, interrupt them and listen
    if(avatarState === "speaking"){ synthRef.current?.cancel(); setAvatarState("idle"); }
    if(isRecordingRef.current){ commitSpeech(); return; }
    if(loading) return;

    if(!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)){
      setMicError("Voice needs Chrome or Edge. Use the text box below to type.");
      return;
    }

    // Build a fresh instance every time — most reliable approach
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-AU";
    finalRef.current = "";

    rec.onstart = ()=>{
      isRecordingRef.current = true;
      setIsRecording(true);
      setAvatarState("listening");
      setMicError(null);
      setTranscript("");
    };

    rec.onresult = (e)=>{
      clearTimeout(silenceTimer.current);
      let interim = ""; let final = finalRef.current;
      for(let i=e.resultIndex; i<e.results.length; i++){
        const t = e.results[i][0].transcript;
        if(e.results[i].isFinal) final += t + " "; else interim = t;
      }
      finalRef.current = final;
      setTranscript((final+interim).trim());
      silenceTimer.current = setTimeout(()=>{ if(isRecordingRef.current) commitSpeech(); }, 2200);
    };

    rec.onerror = (e)=>{
      isRecordingRef.current = false;
      setIsRecording(false);
      setAvatarState("idle");
      if(e.error === "not-allowed" || e.error === "service-not-allowed"){
        setMicError("🔒 Click the lock/camera icon in your browser address bar → set Microphone to Allow → tap mic again.");
      } else if(e.error === "not-supported"){
        setMicError("Voice not supported here. Use Chrome or Edge, or type below.");
      } else if(e.error !== "no-speech" && e.error !== "aborted"){
        setMicError("Mic issue — tap the button again to retry.");
      }
    };

    rec.onend = ()=>{
      if(isRecordingRef.current && !processingRef.current){
        try { rec.start(); } catch(err){ isRecordingRef.current=false; setIsRecording(false); }
      } else {
        isRecordingRef.current = false;
        setIsRecording(false);
      }
    };

    recognitionRef.current = rec;
    try {
      rec.start();
    } catch(err){
      setMicError("Tap the mic again to start listening.");
      isRecordingRef.current = false;
    }
  };

  // ── START CALL — no getUserMedia, SpeechRecognition handles its own permission ──
  const startCall = () => {
    // When a sector overlay is active, the candidate identity is swapped.
    // Use the sector persona's name as the opening line so there's no mismatch.
    const overlay = profile?.focus ? (SECTOR_PERSONA_OVERLAYS[profile.focus] || null) : null;
    const variant  = PERSONA_VARIANTS[profile?.seedVariant ?? 0] || PERSONA_VARIANTS[0];
    const sectorPersona = overlay?.personas?.[variant.companyIdx % (overlay.personas?.length || 1)];

    let openingText;
    if(sectorPersona) {
      // Most scenarios use a formal name pickup (e.g. "Priya Nair.") or neutral ("Yeah?").
      // When sector-swapped, use the sector persona's last name or a neutral pickup.
      const baseOpening = scenario.system.match(/Opening line[^:]*:\s*"([^"]+)"/)?.[1] || "";
      const hasName = /^[A-Z][a-z]+ [A-Z][a-z]+\.?$/.test(baseOpening.trim()); // "First Last." pattern
      openingText = hasName ? `${sectorPersona.name}.` : (baseOpening || `${sectorPersona.name}.`);
    } else {
      openingText = scenario.system.match(/Opening line[^:]*:\s*"([^"]+)"/)?.[1] || "Hello?";
    }

    setMsgs([{role:"ai", content:openingText, time:ts()}]);
    setPhase("call");
    setTimeout(()=> speak(openingText), 700);
  };


  // ── ROLEPLAY PERSONALISATION — full sector + persona swap ──
  const buildPersonalisedSystem = (scen, prof) => {
    if(!prof?.focus) return scen.system;
    const b = prof.billings || "";
    const level = (b.includes("500") || b.includes("1m") || b.includes("1M")) ? "senior"
      : (b.includes("250") || b.includes("300") || b.includes("400")) ? "mid-level" : "junior";
    const difficulty = DIFFICULTY_MODIFIERS[level] || DIFFICULTY_MODIFIERS.junior;

    const overlay = SECTOR_PERSONA_OVERLAYS[prof.focus] || SECTOR_PERSONA_OVERLAYS["Generic"] || null;
    const variant = PERSONA_VARIANTS[prof.seedVariant ?? 0] || PERSONA_VARIANTS[0];

    // Pick sector persona by seedVariant index (gives each user a consistent but unique person)
    const sectorPersona = overlay?.personas?.[variant.companyIdx % (overlay.personas?.length || 1)];
    const sectorRole    = overlay?.roles?.[0];

    const sectorOverride = (overlay && sectorPersona && sectorRole) ? `

═══════════════════════════════════════════════════
SECTOR OVERRIDE — IMPORTANT: fully adopt this persona
═══════════════════════════════════════════════════
The recruiter placing you works in: ${prof.focus}
You must present yourself as a candidate from the ${overlay.world}.

YOUR IDENTITY FOR THIS ROLEPLAY:
- Name: ${sectorPersona.name}
- Current role: ${sectorPersona.title} at ${sectorPersona.company} (${sectorPersona.tenure})
- Your hidden hook (what makes you moveable): ${sectorPersona.hook}

THE OPPORTUNITY BEING DISCUSSED:
- Role: ${sectorRole.role}
- Company: ${sectorRole.company}
- Package: ${sectorRole.package}
- Why relevant: ${sectorRole.sellingPoints.join(", ")}

YOUR INDUSTRY LANGUAGE: Use ${overlay.world} terminology naturally — ${overlay.language}.
YOUR REFLEXIVE OBJECTION when pushed: "${overlay.commonObjection}"

Maintain the same personality traits and call flow from the original scenario above, but express them through this sector identity.` : "";

    return scen.system + sectorOverride + `

PERSONALITY VARIANT FOR THIS SESSION: ${variant.label}
${variant.behaviorNote}

DIFFICULTY CALIBRATION (recruiter is ${level}): ${difficulty}`;
  };

  // ── SEND MESSAGE ──
  const sendMessage = async (text) => {
    if(!text?.trim() || processingRef.current) return;
    processingRef.current = true;
    setLoading(true);
    const userMsg = {role:"user", content:text.trim(), time:ts()};
    const newMsgs = [...msgs, userMsg];
    setMsgs(newMsgs);
    const newT = turns + 1;
    setTurns(newT);
    try {
      const hist = newMsgs.filter(m=>m.role!=="coach").map(m=>({
        role: m.role==="user" ? "user" : "assistant",
        content: m.content
      }));
      // Custom scenarios are pre-tailored — skip sector overlay to avoid conflicting instructions
      const systemPrompt = customScenario ? scenario.system : buildPersonalisedSystem(scenario, profile);
      const resp = await callAPI(hist, systemPrompt, {model:"claude-sonnet-4-6", max_tokens:450, temperature:1});
      // Always strip [Coach:...] from AI response — all feedback goes to post-call debrief only
      const clean = resp.replace(/\[Coach:\s*.+?\]/gs,"").trim();
      const withAI = [...newMsgs, {role:"ai", content:clean, time:ts()}];
      setMsgs(withAI);

      const done = newT>=8 || ["goodbye","speak soon","take care","good luck","all the best"].some(w=>clean.toLowerCase().includes(w));

      setAvatarState("thinking");
      setTimeout(()=>{
        speak(clean, ()=>{
          processingRef.current = false;
          setLoading(false);
          if(done){
            setCallEnded(true);
            setAvatarState("idle");
            const fullTx = withAI.filter(m=>m.role!=="coach")
              .map(m=>`${m.role==="user"?"Recruiter":cand.name}: ${m.content}`).join("\n");
            setTimeout(async()=>{ await scoreCall(fullTx, scenario, profile, setResult, setPhase); }, 800);
          } else {
            setAvatarState("idle");
          }
        });
      }, 400);
    } catch(e){
      const msg = e?.message || "";
      const display = msg.includes("timed out") ? "Request timed out — please try again."
        : msg.includes("overloaded") || msg.includes("529") ? "API busy — wait a moment and try again."
        : "Connection issue — please try again.";
      setMsgs(prev=>[...prev,{role:"ai", content:display, time:""}]);
      console.error("[sendMessage]", e);
      processingRef.current = false;
      setLoading(false);
      setAvatarState("idle");
    }
  };

  // ── AVATAR ──
  const CandidateAvatar = ({state, cand, size=200}) => {
    const isS = state==="speaking";
    const isL = state==="listening";
    const isT = state==="thinking";
    const ringColor = isS?"#4ADE80":isL?"#60A5FA":isT?"#F59E0B":"rgba(255,255,255,0.2)";
    return(
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
        <div style={{
          width:size,height:size,borderRadius:"50%",
          background:`linear-gradient(145deg, ${cand.col}EE, ${cand.col}88)`,
          border:`3px solid ${ringColor}`,
          boxShadow: isS?`0 0 0 8px rgba(74,222,128,0.15),0 0 0 16px rgba(74,222,128,0.07)`:
                     isL?`0 0 0 8px rgba(96,165,250,0.15),0 0 0 16px rgba(96,165,250,0.07)`:
                     `0 8px 32px rgba(0,0,0,0.2)`,
          display:"flex",alignItems:"center",justifyContent:"center",
          transition:"all 0.3s",position:"relative",overflow:"hidden",
        }}>
          {/* Face */}
          <div style={{
            width:size*0.8,height:size*0.8,borderRadius:"50%",
            background:"linear-gradient(170deg,#f5e0c8 0%,#e8c8a0 100%)",
            display:"flex",alignItems:"center",
            flexDirection:"column",justifyContent:"center",
            position:"relative",
          }}>
            {/* Hair */}
            <div style={{position:"absolute",top:0,left:"8%",right:"8%",height:"40%",
              background:cand.hairColor||"#3D2B1F",borderRadius:"50% 50% 0 0"}}/>
            {/* Eyes */}
            <div style={{display:"flex",gap:size*0.13,marginTop:size*0.1,zIndex:1}}>
              {[0,1].map(i=>(
                <div key={i} style={{
                  width:size*0.085,height:isS?size*0.06:size*0.085,
                  borderRadius:"50%",background:"#2D1810",transition:"height 0.15s",
                  animation:isS?"blink 3s ease infinite":"blink 5s ease infinite",
                }}/>
              ))}
            </div>
            {/* Nose */}
            <div style={{width:size*0.05,height:size*0.05,borderRadius:"50%",
              background:"rgba(0,0,0,0.1)",marginTop:size*0.04,zIndex:1}}/>
            {/* Mouth */}
            <div style={{
              width:isS?size*0.26:size*0.18,
              height:isS?size*0.1:size*0.04,
              borderRadius:isS?"0 0 60px 60px":"4px",
              background:isS?"#C0522A":"#A0724A",
              marginTop:size*0.04,zIndex:1,
              transition:"all 0.2s",overflow:"hidden",
            }}>
              {isS&&<div style={{position:"absolute",inset:"3px 4px 0",background:"#7A1A1A",borderRadius:"0 0 56px 56px"}}/>}
            </div>
            {/* Thinking dots */}
            {isT&&(
              <div style={{position:"absolute",bottom:-28,display:"flex",gap:4}}>
                {[0,1,2].map(i=>(
                  <div key={i} style={{width:7,height:7,borderRadius:"50%",background:"rgba(255,255,255,0.9)",
                    animation:"bounce 1s infinite",animationDelay:`${i*0.2}s`}}/>
                ))}
              </div>
            )}
          </div>
          {/* Speaking wave */}
          {isS&&(
            <div style={{position:"absolute",bottom:8,left:"50%",transform:"translateX(-50%)",
              display:"flex",gap:2,alignItems:"flex-end",height:14}}>
              {[0,1,2,3,4].map(i=>(
                <div key={i} style={{width:3,background:"rgba(255,255,255,0.75)",borderRadius:999,
                  animation:"soundwave 0.5s ease infinite alternate",animationDelay:`${i*0.1}s`,
                  height:`${5+i*2}px`}}/>
              ))}
            </div>
          )}
        </div>
        <div style={{textAlign:"center"}}>
          <div style={{fontWeight:800,color:C.navy,fontSize:14}}>{cand.name}</div>
          <div style={{fontSize:11,color:C.muted}}>{cand.title}</div>
          <div style={{marginTop:5,display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
            <div style={{width:6,height:6,borderRadius:"50%",
              background:isS?"#4ADE80":isL?"#60A5FA":isT?"#F59E0B":"#94A3B8",
              animation:(isS||isL)?"bounce 1.2s infinite":"none"}}/>
            <span style={{fontSize:11,fontWeight:600,
              color:isS?"#166534":isL?"#1E40AF":isT?"#92400E":C.muted}}>
              {isS?"Speaking…":isL?"Listening…":isT?"Thinking…":"On the line"}
            </span>
          </div>
        </div>
      </div>
    );
  };


  /* ────────────────────────────────────────────────────────────
     BRIEF SCREEN
  ──────────────────────────────────────────────────────────── */
  if(phase==="brief") return(
    <Shell page="learning" go={go} userRole="learner">
      <button onClick={onBack} style={{color:C.muted,background:"none",border:"none",cursor:"pointer",fontSize:13,marginBottom:20}}>← Back to Module</button>
      <div style={{maxWidth:680}}>
        {/* Header */}
        <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:16,flexWrap:"wrap"}}>
          <span style={{background:C.lavPale,color:C.purple,borderRadius:999,padding:"4px 14px",fontSize:11,fontWeight:700}}>🎭 Roleplay · {lesson.dur}</span>
          <span style={{
            background: scenario.difficulty==="advanced"?"#DBEAFE": scenario.difficulty==="intermediate"?"#FEF3C7":C.greenBg,
            color: scenario.difficulty==="advanced"?"#1E40AF": scenario.difficulty==="intermediate"?"#92400E":C.green,
            borderRadius:999,padding:"4px 14px",fontSize:11,fontWeight:700,textTransform:"capitalize"
          }}>{scenario.difficulty}</span>
          {brief.briefType==="limited" && (
            <span style={{background:"#FEF3C7",color:"#92400E",borderRadius:999,padding:"4px 14px",fontSize:11,fontWeight:700}}>⚠ Limited Brief</span>
          )}
          <span style={{background:"#F0FDF4",color:C.green,borderRadius:999,padding:"4px 14px",fontSize:11,fontWeight:700}}>🎤 Voice enabled</span>
        </div>
        <h1 style={{fontSize:22,fontWeight:800,color:C.navy,marginBottom:4}}>{lesson.title}</h1>

        {/* Skill focus + objectives */}
        <div style={{background:C.navy,borderRadius:R.md,padding:"16px 20px",marginBottom:14}}>
          <div style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:1.5,marginBottom:6}}>What you're practising</div>
          <div style={{fontWeight:800,color:"#fff",fontSize:16,marginBottom:10}}>{scenario.skillFocus}</div>
          <div style={{display:"flex",flexDirection:"column",gap:5}}>
            {scenario.coachObjectives.map((obj,i)=>(
              <div key={i} style={{display:"flex",gap:8,alignItems:"flex-start"}}>
                <span style={{color:C.lav,flexShrink:0,marginTop:1,fontSize:13}}>→</span>
                <span style={{fontSize:12,color:"rgba(255,255,255,0.8)",lineHeight:1.5}}>{obj}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Assessment criteria — good vs great */}
        {(()=>{
          const critKeys = scenario.activeCriteria || SCENARIO_CRITERIA[scenarioKey] || [];
          const crits = critKeys.map(k=>ALL_CRITERIA[k]).filter(Boolean);
          if(!crits.length) return null;
          return(
            <div style={{background:C.white,borderRadius:R.lg,border:`1px solid ${C.border}`,padding:"16px 20px",marginBottom:18}}>
              <div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1.5,marginBottom:12}}>You'll be assessed on</div>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {crits.map((c,i)=>(
                  <div key={i} style={{display:"grid",gridTemplateColumns:"120px 1fr 1fr",gap:8,alignItems:"start",paddingBottom:i<crits.length-1?10:0,borderBottom:i<crits.length-1?`1px solid ${C.bg}`:"none"}}>
                    <div style={{fontWeight:700,color:C.navy,fontSize:12}}>{c.label}</div>
                    <div>
                      <div style={{fontSize:9,fontWeight:700,color:C.amber,textTransform:"uppercase",letterSpacing:1,marginBottom:2}}>Good</div>
                      <div style={{fontSize:11,color:C.text,lineHeight:1.45}}>{c.good}</div>
                    </div>
                    <div>
                      <div style={{fontSize:9,fontWeight:700,color:C.green,textTransform:"uppercase",letterSpacing:1,marginBottom:2}}>Great</div>
                      <div style={{fontSize:11,color:C.text,lineHeight:1.45}}>{c.great}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {brief.briefType==="limited" && (
          <div style={{background:"#FEF3C7",border:"1px solid #FDE68A",borderRadius:14,padding:"14px 18px",marginBottom:18,display:"flex",gap:12,alignItems:"flex-start"}}>
            <span style={{fontSize:18}}>⚠️</span>
            <div>
              <div style={{fontWeight:700,color:"#92400E",fontSize:13,marginBottom:4}}>Limited Brief Scenario</div>
              <p style={{fontSize:13,color:"#78350F",lineHeight:1.65,margin:0}}>
                You won't have all the details. Acknowledge gaps honestly, ask smart questions to fill them, and never over-promise on details you don't know.
              </p>
            </div>
          </div>
        )}

        {/* Candidate + Brief side by side */}
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:14,marginBottom:18}}>
          {/* Candidate profile */}
          <div style={{background:C.white,borderRadius:5,border:`1px solid ${C.border}`,padding:"16px 18px"}}>
            <div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1.5,marginBottom:12}}>Who you're calling</div>
            <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:12}}>
              <div style={{width:44,height:44,borderRadius:"50%",background:cand.col,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:16}}>{cand.ini}</div>
              <div>
                <div style={{fontWeight:800,color:C.navy,fontSize:14}}>{cand.name}</div>
                <div style={{fontSize:11,color:C.muted,marginTop:2}}>{cand.title}</div>
                <div style={{fontSize:11,color:C.muted}}>{cand.company} · {cand.tenure}</div>
              </div>
            </div>
            <div style={{background:C.bg,borderRadius:5,padding:"10px 12px",marginBottom:8}}>
              <div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>Personality</div>
              <p style={{fontSize:12,color:C.text,lineHeight:1.55,margin:0}}>{cand.personality}</p>
            </div>
            <div style={{background:C.lavPale,borderRadius:5,padding:"10px 12px"}}>
              <div style={{fontSize:10,fontWeight:700,color:C.purple,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>The hook</div>
              <p style={{fontSize:12,color:C.navy,lineHeight:1.55,margin:0}}>{cand.hook}</p>
            </div>
          </div>

          {/* Role brief */}
          <div style={{background:C.white,borderRadius:5,border:`1px solid ${C.border}`,padding:"16px 18px"}}>
            <div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1.5,marginBottom:12}}>The brief</div>
            {[
              {l:"Role",v:brief.role},
              {l:"Company",v:brief.company},
              {l:"Package",v:brief.package},
              brief.location&&{l:"Location",v:brief.location},
              {l:"Why relevant",v:brief.whyRelevant},
            ].filter(Boolean).map((row,i)=>(
              <div key={i} style={{marginBottom:8}}>
                <div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:2}}>{row.l}</div>
                <div style={{fontSize:12,color:C.text,lineHeight:1.45}}>{row.v}</div>
              </div>
            ))}
            {brief.briefType==="limited" && brief.unknowns?.length > 0 && (
              <div style={{background:"#FEF3C7",borderRadius:5,padding:"8px 10px",marginTop:8}}>
                <div style={{fontSize:10,fontWeight:700,color:"#92400E",marginBottom:3}}>You don't know</div>
                {brief.unknowns.map((u,i)=><div key={i} style={{fontSize:11,color:"#78350F"}}>• {u}</div>)}
              </div>
            )}
          </div>
        </div>

        {/* Voice setup note */}
        <div style={{background:"#F0FDF4",borderRadius:5,border:"1px solid #BBF7D0",padding:"12px 16px",marginBottom:20,display:"flex",gap:10,alignItems:"center"}}>
          <span style={{fontSize:20}}>🎤</span>
          <div>
            <div style={{fontWeight:700,color:C.green,fontSize:13,marginBottom:2}}>Voice-first roleplay</div>
            <div style={{fontSize:12,color:"#14532D",lineHeight:1.5}}>Hold the mic button and speak your response. The candidate will respond with voice. You'll see a live transcript as you talk. Switch to text if preferred.</div>
          </div>
        </div>

        <button onClick={startCall}
          style={{background:C.purple,color:"#fff",border:"none",borderRadius:999,padding:"14px 32px",fontWeight:800,fontSize:15,cursor:"pointer",width:"100%",letterSpacing:0.3}}>
          📞 Start Call
        </button>
      </div>
    </Shell>
  );

  /* ────────────────────────────────────────────────────────────
     CALL SCREEN — Two-column: brief left, phone call right
  ──────────────────────────────────────────────────────────── */
  if(phase==="call") return(
    <Shell page="learning" go={go} userRole="learner">
      <style>{`
        @keyframes soundwave { from{transform:scaleY(0.3)} to{transform:scaleY(1)} }
        @keyframes blink { 0%,92%,100%{transform:scaleY(1)} 96%{transform:scaleY(0.08)} }
        @keyframes pulse-ring { 0%{transform:scale(1);opacity:0.6} 100%{transform:scale(1.6);opacity:0} }
        @keyframes mic-active { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.5)} 50%{box-shadow:0 0 0 14px rgba(239,68,68,0)} }
      `}</style>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"300px 1fr",minHeight:"calc(100vh - 60px)",fontFamily:"'Inter',sans-serif"}}>

        {/* ── LEFT PANEL: Brief + Objectives ── */}
        <div style={{background:C.white,borderRight:isMobile?"none":`1px solid ${C.border}`,borderBottom:isMobile?`1px solid ${C.border}`:"none",padding:isMobile?"8px 16px":"24px 20px",overflowY:"auto",display:"flex",flexDirection:"column",gap:isMobile?0:16}}>
          {isMobile&&(
            <button onClick={()=>setShowBrief(v=>!v)} style={{background:"none",border:"none",padding:"6px 0",cursor:"pointer",display:"flex",alignItems:"center",gap:6,fontSize:13,fontWeight:700,color:C.navy,textAlign:"left"}}>
              <span>{showBrief?"▲":"▼"}</span>{showBrief?`Hide brief — ${cand?.name}`:`Show brief — ${cand?.name}`}
            </button>
          )}
          <div style={{display:isMobile&&!showBrief?"none":"flex",flexDirection:"column",gap:16,paddingTop:isMobile?8:0}}>

          {/* Candidate */}
          <div>
            <div style={{fontSize:9,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1.5,marginBottom:10}}>Who you're calling</div>
            <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:10}}>
              <div style={{width:40,height:40,borderRadius:"50%",background:cand.col,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:14,flexShrink:0}}>{cand.ini}</div>
              <div>
                <div style={{fontWeight:800,color:C.navy,fontSize:14}}>{cand.name}</div>
                <div style={{fontSize:11,color:C.muted,lineHeight:1.4}}>{cand.title}</div>
                <div style={{fontSize:11,color:C.muted}}>{cand.company}</div>
              </div>
            </div>
            <div style={{background:"#FFF7ED",borderRadius:5,padding:"8px 12px",border:"1px solid #FED7AA"}}>
              <div style={{fontSize:9,fontWeight:700,color:"#C2410C",textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>The hook</div>
              <p style={{fontSize:11,color:"#7C2D12",lineHeight:1.55,margin:0}}>{cand.hook}</p>
            </div>
          </div>

          <div style={{borderTop:`1px solid ${C.border}`}}/>

          {/* Role brief */}
          <div>
            <div style={{fontSize:9,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1.5,marginBottom:10}}>The brief</div>
            {[
              {l:"Role",      v:brief.role},
              {l:"Company",   v:brief.company},
              {l:"Package",   v:brief.package},
              brief.location && {l:"Location", v:brief.location},
              {l:"Why relevant", v:brief.whyRelevant},
            ].filter(Boolean).map((row,i)=>(
              <div key={i} style={{marginBottom:8}}>
                <div style={{fontSize:9,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:2}}>{row.l}</div>
                <div style={{fontSize:12,color:C.text,lineHeight:1.5}}>{row.v}</div>
              </div>
            ))}
            {brief.briefType==="limited" && brief.unknowns?.length>0 && (
              <div style={{background:"#FEF3C7",borderRadius:5,padding:"8px 10px",marginTop:4,border:"1px solid #FDE68A"}}>
                <div style={{fontSize:9,fontWeight:700,color:"#92400E",marginBottom:3}}>You don't know</div>
                {brief.unknowns.map((u,i)=><div key={i} style={{fontSize:11,color:"#78350F",lineHeight:1.4}}>• {u}</div>)}
              </div>
            )}
          </div>

          <div style={{borderTop:`1px solid ${C.border}`}}/>

          {/* Objectives */}
          <div>
            <div style={{fontSize:9,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1.5,marginBottom:10}}>What you're practising</div>
            <div style={{background:C.navy,borderRadius:5,padding:"10px 14px",marginBottom:8}}>
              <div style={{fontSize:11,fontWeight:800,color:C.lav,marginBottom:6}}>{scenario.skillFocus}</div>
              {scenario.coachObjectives.map((obj,i)=>(
                <div key={i} style={{display:"flex",gap:6,alignItems:"flex-start",marginBottom:4}}>
                  <span style={{color:C.lav,flexShrink:0,fontSize:11,marginTop:1}}>→</span>
                  <span style={{fontSize:11,color:"rgba(255,255,255,0.8)",lineHeight:1.5}}>{obj}</span>
                </div>
              ))}
            </div>
            {scenario.difficulty!=="beginner"&&(
              <div style={{background:scenario.difficulty==="advanced"?"#DBEAFE":"#FEF3C7",borderRadius:5,padding:"6px 10px",border:`1px solid ${scenario.difficulty==="advanced"?"#BFDBFE":"#FDE68A"}`,fontSize:10,fontWeight:700,color:scenario.difficulty==="advanced"?"#1E40AF":"#92400E",textAlign:"center"}}>
                {scenario.difficulty==="advanced"?"🎯 Advanced — no in-call coaching":"⚡ Intermediate — work it out"}
              </div>
            )}
          </div>
          </div>{/* end collapsible content wrapper */}
        </div>

        {/* ── RIGHT PANEL: Phone call ── */}
        <div style={{
          background:`linear-gradient(160deg,#0F0A1E 0%,#1A1040 50%,#0D1635 100%)`,
          display:"flex",flexDirection:"column",alignItems:"center",
          padding:"20px 16px",overflowY:"auto",
        }}>

          {/* Status bar */}
          <div style={{width:"100%",maxWidth:420,display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
            <div style={{display:"flex",gap:6,alignItems:"center"}}>
              <div style={{display:"flex",alignItems:"center",gap:5,background:"rgba(74,222,128,0.15)",borderRadius:999,padding:"4px 12px",border:"1px solid rgba(74,222,128,0.3)"}}>
                <div style={{width:6,height:6,borderRadius:"50%",background:"#4ADE80",animation:"bounce 2s infinite"}}/>
                <span style={{fontSize:11,fontWeight:600,color:"#4ADE80"}}>Live · Turn {turns}/8</span>
              </div>
              {/* Mute toggle */}
              <button onClick={toggleMute}
                style={{background:isMuted?"rgba(239,68,68,0.2)":"rgba(255,255,255,0.07)",border:`1px solid ${isMuted?"rgba(239,68,68,0.4)":"rgba(255,255,255,0.12)"}`,borderRadius:999,padding:"4px 12px",fontSize:11,fontWeight:600,color:isMuted?"#FCA5A5":"rgba(255,255,255,0.5)",cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
                {isMuted ? "🔇 Unmute" : "🔊 Mute"}
              </button>
            </div>
            <button onClick={()=>{synthRef.current?.cancel();_stopRec();onBack();}}
              style={{background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:999,padding:"5px 14px",fontSize:11,color:"rgba(255,255,255,0.45)",cursor:"pointer"}}>
              ← Back
            </button>
          </div>

          {/* Avatar */}
          <div style={{marginBottom:16}}>
            <CandidateAvatar state={avatarState} cand={cand} size={150}/>
          </div>

          {/* Mic error */}
          {micError&&(
            <div style={{background:"rgba(239,68,68,0.15)",borderRadius:5,padding:"8px 14px",border:"1px solid rgba(239,68,68,0.3)",fontSize:11,color:"#FCA5A5",marginBottom:10,maxWidth:380,textAlign:"center"}}>
              {micError}
            </div>
          )}

          {/* Live transcript */}
          <div style={{width:"100%",maxWidth:420,minHeight:40,background:"rgba(255,255,255,0.06)",borderRadius:5,border:`1px solid ${isRecording?"rgba(96,165,250,0.5)":"rgba(255,255,255,0.08)"}`,padding:"8px 14px",marginBottom:12,transition:"border-color 0.3s"}}>
            {isRecording?(
              <>
                <div style={{fontSize:9,fontWeight:700,color:"#60A5FA",textTransform:"uppercase",letterSpacing:1.5,marginBottom:2}}>You're saying…</div>
                <div style={{fontSize:12,color:"rgba(255,255,255,0.9)",lineHeight:1.5,minHeight:16}}>{transcript||"Listening…"}</div>
              </>
            ):(
              <div style={{fontSize:11,color:"rgba(255,255,255,0.3)",textAlign:"center",paddingTop:1}}>
                {callEnded?"Call ended — generating debrief…":avatarState==="speaking"?`${cand.name} is speaking…`:avatarState==="thinking"?"Thinking…":"Tap the mic to speak"}
              </div>
            )}
          </div>

          {/* Conversation */}
          <div ref={messagesRef} style={{width:"100%",maxWidth:420,flex:"0 1 220px",overflowY:"auto",display:"flex",flexDirection:"column",gap:6,marginBottom:16}}>
            {msgs.map((m,i)=>(
              <div key={i}>
                {m.role==="coach"?(
                  <div style={{background:"rgba(196,188,238,0.12)",borderRadius:5,padding:"5px 10px",fontSize:10,color:C.lav,textAlign:"center"}}>💬 {m.content}</div>
                ):(
                  <div style={{display:"flex",gap:5,justifyContent:m.role==="user"?"flex-end":"flex-start",alignItems:"flex-end"}}>
                    {m.role==="ai"&&<div style={{width:20,height:20,borderRadius:"50%",background:cand.col,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:8,fontWeight:800,flexShrink:0}}>{cand.ini}</div>}
                    <div style={{background:m.role==="user"?"rgba(99,91,210,0.85)":"rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.92)",borderRadius:m.role==="user"?"12px 12px 3px 12px":"12px 12px 12px 3px",padding:"7px 11px",fontSize:12,lineHeight:1.5,maxWidth:"82%"}}>{m.content}</div>
                    {m.role==="user"&&<div style={{width:20,height:20,borderRadius:"50%",background:"rgba(99,91,210,0.5)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:8,fontWeight:800,flexShrink:0}}>ME</div>}
                  </div>
                )}
              </div>
            ))}
            {loading&&avatarState==="thinking"&&(
              <div style={{display:"flex",gap:5,alignItems:"flex-end"}}>
                <div style={{width:20,height:20,borderRadius:"50%",background:cand.col,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:8,fontWeight:800,flexShrink:0}}>{cand.ini}</div>
                <div style={{background:"rgba(255,255,255,0.1)",borderRadius:"12px 12px 12px 3px",padding:"8px 12px"}}>
                  <div style={{display:"flex",gap:3}}>{[0,1,2].map(i=><div key={i} style={{width:5,height:5,borderRadius:"50%",background:"rgba(255,255,255,0.45)",animation:"bounce 1s infinite",animationDelay:`${i*0.2}s`}}/>)}</div>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:10,width:"100%",maxWidth:420}}>

            {/* Mic button */}
            {!callEnded&&(
              <div style={{position:"relative",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:4}}>
                {isRecording&&[1,2].map(i=>(
                  <div key={i} style={{position:"absolute",width:76+i*18,height:76+i*18,borderRadius:"50%",background:"rgba(239,68,68,0.12)",animation:`pulse-ring ${0.8+i*0.4}s ease-out infinite`,animationDelay:`${i*0.3}s`}}/>
                ))}
                <button onClick={toggleMic} disabled={callEnded||avatarState==="speaking"}
                  style={{
                    width:76,height:76,borderRadius:"50%",
                    background:isRecording?"#EF4444":avatarState==="speaking"?"rgba(255,255,255,0.08)":"rgba(99,91,210,0.9)",
                    border:`2px solid ${isRecording?"rgba(239,68,68,0.5)":avatarState==="speaking"?"rgba(255,255,255,0.08)":"rgba(196,188,238,0.3)"}`,
                    cursor:avatarState==="speaking"||callEnded?"not-allowed":"pointer",
                    display:"flex",alignItems:"center",justifyContent:"center",fontSize:30,
                    animation:isRecording?"mic-active 1.5s infinite":"none",
                    transition:"all 0.2s",
                    boxShadow:isRecording?"0 0 20px rgba(239,68,68,0.4)":"0 6px 20px rgba(0,0,0,0.4)",
                    opacity:avatarState==="speaking"?0.35:1,
                  }}>
                  {isRecording?"⏹":"🎤"}
                </button>
              </div>
            )}

            <div style={{fontSize:10,color:"rgba(255,255,255,0.3)",textAlign:"center",marginBottom:4}}>
              {isRecording?"Tap ⏹ to stop & send":avatarState==="speaking"?"Wait for them to finish…":"Tap 🎤 to speak"}
            </div>

            {/* Text row */}
            <div style={{display:"flex",gap:7,width:"100%"}}>
              <input value={textInput} onChange={e=>setTextInput(e.target.value)}
                placeholder={callEnded?"Call ended…":"Or type your response…"}
                disabled={loading||callEnded||isRecording}
                onKeyDown={e=>{ if(e.key==="Enter"&&textInput.trim()&&!loading){ sendMessage(textInput);setTextInput(""); }}}
                style={{flex:1,background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:999,padding:"9px 14px",fontSize:12,color:"rgba(255,255,255,0.9)",outline:"none",fontFamily:"'Inter',sans-serif",opacity:callEnded||isRecording?0.3:1}}
              />
              <button onClick={()=>{ if(textInput.trim()&&!loading){ sendMessage(textInput);setTextInput(""); }}}
                disabled={!textInput.trim()||loading||callEnded||isRecording}
                style={{background:"rgba(99,91,210,0.8)",color:"#fff",border:"none",borderRadius:999,padding:"9px 16px",fontSize:12,fontWeight:700,cursor:textInput.trim()&&!loading&&!callEnded&&!isRecording?"pointer":"not-allowed",opacity:textInput.trim()&&!loading&&!callEnded&&!isRecording?1:0.3}}>
                Send
              </button>
            </div>

            {/* End call */}
            {!callEnded&&(
              <button onClick={()=>{
                synthRef.current?.cancel(); _stopRec();
                if(msgs.length>1){
                  const tx=msgs.filter(m=>m.role!=="coach").map(m=>`${m.role==="user"?"Recruiter":cand.name}: ${m.content}`).join("\n");
                  setCallEnded(true);
                  scoreCall(tx,scenario,profile,setResult,setPhase);
                } else onBack();
              }}
                style={{background:"rgba(239,68,68,0.12)",color:"#FCA5A5",border:"1px solid rgba(239,68,68,0.25)",borderRadius:999,padding:"7px 22px",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                📵 End call
              </button>
            )}
          </div>
        </div>
      </div>
    </Shell>
  );

  /* ────────────────────────────────────────────────────────────
     DEBRIEF SCREEN
  ──────────────────────────────────────────────────────────── */
  if(phase==="debrief" && result){
    const pass = result.score >= 65;
    const verdictStyle =
      result.verdict==="Strong Performance" ? {bg:C.greenBg, c:C.green, border:"#BBF7D0"} :
      result.verdict==="On Track"           ? {bg:C.lavPale, c:C.purple, border:C.lavSoft} :
                                              {bg:"#FEE2E2", c:"#991B1B", border:"#FECACA"};

    const tabs = [
      {id:"overview",      label:"Overview"},
      {id:"methodologies", label:"Methodology Scores"},
      {id:"frameworks",    label:"Framework Scores"},
      {id:"transcript",    label:"Transcript"},
    ];

    // Framework score colours
    const fScore = (n) =>
      n >= 80 ? {c:C.green,  bg:C.greenBg,  border:"#BBF7D0"} :
      n >= 65 ? {c:C.purple, bg:C.lavPale,  border:C.lavSoft}  :
      n >= 45 ? {c:C.amber,  bg:C.amberBg,  border:"#FDE68A"}  :
               {c:"#991B1B", bg:"#FEE2E2",  border:"#FECACA"};

    const frameworks = result.frameworks || [];
    const transcript = msgs.filter(m=>m.role!=="coach")
      .map(m=>`${m.role==="user"?"You":cand.name}: ${m.content}`)
      .join("\n");

    return(
      <Shell page="learning" go={go} userRole="learner">
        <button onClick={onBack} style={{color:C.muted,background:"none",border:"none",cursor:"pointer",fontSize:13,marginBottom:20}}>← Back to Module</button>

        {showPostCheck && (
          <ConfidenceCheck
            type="post"
            lessonTitle={lesson.title}
            aiScore={result?.score}
            onComplete={()=>{ setShowPostCheck(false); onBack(); }}
            onJournal={()=>{ setShowPostCheck(false); if(onJournal) onJournal(); else onBack(); }}
          />
        )}
        {!showPostCheck && (
          <div style={{maxWidth:800}}>
          {/* ── HERO BAR ── */}
          <div style={{background:C.navy,borderRadius:20,padding:"24px 28px",marginBottom:20,display:"flex",alignItems:"center",gap:24,flexWrap:"wrap"}}>
            <Ring score={result.score} sz={100}/>
            <div style={{flex:1,minWidth:200}}>
              <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:8,flexWrap:"wrap"}}>
                <span style={{background:verdictStyle.bg,color:verdictStyle.c,border:`1px solid ${verdictStyle.border}`,borderRadius:999,padding:"4px 16px",fontSize:12,fontWeight:800}}>
                  {result.verdict}
                </span>
                <span style={{fontSize:12,color:"rgba(255,255,255,0.4)"}}>
                  {scenario.skillFocus} · {scenario.difficulty}
                </span>
              </div>
              <p style={{fontSize:14,color:"rgba(255,255,255,0.85)",lineHeight:1.8,margin:0}}>{result.coachSummary}</p>
            </div>
            <div style={{display:"flex",gap:10,alignItems:"center",flexShrink:0}}>
              <Av ini="SC" col={C.lavSoft} sz={38}/>
              <div>
                <div style={{fontWeight:700,color:"#fff",fontSize:13}}>Scott</div>
                <div style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>Your coach</div>
              </div>
            </div>
          </div>

          {/* ── TABS ── */}
          <div style={{display:"flex",gap:4,marginBottom:20,background:C.white,borderRadius:5,padding:4,border:`1px solid ${C.border}`,width:"fit-content"}}>
            {tabs.map(t=>(
              <button key={t.id} onClick={()=>setActiveDebriefTab(t.id)}
                style={{
                  padding:"7px 18px",borderRadius:9,border:"none",cursor:"pointer",fontSize:13,fontWeight:600,
                  background:activeDebriefTab===t.id?C.navy:"none",
                  color:activeDebriefTab===t.id?"#fff":C.muted,
                  transition:"all 0.15s"
                }}>{t.label}
              </button>
            ))}
          </div>

          {/* ── TAB: OVERVIEW ── */}
          {activeDebriefTab==="overview" && (
            <div style={{animation:"fadeUp 0.3s ease both"}}>

              {/* ── CRITERION SCORECARD — good to great ── */}
              {result.criterionScores?.length > 0 && (
                <div style={{background:C.white,borderRadius:5,border:`1px solid ${C.border}`,padding:"18px 22px",marginBottom:16}}>
                  <div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1.5,marginBottom:16}}>Your scorecard — this session</div>
                  <div style={{display:"flex",flexDirection:"column",gap:14}}>
                    {result.criterionScores.map((c,i)=>{
                      const s = c.score || 0;
                      const col = s>=80?C.green:s>=65?C.purple:s>=50?C.amber:"#991B1B";
                      const bg  = s>=80?C.greenBg:s>=65?C.lavPale:s>=50?C.amberBg:"#FEE2E2";
                      const border = s>=80?"#BBF7D0":s>=65?C.lavSoft:s>=50?"#FDE68A":"#FECACA";
                      return(
                        <div key={i} style={{paddingBottom:i<result.criterionScores.length-1?14:0,borderBottom:i<result.criterionScores.length-1?`1px solid ${C.bg}`:"none"}}>
                          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:6}}>
                            <div style={{flex:1}}>
                              <div style={{fontWeight:700,color:C.navy,fontSize:13}}>{c.label}</div>
                            </div>
                            <div style={{background:bg,border:`1px solid ${border}`,borderRadius:999,padding:"3px 14px",flexShrink:0}}>
                              <span style={{fontSize:14,fontWeight:900,color:col}}>{s}</span>
                              <span style={{fontSize:10,color:col,fontWeight:600}}>/100</span>
                            </div>
                          </div>
                          <div style={{height:5,background:C.bg,borderRadius:999,overflow:"hidden",marginBottom:8}}>
                            <div style={{height:"100%",width:`${s}%`,background:col,borderRadius:999,transition:"width 0.7s ease"}}/>
                          </div>
                          {c.what_you_did_well && (
                            <div style={{display:"flex",gap:8,marginBottom:4}}>
                              <span style={{color:C.green,fontSize:13,flexShrink:0}}>✓</span>
                              <p style={{fontSize:12,color:C.text,lineHeight:1.55,margin:0}}>{c.what_you_did_well}</p>
                            </div>
                          )}
                          {c.path_to_great && (
                            <div style={{display:"flex",gap:8,background:C.lavPale,borderRadius:5,padding:"8px 10px",marginTop:4}}>
                              <span style={{color:C.purple,fontSize:13,flexShrink:0}}>→</span>
                              <div>
                                <div style={{fontSize:9,fontWeight:700,color:C.purple,textTransform:"uppercase",letterSpacing:1,marginBottom:2}}>Path to great</div>
                                <p style={{fontSize:12,color:C.navy,lineHeight:1.55,margin:0}}>{c.path_to_great}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── CALL ANALYTICS STRIP ── */}
              {(() => {
                const ca = result.callAnalytics;
                const tr = ca?.talkRatio || result.talkRatio;
                const tone = ca?.toneProgression || result.toneAnalysis;
                const cs = ca?.callStructureScores || result.callStructure;
                const pause = ca?.pauseUsage;
                const qdepth = ca?.questioningDepth;
                return (
                  <div style={{marginBottom:14}}>
                    {/* Row 1: Talk ratio + Tone + Pause */}
                    <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr 1fr",gap:10,marginBottom:10}}>
                      {tr && (
                        <div style={{background:C.white,borderRadius:14,padding:"14px 16px",border:`1px solid ${C.border}`}}>
                          <div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>🗣 Talk ratio</div>
                          <div style={{display:"flex",height:8,borderRadius:999,overflow:"hidden",marginBottom:6}}>
                            <div style={{width:`${tr.recruiter||50}%`,background:C.purple,transition:"width 0.5s"}}/>
                            <div style={{width:`${tr.candidate||50}%`,background:"#E2DEFF"}}/>
                          </div>
                          <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:6}}>
                            <span style={{color:C.purple,fontWeight:700}}>You {tr.recruiter||"?"}%</span>
                            <span style={{color:C.muted}}>Them {tr.candidate||"?"}%</span>
                          </div>
                          <div style={{fontSize:11,color:C.muted,lineHeight:1.4}}>{tr.note}</div>
                        </div>
                      )}
                      {tone && (
                        <div style={{background:C.white,borderRadius:14,padding:"14px 16px",border:`1px solid ${C.border}`}}>
                          <div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>🎯 Tone</div>
                          <div style={{fontWeight:800,color:C.navy,fontSize:13,marginBottom:4}}>{tone.verdict||tone.overall}</div>
                          {(tone.opening||tone.middle) && <div style={{fontSize:10,color:C.muted,marginBottom:4}}>{[tone.opening,tone.middle,tone.closing].filter(Boolean).join(" → ")}</div>}
                          <div style={{fontSize:11,color:C.muted,lineHeight:1.4}}>{tone.pattern}</div>
                        </div>
                      )}
                      {pause && (
                        <div style={{background:C.white,borderRadius:14,padding:"14px 16px",border:`1px solid ${C.border}`}}>
                          <div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>⏸ Silence use</div>
                          <div style={{fontWeight:800,color:C.navy,fontSize:13,marginBottom:4}}>{pause.verdict}</div>
                          <div style={{fontSize:11,color:C.muted,lineHeight:1.4}}>{pause.note}</div>
                        </div>
                      )}
                    </div>
                    {/* Row 2: Call structure + Questioning depth */}
                    <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:10}}>
                      {cs && (
                        <div style={{background:C.white,borderRadius:14,padding:"14px 16px",border:`1px solid ${C.border}`}}>
                          <div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>📋 Call structure</div>
                          {Object.entries(cs).map(([k,v])=>{
                            const val = typeof v === "object" ? v : {hit:v,score:null,note:null};
                            const hit = val.hit?.startsWith("Hit") || (typeof v === "string" && v.startsWith("Hit"));
                            const partial = val.hit?.startsWith("Partial") || (typeof v === "string" && v.startsWith("Partial"));
                            const na = val.hit?.startsWith("N/A") || (typeof v === "string" && v.startsWith("N/A"));
                            const col = na?"#CBD5E1":hit?"#22C55E":partial?"#F59E0B":"#EF4444";
                            return(
                              <div key={k} style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
                                <div style={{width:7,height:7,borderRadius:"50%",background:col,flexShrink:0}}/>
                                <div style={{flex:1}}>
                                  <span style={{fontSize:11,color:C.text,textTransform:"capitalize",fontWeight:600}}>{k.replace(/([A-Z])/g," $1").trim()}</span>
                                  {val.score!=null && <span style={{marginLeft:6,fontSize:10,color:col,fontWeight:700}}>{val.score}</span>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {qdepth && (
                        <div style={{background:C.white,borderRadius:14,padding:"14px 16px",border:`1px solid ${C.border}`}}>
                          <div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>❓ Questioning depth</div>
                          <div style={{fontWeight:800,color:C.navy,fontSize:13,marginBottom:6}}>{qdepth.verdict}</div>
                          <div style={{display:"flex",gap:10,marginBottom:6}}>
                            <div style={{background:"#FEE2E2",borderRadius:5,padding:"4px 10px",fontSize:11,fontWeight:700,color:C.red}}>Surface: {qdepth.surfaceCount}</div>
                            <div style={{background:C.greenBg,borderRadius:5,padding:"4px 10px",fontSize:11,fontWeight:700,color:C.green}}>Deep: {qdepth.deepCount}</div>
                          </div>
                          <div style={{fontSize:11,color:C.muted,lineHeight:1.4}}>{qdepth.note}</div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* ── STRONGEST MOMENT ── */}
              {result.strongMoment && (
                <div style={{background:"#F0FDF4",borderRadius:5,padding:"18px 22px",border:"1px solid #BBF7D0",marginBottom:12}}>
                  <div style={{fontSize:10,fontWeight:800,color:C.green,textTransform:"uppercase",letterSpacing:1.5,marginBottom:12}}>✓ Strongest moment on this call</div>
                  <div style={{background:"rgba(255,255,255,0.7)",borderRadius:5,padding:"10px 16px",border:"1px solid #BBF7D0",marginBottom:12}}>
                    <div style={{fontSize:10,fontWeight:700,color:C.green,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>You said</div>
                    <p style={{fontSize:14,color:"#14532D",lineHeight:1.6,margin:0,fontStyle:"italic",fontWeight:600}}>"{result.strongMoment.quote || result.strongMoment}"</p>
                  </div>
                  {result.strongMoment.why && (
                    <div style={{marginBottom:10}}>
                      <div style={{fontSize:10,fontWeight:700,color:C.green,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>Why it worked</div>
                      <p style={{fontSize:13,color:"#14532D",lineHeight:1.65,margin:0}}>{result.strongMoment.why}</p>
                    </div>
                  )}
                  {result.strongMoment.howToRepeat && (
                    <div style={{background:"rgba(255,255,255,0.6)",borderRadius:5,padding:"8px 12px",border:"1px solid #BBF7D0"}}>
                      <div style={{fontSize:10,fontWeight:700,color:C.green,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>How to do this deliberately every time</div>
                      <p style={{fontSize:12,color:"#14532D",lineHeight:1.6,margin:0}}>{result.strongMoment.howToRepeat}</p>
                    </div>
                  )}
                </div>
              )}

              {/* ── BIGGEST MISSED OPPORTUNITY ── */}
              {result.missedMoment && (
                <div style={{background:"#FFF7ED",borderRadius:5,padding:"18px 22px",border:"1px solid #FED7AA",marginBottom:12}}>
                  <div style={{fontSize:10,fontWeight:800,color:"#C2410C",textTransform:"uppercase",letterSpacing:1.5,marginBottom:12}}>⚡ Biggest missed opportunity</div>
                  {/* The actual lines */}
                  <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:10,marginBottom:12}}>
                    {(result.missedMoment.recruiterLine||result.missedMoment.candidateLine) ? (
                      <>
                        {result.missedMoment.candidateLine && (
                          <div style={{background:"rgba(255,255,255,0.7)",borderRadius:5,padding:"10px 14px",border:"1px solid #FED7AA"}}>
                            <div style={{fontSize:10,fontWeight:700,color:"#C2410C",textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>They said — the opening</div>
                            <p style={{fontSize:13,color:"#7C2D12",lineHeight:1.6,margin:0,fontStyle:"italic"}}>"{result.missedMoment.candidateLine}"</p>
                          </div>
                        )}
                        {result.missedMoment.recruiterLine && (
                          <div style={{background:"rgba(255,255,255,0.7)",borderRadius:5,padding:"10px 14px",border:"1px solid #FED7AA"}}>
                            <div style={{fontSize:10,fontWeight:700,color:"#C2410C",textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>You said — the miss</div>
                            <p style={{fontSize:13,color:"#7C2D12",lineHeight:1.6,margin:0,fontStyle:"italic"}}>"{result.missedMoment.recruiterLine}"</p>
                          </div>
                        )}
                      </>
                    ) : (
                      <div style={{gridColumn:"1/-1",background:"rgba(255,255,255,0.7)",borderRadius:5,padding:"10px 14px",border:"1px solid #FED7AA"}}>
                        <p style={{fontSize:13,color:"#7C2D12",lineHeight:1.6,margin:0,fontStyle:"italic"}}>{typeof result.missedMoment === "string" ? result.missedMoment : ""}</p>
                      </div>
                    )}
                  </div>
                  {result.missedMoment.whatWasLost && (
                    <div style={{marginBottom:10}}>
                      <div style={{fontSize:10,fontWeight:700,color:"#C2410C",textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>What was lost</div>
                      <p style={{fontSize:13,color:"#7C2D12",lineHeight:1.65,margin:0}}>{result.missedMoment.whatWasLost}</p>
                    </div>
                  )}
                  {result.missedMoment.betterResponse && (
                    <div style={{background:"#F0FDF4",borderRadius:5,padding:"10px 14px",border:"1px solid #BBF7D0"}}>
                      <div style={{fontSize:10,fontWeight:700,color:C.green,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>What to say instead — exact words</div>
                      <p style={{fontSize:13,color:"#14532D",lineHeight:1.6,margin:0,fontStyle:"italic",fontWeight:600}}>"{result.missedMoment.betterResponse}"</p>
                    </div>
                  )}
                </div>
              )}

              {/* Brief alignment note */}
              {result.briefAlignment && (
                <div style={{background:C.lavPale,borderRadius:14,border:`1px solid ${C.lavSoft}`,padding:18,marginBottom:12}}>
                  <div style={{fontSize:10,fontWeight:800,color:C.purple,textTransform:"uppercase",letterSpacing:1.5,marginBottom:8}}>📋 Brief alignment</div>
                  <p style={{fontSize:13,color:C.navy,lineHeight:1.65,margin:0}}>{result.briefAlignment}</p>
                </div>
              )}

              {/* ── QUESTIONING COACH ── */}
              {result.questioningCoach && (
                <div style={{background:C.white,borderRadius:5,border:`1px solid ${C.border}`,padding:"18px 22px",marginBottom:12}}>
                  <div style={{fontSize:10,fontWeight:800,color:C.navy,textTransform:"uppercase",letterSpacing:1.5,marginBottom:4}}>🎯 Questioning coach</div>
                  <p style={{fontSize:13,color:C.muted,lineHeight:1.6,marginBottom:16}}>{result.questioningCoach.overallVerdict}</p>

                  {/* Individual questions analysed */}
                  {result.questioningCoach.questions?.length > 0 && (
                    <div style={{marginBottom:16}}>
                      <div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Your questions — analysed</div>
                      {result.questioningCoach.questions.map((q,i)=>{
                        const typeColors = {
                          surface:{bg:"#FEE2E2",c:C.red,label:"Surface"},
                          situational:{bg:"#FEF3C7",c:C.amber,label:"Situational"},
                          exploratory:{bg:"#FFF7ED",c:"#9A3412",label:"Exploratory"},
                          implication:{bg:C.lavPale,c:C.purple,label:"Implication"},
                          aspirational:{bg:C.greenBg,c:C.green,label:"Aspirational"},
                        };
                        const tc = typeColors[q.type] || {bg:C.bg,c:C.muted,label:q.type};
                        return(
                          <div key={i} style={{background:C.bg,borderRadius:5,padding:"14px 16px",marginBottom:8,border:`1px solid ${C.border}`}}>
                            {/* Asked */}
                            <div style={{display:"flex",gap:8,alignItems:"flex-start",marginBottom:8}}>
                              <span style={{background:tc.bg,color:tc.c,borderRadius:999,padding:"2px 10px",fontSize:10,fontWeight:700,flexShrink:0,whiteSpace:"nowrap"}}>{tc.label}</span>
                              <p style={{fontSize:13,color:C.navy,lineHeight:1.5,margin:0,fontStyle:"italic",fontWeight:600}}>"{q.asked}"</p>
                            </div>
                            {/* What it did */}
                            <div style={{fontSize:12,color:C.muted,lineHeight:1.55,marginBottom:10}}>
                              <strong style={{color:C.text}}>Effect:</strong> {q.whatItDid}
                            </div>
                            {/* Better version */}
                            <div style={{background:C.lavPale,borderRadius:5,padding:"10px 14px",border:`1px solid ${C.lavSoft}`}}>
                              <div style={{fontSize:10,fontWeight:700,color:C.purple,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>⚡ Sharper version</div>
                              <p style={{fontSize:12,color:C.navy,lineHeight:1.55,margin:"0 0 6px",fontStyle:"italic",fontWeight:600}}>"{q.betterVersion}"</p>
                              <p style={{fontSize:11,color:C.purple,lineHeight:1.5,margin:0}}>{q.why}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Key pattern */}
                  {result.questioningCoach.keyPattern && (
                    <div style={{background:"#FEF2F2",borderRadius:5,padding:"10px 14px",border:"1px solid #FECACA",marginBottom:14}}>
                      <div style={{fontSize:10,fontWeight:700,color:C.red,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>🔑 Key pattern to fix</div>
                      <p style={{fontSize:12,color:"#7F1D1D",lineHeight:1.6,margin:0}}>{result.questioningCoach.keyPattern}</p>
                    </div>
                  )}

                  {/* Technique deep dive */}
                  {result.questioningCoach.technique && (
                    <div style={{background:C.navy,borderRadius:5,padding:"16px 18px"}}>
                      <div style={{fontSize:10,fontWeight:800,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:1.5,marginBottom:4}}>Skill to develop</div>
                      <div style={{fontWeight:800,color:"#fff",fontSize:15,marginBottom:8}}>{result.questioningCoach.technique.name}</div>
                      <p style={{fontSize:12,color:"rgba(255,255,255,0.75)",lineHeight:1.65,margin:"0 0 12px"}}>{result.questioningCoach.technique.what}</p>
                      <div style={{background:"rgba(255,255,255,0.07)",borderRadius:5,padding:"10px 14px",marginBottom:10}}>
                        <div style={{fontSize:10,fontWeight:700,color:C.lav,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>In this call — exactly</div>
                        <p style={{fontSize:12,color:"rgba(255,255,255,0.85)",lineHeight:1.6,margin:0,fontStyle:"italic"}}>"{result.questioningCoach.technique.example}"</p>
                      </div>
                      <div style={{background:"rgba(196,188,238,0.2)",borderRadius:5,padding:"10px 14px"}}>
                        <div style={{fontSize:10,fontWeight:700,color:C.lav,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>Practice drill</div>
                        <p style={{fontSize:12,color:"rgba(255,255,255,0.75)",lineHeight:1.6,margin:0}}>{result.questioningCoach.technique.drill}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── What worked / To improve ── */}
              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12,marginBottom:14}}>
                <div style={{background:C.white,borderRadius:14,border:`1px solid ${C.border}`,padding:18}}>
                  <div style={{fontSize:11,fontWeight:700,color:C.green,marginBottom:12}}>✓ What worked</div>
                  {result.strengths?.map((s,i)=>(
                    <div key={i} style={{display:"flex",gap:8,marginBottom:8}}>
                      <span style={{color:C.green,flexShrink:0,marginTop:1}}>✓</span>
                      <p style={{fontSize:13,color:C.text,lineHeight:1.55,margin:0}}>{s}</p>
                    </div>
                  ))}
                </div>
                <div style={{background:C.white,borderRadius:14,border:`1px solid ${C.border}`,padding:18}}>
                  <div style={{fontSize:11,fontWeight:700,color:C.amber,marginBottom:12}}>↑ To improve</div>
                  {result.improvements?.map((s,i)=>(
                    <div key={i} style={{display:"flex",gap:8,marginBottom:8}}>
                      <span style={{color:C.amber,flexShrink:0,marginTop:1}}>↑</span>
                      <p style={{fontSize:13,color:C.text,lineHeight:1.55,margin:0}}>{s}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── MISSED OPPORTUNITIES ── */}
              {result.missedOpportunities?.length > 0 && (
                <div style={{background:C.white,borderRadius:14,border:"1px solid #FECACA",padding:18,marginBottom:14}}>
                  <div style={{fontSize:10,fontWeight:800,color:C.red,textTransform:"uppercase",letterSpacing:1.5,marginBottom:14}}>🚪 Missed opportunities — doors that were open</div>
                  {result.missedOpportunities.map((mo,i)=>(
                    <div key={i} style={{marginBottom:i<result.missedOpportunities.length-1?18:0,paddingBottom:i<result.missedOpportunities.length-1?18:0,borderBottom:i<result.missedOpportunities.length-1?`1px solid ${C.bg}`:"none"}}>
                      <div style={{background:"#FEF2F2",borderRadius:5,padding:"10px 14px",marginBottom:10,border:"1px solid #FECACA"}}>
                        <div style={{fontSize:10,fontWeight:700,color:C.red,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>The moment</div>
                        <p style={{fontSize:13,color:"#7F1D1D",fontStyle:"italic",lineHeight:1.6,margin:0}}>"{mo.moment}"</p>
                      </div>
                      <div style={{fontSize:12,color:C.muted,lineHeight:1.6,marginBottom:6}}>
                        <strong style={{color:C.text}}>What happened:</strong> {mo.what}
                      </div>
                      <div style={{fontSize:12,color:C.muted,lineHeight:1.6,marginBottom:8}}>
                        <strong style={{color:C.text}}>Impact:</strong> {mo.impact}
                      </div>
                      <div style={{background:"#F0FDF4",borderRadius:5,padding:"10px 13px",border:"1px solid #BBF7D0"}}>
                        <div style={{fontSize:10,fontWeight:700,color:C.green,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>How to capture it next time</div>
                        <p style={{fontSize:12,color:"#14532D",lineHeight:1.6,margin:0}}>{mo.howToCapture}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── OPPORTUNITIES CAPTURED WELL ── */}
              {result.capturedOpportunities?.length > 0 && (
                <div style={{background:C.white,borderRadius:14,border:`1px solid ${C.border}`,padding:18,marginBottom:14}}>
                  <div style={{fontSize:10,fontWeight:800,color:C.purple,textTransform:"uppercase",letterSpacing:1.5,marginBottom:14}}>⚡ Opportunities you captured — and how to take them to great</div>
                  {result.capturedOpportunities.map((co,i)=>(
                    <div key={i} style={{marginBottom:i<result.capturedOpportunities.length-1?18:0,paddingBottom:i<result.capturedOpportunities.length-1?18:0,borderBottom:i<result.capturedOpportunities.length-1?`1px solid ${C.bg}`:"none"}}>
                      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:8,marginBottom:8}}>
                        <div style={{background:"#FFF7ED",borderRadius:5,padding:"8px 12px",border:"1px solid #FED7AA"}}>
                          <div style={{fontSize:9,fontWeight:700,color:"#C2410C",textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>They said</div>
                          <p style={{fontSize:12,color:"#7C2D12",fontStyle:"italic",lineHeight:1.5,margin:0}}>"{co.candidateSignal}"</p>
                        </div>
                        <div style={{background:"#F0FDF4",borderRadius:5,padding:"8px 12px",border:"1px solid #BBF7D0"}}>
                          <div style={{fontSize:9,fontWeight:700,color:C.green,textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>You caught it</div>
                          <p style={{fontSize:12,color:"#14532D",fontStyle:"italic",lineHeight:1.5,margin:0}}>"{co.recruiterResponse}"</p>
                        </div>
                      </div>
                      <div style={{fontSize:12,color:C.muted,lineHeight:1.5,marginBottom:8}}>{co.why}</div>
                      <div style={{background:C.lavPale,borderRadius:5,padding:"10px 13px",border:`1px solid ${C.lavSoft}`}}>
                        <div style={{fontSize:9,fontWeight:700,color:C.purple,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>⚡ To make it great</div>
                        <p style={{fontSize:12,color:C.navy,lineHeight:1.6,margin:0}}>"{co.toGreat}"</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Fallback: goodResponses if capturedOpportunities absent */}
              {!result.capturedOpportunities?.length && result.goodResponses?.length > 0 && (
                <div style={{background:C.white,borderRadius:14,border:`1px solid ${C.border}`,padding:18,marginBottom:14}}>
                  <div style={{fontSize:10,fontWeight:800,color:C.purple,textTransform:"uppercase",letterSpacing:1.5,marginBottom:14}}>⚡ Good responses — how to take them to great</div>
                  {result.goodResponses.map((gr,i)=>(
                    <div key={i} style={{marginBottom:i<result.goodResponses.length-1?18:0,paddingBottom:i<result.goodResponses.length-1?18:0,borderBottom:i<result.goodResponses.length-1?`1px solid ${C.bg}`:"none"}}>
                      <div style={{display:"flex",gap:8,marginBottom:6,alignItems:"flex-start"}}>
                        <span style={{background:C.lavPale,color:C.purple,borderRadius:6,padding:"2px 8px",fontSize:10,fontWeight:700,flexShrink:0}}>You said</span>
                        <p style={{fontSize:12,color:C.text,lineHeight:1.5,margin:0,fontStyle:"italic"}}>"{gr.what}"</p>
                      </div>
                      <div style={{fontSize:12,color:C.muted,marginBottom:8}}>{gr.why}</div>
                      <div style={{background:C.lavPale,borderRadius:5,padding:"8px 12px",border:`1px solid ${C.lavSoft}`}}>
                        <div style={{fontSize:9,fontWeight:700,color:C.purple,textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>⚡ To make it great</div>
                        <p style={{fontSize:11,color:C.navy,lineHeight:1.55,margin:0}}>"{gr.toGreat}"</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── BUYER SIGNALS — caught & missed ── */}
              {result.buyerSignals?.length > 0 && (
                <div style={{background:C.white,borderRadius:14,border:`1px solid ${C.border}`,padding:18,marginBottom:14}}>
                  <div style={{fontSize:10,fontWeight:800,color:"#92400E",textTransform:"uppercase",letterSpacing:1.5,marginBottom:14}}>📡 Buyer signals — what happened at each one</div>
                  {result.buyerSignals.map((bs,i)=>{
                    const actedColor = bs.acted==="yes"?{bg:"#F0FDF4",c:C.green,border:"#BBF7D0",icon:"✓ Caught"}:bs.acted==="partial"?{bg:"#FFF7ED",c:C.amber,border:"#FED7AA",icon:"~ Partial"}:{bg:"#FEF2F2",c:C.red,border:"#FECACA",icon:"✗ Missed"};
                    return(
                      <div key={i} style={{marginBottom:i<result.buyerSignals.length-1?14:0,paddingBottom:i<result.buyerSignals.length-1?14:0,borderBottom:i<result.buyerSignals.length-1?`1px solid ${C.bg}`:"none"}}>
                        <div style={{display:"flex",gap:8,alignItems:"flex-start",marginBottom:6}}>
                          <span style={{background:actedColor.bg,color:actedColor.c,border:`1px solid ${actedColor.border}`,borderRadius:999,padding:"2px 8px",fontSize:10,fontWeight:700,flexShrink:0,whiteSpace:"nowrap"}}>{actedColor.icon}</span>
                          <p style={{fontSize:13,color:C.navy,fontStyle:"italic",lineHeight:1.5,margin:0}}>"{bs.signal}"</p>
                        </div>
                        <p style={{fontSize:12,color:C.muted,lineHeight:1.55,margin:0,paddingLeft:60}}>{bs.observation}</p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── NEXT OPPORTUNITIES ── */}
              {(result.nextOpportunities?.length > 0 || result.nextFocus) && (
                <div style={{background:C.navy,borderRadius:14,padding:18,marginBottom:20}}>
                  <div style={{display:"flex",gap:12,alignItems:"flex-start",marginBottom:12}}>
                    <Av ini="SC" col={C.lavSoft} sz={32}/>
                    <div style={{fontSize:10,fontWeight:800,color:"rgba(255,255,255,0.5)",textTransform:"uppercase",letterSpacing:1.5,paddingTop:8}}>Work on next</div>
                  </div>
                  {result.nextOpportunities?.map((opp,i)=>(
                    <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:i<result.nextOpportunities.length-1?10:0,paddingBottom:i<result.nextOpportunities.length-1?10:0,borderBottom:i<result.nextOpportunities.length-1?"1px solid rgba(255,255,255,0.08)":"none"}}>
                      <span style={{background:C.lavSoft,color:C.navy,borderRadius:"50%",width:20,height:20,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,flexShrink:0,marginTop:1}}>{i+1}</span>
                      <p style={{fontSize:13,color:"rgba(255,255,255,0.85)",lineHeight:1.6,margin:0}}>{opp}</p>
                    </div>
                  ))}
                  {result.nextFocus && (
                    <div style={{marginTop:result.nextOpportunities?.length?12:0,paddingTop:result.nextOpportunities?.length?12:0,borderTop:result.nextOpportunities?.length?"1px solid rgba(255,255,255,0.08)":"none"}}>
                      <div style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>One thing to do before next call</div>
                      <p style={{fontSize:13,color:C.lav,lineHeight:1.6,margin:0,fontStyle:"italic"}}>"{result.nextFocus}"</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── TAB: METHODOLOGY SCORES ── */}
          {activeDebriefTab==="methodologies" && (
            <div style={{animation:"fadeUp 0.3s ease both"}}>
              <div style={{background:C.lavPale,borderRadius:14,border:`1px solid ${C.lavSoft}`,padding:"12px 16px",marginBottom:16,display:"flex",gap:10,alignItems:"flex-start"}}>
                <span style={{fontSize:16,flexShrink:0}}>📚</span>
                <p style={{fontSize:12,color:C.purple,lineHeight:1.65,margin:0}}>Scored against 11 proven sales methodologies — each from a different angle. No single methodology fits every call; the pattern across all of them tells the real story.</p>
              </div>
              {(result.methodologyScores||[]).length === 0 ? (
                <div style={{background:C.white,borderRadius:14,border:`1px solid ${C.border}`,padding:24,textAlign:"center",color:C.muted,fontSize:13}}>Methodology scores will appear after your next roleplay.</div>
              ) : (
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  {(result.methodologyScores||[]).map((m,i)=>{
                    const col = m.score>=75?C.green:m.score>=60?C.amber:C.red;
                    const bg  = m.score>=75?C.greenBg:m.score>=60?"#FEF3C7":"#FEE2E2";
                    const border = m.score>=75?"#BBF7D0":m.score>=60?"#FDE68A":"#FECACA";
                    return(
                      <div key={i} style={{background:C.white,borderRadius:14,border:`1px solid ${C.border}`,padding:"14px 18px"}}>
                        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:8}}>
                          <div style={{flex:1}}>
                            <div style={{fontWeight:800,color:C.navy,fontSize:14}}>{m.name}</div>
                            <div style={{fontSize:11,color:C.muted,marginTop:2}}>{m.what}</div>
                          </div>
                          <div style={{textAlign:"center",flexShrink:0}}>
                            <div style={{background:bg,border:`1px solid ${border}`,borderRadius:5,padding:"6px 14px"}}>
                              <div style={{fontSize:22,fontWeight:900,color:col,lineHeight:1}}>{m.score}</div>
                              <div style={{fontSize:9,color:col,fontWeight:700,marginTop:1}}>{m.score>=75?"Strong":m.score>=60?"On Track":"Needs Work"}</div>
                            </div>
                          </div>
                        </div>
                        <div style={{height:5,background:C.bg,borderRadius:999,overflow:"hidden",marginBottom:8}}>
                          <div style={{height:"100%",width:`${m.score}%`,background:col,borderRadius:999,transition:"width 0.5s"}}/>
                        </div>
                        <p style={{fontSize:12,color:C.text,lineHeight:1.6,margin:0}}>{m.feedback}</p>
                      </div>
                    );
                  })}
                  {/* Aggregate pattern */}
                  {result.methodologyScores?.length > 0 && (()=>{
                    const scores = result.methodologyScores.map(m=>m.score);
                    const avg = Math.round(scores.reduce((a,b)=>a+b,0)/scores.length);
                    const lowest = result.methodologyScores.reduce((a,b)=>a.score<b.score?a:b);
                    const highest = result.methodologyScores.reduce((a,b)=>a.score>b.score?a:b);
                    return(
                      <div style={{background:C.navy,borderRadius:14,padding:"16px 20px"}}>
                        <div style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:1.5,marginBottom:10}}>Methodology pattern</div>
                        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr 1fr",gap:10,marginBottom:12}}>
                          {[{l:"Average across all",v:avg},{l:"Strongest fit",v:`${highest.name.split(" ")[0]} (${highest.score})`},{l:"Biggest gap",v:`${lowest.name.split(" ")[0]} (${lowest.score})`}].map((s,i)=>(
                            <div key={i} style={{background:"rgba(255,255,255,0.07)",borderRadius:5,padding:"10px 12px",textAlign:"center"}}>
                              <div style={{fontSize:i===0?22:14,fontWeight:800,color:"#fff",lineHeight:1}}>{s.v}</div>
                              <div style={{fontSize:10,color:"rgba(255,255,255,0.4)",marginTop:4}}>{s.l}</div>
                            </div>
                          ))}
                        </div>
                        <p style={{fontSize:12,color:"rgba(255,255,255,0.7)",lineHeight:1.6,margin:0}}>The gap between your strongest and weakest methodology scores shows where your natural instincts sit — and where the biggest leverage is.</p>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {/* ── TAB: FRAMEWORK SCORES ── */}
          {activeDebriefTab==="frameworks" && (
            <div style={{animation:"fadeUp 0.3s ease both"}}>
              <div style={{background:C.white,borderRadius:5,border:`1px solid ${C.border}`,padding:"18px 22px",marginBottom:14}}>
                <div style={{fontSize:10,fontWeight:800,textTransform:"uppercase",letterSpacing:2,color:C.muted,marginBottom:16}}>Scored against proven frameworks</div>
                <div style={{display:"flex",flexDirection:"column",gap:16}}>
                  {frameworks.length > 0 ? frameworks.map((fw,i)=>{
                    const fc = fScore(fw.score);
                    const barW = `${fw.score}%`;
                    return(
                      <div key={i}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                          <div>
                            <div style={{fontWeight:700,color:C.navy,fontSize:14}}>{fw.name}</div>
                            <div style={{fontSize:11,color:C.muted,marginTop:1}}>{fw.description}</div>
                          </div>
                          <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0,marginLeft:12}}>
                            <span style={{background:fc.bg,color:fc.c,border:`1px solid ${fc.border}`,borderRadius:999,padding:"3px 12px",fontSize:12,fontWeight:800}}>{fw.score}</span>
                          </div>
                        </div>
                        {/* Score bar */}
                        <div style={{height:6,background:C.bg,borderRadius:999,overflow:"hidden",marginBottom:6}}>
                          <div style={{height:"100%",width:barW,background:fc.c,borderRadius:999,transition:"width 0.8s ease"}}/>
                        </div>
                        {/* Per-framework feedback */}
                        <p style={{fontSize:12,color:C.text,lineHeight:1.6,margin:0}}>{fw.feedback}</p>
                        {i < frameworks.length-1 && <div style={{height:1,background:C.bg,marginTop:14}}/>}
                      </div>
                    );
                  }) : (
                    <div style={{textAlign:"center",padding:"24px 0",color:C.muted,fontSize:13}}>
                      Framework scores not available for this call.
                    </div>
                  )}
                </div>
              </div>

              {/* Buyer signals */}
              {result.buyerSignals && result.buyerSignals.length > 0 && (
                <div style={{background:C.white,borderRadius:5,border:`1px solid ${C.border}`,padding:"18px 22px",marginBottom:14}}>
                  <div style={{fontSize:10,fontWeight:800,textTransform:"uppercase",letterSpacing:2,color:C.muted,marginBottom:14}}>Buyer signals detected</div>
                  {result.buyerSignals.map((bs,i)=>(
                    <div key={i} style={{display:"flex",gap:12,alignItems:"flex-start",marginBottom:12,paddingBottom:12,borderBottom:i<result.buyerSignals.length-1?`1px solid ${C.bg}`:"none"}}>
                      <span style={{
                        width:28,height:28,borderRadius:"50%",flexShrink:0,
                        background:bs.acted==="yes"?C.greenBg:bs.acted==="missed"?"#FEE2E2":"#FEF3C7",
                        display:"flex",alignItems:"center",justifyContent:"center",fontSize:14
                      }}>{bs.acted==="yes"?"✓":bs.acted==="missed"?"✗":"?"}</span>
                      <div>
                        <div style={{fontWeight:700,color:C.navy,fontSize:13,marginBottom:2}}>{bs.signal}</div>
                        <p style={{fontSize:12,color:C.muted,lineHeight:1.55,margin:0}}>{bs.observation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── TAB: TRANSCRIPT ── */}
          {activeDebriefTab==="transcript" && (
            <div style={{animation:"fadeUp 0.3s ease both"}}>
              <div style={{background:C.white,borderRadius:5,border:`1px solid ${C.border}`,padding:"18px 22px",marginBottom:14}}>
                <div style={{fontSize:10,fontWeight:800,textTransform:"uppercase",letterSpacing:2,color:C.muted,marginBottom:16}}>Call transcript</div>
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  {msgs.filter(m=>m.role!=="coach").map((m,i)=>(
                    <div key={i} style={{display:"flex",gap:12,alignItems:"flex-start"}}>
                      <div style={{width:60,fontSize:11,fontWeight:700,color:m.role==="user"?C.purple:C.muted,flexShrink:0,paddingTop:2,textAlign:"right"}}>
                        {m.role==="user"?"You":cand.name}
                      </div>
                      <div style={{
                        flex:1,background:m.role==="user"?C.lavPale:C.bg,
                        borderRadius:5,padding:"8px 12px",fontSize:13,color:C.text,lineHeight:1.6
                      }}>{m.content}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── PASS/FAIL + ACTIONS ── */}
          {!pass && (
            <div style={{background:"#FEE2E2",borderRadius:5,padding:14,marginBottom:16,fontSize:13,color:"#991B1B",border:"1px solid #FECACA",textAlign:"center"}}>
              🔒 Score 65+ to unlock the next lesson. You've got this — try again.
            </div>
          )}

          <div style={{display:"flex",gap:10,justifyContent:"center",marginBottom:28}}>
            <button onClick={()=>{setResult(null);setMsgs([]);setTurns(0);setPhase("brief");}}
              style={{border:`2px solid ${C.border}`,background:C.white,color:C.text,borderRadius:999,padding:"11px 22px",fontWeight:600,cursor:"pointer",fontSize:13}}>
              ↺ Try Again
            </button>
            {pass && (
              <button onClick={onBack}
                style={{background:C.navy,color:"#fff",border:"none",borderRadius:999,padding:"11px 24px",fontWeight:800,cursor:"pointer",fontSize:13}}>
                ✓ Complete & Continue
              </button>
            )}
          </div>

          {/* SMART Goals — shown when 3-roleplay cycle completes */}
          {(() => {
            const rps = loadRoleplays();
            const showGoals = rps.length >= 3 && rps.length % 3 === 0;
            if (!showGoals && rps.length < 3) return (
              <div style={{background:C.lavPale,borderRadius:14,border:`1px solid ${C.lavSoft}`,padding:16,textAlign:"center"}}>
                <div style={{fontSize:13,color:C.purple,fontWeight:600}}>🎯 {3-rps.length} more roleplay{3-rps.length!==1?"s":""} until Scott generates your SMART development goals</div>
              </div>
            );
            if (showGoals) return (
              <div>
                <div style={{background:C.amberBg,borderRadius:5,padding:"12px 16px",marginBottom:16,display:"flex",gap:10,alignItems:"center",border:"1px solid #FDE68A"}}>
                  <span style={{fontSize:18}}>🎯</span>
                  <div style={{fontWeight:700,color:C.amber,fontSize:13}}>You've completed 3 roleplays — Scott has generated your personalised development goals below.</div>
                </div>
                <SmartGoalsPanel profile={profile}/>
              </div>
            );
            return null;
          })()}

          {/* Complete & Reflect button */}
          <div style={{marginTop:24,paddingTop:20,borderTop:`1px solid ${C.border}`}}>
            <button onClick={()=>setShowPostCheck(true)}
              style={{width:"100%",background:C.purple,color:"#fff",border:"none",borderRadius:999,padding:"13px",fontWeight:700,fontSize:14,cursor:"pointer"}}>
              Complete & Reflect →
            </button>
            <p style={{fontSize:11,color:C.muted,textAlign:"center",marginTop:8}}>Takes 30 seconds — helps Scott track your confidence over time</p>
          </div>

        </div>
        )}
      </Shell>
    );
  }

  return null;
}

/* ══════════════════════════════════════════════════════════════
   SCORE CALL — framework-aware scoring engine
══════════════════════════════════════════════════════════════ */

export function pushRoleplayToManager(rpEntry, parsed, profile) {
  try {
    const inbox = loadManagerInbox();
    const learnerName = profile?.name || (profile?.focus ? `${profile.focus} recruiter` : "Learner");
    const avgFramework = parsed.frameworks?.length
      ? Math.round(parsed.frameworks.reduce((a,f)=>a+(f.score||0),0)/parsed.frameworks.length)
      : parsed.score;
    const redFlags = (parsed.frameworks||[]).filter(f=>f.score<60);
    const summary = {
      type: "roleplay_complete",
      learner: learnerName,
      savedAt: new Date().toISOString(),
      read: false,
      // Headline data
      scenario: rpEntry.scenarioName || rpEntry.scenarioKey,
      difficulty: rpEntry.difficulty,
      score: parsed.score,
      verdict: parsed.verdict,
      // Coaching summary
      coachSummary: parsed.coachSummary,
      strongMoment: parsed.strongMoment,
      missedMoment: parsed.missedMoment,
      // Questioning coach
      questioningCoach: parsed.questioningCoach ? {
        overallVerdict: parsed.questioningCoach.overallVerdict,
        keyPattern: parsed.questioningCoach.keyPattern,
        technique: parsed.questioningCoach.technique,
      } : null,
      // New fields
      missedOpportunities: parsed.missedOpportunities || [],
      goodResponses: parsed.goodResponses || [],
      nextOpportunities: parsed.nextOpportunities || [],
      // Framework scores
      frameworks: (parsed.frameworks||[]).map(f=>({name:f.name,score:f.score})),
      redFlags: redFlags.map(f=>f.name),
      // Signal data
      missedSignalCount: parsed.missedSignals?.length || 0,
      nextFocus: parsed.nextFocus,
    };
    inbox.push(summary);
    localStorage.setItem(MANAGER_INBOX_KEY, JSON.stringify(inbox));
  } catch(e) {}
}

async function scoreCall(transcript, scenario, profile, setResult, setPhase) {
  const ctx = profile ? `Recruiter sector: ${profile.focus || "General"}, billings: ${profile.billings || "not stated"}. Challenge: "${profile.ownChallenge||profile.challenge||"not stated"}".` : "";
  const overlay = profile?.focus ? (SECTOR_PERSONA_OVERLAYS[profile.focus] || null) : null;
  const brief = overlay
    ? `Sector: ${overlay.world}. Skill being tested: ${scenario.skillFocus}.`
    : `Role: ${scenario.brief?.role || scenario.skillFocus} at ${scenario.brief?.company || "company in brief"}. Skill: ${scenario.skillFocus}.`;

  const scenarioId = Object.keys(SCENARIOS).find(k=>SCENARIOS[k]===scenario);
  const activeCritKeys = scenario.activeCriteria || SCENARIO_CRITERIA[scenarioId] || ["openingHook","discoveryDepth","activeListening","objectionHandling","closingStrength"];
  const activeCrit = activeCritKeys.map(k=>ALL_CRITERIA[k]).filter(Boolean);
  const criteriaBlock = activeCrit.map(c=>`- ${c.label}: Good = "${c.good}" | Great = "${c.great}"`).join("\n");

  const prompt = `You are Scott, a senior recruitment sales coach. Your job is to take recruiters from good to great — not to critique them, but to identify the one or two specific behaviour changes that will have the highest immediate impact on their calls.

${ctx}
SCENARIO: ${brief}
DIFFICULTY: ${scenario.difficulty||"beginner"}
SKILL FOCUS: ${scenario.skillFocus}

ACTIVE ASSESSMENT CRITERIA FOR THIS ROLEPLAY:
${criteriaBlock}

TRANSCRIPT:
${transcript}

COACHING PHILOSOPHY:
- Score honestly based on what was demonstrated — not on intent
- Never score any criterion below 40 unless the recruiter made no attempt whatsoever
- Lead with genuine strengths before identifying gaps
- For every gap, give ONE specific behaviour change framed as an opportunity, not a criticism
- The goal is "you did X well — here's the one thing that would take this from good to great"
- Use the candidate's actual name from the transcript when referencing moments

Return ONLY this JSON (no markdown, no extra text):
{
  "score": 68,
  "verdict": "On Track",
  "summary": "2-3 sentences: open with one genuine strength (include verbatim recruiter quote), then name the single highest-impact change. Frame as an opportunity.",
  "coachSummary": "same as summary",
  "topWin": "verbatim recruiter line that showed real skill — quote it exactly",
  "topMiss": {"candidateLine": "verbatim signal the candidate gave that was missed", "recruiterLine": "what the recruiter said instead", "betterResponse": "exact words Scott would suggest — framed as 'try this next time'"},
  "talkRatio": {"recruiter": 55, "candidate": 45, "note": "1 sentence on whether talk ratio helped or hindered"},
  "criterionScores": [
    {"key": "openingHook", "label": "Opening & Permission", "score": 65, "what_you_did_well": "1 sentence on a specific strength", "path_to_great": "1 sentence — the exact one change that closes the gap from good to great"}
  ],
  "frameworks": [
    {"name": "Opening & Permission", "score": 60, "feedback": "1 sentence — specific to this call"},
    {"name": "Discovery (SPIN)", "score": 50, "feedback": "1 sentence — which SPIN levels were reached"},
    {"name": "Listening & Signals", "score": 65, "feedback": "1 sentence — specific moment"},
    {"name": "Objection Handling", "score": 70, "feedback": "1 sentence or 'No objections arose in this session'"},
    {"name": "Commitment & Close", "score": 55, "feedback": "1 sentence — what was agreed or what was missed"}
  ],
  "methodologyScores": {"openingHook": 60, "permissionAsked": 50, "discoveryDepth": 55, "listeningSignals": 65, "objectionHandling": 70, "closingStrength": 55, "talkRatioScore": 60, "toneAndRapport": 70, "questioningFunnel": 50, "valueArticulation": 60, "momentumControl": 65}
}

Rules for criterionScores: include ONLY the active criteria listed above (${activeCritKeys.join(", ")}). Score each 40–100. Both "what_you_did_well" and "path_to_great" must reference specific moments from the transcript. Fill every field with real observations.`;

  try {
    const fb = await callAPI([{role:"user", content:prompt}], null, {model:"claude-sonnet-4-6", max_tokens:1200, temperature:0});
    const parsed = parseJSON(fb);
    setResult(parsed);
    const rpEntry = {
      scenarioKey: scenario.skillFocus,
      scenarioId: Object.keys(SCENARIOS).find(k=>SCENARIOS[k]===scenario) || "custom",
      moduleId: scenario.moduleId || null,
      score: parsed.score,
      verdict: parsed.verdict,
      coachSummary: parsed.coachSummary || parsed.summary,
      savedAt: new Date().toISOString(),
      frameworks: parsed.frameworks||[],
      criterionScores: parsed.criterionScores||[],
      sectorContext: profile?.focus || null,
      difficulty: scenario.difficulty || "beginner",
    };
    saveRoleplay(rpEntry);
    pushRoleplayToManager(rpEntry, parsed, profile);
    setPhase("debrief");
  } catch(e) {
    console.error("scoreCall error:", e);
    setResult({
      score:50, verdict:"On Track",
      summary:"Couldn't score this call — but you completed the roleplay. Review the transcript above.",
      coachSummary:"Couldn't score this call — but you completed the roleplay.",
      topWin:"See transcript", topMiss:{candidateLine:"",recruiterLine:"",betterResponse:""},
      talkRatio:{recruiter:50,candidate:50},
      frameworks:[],
      methodologyScores:{openingHook:50,permissionAsked:50,discoveryDepth:50,listeningSignals:50,objectionHandling:50,closingStrength:50,talkRatioScore:50,toneAndRapport:50,questioningFunnel:50,valueArticulation:50,momentumControl:50}
    });
    setPhase("debrief");
  }
}


async function generateSmartGoals(roleplays, profile, setGoals, setGenerating) {
  if (roleplays.length < 3) return;
  setGenerating(true);
  const cycleRps = roleplays.slice(-3);
  const allRps = roleplays;
  const cycleSummary = cycleRps.map((rp, i) => `Roleplay ${i+1}: Score ${rp.score}/100 | ${rp.verdict} | Key gap: ${rp.missedMoment || rp.improvements?.[0] || "not captured"}`).join("\n");
  const arcSummary = allRps.length > 3 ? `Long-term arc (${allRps.length} total): Avg score first 3 → ${allRps.slice(0,3).reduce((a,r)=>a+r.score,0)/3|0}, latest 3 → ${allRps.slice(-3).reduce((a,r)=>a+r.score,0)/3|0}` : "";
  const profileCtx = profile ? `Recruiter: ${profile.focus}, ${profile.billings}, challenge: "${profile.ownChallenge || profile.challenge}"` : "";
  const prompt = `You are Scott. Based on these 3 roleplays, generate SMART development goals. ${profileCtx}\n\n${cycleSummary}\n${arcSummary}\n\nReturn ONLY valid JSON:\n{"cycleGoals":[{"priority":"immediate","title":"Short title","specific":"Exact behaviour","measurable":"How to measure","achievable":"Why reachable now","relevant":"Why matters","timebound":"Next 3 roleplays","coachNote":"1-2 sentences from Scott"},{"priority":"important","title":"...","specific":"...","measurable":"...","achievable":"...","relevant":"...","timebound":"Next 2 weeks","coachNote":"..."}],"longTermArc":{"pattern":"Recurring theme","trajectory":"positive|developing|needs_reset","arcGoal":"3-month goal","signalToWatch":"What indicates real breakthrough"},"generatedAt":"${new Date().toISOString()}"}\nPriority must be exactly "immediate", "important", or "developing".`;
  try {
    const res = await callAPI([{role:"user", content:prompt}], null, {model:"claude-sonnet-4-6", max_tokens:1000});
    const goals = parseJSON(res);
    saveSmartGoals(goals);
    setGoals(goals);
  } catch(e) {
    const fallback = {
      cycleGoals:[
        {priority:"immediate",title:"Stay in objections longer",specific:"Do not accept the first 'not interested' — attempt at least one A-B-R before redirecting",measurable:"Zero early capitulations in next 3 roleplays. Objections score improves by 8+ points.",achievable:"You've shown you can do it when confident — this is about making it automatic",relevant:"Objection handling is the single biggest gap across your last 3 calls",timebound:"Next 3 roleplays",coachNote:"The technique is there. The gap is the reflex. One more move in the objection changes everything downstream."},
        {priority:"important",title:"Follow the signal thread",specific:"When a candidate hesitates or uses emotional language, ask one follow-up question before moving on",measurable:"At least 2 signal follow-ups identified in reflection per roleplay",achievable:"You're already noticing signals — the next step is acting on them in the moment",relevant:"Signal recognition separates good recruiters from trusted advisors",timebound:"Next 2 weeks",coachNote:"You're picking up more than you think. The goal now is trusting what you notice."}
      ],
      longTermArc:{pattern:"Strong openings that don't convert — the gap is what happens after the first exchange.",trajectory:"developing",arcGoal:"Within 3 months, move from 'gets the conversation' to 'moves it forward intentionally on every turn'.",signalToWatch:"A roleplay where the call ends with a firm next step AND the candidate says something about feeling genuinely heard."},
      generatedAt: new Date().toISOString()
    };
    saveSmartGoals(fallback);
    setGoals(fallback);
  }
  setGenerating(false);
}


export default RoleplayView;