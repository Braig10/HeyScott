export const PERSONA_VARIANTS = [
  { label:"Cooperative but busy",     companyIdx:0, behaviorNote:"Engage reasonably well if the recruiter earns it. Give medium-length answers. One reflex objection max." },
  { label:"Guarded and vague",        companyIdx:1, behaviorNote:"Deflect with positivity ('all good here'). Give short answers. Don't volunteer information. Warm up only if they ask a genuinely insightful question." },
  { label:"Interrupter",              companyIdx:2, behaviorNote:"Cut the recruiter's sentences short frequently. Finish their thoughts (often incorrectly). Push for brevity. If they stay calm and steer back well, respect it." },
  { label:"Abrupt and impatient",     companyIdx:3, behaviorNote:"3-word answers. Constant 'send me an email'. Give very little. Only open up if they demonstrate peer-level insight fast." },
  { label:"Curious but non-committal",companyIdx:4, behaviorNote:"Ask lots of questions back. Show genuine interest but avoid committing to anything. Will explore hypotheticals but resist any next steps." },
  { label:"Surface-positive",         companyIdx:5, behaviorNote:"Sound warm and engaged on the surface but give nothing of substance. 'Yeah that sounds great' without commitment. Politically careful." },
];

export const DIFFICULTY_MODIFIERS = {
  junior:       "Stay moderately guarded. Give average-length answers. One reflex objection max. Warm up if they demonstrate genuine curiosity.",
  "mid-level":  "Use 2 objections. Require better question sequencing before opening up. Give shorter answers initially.",
  senior:       "Give very short initial answers. Deploy 3 distinct objections. Require peer-level engagement and genuine insight before opening up. Don't volunteer anything.",
};

export const SAMPLE_TRANSCRIPT = `Recruiter: Hey is this James?\nJames: Yeah, who's this?\nRecruiter: Hey James, it's Mike calling from Talent Co. How are you going today?\nJames: Fine, what's this about?\nRecruiter: So I'm calling because we have a really great opportunity. Senior role, good salary.\nJames: I'm not really looking right now.\nRecruiter: Oh right, but this is a really good role. The salary is 120k plus super.\nJames: How did you get my number?\nRecruiter: We have your details in our database. Can I send you the JD?\nJames: Not really interested, thanks.\nRecruiter: Are you sure? Lots of benefits.\nJames: Yeah look I'm busy. Send me an email if you want.`;

export const SCORE_DATA=[{m:"Jan",v:68},{m:"Feb",v:70},{m:"Mar",v:72},{m:"Apr",v:71},{m:"May",v:74},{m:"Jun",v:75}];
export const REV_DATA=[{m:"Jan",v:128000},{m:"Feb",v:135000},{m:"Mar",v:141000},{m:"Apr",v:162000},{m:"May",v:175000},{m:"Jun",v:198000}];
export const WEEKLY_DATA=[{d:"Mon",c:3,s:2},{d:"Tue",c:2,s:1},{d:"Wed",c:4,s:3},{d:"Thu",c:3,s:3},{d:"Fri",c:5,s:2},{d:"Sat",c:1,s:0},{d:"Sun",c:0,s:1}];
export const SENT_DATA=[{turn:"T1",v:40},{turn:"T2",v:35},{turn:"T3",v:50},{turn:"T4",v:45},{turn:"T5",v:60},{turn:"T6",v:70},{turn:"T7",v:75}];
export const MILESTONES = [
  {id:1, title:"Book 5 meetings from cold calls", desc:"Consistent pipeline from cold outreach", cur:3, tgt:5, done:false},
  {id:2, title:"Score 70+ on 3 roleplays in a row", desc:"Proving technique under pressure", cur:1, tgt:3, done:false},
  {id:3, title:"Complete Module 1", desc:"Cold Call Mindset foundations", cur:4, tgt:5, done:false},
  {id:4, title:"First placement from a cold call", desc:"Close the loop on a headhunted candidate", cur:0, tgt:1, done:false},
  {id:5, title:"10-day call streak", desc:"Consistency is the skill", cur:5, tgt:10, done:false},
];

export const SKILLS = [
  {name:"Opening & Permission",score:72,prev:63},
  {name:"Discovery (SPIN)",score:68,prev:60},
  {name:"Objection Handling",score:75,prev:64},
  {name:"Rapport & Tone",score:80,prev:71},
  {name:"Closing / Commitment",score:65,prev:58},
];

export const ANALYSES = [
  {id:1, date:"Today, 2:14pm", overall:72, opening:68, discovery:75, objections:70, closing:74},
  {id:2, date:"Yesterday, 10:30am", overall:65, opening:60, discovery:70, objections:62, closing:68},
  {id:3, date:"Mon, 9:15am", overall:78, opening:80, discovery:76, objections:75, closing:82},
];

/* ══════════════════════════════════════════════════════════════
   SUPABASE CONFIG
══════════════════════════════════════════════════════════════ */
// Read lazily so window._env is populated by the time any method is called
export const ASSESSMENT_SCENARIOS = [
  {
    id:"marcus", level:"1 of 3", name:"Marcus Webb", ini:"MW", col:"#6B7280",
    title:"Account Executive", company:"Nexus Software",
    context:"You're filling a Senior BDM role at a Series B scale-up — £65k base, strong OTE, fully remote. Marcus has solid outbound B2B sales experience and his background is a strong match for the role.",
    system:`You are Marcus Webb, Account Executive at Nexus Software. You've been here 2 years — it's fine. Decent salary, reasonable manager. Not unhappy but not inspired either. Not actively looking but not hostile.
PERSONALITY: Friendly but passive. You answer what you're asked but don't volunteer much. Mildly surprised to get the call but open enough to hear it out.
RESPONSE STYLE: Short responses (1-2 sentences). Polite but non-committal. If the recruiter asks genuine questions about your situation, you gradually open up. If they just pitch without asking anything, stay polite but brief.
Opening line: "Oh hi — what's this about?"`
  },
  {
    id:"priya", level:"2 of 3", name:"Priya Nair", ini:"PN", col:"#7C3AED",
    title:"Senior Consultant", company:"Hays",
    context:"You're placing a Senior Manager at a boutique accountancy practice — stronger culture, more autonomy, broadly similar compensation. Priya has a strong track record in practice recruitment and is well-regarded in her network.",
    system:`You are Priya Nair, Senior Consultant at Hays. Five years here, good at your job, get headhunted regularly. You know how to handle recruiter calls.
PERSONALITY: Professional, polished, guarded. "Happy where I am" comes naturally and early. But underneath: you were passed over for a promotion 8 months ago and it stung. You're ambitious. You'd move for the right thing — but you won't give that away cheaply.
RESPONSE STYLE: Polite but firm deflections at first. If someone genuinely listens and asks what "happy" or "settled" actually means to you, soften slightly and reveal more. If they just pitch harder, stay closed.
Opening line: "Hi — yes, who's this?"`
  },
  {
    id:"james", level:"3 of 3", name:"James Sutherland", ini:"JS", col:"#1E3A8A",
    title:"Director of Engineering", company:"FinTech Capital",
    context:"You're placing a VP of Engineering — meaningful equity, strong leadership team, serious technical challenge. You don't have every detail of the brief yet. James has the exact background and you believe this is worth his time.",
    system:`You are James Sutherland, Director of Engineering at FinTech Capital. Headhunted constantly. Zero patience for generic calls. Senior, busy, and you know within 10 seconds if someone is wasting your time.
PERSONALITY: Brusque, dismissive, immediately testing. You challenge credentials and specifics early. Enthusiasm and positivity make you more dismissive — you respond only to calm authority and genuine knowledge about why you called this person specifically.
RESPONSE STYLE: Open with time pressure. Short, clipped sentences. If they stumble, apologise, or get defensive, give one more short chance then end the call. If they stay completely calm and show real specificity about why they came to you, give slightly more.
Opening line: "Sutherland. Two minutes — what is it?"`
  }
];