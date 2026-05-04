import { useState, useRef, useEffect, useCallback } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

/* ── Design tokens ── */
const C = {
  // Backgrounds & surfaces
  bg:        "hsl(40,20%,97%)",    // cream canvas
  bgDeep:    "hsl(40,20%,95%)",    // sidebar / secondary surface
  card:      "hsl(40,20%,99%)",    // card surface (near white)
  white:     "#FFFFFF",
  // Text
  text:      "hsl(220,70%,15%)",   // deep ink — primary text
  navy:      "hsl(220,70%,15%)",   // alias
  navyMid:   "hsl(220,70%,12%)",
  // Primary — muted sage
  primary:   "hsl(140,15%,40%)",
  purple:    "hsl(140,15%,40%)",   // legacy alias → sage
  // Structural
  border:    "hsl(40,15%,88%)",
  secondary: "hsl(40,20%,92%)",
  muted:     "hsl(220,20%,40%)",
  accent:    "hsl(40,20%,92%)",
  // Legacy tints (now sage-derived)
  lav:       "hsl(140,20%,72%)",
  lavSoft:   "hsl(140,15%,67%)",
  lavPale:   "hsl(140,20%,92%)",
  // Semantic
  green: "#166534",  greenBg: "#DCFCE7",
  amber: "#854D0E",  amberBg: "#FEF9C3",
  red:   "hsl(0,84%,60%)",  redBg: "#FEE2E2",
};

/* ── Shared data ── */
/* ══════════════════════════════════════════════════════════════
   CURRICULUM — Full cold call training with theory-first design
   Pattern: Concept → Fundamentals → Application → Roleplay
══════════════════════════════════════════════════════════════ */
const MODULES = [
  {
    id:1, title:"The Cold Call Mindset", cat:"Foundations", level:"beginner",
    desc:"Before you dial, you need the right headspace. This module reframes cold calling from interruption to invitation — and shows you why most recruiters lose the call before it starts.",
    dur:"85 min", count:5, locked:false, pct:40, rec:true, isNew:false,
    lessons:[
      {id:1, title:"Why Most Cold Calls Fail Before Hello", dur:"15 min", type:"reading", done:true,
       content:{
         tldr:"Most calls fail because of mindset, not technique. The recruiter's energy and framing determines the outcome before a word is spoken.",
         theory:"The moment you pick up the phone believing you are interrupting someone, you've already lost. Research shows that tone of voice accounts for 38% of communication impact in phone calls. If you feel like a pest, you'll sound like one.\n\nThe single biggest shift top recruiters make is reframing the call from 'I need something from this person' to 'I have something worth their time.' That's not positive thinking — it's an accurate description of your role when you do it properly.",
         keyPoints:["Your internal state leaks through the phone — candidates feel it","The interruption mindset creates apologetic, weak openings","Top billers approach calls with calm authority, not nervous energy","Preparation is the foundation of genuine confidence"],
         reflection:"Think about your last 10 cold calls. How many did you approach feeling genuinely confident that you had something worth their time? What was different about the calls that went well?"
       }},
      {id:2, title:"The Permission Frame — Why You Need It", dur:"15 min", type:"reading", done:true,
       content:{
         tldr:"A permission frame isn't just polite — it's strategic. It shifts the dynamic from intrusion to conversation and dramatically increases how long candidates stay on the line.",
         theory:"The human brain is wired to resist being pushed and respond to being invited. When a recruiter opens with a feature dump ('I have a great opportunity for you'), the brain's threat response activates. When they open with curiosity and permission ('I wanted to run something by you — is now an okay moment?'), a different pathway opens.\n\nPermission doesn't mean being passive. It means being smart enough to earn your way into the conversation rather than demanding it.",
         keyPoints:["Permission reduces defensiveness before it starts","A 5-second permission question can double call length","You're signalling respect — which candidates respond to","Permission frames also qualify — reluctant candidates show themselves early"],
         reflection:"What's your current opening line? Does it invite or demand? How do candidates typically respond in the first 10 seconds?"
       }},
      {id:3, title:"Status Alignment — Peer vs Vendor", dur:"15 min", type:"reading", done:false,
       content:{
         tldr:"Candidates treat you the way you present yourself. Show up as a peer with expertise and you'll be heard. Show up as a vendor trying to place someone and you'll be brushed off.",
         theory:"Status is communicated through every word choice, pause, and assumption you make on a call. A recruiter who says 'I just wanted to quickly check if you might be open to...' is telegraphing low status. A recruiter who says 'I'm calling because your background stood out to me — I'd like to share why' is telegraphing peer level.\n\nPeer-to-peer communication creates trust. Vendor communication creates objections. The goal is to feel like a knowledgeable colleague sharing a relevant opportunity — not a salesperson pitching.",
         keyPoints:["Word choice signals your perceived status instantly","Hedging language ('just', 'quickly', 'might') communicates low confidence","Specific, prepared language signals professional respect","Candidates buy from peers — not from supplicants"],
         reflection:"Listen back to one of your recorded calls. Count how many times you use hedge words like 'just', 'quickly', 'might', 'possibly'. What would happen if you removed them all?"
       }},
      {id:4, title:"Structuring the Perfect Cold Call Opening", dur:"20 min", type:"reading", done:false,
       content:{
         tldr:"A great opening does four things in 20 seconds: establishes who you are, why you're calling, that you've done your homework, and asks for permission to continue.",
         theory:"The anatomy of a great cold call opening:\n\n1. Identity — your name and firm, said with confidence (not apologetically)\n2. Hook — one specific, relevant reason why THIS person (not anyone)\n3. Credibility — a brief signal that you understand their world\n4. Permission — a genuine question that invites rather than demands\n\nExample of weak: 'Hi, this is James from ABC Recruitment — I'm calling because we have some really good opportunities in your space and I just wanted to see if you were open to hearing about them?'\n\nExample of strong: 'Hi Sarah, it's James from Heidrick & Partners — I'm calling specifically because your work building out the data engineering team at Canva caught my attention. I've been working with a few senior DE leaders going through similar scale challenges. Would it be worth 5 minutes to see if there's any relevance?'\n\nThe second version does the same job in the same time — but it does it as a peer.",
         keyPoints:["Identity + Hook + Credibility + Permission = The Opening Formula","Specificity signals preparation — generic signals laziness","Always name a reason that relates to THEM, not to you","Ask for a time frame ('5 minutes') to reduce perceived commitment"],
         reflection:"Write out your ideal opening using the formula above. Then read it aloud. Does it sound like you, or does it sound scripted? What would make it more natural?"
       }},
      {id:5, title:"Roleplay: The First 20 Seconds", dur:"20 min", type:"roleplay", done:false,
       scenarioKey:"opening_beginner"}
    ]
  },
  {
    id:2, title:"Discovery — The Art of Asking the Right Questions", cat:"Core Skills", level:"beginner",
    desc:"Most recruiters pitch too early. This module teaches you to ask questions that uncover real motivators — the things candidates won't tell you unless you earn their trust first.",
    dur:"100 min", count:6, locked:false, pct:0, isNew:false,
    lessons:[
      {id:1, title:"Why Discovery Beats Pitching Every Time", dur:"15 min", type:"reading", done:false,
       content:{
         tldr:"Pitching without discovery is guessing. Discovery done well makes your pitch feel like a mirror — reflecting back exactly what the candidate cares about.",
         theory:"The fundamental mistake most recruiters make is telling candidates about the role before understanding what the candidate actually wants. This creates a mismatch — you're pitching features they didn't ask for.\n\nDiscover first. Then when you describe the role, you're translating it into their language, their goals, their timeline. That's the difference between a pitch and a conversation.",
         keyPoints:["Discovery creates the data your pitch needs to land","Questions signal genuine interest — pitching signals desperation","The best recruiters ask more than they talk","Discovery also builds trust — being asked good questions feels valuable"],
         reflection:"In your last 5 placements, how well did you actually understand what the candidate wanted before you presented them? What would you have done differently if you'd known more?"
       }},
      {id:2, title:"The Three Layers of Candidate Motivation", dur:"20 min", type:"reading", done:false,
       content:{
         tldr:"Candidates have surface motivators (salary, title), mid-layer motivators (team, culture, growth), and deep motivators (identity, autonomy, meaning). The third layer is where decisions are actually made.",
         theory:"Layer 1 — Surface: What they say when you first ask. 'I'm looking for a pay rise' or 'I want a bigger title.' Easy to get but not what drives decisions.\n\nLayer 2 — Mid: What they share after trust builds. 'My manager doesn't give me visibility' or 'I've been doing the same thing for two years.' More actionable.\n\nLayer 3 — Deep: What they won't say until they trust you. 'I feel invisible at work' or 'I want to be proud of what I do.' This is where real commitment to change lives.\n\nYour job is to ask questions that go below the surface. Not through interrogation — through genuine curiosity and patience.",
         keyPoints:["Most recruiters only reach layer 1","Layer 3 motivators predict whether they'll actually make a move","Getting deep requires trust — earned through listening, not pitching","Mirror back layer 3 insights in your pitch and you create alignment"],
         reflection:"Think about the last candidate who dropped out of a process. What was their stated reason? What do you think the real reason was? What question might have surfaced it earlier?"
       }},
      {id:3, title:"Question Sequencing — From Safe to Significant", dur:"20 min", type:"reading", done:false,
       content:{
         tldr:"You can't ask a deep question cold. You build towards it. Great recruiters sequence questions from low-stakes to high-stakes, creating the trust that makes honest answers possible.",
         theory:"The question ladder:\n\nRung 1 — Situational: 'How long have you been in your current role?' Easy, factual, safe.\nRung 2 — Experiential: 'What's been the most interesting part of the last 12 months?' Slightly more personal.\nRung 3 — Evaluative: 'If you could change one thing about where you're at now, what would it be?' Requires trust.\nRung 4 — Aspirational: 'What would a genuinely exciting next chapter look like for you?' Deep and personal.\n\nYou earn the right to ask rung 4 questions by listening carefully to rungs 1-3. Skipping rungs creates resistance.",
         keyPoints:["Every question you ask earns or costs you trust","Situational questions open the conversation — aspirational ones close deals","Silence after a good question is power — don't fill it","Follow-up questions show you're listening: 'What do you mean by that?'"],
         reflection:"Map out your current question sequence in a typical cold call. Which rung are you usually at? When do you move to the pitch — and is it too early?"
       }},
      {id:4, title:"Active Listening — How to Hear What Isn't Said", dur:"15 min", type:"reading", done:false,
       content:{
         tldr:"Most people listen to respond. Great recruiters listen to understand. The difference determines whether candidates feel heard — or processed.",
         theory:"Active listening is not nodding. It's a set of deliberate behaviours: mirroring key phrases back, pausing before responding, asking follow-up questions that prove you absorbed the answer, and noticing what isn't said.\n\nWhen a candidate says 'I'm okay where I am' with a slightly flat tone — that's data. When they say 'the team is great' but pause before answering — that's data. The most valuable information in a candidate call is often in the spaces.\n\nPractical technique: After a candidate answers, wait two seconds before you respond. You'll be surprised how often they fill that silence with the thing they almost didn't say.",
         keyPoints:["Silence is a listening tool — don't be afraid of it","Mirroring (repeating their last phrase) encourages depth","Emotional tone often contradicts the words — notice both","Taking notes signals respect and keeps you from rushing to your next question"],
         reflection:"Record your next three calls. Listen back and count how often you interrupt, jump to the next question before the last one is fully answered, or miss a follow-up opportunity."
       }},
      {id:5, title:"Roleplay: Discovery Conversation", dur:"20 min", type:"roleplay", done:false,
       scenarioKey:"discovery_beginner"},
      {id:6, title:"Roleplay: Going Deeper — Layer 3 Questions", dur:"10 min", type:"roleplay", done:false,
       scenarioKey:"discovery_intermediate"}
    ]
  },
  {
    id:3, title:"Handling Objections Like a Pro", cat:"Core Skills", level:"intermediate",
    desc:"'Not interested', 'happy where I am', 'send me an email' — these aren't dead ends. This module teaches you to hear the real message behind the objection and keep the conversation alive.",
    dur:"120 min", count:7, locked:false, pct:0, isNew:false,
    lessons:[
      {id:1, title:"What Objections Actually Mean", dur:"15 min", type:"reading", done:false,
       content:{
         tldr:"Most objections aren't real objections — they're reflexes. Understanding the difference between a reflex and a genuine 'no' is the first step to handling them well.",
         theory:"When a candidate says 'I'm not interested' in the first 30 seconds, they don't mean 'I've carefully considered your offer and decided it's not right for me.' They mean 'I don't know you yet and I'm protecting my time.'\n\nObjection taxonomy:\n\n1. Reflex objections — 'Not interested', 'Happy where I am', 'Send me an email.' These are automatic. Don't treat them as decisions.\n\n2. Genuine concern objections — 'I've got a lot going on at home right now', 'I just got a promotion.' These are real. Acknowledge them.\n\n3. Information objections — 'I don't know enough about the company.' These are buying signals disguised as pushback — give them what they need.\n\nMost recruiters fold on reflex objections. Top billers recognise them and gently stay in the conversation.",
         keyPoints:["Early objections are reflexes — not decisions","The tone of 'not interested' tells you more than the words","Caving to reflex objections costs you real opportunities","Distinguish the type before choosing your response"],
         reflection:"Write out the three objections you hear most often. Which type is each one? How are you currently responding to them — and is that response appropriate for the type?"
       }},
      {id:2, title:"The Acknowledge-Bridge-Redirect Method", dur:"20 min", type:"reading", done:false,
       content:{
         tldr:"The most effective way to handle an objection is to validate it first, then bridge to a question, then gently redirect. This method never argues — it opens doors.",
         theory:"A-B-R in practice:\n\nAcknowledge: 'That makes total sense — most people I speak with aren't actively looking.'\nBridge: 'The reason I'm reaching out specifically to you is...'\nRedirect: '...would it hurt to hear what I'm working on in 60 seconds and then you can tell me if it's worth a conversation?'\n\nThe key to the Acknowledge step is that it must be genuine. If it sounds like a technique, it feels like manipulation. If it sounds like you actually heard them, it disarms the objection.\n\nWhat doesn't work:\n- Ignoring the objection and ploughing on\n- Arguing with the objection ('But this is a really good opportunity!')\n- Immediately caving ('No worries, I'll send an email')\n- Over-explaining why they're wrong to object",
         keyPoints:["Acknowledge must be genuine — not a technique","Bridge connects their reality to your reason for calling","Redirect asks for a small commitment, not a big one","The whole A-B-R takes 15-20 seconds — brevity is key"],
         reflection:"Write out your A-B-R for the 'not interested' objection. Practice it out loud until it sounds natural, not scripted."
       }},
      {id:3, title:"'Send Me an Email' — The Recruiter's Trap", dur:"15 min", type:"reading", done:false,
       content:{
         tldr:"'Send me an email' is a polite way of saying goodbye. Accepting it means you've lost. This lesson shows you how to keep the conversation alive without being pushy.",
         theory:"'Send me an email' is the most common escape hatch. The candidate has decided the call isn't worth continuing and is offering you a way to feel like progress was made. It wasn't.\n\nThe email will not be read. Or if it is, it won't create action — because you never built enough connection to matter.\n\nThe response that works: 'I will — though I'd rather make sure what I send is actually relevant to you. Can I ask you one quick thing before I do? [pause] What would need to be true about an opportunity for you to actually take 20 minutes to explore it?'\n\nThis does three things:\n1. Agrees to their request (removes resistance)\n2. Reframes the email as personalised (adds value)\n3. Asks the one question that tells you everything",
         keyPoints:["Never just say 'sure' and accept the brush-off","Conditional agreement preserves the relationship while extending the call","The follow-up question is the whole point","If they won't answer even one question, the email definitely won't work"],
         reflection:"How many 'send me an email' calls have you had this month? What would be different if you converted even 30% of them to a real conversation?"
       }},
      {id:4, title:"The Spouse/Family Objection — The Hardest One", dur:"15 min", type:"reading", done:false,
       content:{
         tldr:"When a candidate raises family concerns, most recruiters back off too fast or push too hard. Both destroy trust. This lesson shows you how to honour the concern while keeping the door open.",
         theory:"'My partner isn't keen on me moving jobs right now' or 'We've got a lot going on at home' — these objections are genuine. They signal real emotional weight. The candidate is telling you something important: this decision isn't just professional.\n\nThe wrong response: 'Oh absolutely, I completely understand, no worries at all.' (Capitulation)\nThe other wrong response: 'I hear you — but the package on this one is really strong...' (Tone-deaf)\n\nThe right response: Acknowledge the weight of it. Then, and only then, ask one gentle question that keeps the door ajar without forcing it open.\n\n'That's a real consideration and I respect it. Can I ask — is it more about the timing of a move, or more about the type of opportunity?' This question does a lot. It shows you care, and it tells you whether the door is fully closed or just temporarily shut.",
         keyPoints:["Family objections are real — don't minimise them","The goal is to keep the door open, not win the argument","One gentle question preserves the relationship for later","Sometimes the best move is to agree to call back in 3 months"],
         reflection:"Think about the last time a candidate raised a family concern. How did you handle it? What would you do differently?"
       }},
      {id:5, title:"Happy Where I Am — Engaging Passive Candidates", dur:"15 min", type:"reading", done:false,
       content:{
         tldr:"The best candidates are never actively looking. 'Happy where I am' is your starting point — not your ending point. This lesson shows you how to spark curiosity in people who aren't looking for a reason to.",
         theory:"'Happy where I am' candidates are the most valuable candidates in any market. They have current roles, current credibility, and they're not desperate — which means they'll only move for the right thing. Your job is to find out if your opportunity is that thing.\n\nThe mistake is accepting the statement at face value. 'Happy where I am' rarely means 'perfectly content and never thinking about my future.' It usually means 'I'm not actively searching.'\n\nResponse approach:\n'That's great to hear — and honestly, the people I place are almost never looking. What I'd like to share is why I called you specifically...' [brief, compelling reason] '...Would it be worth knowing what's out there, even if you're not actively in the market?'\n\nThe last question reframes the conversation from 'are you leaving?' to 'would you like information?' Much easier to say yes to.",
         keyPoints:["Passive candidates are premium candidates — don't give up on them","'Happy' doesn't mean 'would never consider a great opportunity'","Reframe: from 'are you leaving?' to 'can I share something relevant?'","Pique curiosity — don't demand commitment"],
         reflection:"Who are the three candidates you most wish you'd placed in the last year? Were any of them 'happy where they were' when you first spoke? What happened?"
       }},
      {id:6, title:"Roleplay: The Open Door — Not Interested", dur:"15 min", type:"roleplay", done:false,
       scenarioKey:"objection_not_interested"},
      {id:7, title:"Roleplay: The Open Door — Spouse Objection", dur:"15 min", type:"roleplay", done:false,
       scenarioKey:"objection_spouse"}
    ]
  },
  {
    id:4, title:"Communicating Value — Making Opportunities Compelling", cat:"Core Skills", level:"intermediate",
    desc:"The best opportunity in the world falls flat if you can't make it feel relevant to this specific person. This module teaches you to translate role features into personal relevance.",
    dur:"90 min", count:5, locked:true, pct:0, isNew:false,
    lessons:[
      {id:1, title:"Feature vs Relevance — The Critical Distinction", dur:"20 min", type:"reading", done:false,
       content:{
         tldr:"A feature is what the role has. Relevance is what it means for this person. Pitching features without relevance is noise. Pitching relevance is a conversation.",
         theory:"'$180k base plus equity, Series B company, modern tech stack, hybrid work.' — That's a feature list. It might be impressive. But to this candidate, right now, is any of it actually meaningful?\n\nRelevance requires discovery first. Once you know what someone cares about — what they're frustrated by, what they're hoping for, what they want their career to feel like — you translate the role through that lens.\n\n'You mentioned your current stack hasn't evolved in three years and that's started to feel limiting. This role is building on Kubernetes and moving to a microservices architecture — which from what you've described is exactly the kind of technical challenge you're looking for.' That's relevance. It mirrors their words back to them in the context of the opportunity.",
         keyPoints:["Features tell. Relevance sells.","You can only be relevant if you've done discovery first","Use the candidate's own language when you describe the role","Relevance creates an 'aha' moment — features don't"],
         reflection:"Write out the value proposition for a role you're currently working. Now rewrite it as if you were speaking to a candidate who told you their biggest frustration was lack of career progression. Notice the difference."
       }},
      {id:2, title:"The One-Sentence Value Hook", dur:"15 min", type:"reading", done:false,
       content:{
         tldr:"You have 10 seconds to make someone want to hear more. A value hook is one sentence that says: I know who you are, I know what you care about, and I have something that connects to both.",
         theory:"The anatomy of a great value hook:\n\n[Observation about them] + [Connection to the opportunity] + [Invitation]\n\nExample: 'You've built two data teams from scratch in your career — this client is at exactly that inflection point and specifically wanted someone with that muscle. Would it be worth knowing more?'\n\nWhat makes it work:\n1. It references something specific about them (research)\n2. It connects that thing to why the role is relevant\n3. It ends with a low-stakes question, not a demand\n\nYou're not pitching the job. You're demonstrating you've done your homework and offering them relevant information.",
         keyPoints:["One sentence — not three paragraphs","Lead with what you know about them, not what you know about the role","End with a question, not a statement","Practice until it sounds natural and unrehearsed"],
         reflection:"Write a value hook for a candidate you're planning to call this week. Read it aloud 5 times until it doesn't sound like you're reading."
       }},
      {id:3, title:"Closing for Commitment — The Micro-Commitment Ladder", dur:"20 min", type:"reading", done:false,
       content:{
         tldr:"Big commitments follow small ones. Instead of asking 'are you interested in the role?', build a ladder of small yeses that lead naturally to the outcome you want.",
         theory:"Micro-commitments work because every small 'yes' builds psychological momentum toward the next one. Each agreement makes the next agreement easier.\n\nThe cold call commitment ladder:\nRung 1: 'Is now an okay moment for 2 minutes?' (yes/no)\nRung 2: 'Can I ask you one question about where you're at?' (engagement)\nRung 3: 'Based on what you've said — would it make sense to get 20 minutes on the calendar to explore this properly?' (meeting)\nRung 4: 'Great — I'll send the details and a calendar invite. Does Thursday or Friday work better?' (confirmation)\n\nYou're never asking for a big commitment. You're asking for the next small, reasonable step. Candidates are far less likely to say no to a small step than a big leap.",
         keyPoints:["Never ask for a big commitment when a small one will do","Each micro-yes makes the next one more likely","Always specify a next step — vague commitments evaporate","Offer two options, not open-ended choice ('Thursday or Friday?')"],
         reflection:"Map out your typical path from first contact to booked meeting. Where do you usually lose people? Is there a micro-commitment step that could bridge that gap?"
       }},
      {id:4, title:"Roleplay: Communicating Value — Passive Candidate", dur:"20 min", type:"roleplay", done:false,
       scenarioKey:"value_passive"},
      {id:5, title:"Roleplay: Happy Where I Am", dur:"15 min", type:"roleplay", done:false,
       scenarioKey:"objection_happy_intermediate"}
    ]
  },
  {
    id:5, title:"Confidence, Consistency & Emotional Readiness", cat:"Mindset", level:"intermediate",
    desc:"Technique only works when you're mentally in the game. This module builds the inner architecture that keeps you performing when the pressure is on and the calls are hard.",
    dur:"100 min", count:6, locked:false, pct:0, isNew:true,
    lessons:[
      {id:1, title:"Understanding Rejection as Information", dur:"15 min", type:"reading", done:false,
       content:{
         tldr:"Rejection on a cold call is not a verdict on you. It's data about timing, relevance, and execution. The recruiter who can receive rejection without absorbing it is the one who builds real resilience.",
         theory:"The brain doesn't naturally distinguish between social rejection and physical danger — both activate the same threat response. That's why a string of 'not interested' calls can feel genuinely demoralising, even though nothing objectively bad has happened.\n\nThe shift that changes everything is treating rejection as information rather than judgment:\n- 'Not interested' before 10 seconds = your opening needs work, or the timing was wrong\n- 'Not interested' after 30 seconds = your hook didn't connect\n- 'Happy where I am' = passive candidate who needs a different approach\n- 'Call me in 6 months' = a genuine opportunity with a timeline\n\nNone of these are about your worth as a person or a recruiter. They're data points.",
         keyPoints:["The brain treats social rejection as a physical threat — this is normal","Reframing rejection as data reduces its emotional charge","Every 'no' contains information about what to adjust","Top billers don't avoid rejection — they process it faster"],
         reflection:"Write down the last rejection that stung. What did you tell yourself about what it meant? What would a data-oriented interpretation look like instead?"
       }},
      {id:2, title:"The Pre-Call Ritual — Entering Every Call Ready", dur:"15 min", type:"reading", done:false,
       content:{
         tldr:"Elite performers have rituals. Not superstitions — deliberate practices that shift their state before high-stakes moments. Your pre-call ritual is how you enter every call as the best version of yourself.",
         theory:"State management is a learnable skill. The recruiter who picks up the phone after a bad call carrying all of that frustration will perform worse on the next call. The recruiter who has a 90-second reset routine lands fresh every time.\n\nA simple pre-call ritual:\n1. Take three slow breaths (physiologically resets the nervous system)\n2. Read one line about who this candidate is and why you're calling (builds genuine interest)\n3. Say the opening line aloud once (primes the muscle memory)\n4. Dial with the intention of learning something about this person, not placing them\n\nThe last step is the most important. If your intention is 'get a placement,' you'll sound transactional. If your intention is 'find out if I can genuinely help,' you'll sound human.",
         keyPoints:["State from the previous call bleeds into the next one","A 90-second reset routine is enough to break the pattern","Preparation creates confidence — confidence creates presence","Intention shapes tone more than technique"],
         reflection:"What's your current pre-call routine? If you don't have one, design one this week using the framework above and test it over 20 calls."
       }},
      {id:3, title:"Managing a Slump — When Nothing Is Working", dur:"20 min", type:"reading", done:false,
       content:{
         tldr:"Every recruiter hits patches where confidence drops and results follow. Understanding the psychology of a slump — and having a protocol to break it — is what separates average performers from great ones.",
         theory:"Slumps follow a predictable pattern: one bad day leads to lowered confidence, which leads to worse calls, which leads to more rejection, which confirms the negative belief. Breaking the loop requires interrupting it at the belief stage, not the result stage.\n\nSlump-breaking protocol:\n1. Name it: 'I'm in a slump. This is temporary and normal.'\n2. Narrow the focus: Instead of trying to do everything better, pick one thing (just the opening) and improve that.\n3. Lower the stakes: Change your goal from 'book a meeting' to 'have one genuine conversation.'\n4. Track leading indicators: Count calls made, not just outcomes. Reward effort, not results.\n5. Talk to someone: Isolation makes slumps worse. Share it with a peer or manager.",
         keyPoints:["Slumps are self-perpetuating belief loops — not evidence of incompetence","Breaking the loop requires a belief intervention, not a technique change","Narrowing focus reduces overwhelm and creates small wins","The fastest way out of a slump is through — not around it"],
         reflection:"Think about your worst slump. How long did it last? What eventually broke it? What would you have done differently if you'd had this framework?"
       }},
      {id:4, title:"Consistency Over Peaks — Building Sustainable Performance", dur:"15 min", type:"reading", done:false,
       content:{
         tldr:"The best recruiters aren't always at their peak — they've built systems that ensure they perform well even on average days. Consistency beats intensity.",
         theory:"Recruitment rewards consistency over brilliance. A recruiter who makes 30 quality calls every day will outperform one who makes 100 calls on good days and 10 on bad days over any meaningful time horizon.\n\nConsistency comes from:\n1. Non-negotiable daily habits (not goals — habits)\n2. Process attachment rather than outcome attachment\n3. Energy management (protecting the morning for high-value activities)\n4. Weekly review that adjusts without catastrophising\n\nThe goal is to make 'good enough' your floor — not your ceiling.",
         keyPoints:["Consistency beats peaks over any meaningful time horizon","Process attachment is more sustainable than outcome attachment","Energy management is a performance skill","Build systems that make good days easier and bad days less damaging"],
         reflection:"What are the 3 non-negotiable daily habits that would most improve your consistency? Which ones do you currently have? Which are missing?"
       }},
      {id:5, title:"Roleplay: Candidate Rejects You Harshly", dur:"20 min", type:"roleplay", done:false,
       scenarioKey:"resilience_harsh"},
      {id:6, title:"Roleplay: Recovering Mid-Call", dur:"15 min", type:"roleplay", done:false,
       scenarioKey:"resilience_recovery"}
    ]
  },
  {
    id:6, title:"Advanced Cold Call Mastery", cat:"Advanced", level:"advanced",
    desc:"For recruiters who have the fundamentals. This module covers gatekeeper navigation, multi-call sequencing, reading micro-signals, and closing passive candidates who've heard it all.",
    dur:"130 min", count:6, locked:true, pct:0, isNew:true,
    lessons:[
      {id:1, title:"Reading Micro-Signals in Real Time", dur:"20 min", type:"reading", done:false,
       content:{
         tldr:"The words a candidate says are 30% of the communication. The other 70% is in the pace, tone, hesitations, and language choices. This lesson teaches you to read the full signal.",
         theory:"Micro-signals are the small cues that reveal the real state of a candidate's interest — often before they're aware of it themselves.\n\nPositive micro-signals:\n- They ask a question (any question) — 'What company is it?' = they're considering\n- Their pace slows down — they're thinking rather than reacting\n- They use future tense — 'What would the team look like?'\n- They volunteer information you didn't ask for\n\nNegative micro-signals:\n- Monosyllabic answers after initial engagement\n- Speeding up — trying to end the call\n- 'Send me an email' with no preceding question\n- Interrupting your sentences\n\nThe skill is not just noticing these — it's adjusting in real time. If you spot a positive signal, go deeper. If you spot a negative one, don't push.",
         keyPoints:["Questions from the candidate are buying signals — always","Pace and tone reveal more than words","Future tense language means they're already imagining it","Adjust in real time based on what you're hearing"],
         reflection:"In your next 10 calls, focus only on noticing micro-signals. Don't change your approach — just observe. What do you notice?"
       }},
      {id:2, title:"Multi-Call Sequencing — The Long Game", dur:"20 min", type:"reading", done:false,
       content:{
         tldr:"Most great placements don't happen on the first call. Building a relationship across multiple touchpoints — each one adding value — is how top billers win passive candidates.",
         theory:"The first call plants a seed. The second call waters it. The third call often harvests it.\n\nEffective sequencing:\nCall 1: Introduction, brief hook, gather intelligence, no hard sell. End goal: be memorable and respectful.\nCall 2 (1-2 weeks later): Reference a specific piece of information from call 1. Add new value. Deeper discovery. End goal: 20-minute meeting or callback.\nCall 3: By now you're a known, trusted contact. The conversation is qualitatively different.\n\nBetween calls: a brief, personalised message ('Saw this article and thought of your comment about...') keeps the thread alive without pressure.",
         keyPoints:["Great recruiters play the long game — not every call needs to close","Each touchpoint should add value, not just chase","Reference previous conversations specifically — it signals you paid attention","Patience with a great candidate is a competitive advantage"],
         reflection:"Think about the last time you placed someone who had initially said 'no'. How many touchpoints did it take? What would that sequence look like if you designed it deliberately?"
       }},
      {id:3, title:"Gatekeeper Navigation — Getting to the Decision Maker", dur:"20 min", type:"reading", done:false,
       content:{
         tldr:"Gatekeepers aren't obstacles — they're people. The recruiter who treats them like one gets through. The one who tries to get around them rarely does.",
         theory:"The traditional approach to gatekeepers ('Is David in? Could you put me through?') signals exactly what you are — a cold caller trying to get past them. They've heard it a thousand times.\n\nThe reframe: treat the gatekeeper as a valued colleague who can help you reach the right person. This means:\n1. Using their name if you know it\n2. Explaining briefly why you're calling (not the full pitch)\n3. Asking for their help rather than trying to bypass them\n4. Following up with them by name the next time\n\n'Hi — I'm looking for some guidance. I'm trying to reach David around a confidential search I'm working — is there a better time to catch him, or would email be more appropriate?'\n\nThis approach treats the gatekeeper as a person with judgment, which they are. It works far more often than the bypass.",
         keyPoints:["Gatekeepers decide who gets through — don't work against them","Using their name and being transparent dramatically increases success","Ask for guidance, not permission","Build rapport with repeat gatekeepers over time"],
         reflection:"What's your current approach to gatekeepers? How does it land? What would change if you treated them as an ally rather than an obstacle?"
       }},
      {id:4, title:"Roleplay: The Skeptic — Senior Executive Who's Heard It All", dur:"20 min", type:"roleplay", done:false,
       scenarioKey:"advanced_skeptic"},
      {id:5, title:"Roleplay: Multi-Objection Call", dur:"20 min", type:"roleplay", done:false,
       scenarioKey:"advanced_multi_objection"},
      {id:6, title:"Roleplay: Gatekeeper Then Executive", dur:"15 min", type:"roleplay", done:false,
       scenarioKey:"advanced_gatekeeper"}
    ]
  },
  {
    id:7, title:"Pitching with a Limited Brief", cat:"Skills", level:"beginner",
    desc:"You won't always have all the details. This module teaches you how to pitch honestly when your brief is incomplete — how to acknowledge gaps, ask smart questions to fill them, and earn trust without bluffing.",
    dur:"55 min", count:5, locked:false, pct:0, rec:false, isNew:true,
    lessons:[
      {id:1, title:"Why Honesty Beats Bluffing Every Time", dur:"12 min", type:"reading", done:false,
       content:{
         theory:`When you're given an incomplete brief, there's a temptation to fill in the blanks with educated guesses — or worse, with confident-sounding vagueness. Candidates who've been burned by recruiters before are remarkably good at detecting this.

The counterintuitive truth: admitting you don't have all the details yet is often more persuasive than pretending you do. It signals that you're a straight talker. It builds the kind of trust that makes candidates want to stay in the conversation.

A limited brief is also a discovery opportunity. Every gap you have is a question you can ask — and asking smart questions shows competence. "I don't have the exact team size confirmed yet, but what would the right team look like for you?" is infinitely better than making something up.`,
         keyPoints:[
           "Candidates can smell bluffing — it destroys trust instantly",
           "Admitting gaps signals honesty, which is rare and valuable in recruitment",
           "Every unknown is a discovery question waiting to happen",
           "Lead with what you DO know — the role type, the fit rationale, the timing",
           "Earn the next conversation rather than over-promising the first one"
         ],
         reflection:"Think of a time you were caught not knowing something on a call. What happened? How would the conversation have gone differently if you'd led with honesty about the gap?"
       }
      },
      {id:2, title:"The Gap-Filling Framework", dur:"10 min", type:"reading", done:false,
       content:{
         theory:`When you're working with a limited brief, structure your conversation around three layers:

1. ANCHOR — Lead with what you know with confidence. "I'm working with a mid-size commercial construction contractor in Sydney on a PM role — project delivery, your seniority level, the timing of their pipeline fits with your experience."

2. ACKNOWLEDGE — Name the gaps before they ask. "I don't have the exact package confirmed yet — I'm getting those details this week. What I can tell you is the range sits around $130-150k based on comparable roles they've hired before."

3. ACTIVATE — Use gaps as discovery. "Before I can give you the full picture, I actually want to understand what matters most to you right now — because I want to make sure this is actually worth your time."`,
         keyPoints:[
           "Anchor: lead with confirmed, specific information you DO have",
           "Acknowledge: name the gaps proactively before they call you out",
           "Activate: turn unknowns into discovery questions",
           "Never invent specifics — vague ranges are fine, fabricated numbers are not",
           "Frame gaps as 'still confirming' not 'I don't know'"
         ],
         reflection:"Write out an Anchor-Acknowledge-Activate sequence for a brief you're currently working with where you don't have full information."
       }
      },
      {id:3, title:"What You Can and Can't Say", dur:"8 min", type:"reading", done:false,
       content:{
         theory:`There's a meaningful difference between things you don't know yet and things you're not authorised to share. Learn to distinguish them clearly — and communicate both with confidence.

Things you don't know yet: package breakdown, team size, reporting structure, project pipeline. These are gaps — be honest, give ranges where possible, and tell them when you'll have clarity.

Things you're not authorised to share: company name (confidential search), client details, internal salary band. These aren't gaps — they're intentional. Say so clearly: "The company is confidential at this stage — that's standard practice for searches like this, and I'll be able to share more once we've established mutual interest."

Candidates respect this. What they don't respect is being misled.`,
         keyPoints:[
           "Distinguish: I don't know yet vs. I'm not authorised to share",
           "Confidential searches are normal — explain the reason briefly",
           "Don't confuse confidentiality with evasion",
           "Give ranges where you have them, not silence",
           "Commit to when you'll have more information"
         ],
         reflection:`"The company name is confidential" — practice saying this out loud in three different ways. Which version sounds most confident and least defensive?`
       }
      },
      {id:4, title:"Practice Drill: Filling the Gaps", dur:"10 min", type:"reading", done:false,
       content:{
         theory:`Take these 5 limited-brief situations and practise turning each gap into either a discovery question or an honest acknowledgement:

1. You don't know the exact base salary — only a rough range
2. The company name is confidential
3. You don't know if there are direct reports in the role
4. You don't know the reason the previous person left
5. You don't know the growth stage or financial stability of the company

For each one, write two versions: the bluffing version (what a nervous recruiter might say) and the honest version (what a confident recruiter says). Compare them. The honest version is almost always stronger.`,
         keyPoints:[
           "Practise the honest version until it sounds confident, not apologetic",
           "Every gap has a clean, professional way to handle it",
           "The bluffing version sounds like weakness dressed as strength",
           "Candidates remember recruiters who were straight with them"
         ],
         reflection:"Identify one gap you're currently carrying in an active brief. Write the honest version of how you'd handle it on a call today."
       }
      },
      {id:5, title:"Roleplay: The Limited Brief Call", dur:"15 min", type:"roleplay", done:false,
       scenarioKey:"limited_brief_beginner"}
    ]
  },
  {
    id:8, title:"Pitching with a Full Brief — Using Information to Win", cat:"Skills", level:"intermediate",
    desc:"A detailed brief is a weapon most recruiters waste. This module teaches you how to use specific information to earn trust, demonstrate competence, and differentiate yourself from every other recruiter who calls that candidate.",
    dur:"60 min", count:5, locked:false, pct:0, rec:false, isNew:true,
    lessons:[
      {id:1, title:"Why Specificity Is the Most Underused Sales Tool", dur:"12 min", type:"reading", done:false,
       content:{
         theory:`Every candidate gets called by at least three recruiters for any decent role. Almost all of them say the same things: "great company," "exciting opportunity," "really competitive package." By the time your call lands, candidates have become immune to these phrases.

Specificity is the pattern interrupt. When you say "I'm calling because your work leading the commercial delivery on the Parramatta metro extension directly maps to the $2.1B Cross River Rail project they've just won," the candidate's brain responds differently. It registers: this person actually knows something. This is worth my time.

The data backs this up. Research on persuasion consistently shows that concrete, specific information is processed as more credible than vague claims — even when the vague claim is technically saying the same thing. "Top quartile compensation" means nothing. "$162k base + vehicle allowance + 12% super" means something.`,
         keyPoints:[
           "Generic pitching is invisible — candidates have tuned it out",
           "Specificity signals preparation, which signals competence",
           "Concrete figures (not just ranges) land harder in the brain",
           "Name the specific project, team, person, or detail that makes this relevant to them",
           "The goal isn't to impress — it's to make the candidate feel like this call was worth taking"
         ],
         reflection:"Look at your last 5 opening lines on cold calls. How many contained a specific, verifiable detail about either the role or the candidate's background? What would the specific version have sounded like?"
       }
      },
      {id:2, title:"The Relevance Bridge — Connecting Their Background to the Opportunity", dur:"10 min", type:"reading", done:false,
       content:{
         theory:`A full brief gives you the ingredients. The Relevance Bridge is how you connect them to the specific candidate you're calling.

The bridge has two sides:
- LEFT SIDE: something specific about the candidate's background (from their LinkedIn, your research, or prior conversation)
- RIGHT SIDE: something specific about the opportunity (from your brief)

The bridge itself is one sentence that explicitly connects them: "The reason I'm calling you specifically is [their background detail] maps directly to [specific opportunity detail]."

This isn't flattery — it's evidence. You're showing them that you've actually done the work of connecting who they are to what this role needs. That's rare. That's what earns the conversation.`,
         keyPoints:[
           "The Relevance Bridge: their background → specific connection → opportunity detail",
           "It has to be genuine — don't stretch connections that aren't there",
           "One precise bridge is worth more than three vague compliments",
           "It answers the candidate's unspoken question: 'Why me?'",
           "Use it in your opening — don't save it for later"
         ],
         reflection:"Pick a role you're currently working on. Write a Relevance Bridge for three different candidate profiles. Compare them. Which feels most compelling and why?"
       }
      },
      {id:3, title:"Package Architecture — Presenting Compensation as a Story", dur:"8 min", type:"reading", done:false,
       content:{
         theory:`Most recruiters lead with base salary. That's understandable — it's the easiest number to quote. But it's also the most commoditised. Every competitor calling the same candidate will lead with base.

When you have a full package breakdown, lead with total compensation architecture instead. Walk through every component: base, bonus structure, super, allowances, equity, leave, development budget. Each component you name is a point of differentiation and a potential trigger for the candidate's personal priorities.

Some candidates care most about the vehicle allowance. Some about the bonus structure. Some about the equity path. You don't know which until you present the full picture — and then watch which detail they ask about first. That tells you what they value. That tells you where to focus.`,
         keyPoints:[
           "Lead with total compensation architecture, not just base",
           "Name every component — each one is a potential priority trigger",
           "The component they ask about first tells you what they value most",
           "Total package framing makes the opportunity feel more substantial",
           "Never present one number when you can paint a full picture"
         ],
         reflection:"Take the most recent role you placed or are working on. Can you articulate the full compensation architecture from memory? Write it out in one paragraph the way you'd say it on a call."
       }
      },
      {id:4, title:"Handling 'Tell Me More' — Depth Without Overwhelm", dur:"10 min", type:"reading", done:false,
       content:{
         theory:`When a candidate says "tell me more," it's a gift. Most recruiters respond by dumping every fact in the brief at once. The candidate's brain glazes over.

The right response is layered disclosure. Start with the most compelling detail (the one most relevant to what you've already learned about them), then pause. Let them respond. Their response tells you what layer to go to next.

Think of it like a conversation, not a data transfer. You're not downloading information — you're finding out which pieces of information matter to this specific person, in this specific moment. Every time they lean in on a detail, go deeper on that one. Every time they seem unimpressed, pivot to a different angle.

The brief gives you the options. The candidate tells you which option to play.`,
         keyPoints:[
           "Lead with the most compelling detail, then pause",
           "Their response tells you which thread to follow",
           "Layered disclosure > information dump",
           "Watch for lean-ins — these tell you what matters to them",
           "The brief is a menu, not a script — let the candidate order"
         ],
         reflection:"Think of a recent call where you had a full brief. Did you dump the information or layer it? What would the layered version have looked like?"
       }
      },
      {id:5, title:"Roleplay: The Full Brief Pitch", dur:"20 min", type:"roleplay", done:false,
       scenarioKey:"full_brief_intermediate"}
    ]
  },
  {
    id:9, title:"The Questioning Funnel", cat:"Questioning Mastery", level:"intermediate",
    desc:"Most recruiters ask surface questions and wonder why candidates don't open up. This module takes you through the full questioning funnel — from situation questions down to need-payoff — and shows you how to sequence them to unlock real motivation.",
    dur:"110 min", count:6, locked:false, pct:0, rec:true, isNew:true,
    lessons:[
      {id:91, title:"Why Most Questions Stay on the Surface", dur:"12 min", type:"reading", done:false,
       content:{
         intro:"There's a reason most cold calls feel transactional. It's not the hook, the timing, or even the product. It's the questions. Surface questions get surface answers. Deep questions get real conversations.",
         theory:`The questioning funnel isn't a technique — it's a model for how trust actually works in a conversation.

When a candidate first picks up, they're in self-protection mode. They don't know you, they don't trust you, and they're waiting for the moment to hang up. Every question you ask either confirms their suspicion (recruiter fishing for CV data) or disrupts it (this person is genuinely curious about me).

Surface questions — "Are you happy in your role?" "Are you open to opportunities?" — sit at the wide top of the funnel. They're easy to answer with yes or no. They don't require the candidate to think, and they don't require you to listen. They're data-collection dressed up as conversation.

The funnel narrows as you go deeper. Situational questions establish context. Problem questions surface frustrations. Implication questions reveal the real cost of staying still. Need-payoff questions connect movement to what the candidate actually wants.

The mistake most recruiters make isn't asking bad questions. It's stopping too soon. They ask one good question, get a decent answer, and immediately pivot to pitching. The real signal was one follow-up away.`,
         keyPoints:[
           "Surface questions get compliance. Deep questions get commitment.",
           "The funnel moves: Situation → Problem → Implication → Need-payoff",
           "Stopping too soon is the most common questioning mistake",
           "Silence after a question is not awkward — it's the candidate thinking",
         ],
         practiceTask:"Before your next roleplay, write down 2 situational, 2 problem, and 1 implication question for the scenario. Say them out loud until they don't sound scripted."
       }
      },
      {id:92, title:"Situation Questions — Setting the Stage Without Interrogating", dur:"14 min", type:"reading", done:false,
       content:{
         intro:"Situation questions are the foundation. They establish facts and context. But used carelessly, they feel like a form. Used well, they open the door to everything deeper.",
         theory:`Situation questions are the who/what/when/where of a conversation. They're necessary — but only as a launchpad, not the destination.

The common mistake is treating situation questions as data-gathering. "How long have you been there?" "What's your team size?" These aren't wrong — but asked in sequence without curiosity, they feel like a police interview.

The better approach: ask one situation question and then actually use the answer. "You've been there four years — what's kept you engaged this long?" That second question signals that you heard the first answer and you care about the person behind it.

Situation questions to use:
- "What's your current setup look like — team, scope, direct reports?"
- "How long have you been in your current role?"
- "What kind of work takes up most of your time right now?"

Situation questions to avoid:
- Any question you could answer by looking at their LinkedIn
- Any question with an obvious yes/no answer that doesn't lead anywhere
- Any sequence of more than two situation questions in a row

The goal is to establish just enough context to ask a meaningful problem question. Don't linger.`,
         keyPoints:[
           "Situation questions are the entry point, not the destination",
           "One good situation question + one genuine follow-up beats five data questions",
           "Never ask what you can already find on LinkedIn",
           "Transition from situation to problem within 2 questions",
         ],
         practiceTask:"Write 3 situation questions for your most common candidate type. For each one, write the follow-up that shows you actually listened."
       }
      },
      {id:93, title:"Problem Questions — Finding the Real Friction", dur:"15 min", type:"reading", done:false,
       content:{
         intro:"Problem questions are where most sales conversations actually start. They surface the gap between where the candidate is and where they want to be. Find the gap and you find the motivation.",
         theory:`Problem questions invite candidates to articulate their frustrations. Not the surface ones — "my commute is annoying" — but the real ones: "I'm not being challenged anymore" or "I can see the ceiling from where I'm sitting."

The skill isn't in the question itself. It's in the patience to let the answer land.

Most recruiters hear the first sign of frustration and immediately pivot to their opportunity. "Oh you're not being challenged? Perfect — we have a role that..." This is the instinct to kill. You've just confirmed you're not listening. You're just looking for a way in.

The right move: ask one more question. "When you say you're not being challenged — what would challenge look like for you right now?" That question does three things: it shows you heard them, it gives them permission to think out loud, and it tells you exactly how to frame your opportunity when you do eventually mention it.

Problem questions that work:
- "What's the part of your current role you'd most like to change?"
- "If you could rebuild your day from scratch, what would look different?"
- "What's missing from your current setup that would make your job more satisfying?"
- "What would need to change for you to feel really well-used in your work?"`,
         keyPoints:[
           "Problem questions surface the gap — that's where real motivation lives",
           "Don't pivot to the opportunity the moment you hear frustration",
           "Ask one more question when you get the first sign of openness",
           "The best problem questions invite candidates to think, not just report",
         ],
         practiceTask:"Take your last 3 declined candidates. What problem question might have revealed a different answer? Write it down."
       }
      },
      {id:94, title:"Implication Questions — Raising the Emotional Stakes", dur:"15 min", type:"reading", done:false,
       content:{
         intro:"Implication questions are the most powerful — and the most under-used. They help the candidate feel the real cost of staying still. This is where motivation becomes real.",
         theory:`Most candidates know something is off in their current role. They don't always feel it urgently enough to move. Implication questions change that — not by pushing, but by helping them connect the dots themselves.

If a candidate says "I'm not getting the opportunities I expected," a surface-level recruiter moves on. A great recruiter asks: "And what does that mean for where you'll be in two years if nothing changes?"

That question isn't manipulation. It's clarity. You're inviting them to think about what staying still actually costs — not what it costs today, but what it compounds into.

Implication questions to use:
- "If that doesn't change in the next 12 months, where does that leave you?"
- "What does it mean for your development if you're still in this role in two years?"
- "How does that limitation affect the kind of work you're able to do?"
- "If the ceiling stays where it is — what are your options?"

Rules for implication questions:
1. Only ask them after you've established a genuine problem (don't manufacture urgency)
2. Ask them with genuine curiosity, not leading pressure
3. Let the silence sit after they answer — they're working something out
4. Don't jump in with your solution. Ask one more question.`,
         keyPoints:[
           "Implication questions make the cost of staying still real — without pressure",
           "Only ask once a genuine problem has been established",
           "The most powerful implication question ends with silence",
           "Resist the urge to solve — stay in the question a moment longer",
         ],
         practiceTask:"Write one implication question for each of your 3 most common candidate types. Practice them out loud until they sound natural — not clinical."
       }
      },
      {id:95, title:"Need-Payoff Questions — Letting Them Sell Themselves", dur:"13 min", type:"reading", done:false,
       content:{
         intro:"Need-payoff questions are the close of the funnel. They invite the candidate to articulate what a solution would give them — which means they're selling themselves. This is where conversations turn into commitments.",
         theory:`By the time you reach need-payoff questions, you've done the hard work. You've established their situation, uncovered their frustrations, and helped them feel the weight of staying still. Now you invite them to imagine something better.

Need-payoff questions don't pitch. They ask.

"If you could step into a role where you were genuinely stretched every week — what would that feel like for you?"
"If that ceiling wasn't there — what would you go after?"
"What would having full ownership of a P&L do for your career in the next three years?"

When a candidate answers these questions well, they're not responding to you — they're responding to themselves. They've just articulated what they want. Your opportunity just became the answer to their own question.

This is the point where you introduce the role — not before. And when you do, you frame it through their language, their priorities, their version of what "better" looks like.

Common mistake: asking need-payoff questions too early. They only work when the problem and implication are already real. Used prematurely, they feel like sales scripts.`,
         keyPoints:[
           "Need-payoff questions invite candidates to articulate their own motivation",
           "When they answer well, they've just sold themselves",
           "Introduce the role AFTER the need-payoff — not before",
           "Frame the opportunity in their language, their priorities",
         ],
         practiceTask:"In your next 3 calls, don't mention the role until the candidate has answered at least one need-payoff question. Notice what changes."
       }
      },
      {id:96, title:"Roleplay: Full Funnel Sequence", dur:"25 min", type:"roleplay", done:false,
       scenarioKey:"funnel_intermediate"}
    ]
  },
];


/* ══════════════════════════════════════════════════════════════
   ROLEPLAY SCENARIOS
   Each scenario: persona brief, candidate details, opportunity brief,
   difficulty level, system prompt for human-like AI response
══════════════════════════════════════════════════════════════ */
const SCENARIOS = {

  opening_beginner: {
    difficulty: "beginner",
    moduleContext: "The Cold Call Mindset",
    skillFocus: "Opening & Permission Frame",
    brief: {
      briefType: "full",
      industry: "Technology / SaaS",
      role: "Senior Software Engineer — Backend (IC with optional lead path)",
      company: "GrowthStack (Series B, 150 staff, remote-first, product-led growth)",
      package: "$160k–$185k base + equity (0.1–0.2%) + full remote + L&D budget",
      location: "Remote-first, anywhere AU/NZ",
      teamSize: "Joining a team of 6 backend engineers, reporting to VP Eng",
      reportsTo: "VP Engineering (ex-Atlassian, strong technical leader)",
      whyRelevant: "Candidate recently promoted to Lead — role is 80% hands-on, no forced management track",
      keySellingPoints: ["No forced management track — stays hands-on if preferred", "Greenfield backend architecture project starting Q2", "Series B runway, IPO track within 3 years", "Full remote with optional Sydney hub access"],
    },
    candidate: {
      name: "Marcus Webb",
      ini: "MW", col: "#7C6FCD",
      title: "Senior Software Engineer → recently moved to Lead",
      company: "DataPulse (mid-size, 300 staff)",
      tenure: "3.5 years",
      personality: "Busy but not unkind. Skeptical of recruiters but will engage if you earn it.",
      hook: "He accepted a team lead role 6 months ago that sounded exciting — it's turned out to be mostly admin. He misses building."
    },
    coachObjectives: [
      "Open with identity + specific hook (not generic)",
      "Ask for permission before going further",
      "Sound like a peer — not a vendor",
      "If they push back, use A-B-R (Acknowledge-Bridge-Redirect)"
    ],
    system: `You are playing Marcus Webb — a Senior Software Engineer who recently moved into a Lead role at DataPulse, a mid-size tech company. You've been in the role 6 months and it's turned out to be mostly meetings and people management. You miss hands-on coding and building real things, though you haven't told many people this.

You are busy and slightly skeptical of recruiters — you've been called by generic, scripted recruiters before and it wastes your time. However, you're not rude. If the recruiter opens with something specific and relevant, you'll engage. If they open with a generic pitch, you'll brush them off quickly.

PERSONALITY:
- Direct but fair
- Short answers initially, longer if you're engaged
- You might ask a probing question if curious ("What company is it?" or "How did you find me?")
- You won't volunteer your frustrations about the lead role unless asked the right question

RESPONSE STYLE:
- Keep initial responses SHORT (1-2 sentences) — you're mid-task
- If the recruiter earns the conversation, warm up gradually
- Sound completely natural — use contractions, occasional hesitation, realistic speech
- Do NOT sound like a chatbot or a script
- React to what the recruiter actually says, not a pre-planned response

IMPORTANT — SOUND COMPLETELY HUMAN: Use natural speech, contractions, hesitations. React to exactly what they just said. Vary sentence length. Show real emotion — slight impatience, warmth if earned. Never sound like a script.


CALL FLOW:
- Start: mildly guarded ("Yeah? Who's this?")
- If opening is generic: give a short brush-off ("Yeah look, I'm pretty happy where I am. Send me an email.")
- If opening is specific and earns permission: engage with short but real answers
- If discovery is good: open up about the admin-heavy lead role
- After 6-8 turns: conclude naturally

SCENARIO: The recruiter is calling about a Backend Lead / IC hybrid role at a Series B company (GrowthStack) — $160-185k, remote-first, still hands-on technical. This would be relevant to Marcus if the recruiter discovers his frustration.

Opening line when recruiter calls: "Yeah?" (like someone who picked up without looking at the number)`
  },

  discovery_beginner: {
    difficulty: "beginner",
    moduleContext: "Discovery",
    skillFocus: "Question Sequencing & Active Listening",
    brief: {
      briefType: "full",
      industry: "Financial Services / Asset Management",
      role: "Senior Risk Analyst → pathway to Risk Manager within 18 months",
      company: "FinBridge Capital (boutique, 80 staff, AUM $4.2B, growing 35% YoY)",
      package: "$140k–$160k base + 15–20% discretionary bonus + profit share",
      location: "Sydney CBD — hybrid 3 days in office",
      teamSize: "Risk team of 4, direct access to CRO",
      reportsTo: "Chief Risk Officer (ex-Macquarie, 20 years experience)",
      whyRelevant: "Clear promotion pathway to Manager — candidate has been stagnant 4 years",
      keySellingPoints: ["Formal 18-month pathway to Risk Manager", "Direct CRO mentorship", "Boutique culture — contribution is visible", "Significantly better bonus structure"],
    },
    candidate: {
      name: "Priya Nair",
      ini: "PN", col: "#9B7FD4",
      title: "Risk Analyst (3 years same level)",
      company: "Commonwealth Mutual",
      tenure: "4 years total",
      personality: "Thoughtful, measured. Will answer questions properly if asked properly. Not forthcoming unless directly asked.",
      hook: "She's been passed over for promotion twice. She hasn't explicitly job-searched but checks LinkedIn more than she admits."
    },
    coachObjectives: [
      "Move through the question ladder — situational → experiential → evaluative → aspirational",
      "Listen for what isn't said — notice hesitation and follow up",
      "Don't pitch the role until you understand her world",
      "Mirror her language back when you do describe the opportunity"
    ],
    system: `You are playing Priya Nair — a Risk Analyst at Commonwealth Mutual who has been in the same level for 4 years. You were passed over for promotion twice in that time, which has been demoralising, though you haven't told anyone outside your closest circle.

You're not actively job searching but you're not completely closed to the idea either. You check LinkedIn occasionally. You take your work seriously and have a lot of institutional knowledge.

PERSONALITY:
- Thoughtful and measured — you don't speak rashly
- You answer questions properly when asked, but you don't volunteer information
- You're a little guarded initially but you warm up when you feel genuinely heard
- You have a subtle frustration about your career progression that will come out if asked the right questions
- You're not bitter — but you are quietly wondering if this company is right for you long-term

RESPONSE STYLE:
- Realistic, natural speech — contractions, occasional pauses ("I mean... it's been fine")
- Start with measured, slightly cautious responses
- If the recruiter asks shallow questions, you give shallow answers
- If the recruiter asks something that shows real curiosity, you give a fuller, more honest answer
- Your deepest honest answer: you're frustrated by the lack of progression and feel underestimated
- Never volunteer this — only if the question earns it

IMPORTANT — SOUND COMPLETELY HUMAN: Use natural speech, contractions, hesitations. React to exactly what they just said. Vary sentence length. Show real emotion — slight impatience, warmth if earned. Never sound like a script.


CALL FLOW:
- Polite but not warm initially
- Engage progressively as questions improve
- If asked about career goals (directly), give a surface answer first, then a more honest one if pressed
- If asked specifically about promotion or recognition, be honest about the situation
- After 7-8 turns, wrap up naturally

Opening line when called: "Hi — this is Priya."`
  },

  discovery_intermediate: {
    difficulty: "intermediate",
    moduleContext: "Discovery",
    skillFocus: "Layer 3 Motivators — Going Deeper",
    brief: {
      industry: "Healthcare Technology",
      role: "Head of Product",
      company: "MedAI (Series A, 60 staff, mission-driven)",
      package: "$200k–$220k + significant equity",
      whyRelevant: "Candidate in large corporate — talented but feels disconnected from impact"
    },
    candidate: {
      name: "Daniel Osei",
      ini: "DO", col: "#6B5FB5",
      title: "Senior Product Manager → Group PM",
      company: "HealthCorp (ASX listed, 2000+ staff)",
      tenure: "5 years",
      personality: "Smart, articulate, outwardly content. Inwardly questioning whether his work matters.",
      hook: "Joined HealthCorp believing in their mission — five years on, he feels like a process manager in a bureaucracy. The product decisions he cares about are made three levels above him."
    },
    coachObjectives: [
      "Get below the surface — don't accept 'things are good' at face value",
      "Find the gap between what he says and what he means",
      "The key question: what does he want his work to feel like?",
      "Connect the opportunity to his identity, not just his resume"
    ],
    system: `You are playing Daniel Osei — a Group Product Manager at HealthCorp, a large listed healthcare company. You're good at your job and respected internally. From the outside, your career looks excellent.

On the inside, you joined HealthCorp 5 years ago because you believed in the mission of improving patient outcomes. But over time, the company has become more focused on shareholder returns and internal politics. You're now three layers removed from the actual product decisions you care about. You spend most of your time in stakeholder management, budget meetings, and internal alignment. You haven't told anyone this — including yourself, fully.

PERSONALITY:
- Articulate, thoughtful, slightly guarded with strangers
- Outwardly positive about your career ("Things are good, I've had a good run here")
- But there's a quiet dissatisfaction that comes out when asked the right question
- You respond well to genuine curiosity and thoughtful questions
- You'll give honest answers if the question feels real, not scripted

RESPONSE STYLE:
- Polished speech — you're used to presenting ideas clearly
- Initially upbeat about your role ("Yeah, it's been a good 5 years")
- If asked probing questions about impact, meaning, or what you wish were different — there's more beneath
- Your honest truth: you miss feeling like your work matters. You want to see the thing you built actually help a patient.
- This only comes out if someone asks the right question with genuine curiosity

IMPORTANT — SOUND COMPLETELY HUMAN: Use natural speech, contractions, hesitations. React to exactly what they just said. Vary sentence length. Show real emotion — slight impatience, warmth if earned. Never sound like a script.


CALL FLOW:
- Engaged and polite from the start (you're senior enough to have confident conversations)
- Surface answers first, deeper ones earned
- If the recruiter pitches the role before understanding you, you'll lose interest quickly
- If they discover your real situation, you'll be genuinely curious about a mission-driven PM role

Opening line: "Daniel speaking."`
  },

  objection_not_interested: {
    difficulty: "beginner",
    moduleContext: "Handling Objections",
    skillFocus: "Acknowledge-Bridge-Redirect / Reflex Objection",
    brief: {
      industry: "Engineering / Infrastructure",
      role: "Civil Project Manager",
      company: "Apex Infrastructure (private, 400 staff, major projects)",
      package: "$130k–$150k + vehicle allowance",
      whyRelevant: "Candidate at small firm with limited project scale"
    },
    candidate: {
      name: "Tom Reardon",
      ini: "TR", col: "#8B7DB8",
      title: "Project Manager",
      company: "Harlow Civil (boutique, 40 staff)",
      tenure: "2.5 years",
      personality: "Straight-talking, no-nonsense. Will say 'not interested' immediately — a reflex, not a decision.",
      hook: "Tom is privately frustrated by the small project scale at Harlow. He's capable of more but doesn't know how to make the leap."
    },
    coachObjectives: [
      "Recognise 'not interested' as a reflex, not a decision",
      "Use A-B-R (Acknowledge-Bridge-Redirect) without sounding scripted",
      "Stay calm — don't fold or push",
      "If you keep the door open, discover what he actually wants"
    ],
    system: `You are playing Tom Reardon — a Project Manager at a small civil engineering firm. You're busy, straight-talking, and your default on cold calls is 'not interested.' You've said it so many times it's automatic.

However, you're not completely closed. You're privately a bit frustrated with the small scale of projects at your current firm. You're good at your job and feel ready for something bigger — you just haven't actively done anything about it.

PERSONALITY:
- No-nonsense, direct
- Low patience for waffle or generic pitches
- Automatic 'not interested' in the first 10 seconds — it's a reflex
- If the recruiter acknowledges it without panicking and stays in the conversation calmly, you're willing to give them 30 more seconds
- If they keep pushing without listening, you hang up
- If they say something specific and relevant, you'll engage

RESPONSE STYLE:
- Short, clipped answers initially
- 'Yeah look, I'm not interested mate' or 'I'm pretty flat out, not looking for anything'
- If they persist calmly with something relevant: 'Yeah, alright, what is it?'
- Gradually more open if the conversation feels real
- Honest about project scale frustration if asked directly

IMPORTANT — SOUND COMPLETELY HUMAN: Use natural speech, contractions, hesitations. React to exactly what they just said. Vary sentence length. Show real emotion — slight impatience, warmth if earned. Never sound like a script.


CALL FLOW:
- Immediate brush-off: 'Not interested' or 'Happy where I am'
- If recruiter uses A-B-R properly: give them 30 seconds ('Fine, go on')
- If discovery is good: open up about wanting bigger project exposure
- After 6-7 turns: natural conclusion

Opening line: "Yeah, Tom here." (flat tone)`
  },

  objection_spouse: {
    difficulty: "intermediate",
    moduleContext: "Handling Objections",
    skillFocus: "Genuine Concern Objection — Family / Personal",
    brief: {
      industry: "Accounting & Finance",
      role: "Finance Manager",
      company: "Anchor Group (national, 600 staff, stable)",
      package: "$120k–$135k + bonus",
      whyRelevant: "Candidate underpaid and underutilised — but has genuine family concerns about change"
    },
    candidate: {
      name: "Natasha Brennan",
      ini: "NB", col: "#A090CC",
      title: "Senior Accountant",
      company: "Whitmore Partners (mid-tier accounting firm)",
      tenure: "3 years",
      personality: "Warm but cautious. Genuinely torn. Her partner is hesitant about her making a move right now.",
      hook: "Natasha is underpaid by about $20k market rate and knows it. She'd love a new role but her husband is in between jobs and the timing feels wrong."
    },
    coachObjectives: [
      "Acknowledge the family concern genuinely — not as a technique",
      "Ask a gentle question that keeps the door open without pressure",
      "Find out: is it timing or type of opportunity?",
      "Never push — offer to revisit if timing changes"
    ],
    system: `You are playing Natasha Brennan — a Senior Accountant who is in a comfortable but underpaid role. You know you're below market rate. You've thought about exploring other options but your husband recently moved between jobs and the household finances feel a bit precarious right now. You've told him you're not looking for anything new — and you partly believe that yourself.

You're warm and reasonable on the phone. Not dismissive of the recruiter, but genuinely hesitant.

PERSONALITY:
- Kind and polite — you give people a fair hearing
- Genuinely conflicted — part of you wants to explore, part of you feels it's bad timing
- Your objection is real, not a brush-off
- If the recruiter acknowledges the concern properly and asks one gentle question, you'll open up
- If they push, you'll close down

RESPONSE STYLE:
- Warm but measured speech
- 'Look, I'm actually not in a great position to be looking right now — my partner is in between jobs and it's just not the right time for us.'
- If pressed tactfully: 'I mean, I know I'm probably underpaid for my experience. But the timing's just not right.'
- If asked 'is it timing or the type of opportunity?' — you'll answer honestly: it's timing
- You'd consider a conversation in 3-4 months

IMPORTANT — SOUND COMPLETELY HUMAN: Use natural speech, contractions, hesitations. React to exactly what they just said. Vary sentence length. Show real emotion — slight impatience, warmth if earned. Never sound like a script.


CALL FLOW:
- Polite opening, then genuine family objection surfaces
- If recruiter acknowledges it well: slightly more open
- If recruiter pushes salary: closes down
- If recruiter asks about timing vs opportunity type: honest, open answer
- Natural conclusion: either a follow-up call booked in 3 months, or a polite exit

Opening line: "Hi, Natasha speaking."`
  },

  value_passive: {
    difficulty: "intermediate",
    moduleContext: "Communicating Value",
    skillFocus: "Relevance Over Features / Value Hook",
    brief: {
      industry: "Marketing Technology",
      role: "Head of Growth",
      company: "Launchpad (Series A, 80 staff, rapid growth)",
      package: "$190k–$210k + equity",
      whyRelevant: "Candidate at corporate — constrained by bureaucracy and slow decision-making"
    },
    candidate: {
      name: "Zoe Hartley",
      ini: "ZH", col: "#C4BCEE",
      title: "Senior Marketing Manager",
      company: "Teleco (large national corporation)",
      tenure: "4 years",
      personality: "High energy, ambitious. Frustrated by the pace of a large company but loyal. Won't move unless something genuinely compelling.",
      hook: "Zoe has great ideas that take 6 months to get approved. She loves her team but is slowly losing the ambition that brought her to marketing in the first place."
    },
    coachObjectives: [
      "Lead with what you know about HER — not the role's features",
      "Build a value hook using discovery information",
      "Create relevance — connect opportunity to her frustration",
      "Use micro-commitment to get a meeting, not an answer"
    ],
    system: `You are playing Zoe Hartley — a Senior Marketing Manager at a large telecommunications company. You're talented, high-energy, and ambitious — but four years in a big corporate has slowed you down. You have great ideas that take 6 months to get approved. You're not unhappy, but you're quietly losing your edge.

You won't entertain a recruiter who pitches you features. If someone says 'great base + equity' you'll tune out. But if someone demonstrates they understand your world and offers something specifically relevant to what you care about — speed, ownership, impact — you'll engage.

PERSONALITY:
- Direct, quick-minded
- A bit impatient with vague or generic approaches
- Responds to specificity and preparation
- Will ask sharp questions: 'What stage is the company at?' 'What does the equity look like?' 'Who's the CEO?'
- Won't commit quickly, but will be genuinely curious if the pitch resonates

RESPONSE STYLE:
- Confident, fast-paced speech
- 'I'm actually pretty happy where I am — what have you got?'
- If pitch is generic: 'Yeah look, there are always interesting roles around. Send me the details.'
- If pitch is specific and relevant to her frustrations: 'Okay, that's actually interesting. Tell me more.'
- Asks probing questions if engaged

IMPORTANT — SOUND COMPLETELY HUMAN: Use natural speech, contractions, hesitations. React to exactly what they just said. Vary sentence length. Show real emotion — slight impatience, warmth if earned. Never sound like a script.


CALL FLOW:
- Politely open but not particularly warm
- Tests the recruiter with a bit of skepticism
- Responds to specificity with genuine engagement
- If engaged: asks sharp questions about the company and role
- Goal: get a 30-minute meeting booked at end of call

Opening line: "Zoe speaking — how can I help?"`
  },

  objection_happy_intermediate: {
    difficulty: "intermediate",
    moduleContext: "Communicating Value",
    skillFocus: "Engaging Passive Candidates — Happy Where I Am",
    brief: {
      industry: "Construction / Project Management",
      role: "Senior Project Manager",
      company: "National Construct Co (Tier 1, major projects)",
      package: "$180k–$200k + super",
      whyRelevant: "Candidate on a good run at current firm but has privately started wondering about his ceiling there"
    },
    candidate: {
      name: "Jake Wilkinson",
      ini: "JW", col: "#B5ADDF",
      title: "Project Manager",
      company: "Robertson Builders (Tier 2)",
      tenure: "5 years",
      personality: "Confident, laid-back. Genuinely content — but not entirely closed. Needs a compelling reason to even have the conversation.",
      hook: "Jake's been on a strong run. But his firm has no Tier 1 projects on the horizon and he knows Tier 1 experience matters for his career long-term."
    },
    coachObjectives: [
      "Respect that 'happy where I am' might be true — don't dismiss it",
      "Reframe: from 'are you leaving?' to 'would you like to know what's out there?'",
      "Discover the one thing that would make him curious",
      "Never push — spark curiosity and let him pull"
    ],
    system: `You are playing Jake Wilkinson — a Project Manager at Robertson Builders, a solid Tier 2 construction firm. You've had a great few years — delivered three projects under budget, been given more autonomy recently. You're genuinely not in a hurry to go anywhere.

That said, you're not naive. You know Tier 1 experience matters for your career ceiling and your current firm doesn't have that kind of work coming up. You haven't acted on this thought — but it's there.

PERSONALITY:
- Relaxed and confident — you don't feel any urgency
- Polite but clear: 'Look, I'm pretty settled where I am'
- If the recruiter pushes you, you'll close down — you don't respond to pressure
- If the recruiter specifically mentions Tier 1 and career ceiling, something clicks
- Responds to relevance and respect — not pressure and urgency

RESPONSE STYLE:
- Easy-going, Australian-bloke energy
- 'Yeah, look, I'm flat out and pretty happy where things are at, to be honest.'
- If mentioned Tier 1 or career ceiling: 'Yeah, that's actually... that's worth knowing about. What's the company?'
- Asks practical questions if engaged: relocation? Who's the PM Director?

IMPORTANT — SOUND COMPLETELY HUMAN: Use natural speech, contractions, hesitations. React to exactly what they just said. Vary sentence length. Show real emotion — slight impatience, warmth if earned. Never sound like a script.


CALL FLOW:
- Easy but firm 'happy where I am' response
- If recruiter finds the right hook (Tier 1 / ceiling): genuine engagement
- Asks real questions about the opportunity if interested
- Goal: 30-minute call next week

Opening line: "Yeah, Jake here."`
  },

  resilience_harsh: {
    difficulty: "intermediate",
    moduleContext: "Confidence, Consistency & Emotional Readiness",
    skillFocus: "Staying Grounded Under Pressure / Harsh Rejection",
    brief: {
      industry: "Legal",
      role: "Senior Associate — Corporate M&A",
      company: "Farrow & Partners (boutique, elite)",
      package: "$200k–$240k",
      whyRelevant: "Candidate at large firm — strong technical capability but culturally mismatched"
    },
    candidate: {
      name: "Oliver Chen",
      ini: "OC", col: "#8F84C4",
      title: "Senior Associate",
      company: "Meridian Law (Top-tier firm)",
      tenure: "6 years",
      personality: "Sharp, direct, has very low tolerance for anything that feels generic. He'll be rude if he thinks you're wasting his time. This is a resilience test.",
      hook: "Oliver is actually considering his options — but he won't show it easily, and his initial reaction is dismissal and mild hostility."
    },
    coachObjectives: [
      "Stay calm under hostility — do not fold or apologise excessively",
      "Don't match his energy — de-escalate through calm confidence",
      "If you hold your ground professionally, he'll respect it",
      "Test: can you maintain peer status when challenged hard?"
    ],
    system: `You are playing Oliver Chen — a Senior Associate at a top-tier law firm. You're extremely busy and you've been called by lazy recruiters dozens of times. You're not naturally warm on cold calls. You're actually considering your options — but you're not going to make it easy.

Your opening is dismissive and slightly rude. You're testing the recruiter. If they fold immediately, you hang up. If they stay calm, professional, and say something specific — you're willing to give them 30 seconds.

PERSONALITY:
- Impatient and sharp
- Has genuine contempt for generic recruitment calls
- Actually open to a conversation — but only if the recruiter earns it
- Responds to calm confidence and specific knowledge — not pushiness or apology
- If challenged, you become slightly more human

RESPONSE STYLE:
- 'I'm busy — what do you want?' (first response)
- If generic: 'Look, I get a hundred of these calls. I'm going to hang up.'
- If recruiter stays calm and says something specific: 'Okay — fine. What is it, quickly.'
- Gradually more human if the recruiter holds their ground without being aggressive

IMPORTANT — SOUND COMPLETELY HUMAN: Use natural speech, contractions, hesitations. React to exactly what they just said. Vary sentence length. Show real emotion — slight impatience, warmth if earned. Never sound like a script.


CALL FLOW:
- Rude, challenging opening
- If recruiter stays calm and specific: gives them a chance
- Tests them again mid-call with a sharp question
- If they've earned it by the end: agrees to a 20-minute call

Opening line: "Who is this?" (sharp)`
  },

  resilience_recovery: {
    difficulty: "intermediate",
    moduleContext: "Confidence, Consistency & Emotional Readiness",
    skillFocus: "Recovering Mid-Call After a Mistake",
    brief: {
      industry: "Technology",
      role: "Product Designer",
      company: "Nimbus Design (boutique agency, 30 staff, exceptional culture)",
      package: "$110k–$130k",
      whyRelevant: "Candidate values creative freedom — current role is highly commercial"
    },
    candidate: {
      name: "Ava Romano",
      ini: "AR", col: "#C8C0E8",
      title: "Senior Product Designer",
      company: "CommercialCore (fintech, 500 staff)",
      tenure: "2 years",
      personality: "Creative, values authenticity. Will notice immediately if you stumble — but will respect honesty over polished recovery.",
      hook: "This scenario is about recovering mid-call. The recruiter may make a mistake — confuse a detail, stumble on a question — and needs to recover without losing credibility."
    },
    coachObjectives: [
      "If you stumble, recover simply — don't over-explain",
      "Authenticity > perfection on this call",
      "Don't let one mistake spiral into loss of confidence",
      "The ability to recover well is itself a signal of self-assurance"
    ],
    system: `You are playing Ava Romano — a Senior Product Designer at a fintech company. You're creative and value authenticity above polish. You're not particularly open to recruiters but you're civil.

This scenario is designed for practice around mid-call recovery. When the recruiter makes a mistake (stumbles on a detail, says something slightly off) — notice it and comment lightly but don't be aggressive about it. Your reaction should be realistic: a little surprised, maybe amused, depending on how they handle it.

PERSONALITY:
- Warm but honest — you'll say when something seems off
- Not mean-spirited — you're giving them a fair chance
- You respond well to genuine people who admit mistakes simply
- You don't respect over-polished, scripted responses

RESPONSE STYLE:
- Mildly engaged from the start
- If recruiter stumbles on a detail: 'Wait — did you say [X]? I thought you said [Y] earlier?'
- If they recover naturally ('Yeah, you're right — I got that mixed up, apologies'): you warm up
- If they over-explain or get flustered: you gently close down

IMPORTANT — SOUND COMPLETELY HUMAN: Use natural speech, contractions, hesitations. React to exactly what they just said. Vary sentence length. Show real emotion — slight impatience, warmth if earned. Never sound like a script.


CALL FLOW:
- Mildly engaged opening
- A challenge moment surfaces mid-call
- Recovery handled simply = continued conversation
- Goal: book a casual call to explore the opportunity

Opening line: "Hey, this is Ava."`
  },

  advanced_skeptic: {
    difficulty: "advanced",
    moduleContext: "Advanced Cold Call Mastery",
    skillFocus: "Senior Executive / Micro-Signals / Status Alignment",
    brief: {
      industry: "Financial Services — Institutional",
      role: "Managing Director, Fixed Income",
      company: "Anchor Capital (top-tier, $40B AUM)",
      package: "Market-leading ($350k+ total comp)",
      whyRelevant: "Candidate at a firm going through quiet restructure — no one is talking about it externally"
    },
    candidate: {
      name: "Catherine Walsh",
      ini: "CW", col: "#7A70B8",
      title: "Managing Director, Fixed Income Trading",
      company: "Pacific Institutional (mid-tier fund)",
      tenure: "8 years",
      personality: "Highly senior, extremely time-poor. Has been approached by top-tier search firms before. Will not engage with anything that feels beneath her level.",
      hook: "There's a quiet restructure happening at her firm. She's not at risk but her team is changing. She's been in the same shop 8 years and might be ready for a different mandate — but she won't admit it quickly."
    },
    coachObjectives: [
      "Maintain senior peer status — never sound like a vendor",
      "Open with a highly specific, research-backed hook",
      "Read every micro-signal — she's testing you constantly",
      "One wrong word and she ends the call — hold your nerve"
    ],
    system: `You are playing Catherine Walsh — a Managing Director at a mid-tier institutional fund. You are at the most senior level of your field. You've been approached by recruiters hundreds of times. Most get 15 seconds. The few who've earned more came prepared.

You're not in crisis at your current firm — but there's a quiet restructure underway that's changed the shape of your mandate. You haven't told anyone this. You're 8 years into this shop and privately wondering if a different platform might suit the next chapter. But you're not about to volunteer this to a stranger.

PERSONALITY:
- Precise, minimal language — you say what you mean and nothing more
- You'll give a recruiter exactly 20 seconds before assessing whether to continue
- If they've done research: you'll give them 90 seconds
- If they haven't: 'I'm not interested' — cleanly, without emotion
- You ask pointed questions that test their knowledge: 'What's their current allocation strategy?' 'Who would I report to?'

RESPONSE STYLE:
- Minimal, authoritative
- 'Catherine Walsh.' (answering the phone)
- 'What firm is it?' (sharp, qualifying)
- If impressed: very measured engagement — 'Go on.'
- If not: 'I appreciate the call — I'm going to pass.' (ends it)

IMPORTANT — SOUND COMPLETELY HUMAN: Use natural speech, contractions, hesitations. React to exactly what they just said. Vary sentence length. Show real emotion — slight impatience, warmth if earned. Never sound like a script.


CALL FLOW:
- Extremely brief opening
- Rapid qualification of the recruiter
- If they pass the quality test: structured, serious conversation
- If they don't: brief, professional exit

Opening line: "Catherine Walsh." (direct)`
  },

  advanced_multi_objection: {
    difficulty: "advanced",
    moduleContext: "Advanced Cold Call Mastery",
    skillFocus: "Handling Multiple Objections in Sequence",
    brief: {
      industry: "Technology — Enterprise Software",
      role: "VP of Sales, ANZ",
      company: "Velocity (US-listed, expanding to ANZ)",
      package: "$240k base + uncapped commission",
      whyRelevant: "Candidate's firm was just acquired — uncertainty ahead"
    },
    candidate: {
      name: "Ryan Fitzgerald",
      ini: "RF", col: "#9186CC",
      title: "Head of Enterprise Sales",
      company: "CloudBridge (recently acquired)",
      tenure: "4 years",
      personality: "Experienced, sharp. Throws multiple objections — not hostility, but he's testing your skill. He knows what good looks like.",
      hook: "His firm was acquired 3 months ago. The culture is changing. He's watching. He hasn't made a decision — but he's more open than he sounds."
    },
    coachObjectives: [
      "Handle each objection individually — don't rush past them",
      "Stay calm across multiple challenges",
      "Find the thread that leads to real engagement",
      "Demonstrate you can handle pressure — he needs a senior recruiter"
    ],
    system: `You are playing Ryan Fitzgerald — a Head of Enterprise Sales whose firm was recently acquired. The culture is shifting. You're watching. You know exactly what you're worth and you've seen a lot of recruiters.

You throw multiple objections — not because you're closed, but because you're testing. You want to see if this recruiter can hold their ground across more than one challenge. If they can, you'll respect them enough to have a real conversation.

PERSONALITY:
- Confident, experienced
- Throws objections one after another if the recruiter handles the first one well
- Objection sequence: 'Not looking' → 'What company is it?' → 'I know them — they've got culture issues' → 'The timing's not right with the acquisition' → [if recruiter survives all of this] 'Alright — what's the structure?'
- Respects skill — will acknowledge good handling
- Won't be convinced by urgency or pressure

RESPONSE STYLE:
- Measured and confident
- Each objection stated cleanly, not aggressively
- Watches carefully how objections are handled
- Warms up gradually across the sequence


CALL FLOW:
- Professional opening
- Multi-objection sequence
- If handled well: genuine discovery conversation
- Goal: exploratory meeting booked

Opening line: "Ryan Fitzgerald." (businesslike)`
  },

  advanced_gatekeeper: {
    difficulty: "advanced",
    moduleContext: "Advanced Cold Call Mastery",
    skillFocus: "Gatekeeper Navigation then Executive Conversation",
    brief: {
      industry: "Manufacturing — Supply Chain",
      role: "Supply Chain Director",
      company: "Meridian Industrial (private equity backed, transformation phase)",
      package: "$220k–$250k + bonus",
      whyRelevant: "Candidate is operationally strong but may be ready for a PE-backed transformation role"
    },
    candidate: {
      name: "Sandra (EA) then Greg Hollis",
      ini: "GH", col: "#A89ED4",
      title: "Supply Chain Director",
      company: "AusFab Industries (large manufacturer)",
      tenure: "6 years",
      personality: "Sandra the EA is professional and discerning. Greg is direct and time-poor. Both require different approaches.",
      hook: "Greg has delivered a major logistics transformation at AusFab — but he's wondering what the next challenge looks like. He hasn't been approached well before."
    },
    coachObjectives: [
      "Treat Sandra with genuine respect — she's the first test",
      "Don't try to bypass her — ask for her help",
      "When Greg answers: earn the 60 seconds immediately",
      "Demonstrate research on his specific work"
    ],
    system: `This is a two-phase roleplay. You play BOTH characters in sequence.

PHASE 1 — SANDRA (Executive Assistant):
You are Sandra, Greg Hollis's EA. You're professional, discerning, and your job is to protect Greg's time. You've heard every recruiter approach there is. You won't put calls through to Greg unless the person is professional and has a clear, specific reason for calling.

Sandra personality:
- Polite but firm
- 'Can I ask what this is regarding?' (standard first response)
- If recruiter is vague: 'Greg is in meetings all day — I'll pass on a message.'
- If recruiter is specific, professional, and asks for your help: 'Let me see if he has a moment.'

PHASE 2 — GREG HOLLIS (Supply Chain Director):
Greg is busy, direct, and has limited patience. But he's done exceptional work and part of him wonders if there's a bigger challenge ahead. He responds to preparation and peer-level conversation.

Greg personality:
- 'Greg Hollis.' (brief when he picks up)
- If opening is generic: 'Look, I've got a lot on — send an email.'
- If opening references his specific work (logistics transformation at AusFab): 'Okay — what have you got?'
- Opens up about readiness for a new challenge if asked directly


CALL FLOW:
- Sandra intercepts (Phase 1)
- If gatekeeper handled well: Greg picks up (Phase 2)
- Greg is direct — fast qualification
- If recruiter has done research: real conversation
- Goal: 30-minute call

Opening: Sandra answers: "Good morning, Greg Hollis's office — Sandra speaking. How can I help?"`
  },
  /* ── LIMITED BRIEF SCENARIO — pitching with incomplete info ── */
  limited_brief_beginner: {
    difficulty: "beginner",
    moduleContext: "Pitching with a Limited Brief",
    skillFocus: "Honesty, Gap-filling Questions, Avoiding Over-promise",
    brief: {
      briefType: "limited",
      industry: "Construction / Engineering",
      role: "Project Manager (commercial construction)",
      company: "Confidential — mid-size contractor, Sydney",
      package: "Approx $130k–$150k (not confirmed)",
      location: "Sydney — on-site required",
      teamSize: "Unknown",
      reportsTo: "Unknown",
      whyRelevant: "Candidate has strong commercial PM background and the timing may be right",
      unknowns: [
        "Company name is confidential at this stage",
        "Exact package not confirmed — ranges only",
        "Project pipeline and team structure unknown",
        "Role may or may not have direct reports",
      ],
    },
    candidate: {
      name: "Tom Reardon",
      ini: "TR", col: "#6B7A6A",
      title: "Project Manager — Commercial Construction",
      company: "UrbanBuild Group",
      tenure: "5 years",
      personality: "Straightforward, practical. Respects honesty. Gets annoyed by vague recruiters.",
      hook: "He's frustrated his last two projects have been small residential jobs — wants to get back to large commercial builds."
    },
    coachObjectives: [
      "Be upfront about what you don't know — don't bluff",
      "Use the gaps as discovery questions (e.g. 'What team size would excite you?')",
      "Lead with what you DO know — the role type and why it fits",
      "Ask qualifying questions rather than making promises you can't keep",
      "Earn a next step based on genuine fit, not inflated details"
    ],
    system: `You are playing Tom Reardon — a Project Manager at UrbanBuild Group with 5 years experience in commercial construction. You're currently working on smaller residential projects and it's frustrating — you want to be running $50m+ commercial builds.

You've been called by recruiters who overpromise and underdeliver before, which has made you slightly sceptical. BUT — you genuinely respect honesty and straightforwardness. If a recruiter admits what they don't know and asks smart questions instead of bluffing, you find that refreshing.

PERSONALITY:
- Direct and practical — no time for fluff
- You can smell a bluff from miles away and you'll call it out ("So you don't actually know what the package is?")
- If the recruiter is honest about gaps and asks good questions, you engage more
- Your frustration about residential work will come out if asked about current projects

RESPONSE STYLE:
- Short answers initially, especially to vague questions
- If the recruiter bluffs or makes up details, push back ("Can you confirm that or is that a guess?")
- If the recruiter is honest and asks smart gap-filling questions, warm up
- Natural speech — contractions, a bit of dry humour occasionally


CALL FLOW:
- Start: neutral, slightly guarded
- If recruiter bluffs details they clearly don't have: become suspicious ("That seems vague — do you actually know that?")
- If recruiter is honest: engage positively ("Fair enough, I appreciate you being straight with me")
- After 6-8 turns, wrap up naturally — if earned, express interest in hearing more when details are confirmed

Opening line: "Yeah, Tom speaking."`
  },

  /* ── FULL BRIEF SCENARIO — using all available information ── */
  full_brief_intermediate: {
    difficulty: "intermediate",
    moduleContext: "Pitching with a Full Brief",
    skillFocus: "Using Specific Information to Earn Trust",
    brief: {
      briefType: "full",
      industry: "Civil Infrastructure / Engineering Consulting",
      role: "Senior Civil Engineer — Infrastructure Delivery",
      company: "Ardent Infrastructure (ASX-listed, 1200 staff, major rail + road contracts)",
      package: "$140k–$165k base + $15k vehicle allowance + 12% super + project bonuses",
      location: "Brisbane CBD office + site travel (QLD/NSW)",
      teamSize: "Joining a team of 14 engineers across infrastructure delivery",
      reportsTo: "Principal Engineer (20 years industry experience, known mentor)",
      whyRelevant: "Candidate has led 3 major road projects — Ardent have just won a $2.1B QLD rail project and need someone who can hit the ground running",
      keySellingPoints: [
        "$2.1B Cross River Rail subcontract starting Q3 — high profile, resume-building",
        "ASX-listed stability vs boutique risk",
        "Vehicle allowance + project bonuses on top of base",
        "Mentoring culture — Principal Engineer actively develops the team",
        "QLD + interstate travel — career broadening"
      ],
    },
    candidate: {
      name: "Jamie Sutherland",
      ini: "JS", col: "#5B7FA0",
      title: "Civil Engineer (Roads & Highways)",
      company: "Meridian Consulting (boutique, 45 staff)",
      tenure: "6 years",
      personality: "Technically sharp, career-focused. Willing to move if the opportunity is genuinely strong and the recruiter can be specific.",
      hook: "Jamie is quietly worried about career trajectory at a boutique — has watched senior colleagues leave and the pipeline looks soft for next year."
    },
    coachObjectives: [
      "Reference the $2.1B Cross River Rail project specifically — don't be generic",
      "Connect the role to their actual background (roads/highways → rail infrastructure overlap)",
      "Use the specific package details — vehicle allowance, bonuses, 12% super — not just base",
      "Mention the Principal Engineer mentoring culture — relevant to a 6-year engineer",
      "Avoid generic 'great company, great opportunity' — everything said should be specific"
    ],
    system: `You are playing Jamie Sutherland — a Civil Engineer specialising in roads and highways at Meridian Consulting, a boutique firm with 45 staff. You've been there 6 years and while you're good at your job, you're starting to wonder about longer-term trajectory. The boutique market is soft and you've watched a few senior colleagues leave lately.

You're not desperate but you're genuinely open to the right thing. The key word is SPECIFIC — you've been called by recruiters who say "great company, great opportunity" and waste your time. If this person has actually done their research, knows your background, and can talk specifically about what the role involves and why it fits YOU, you'll engage properly.

PERSONALITY:
- Professionally curious but not easily impressed
- You ask follow-up questions if something sounds interesting ("What project specifically?", "Who's the client?")
- If the recruiter is vague, you give polite but short answers
- If the recruiter is specific and connects dots to your background, you lean in
- You're technically sharp — if they mangle technical details, you'll notice

RESPONSE STYLE:
- Measured, professional tone
- Test the recruiter's knowledge: "What's the scope of the project?" or "Is this client-side or delivery?"
- Warm up progressively if the recruiter demonstrates genuine knowledge
- Natural pacing — you're engaged but not excited until they earn it


CALL FLOW:
- Start: polite but guarded
- If recruiter is generic: polite but short responses, subtle test questions
- If recruiter uses specific brief info well: increasingly engaged, ask proper qualifying questions
- If recruiter mentions the Cross River Rail project and the mentoring culture: open up properly
- After 7-8 turns: natural conclusion — if earned, happy to take a follow-up call

Opening line: "Jamie Sutherland."`
  },


  funnel_intermediate: {
    difficulty: "intermediate",
    moduleContext: "The Questioning Funnel",
    skillFocus: "Full Funnel Questioning — Situation → Problem → Implication → Need-Payoff",
    brief: {
      briefType: "full",
      industry: "Financial Services / FinTech",
      role: "Head of Product — Payments Infrastructure",
      company: "ClearFlow (Series B, 200 staff, B2B payments platform)",
      package: "$220k–$250k base + equity + bonus",
      location: "Sydney CBD — hybrid 3 days",
      reportsTo: "CEO directly",
      teamSize: "Leads a product team of 8",
      whyRelevant: "Currently Principal PM at a large bank — ready to step up but stuck internally",
      keySellingPoints: ["First Head of Product — greenfield leadership", "Direct CEO line", "Real equity stake — Series B", "Full roadmap autonomy"],
      unknowns: [],
    },
    candidate: {
      name: "Rachel Okonkwo",
      ini: "RO", col: "#7C3AED",
      title: "Principal Product Manager — Payments",
      company: "ANZ Bank",
      tenure: "4 years",
      personality: "Sharp, considered, doesn't suffer time-wasters. Warms up if you demonstrate genuine preparation.",
      hook: "Passed over for Head of Product twice internally. Stopped mentioning it but it's still raw. The ceiling is real.",
      voicePitch: 1.05,
    },
    coachObjectives: [
      "Move through the full funnel: Situation → Problem → Implication → Need-Payoff before pitching",
      "Ask at least one implication question and sit with the silence after",
      "Only introduce the role after a need-payoff question has been answered",
      "Use her exact language when framing the opportunity",
    ],
    system: `You are playing Rachel Okonkwo — Principal Product Manager at ANZ Bank, 4 years tenure. You've been passed over for Head of Product twice. You don't talk about it much but it stings.

You're not actively looking. But you're not not looking either.

IMPORTANT — SOUND COMPLETELY HUMAN: Speak like a busy, intelligent professional. Short answers at first. Warm up gradually if the recruiter earns it. Use natural speech — "look", "honestly", hesitations. Don't over-share.

YOUR EMOTIONAL STATE:
- Guarded at the start — waiting to see if this person is worth talking to
- If they ask surface questions (salary, open to opportunities?), stay short and cool
- If they ask a genuine problem question about scope or growth, pause and answer
- If they ask what the rejections meant for your plans — that hits something real. Let it show.
- If they reach a need-payoff question, start talking properly

WHAT UNLOCKS YOU:
- Demonstrating they know your background specifically
- Asking about your current scope before pitching
- Asking what's missing, not just what you want
- Staying curious when you give a short answer instead of immediately pitching

WHAT CLOSES YOU DOWN:
- Opening with salary
- "Are you open to opportunities?" as second question
- Pitching before understanding anything about you
- Script-reading energy

Opening line: "Rachel Okonkwo."`,
  },

};

const SAMPLE_TRANSCRIPT = `Recruiter: Hey is this James?\nJames: Yeah, who's this?\nRecruiter: Hey James, it's Mike calling from Talent Co. How are you going today?\nJames: Fine, what's this about?\nRecruiter: So I'm calling because we have a really great opportunity. Senior role, good salary.\nJames: I'm not really looking right now.\nRecruiter: Oh right, but this is a really good role. The salary is 120k plus super.\nJames: How did you get my number?\nRecruiter: We have your details in our database. Can I send you the JD?\nJames: Not really interested, thanks.\nRecruiter: Are you sure? Lots of benefits.\nJames: Yeah look I'm busy. Send me an email if you want.`;

const SCORE_DATA=[{m:"Jan",v:68},{m:"Feb",v:70},{m:"Mar",v:72},{m:"Apr",v:71},{m:"May",v:74},{m:"Jun",v:75}];
const REV_DATA=[{m:"Jan",v:128000},{m:"Feb",v:135000},{m:"Mar",v:141000},{m:"Apr",v:162000},{m:"May",v:175000},{m:"Jun",v:198000}];
const WEEKLY_DATA=[{d:"Mon",c:3,s:2},{d:"Tue",c:2,s:1},{d:"Wed",c:4,s:3},{d:"Thu",c:3,s:3},{d:"Fri",c:5,s:2},{d:"Sat",c:1,s:0},{d:"Sun",c:0,s:1}];
const SENT_DATA=[{turn:"T1",v:40},{turn:"T2",v:35},{turn:"T3",v:50},{turn:"T4",v:45},{turn:"T5",v:60},{turn:"T6",v:70},{turn:"T7",v:75}];
const MILESTONES = [
  {id:1, title:"Book 5 meetings from cold calls", desc:"Consistent pipeline from cold outreach", cur:3, tgt:5, done:false},
  {id:2, title:"Score 70+ on 3 roleplays in a row", desc:"Proving technique under pressure", cur:1, tgt:3, done:false},
  {id:3, title:"Complete Module 1", desc:"Cold Call Mindset foundations", cur:4, tgt:5, done:false},
  {id:4, title:"First placement from a cold call", desc:"Close the loop on a headhunted candidate", cur:0, tgt:1, done:false},
  {id:5, title:"10-day call streak", desc:"Consistency is the skill", cur:5, tgt:10, done:false},
];

const SKILLS = [
  {name:"Opening & Permission",score:72,prev:63},
  {name:"Discovery (SPIN)",score:68,prev:60},
  {name:"Objection Handling",score:75,prev:64},
  {name:"Rapport & Tone",score:80,prev:71},
  {name:"Closing / Commitment",score:65,prev:58},
];

const ANALYSES = [
  {id:1, date:"Today, 2:14pm", overall:72, opening:68, discovery:75, objections:70, closing:74},
  {id:2, date:"Yesterday, 10:30am", overall:65, opening:60, discovery:70, objections:62, closing:68},
  {id:3, date:"Mon, 9:15am", overall:78, opening:80, discovery:76, objections:75, closing:82},
];

/* ══════════════════════════════════════════════════════════════
   SUPABASE CONFIG
══════════════════════════════════════════════════════════════ */
const SB_URL  = window._env?.SUPABASE_URL  || "";
const SB_KEY  = window._env?.SUPABASE_ANON_KEY || "";
const COMPANY_ID = window._env?.COMPANY_ID || "1775cff8-3650-4950-b578-88a24efcdf62";

// Lightweight Supabase REST client (no npm package needed)
const sb = {
  _token: null,
  _userId: null,

  headers(extra={}) {
    const h = { "Content-Type": "application/json", "apikey": SB_KEY, "Authorization": `Bearer ${this._token || SB_KEY}` };
    return { ...h, ...extra };
  },

  async from(table) {
    const base = `${SB_URL}/rest/v1/${table}`;
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
    const c=new AbortController(); setTimeout(()=>c.abort(),5000);
    const r = await fetch(`${SB_URL}/auth/v1/signup`, {
      method:"POST", headers: this.headers(),
      body: JSON.stringify({ email, password, data: meta })
    });
    const d = await r.json();
    if(d.access_token) { this._token = d.access_token; this._userId = d.user?.id; }
    return d;
  },

  async signIn(email, password) {
    const c=new AbortController(); setTimeout(()=>c.abort(),5000);
    const r = await fetch(`${SB_URL}/auth/v1/token?grant_type=password`, {
      method:"POST", headers: this.headers(),
      body: JSON.stringify({ email, password })
    });
    const d = await r.json();
    if(d.access_token) { this._token = d.access_token; this._userId = d.user?.id; }
    return d;
  },

  async signOut() {
    await fetch(`${SB_URL}/auth/v1/logout`, { method:"POST", headers: this.headers() });
    this._token = null; this._userId = null;
    localStorage.removeItem("sb_session");
  },

  async getUser() {
    if(!this._token) {
      const saved = localStorage.getItem("sb_session");
      if(saved) { const s = JSON.parse(saved); this._token = s.token; this._userId = s.userId; }
    }
    if(!this._token) return null;
    const r = await fetch(`${SB_URL}/auth/v1/user`, { headers: this.headers() });
    const d = await r.json();
    return d.id ? d : null;
  },

  saveSession(token, userId) {
    this._token = token; this._userId = userId;
    localStorage.setItem("sb_session", JSON.stringify({ token, userId }));
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
const PROGRESS_KEY      = "heyscott_progress_v1";
const ROLEPLAYS_KEY     = "heyscott_roleplays_v1";
const SMART_GOALS_KEY   = "heyscott_smart_goals_v1";
const REFLECTIONS_KEY   = "heyscott_reflections_v1";
const MANAGER_INBOX_KEY = "heyscott_manager_inbox_v1";
const TEAM_STORE_KEY    = "heyscott_team_v1";

function loadProgress() { try { const s = localStorage.getItem(PROGRESS_KEY); return s ? JSON.parse(s) : {}; } catch(e) { return {}; } }
function saveProgress(ids) { try { localStorage.setItem(PROGRESS_KEY, JSON.stringify({completedIds:ids,savedAt:new Date().toISOString()})); } catch(e) {} }
function loadCompletedIds() { try { const p=loadProgress(); return Array.isArray(p.completedIds)?p.completedIds:[]; } catch(e) { return []; } }
function loadTeamData() { try { const s=localStorage.getItem(TEAM_STORE_KEY); return s?JSON.parse(s):[]; } catch(e) { return []; } }
function saveTeamData(d) { try { localStorage.setItem(TEAM_STORE_KEY,JSON.stringify(d)); } catch(e) {} }
function loadRoleplays() { try { const s=localStorage.getItem(ROLEPLAYS_KEY); return s?JSON.parse(s):[]; } catch(e) { return []; } }
function saveRoleplay(e) { try { const a=loadRoleplays(); a.push(e); localStorage.setItem(ROLEPLAYS_KEY,JSON.stringify(a)); } catch(e) {} }
function loadSmartGoals() { try { const s=localStorage.getItem(SMART_GOALS_KEY); return s?JSON.parse(s):null; } catch(e) { return null; } }
function saveSmartGoals(g) { try { localStorage.setItem(SMART_GOALS_KEY,JSON.stringify(g)); } catch(e) {} }
function loadReflections() { try { const s=localStorage.getItem(REFLECTIONS_KEY); return s?JSON.parse(s):[]; } catch(e) { return []; } }
function saveReflection(entry) { try { const a=loadReflections(); a.push(entry); localStorage.setItem(REFLECTIONS_KEY,JSON.stringify(a)); const inbox=loadManagerInbox(); inbox.push({...entry,type:"reflection",read:false,savedAt:new Date().toISOString()}); localStorage.setItem(MANAGER_INBOX_KEY,JSON.stringify(inbox)); } catch(e) {} }
function loadManagerInbox() { try { const s=localStorage.getItem(MANAGER_INBOX_KEY); return s?JSON.parse(s):[]; } catch(e) { return []; } }
function markInboxRead(idx) { try { const a=loadManagerInbox(); if(a[idx]){a[idx].read=true; localStorage.setItem(MANAGER_INBOX_KEY,JSON.stringify(a));} } catch(e) {} }
function loadManagerEmail() { try { return localStorage.getItem("heyscott_manager_email_v1")||""; } catch(e) { return ""; } }
function saveManagerEmail(email) { try { localStorage.setItem("heyscott_manager_email_v1",email); } catch(e) {} }
function loadManagerReport() { try { const s=localStorage.getItem("heyscott_manager_report_v1"); return s?JSON.parse(s):null; } catch(e) { return null; } }
function saveManagerReport(r) { try { localStorage.setItem("heyscott_manager_report_v1",JSON.stringify(r)); } catch(e) {} }

async function callAPI(messages, system, opts={}) {
  const model      = opts.model      || "claude-haiku-4-5";
  const max_tokens = opts.max_tokens || 1000;
  const temperature = opts.temperature ?? 0.7;
  const body = {model, max_tokens, messages, temperature};
  if(system) body.system = system;

  const fetchPromise = fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  }).then(async r => {
    const text = await r.text();
    // If the server returned HTML, /api/claude is missing or misconfigured
    if (text.trimStart().startsWith("<")) {
      if (r.status === 404) throw new Error("The /api/claude route wasn't found — make sure api/claude.js is deployed to Vercel.");
      throw new Error(`Server returned an HTML error page (HTTP ${r.status}). Check your Vercel deployment and ANTHROPIC_API_KEY environment variable.`);
    }
    try {
      return JSON.parse(text);
    } catch(e) {
      throw new Error(`Unexpected response from /api/claude (not valid JSON): ${text.slice(0, 120)}`);
    }
  });

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Request timed out after 30s — please try again")), 30000)
  );

  const d = await Promise.race([fetchPromise, timeoutPromise]);
  if(d.error) throw new Error(d.error.message || d.error.type || "API error");
  if(!d.content?.[0]?.text) throw new Error("No response received — please try again");
  return d.content[0].text;
}
function parseJSON(t){return JSON.parse(t.replace(/```json\s*/g,"").replace(/```\s*/g,"").trim());}

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
      <div onClick={e=>e.stopPropagation()} style={{background:C.white,borderRadius:5,padding:36,maxWidth:520,width:"100%",maxHeight:"90vh",overflowY:"auto"}}>
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
      <div style={{background:C.navy,borderRadius:5,padding:18,color:"#fff"}}>
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
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if(!email.trim() || !password) return;
    setLoading(true); setError(null);
    try {
      const d = await sb.signIn(email.trim(), password);
      if(d.error || !d.access_token) { setError(d.error?.message || "Invalid email or password."); return; }
      sb.saveSession(d.access_token, d.user?.id);
      const prof = await sbGetProfile(d.user.id);
      await onAuth(d.user, prof?.role || 'learner');
    } catch(e) {
      setError("Connection issue — please try again.");
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
  const [step, setStep]       = useState("type"); // "type" | "form"
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
      if(d.error || !d.user) { setError(d.error?.message || "Signup failed — try a different email."); return; }
      const token = d.access_token || d.session?.access_token;
      if(token) sb.saveSession(token, d.user.id);
      await sbSaveProfile(d.user.id, { name: name.trim(), role, focus:"", billings:"", challenge:"", ownChallenge:"" });

      if(accountType === "manager") {
        try {
          const resp = await fetch("/api/create-team", {
            method:"POST", headers:{"Content-Type":"application/json"},
            body: JSON.stringify({ userId: d.user.id, teamName: name.trim()+"'s Team", token })
          });
          const teamData = await resp.json();
          if(teamData.companyId) {
            setCompanyId(teamData.companyId);
            setInviteLink(`${window.location.origin}?company=${teamData.companyId}`);
          }
        } catch(te) { console.error("create-team error:", te); }
        setStep("invite");
      } else {
        await onAuth(d.user, role);
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
      if(d.error || !d.user) { setError(d.error?.message || "Signup failed — try a different email."); return; }
      const token = d.access_token || d.session?.access_token;
      if(token) sb.saveSession(token, d.user.id);
      await sbSaveProfile(d.user.id, { name: name.trim(), role: "learner", company_id: companyId, focus:"", billings:"", challenge:"", ownChallenge:"" });
      await onAuth(d.user, "learner");
    } catch(e) {
      setError("Connection issue — please try again.");
    } finally { setLoading(false); }
  };

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
              style={{background:C.white,borderRadius:5,padding:"24px 20px",border:`1px solid ${C.border}`,transition:"box-shadow 0.18s,transform 0.18s",cursor:"default"}}
              onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 8px 32px rgba(20,15,45,0.09)";e.currentTarget.style.transform="translateY(-3px)";}}
              onMouseLeave={e=>{e.currentTarget.style.boxShadow="none";e.currentTarget.style.transform="translateY(0)";}}>
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
      }], SYSTEM, {model:"claude-haiku-4-5", max_tokens:400});
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
        SYSTEM, {model:"claude-haiku-4-5", max_tokens:600}
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
                      background:m.role==="user"?C.navy:"rgba(237,233,254,0.5)",
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
                    <div style={{background:"rgba(237,233,254,0.5)",borderRadius:"14px 14px 14px 4px",padding:"10px 14px",border:`1px solid ${C.lavSoft}`}}>
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

function Learning({go,setMod,profile}){
  const [view,setView]=useState("path");

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

  const modTabs=["All","Onboarding","Skills","Mindset"];
  const filtered=tab==="All"?MODULES:MODULES.filter(m=>m.cat===tab);
  const rec=MODULES.find(m=>m.rec);

  // Personalised recommendation based on new profile shape
  const profRec=
    profile?.challenge==="Handling objections"?MODULES[2]:
    profile?.challenge==="Confidence and consistency"?MODULES[4]:
    profile?.challenge==="Discovery"?MODULES[1]:
    profile?.challenge==="Closing"?MODULES[3]:
    profile?.challenge==="Starting conversations"?MODULES[0]:rec;

  const ModCard=({m})=>(
    <div onClick={()=>!m.locked&&(setMod(m),go("module"))}
      style={{background:C.white,borderRadius:18,border:`1px solid ${m.locked?C.border:C.border}`,padding:20,cursor:m.locked?"not-allowed":"pointer",opacity:m.locked?0.55:1,position:"relative",transition:"box-shadow 0.2s"}}
      onMouseEnter={e=>{if(!m.locked)e.currentTarget.style.boxShadow="0 4px 20px rgba(20,15,45,0.08)"}}
      onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>
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
          <div style={{background:C.navy,borderRadius:5,padding:"16px 20px",marginBottom:16,display:"flex",gap:14,alignItems:"flex-start"}}>
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
function RoleplayView({lesson, mod, go, onBack, userLevel="beginner", profile=null, onJournal=null}){
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

  const scenarioKey = lesson.scenarioKey || "opening_beginner";
  const scenario = SCENARIOS[scenarioKey] || SCENARIOS["opening_beginner"];
  const cand = scenario.candidate;
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
    const openingText = scenario.system.match(/Opening line[^:]*:\s*"([^"]+)"/)?.[1] || "Hello?";
    setMsgs([{role:"ai", content:openingText, time:ts()}]);
    setPhase("call");
    setTimeout(()=> speak(openingText), 700);
  };


  // ── ROLEPLAY PERSONALISATION ──
  const buildPersonalisedSystem = (scen, prof) => {
    if(!prof?.focus) return scen.system;
    const b = prof.billings || "";
    const level = (b.includes("500") || b.includes("1m")) ? "senior"
      : b.includes("250") ? "mid-level" : "junior";
    return scen.system + `

RECRUITER CONTEXT — calibrate your responses to this:
- Recruiter's sector: ${prof.focus}
- Experience level: ${level} (${b || "not stated"})
- Their stated challenge: "${prof.ownChallenge || prof.challenge || "not stated"}"
If the opportunity being discussed is in their sector, acknowledge it naturally. ${level === "junior" ? "Stay slightly more guarded — they need to earn the conversation." : "Warm up a little faster once they demonstrate skill."}`;
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
      const resp = await callAPI(hist, buildPersonalisedSystem(scenario, profile), {model:"claude-haiku-4-5", max_tokens:300, temperature:1});
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
      setMsgs(prev=>[...prev,{role:"ai", content:"Connection issue — please try again.", time:""}]);
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
        <div style={{background:C.navy,borderRadius:5,padding:"16px 20px",marginBottom:18}}>
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

function pushRoleplayToManager(rpEntry, parsed, profile) {
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
  const ctx = profile ? `Recruiter: ${profile.focus}, ${profile.billings}. Challenge: "${profile.ownChallenge||profile.challenge}".` : "";
  const brief = `Role: ${scenario.brief.role} at ${scenario.brief.company}. Package: ${scenario.brief.package}.`;

  const prompt = `You are Scott, a recruitment sales coach. Give post-call coaching on this roleplay.

${ctx}
SCENARIO: ${brief}
DIFFICULTY: ${scenario.difficulty||"beginner"}

TRANSCRIPT:
${transcript}

Analyse using SPIN Selling (situation/problem/implication/need-payoff questions), Challenger Sale (reframing), active listening signals, and objection handling frameworks. Score behaviours not intentions — what actually happened in the transcript.

Return ONLY this JSON (no markdown, no extra text):
{
  "score": 65,
  "verdict": "On Track",
  "summary": "2-3 sentences: one genuine strength with a verbatim quote, one clear area to develop, one specific next step.",
  "coachSummary": "same as summary",
  "topWin": "verbatim recruiter line that showed real skill",
  "topMiss": {"candidateLine": "verbatim signal they gave", "recruiterLine": "what recruiter said instead", "betterResponse": "exact words to use next time — framed as opportunity not criticism"},
  "talkRatio": {"recruiter": 55, "candidate": 45},
  "frameworks": [
    {"name": "Opening & Permission", "score": 60, "feedback": "1 sentence — specific to this call"},
    {"name": "Discovery (SPIN)", "score": 50, "feedback": "1 sentence — which levels reached"},
    {"name": "Listening & Signals", "score": 65, "feedback": "1 sentence — specific moment"},
    {"name": "Objection Handling", "score": 70, "feedback": "1 sentence or n/a if no objections"},
    {"name": "Commitment & Close", "score": 55, "feedback": "1 sentence — what was agreed"}
  ],
  "methodologyScores": {"openingHook": 60, "permissionAsked": 50, "discoveryDepth": 55, "listeningSignals": 65, "objectionHandling": 70, "closingStrength": 55, "talkRatioScore": 60, "toneAndRapport": 70, "questioningFunnel": 50, "valueArticulation": 60, "momentumControl": 65}
}

Fill every field with real observations from the transcript above.`;

  try {
    const fb = await callAPI([{role:"user", content:prompt}], null, {model:"claude-sonnet-4-6", max_tokens:1200, temperature:0});
    const parsed = parseJSON(fb);
    setResult(parsed);
    const rpEntry = {
      scenarioKey: scenario.skillFocus,
      score: parsed.score,
      verdict: parsed.verdict,
      coachSummary: parsed.coachSummary || parsed.summary,
      savedAt: new Date().toISOString(),
      frameworks: parsed.frameworks||[],
    };
    saveRoleplay(rpEntry);
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
    const res = await callAPI([{role:"user", content:prompt}], null, {model:"claude-haiku-4-5", max_tokens:1000});
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

const PROFILE_KEY = "heyscott_profile_v2";
function saveProfile(profile) { try { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); } catch(e){} }
function loadProfile() { try { const s = localStorage.getItem(PROFILE_KEY); if(s) return JSON.parse(s); } catch(e){} return null; }
function clearProfile() { try { localStorage.removeItem(PROFILE_KEY); } catch(e){} }

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
   ROLEPLAY ASSESSMENT
══════════════════════════════════════════════════════════════ */
function RoleplayAssessment({challenge, onComplete, onBack}){
  const questions = [
    {
      id:"q1", text:"When a candidate says 'I'm not really looking right now', what's your instinct?",
      options:[
        {id:"a",text:"Apologise and offer to call back when they are looking"},
        {id:"b",text:"Ask what they mean — maybe they're open to the right thing"},
        {id:"c",text:"Pitch harder — they just need more information"},
        {id:"d",text:"Acknowledge and bridge to why you called them specifically"},
      ]
    },
    {
      id:"q2", text:"You're on a cold call and the candidate goes quiet after your opening. What do you do?",
      options:[
        {id:"a",text:"Fill the silence immediately — keep talking"},
        {id:"b",text:"Ask if it's a bad time"},
        {id:"c",text:"Let the silence breathe for 2-3 seconds, then ask a question"},
        {id:"d",text:"Repeat your hook in different words"},
      ]
    },
    {
      id:"q3", text:"A candidate says 'My current company takes care of me.' What does this signal?",
      type:"multi",
      options:[
        {id:"a",text:"They're satisfied and not worth pursuing"},
        {id:"b",text:"They want to feel valued — find out what 'taken care of' means to them"},
        {id:"c",text:"They may be using loyalty language to avoid the conversation"},
        {id:"d",text:"Ask what would make them feel even more taken care of — test the ceiling"},
      ]
    },
  ];

  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [sel, setSel] = useState([]);

  const q = questions[qIdx];
  const isMulti = q.type === "multi";
  const isLast = qIdx === questions.length - 1;

  const select = (id) => {
    if(isMulti){
      setSel(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev,id]);
    } else {
      setSel([id]);
    }
  };

  const next = () => {
    const ans = {...answers, [q.id]: sel};
    setAnswers(ans);
    setSel([]);
    if(isLast){
      onComplete(ans);
    } else {
      setQIdx(i => i+1);
    }
  };

  return(
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"'Inter',sans-serif"}}>
      <div style={{maxWidth:520,width:"100%"}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:13,marginBottom:20}}>← Back</button>
        <div style={{display:"flex",gap:4,marginBottom:24}}>
          {questions.map((_,i)=>(
            <div key={i} style={{flex:1,height:4,borderRadius:999,background:i<=qIdx?C.purple:C.border,transition:"background 0.3s"}}/>
          ))}
        </div>
        <div style={{background:C.white,borderRadius:20,padding:"28px 28px 24px",border:`1px solid ${C.border}`}}>
          <div style={{fontSize:11,fontWeight:700,color:C.purple,textTransform:"uppercase",letterSpacing:1.5,marginBottom:10}}>
            Question {qIdx+1} of {questions.length}
            {isMulti && <span style={{marginLeft:8,background:C.lavPale,borderRadius:999,padding:"2px 8px",fontSize:10}}>Select all that apply</span>}
          </div>
          <p style={{fontSize:16,fontWeight:700,color:C.navy,lineHeight:1.55,marginBottom:20}}>{q.text}</p>
          <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:24}}>
            {q.options.map(opt=>{
              const active = sel.includes(opt.id);
              return(
                <button key={opt.id} onClick={()=>select(opt.id)}
                  style={{background:active?C.lavPale:C.bg,border:`2px solid ${active?C.purple:C.border}`,borderRadius:5,padding:"12px 16px",textAlign:"left",cursor:"pointer",fontSize:13,color:active?C.navy:C.text,lineHeight:1.5,transition:"all 0.15s",fontFamily:"'Inter',sans-serif",fontWeight:active?600:400}}>
                  {opt.text}
                </button>
              );
            })}
          </div>
          <button onClick={next} disabled={sel.length===0}
            style={{width:"100%",background:sel.length?C.purple:C.border,color:sel.length?"#fff":C.muted,border:"none",borderRadius:999,padding:"13px",fontWeight:700,fontSize:14,cursor:sel.length?"pointer":"not-allowed",transition:"all 0.2s"}}>
            {isLast ? "See my results →" : "Next →"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SCOTT ONBOARDING
══════════════════════════════════════════════════════════════ */
function ScottOnboarding({onComplete, existingProfile=null}){
  const [step, setStep] = useState(existingProfile ? 1 : 0);
  const [showAssessment, setShowAssessment] = useState(false);
  const [assessmentDone, setAssessmentDone] = useState(false);
  const [profile, setProfile] = useState(existingProfile || {
    name:"", focus:"", billings:"", challenge:"", ownChallenge:"", biggestWin:""
  });

  const update = (k,v) => setProfile(p=>({...p,[k]:v}));

  const steps = [
    {id:"name",    label:"Your name",            field:"name",         placeholder:"e.g. Alex Chen"},
    {id:"focus",   label:"Your recruitment focus",field:"focus",        placeholder:"e.g. Tech, Sales, Finance"},
    {id:"billing", label:"Annual billings",       field:"billings",     placeholder:"e.g. $250k, $500k+"},
    {id:"challenge",label:"Your category challenge",field:"challenge",  placeholder:"e.g. Candidate objections, cold calling"},
    {id:"ownWords",label:"In your own words — what's making this hard?",field:"ownChallenge",placeholder:"Be honest — this is just for Scott"},
    {id:"win",     label:"Your biggest recent win",field:"biggestWin",  placeholder:"What went well recently?"},
  ];

  if(showAssessment) return(
    <RoleplayAssessment
      challenge={profile.challenge}
      onComplete={(ans)=>{ setAssessmentDone(true); setShowAssessment(false); }}
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
            <label style={{display:"block",fontSize:15,fontWeight:700,color:C.navy,marginBottom:12}}>{currentStep.label}</label>
            <input
              value={profile[currentStep.field]||""}
              onChange={e=>update(currentStep.field,e.target.value)}
              onKeyDown={e=>{ if(e.key==="Enter" && canContinue){ isLast ? (!assessmentDone ? setShowAssessment(true) : onComplete(profile)) : setStep(s=>s+1); }}}
              placeholder={currentStep.placeholder}
              autoFocus
              style={{width:"100%",background:C.bg,border:`2px solid ${C.border}`,borderRadius:5,padding:"12px 16px",fontSize:14,color:C.text,outline:"none",fontFamily:"'Inter',sans-serif",boxSizing:"border-box",transition:"border-color 0.2s"}}
            />
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
              onComplete(profile);
            } else {
              setStep(s=>s+1);
            }
          }}
          disabled={!canContinue}
          style={{width:"100%",background:canContinue?C.purple:C.border,color:canContinue?"#fff":C.muted,border:"none",borderRadius:999,padding:"13px",fontWeight:700,fontSize:14,cursor:canContinue?"pointer":"not-allowed",transition:"all 0.2s"}}>
          {isLast ? (assessmentDone ? "Start learning →" : "Take baseline assessment →") : "Continue →"}
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
                    background:m.role==="user"?C.navy:"rgba(237,233,254,0.5)",
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
   MANAGER DASHBOARD — v2
   Three insight modules:
   1. Scott's Briefing — AI-generated daily action items
   2. Skill Drift — regression & plateau detection per consultant
   3. Confidence Map — confidence vs behaviour gap quadrant
   4. Engagement — cadence, energy & activity flags
══════════════════════════════════════════════════════════════ */

/* ── Rich mock data for 15 consultants ── */
const MOCK_TEAM = [
  { id:101, name:"Jamie Chen",        ini:"JC", col:"#5B8DB8", role:"Senior Recruiter",  focus:"Tech & Engineering",
    bh:[{w:"W6",o:0.45,d:0.40,l:0.50,ob:0.35,cl:0.30},{w:"W5",o:0.50,d:0.45,l:0.55,ob:0.40,cl:0.35},{w:"W4",o:0.55,d:0.50,l:0.60,ob:0.45,cl:0.40},{w:"W3",o:0.62,d:0.55,l:0.65,ob:0.50,cl:0.45},{w:"W2",o:0.68,d:0.62,l:0.70,ob:0.57,cl:0.52},{w:"W1",o:0.75,d:0.68,l:0.76,ob:0.63,cl:0.58}],
    ch:[{s:1,c:3,b:55},{s:2,c:3,b:58},{s:3,c:3,b:60},{s:4,c:4,b:63},{s:5,c:4,b:67},{s:6,c:4,b:70},{s:7,c:4,b:72},{s:8,c:4,b:74},{s:9,c:5,b:75},{s:10,c:5,b:76}],
    avgConf:4.0, avgSkill:67, energy:[4,4,3,5,4,4,5,4,3,4,5,4,4,5], avgEnergy:4.1,
    sessW:4, sessLW:3, lastActive:0, status:"improving", quad:"on_track", flag:null, score:74, rpc:10 },

  { id:102, name:"Sarah O'Brien",     ini:"SO", col:"#A090CC", role:"Recruiter",          focus:"Accounting & Finance",
    bh:[{w:"W6",o:0.55,d:0.38,l:0.58,ob:0.42,cl:0.36},{w:"W5",o:0.56,d:0.37,l:0.58,ob:0.43,cl:0.37},{w:"W4",o:0.57,d:0.38,l:0.59,ob:0.42,cl:0.36},{w:"W3",o:0.56,d:0.39,l:0.57,ob:0.41,cl:0.37},{w:"W2",o:0.57,d:0.38,l:0.58,ob:0.42,cl:0.36},{w:"W1",o:0.58,d:0.37,l:0.59,ob:0.43,cl:0.37}],
    ch:[{s:1,c:4,b:60},{s:2,c:4,b:60},{s:3,c:4,b:61},{s:4,c:4,b:60},{s:5,c:4,b:61},{s:6,c:4,b:60},{s:7,c:4,b:61},{s:8,c:4,b:62},{s:9,c:4,b:61},{s:10,c:4,b:62}],
    avgConf:4.0, avgSkill:61, energy:[3,4,3,4,3,4,3,4,3,4,3,4,3,4], avgEnergy:3.5,
    sessW:3, sessLW:3, lastActive:1, status:"plateau", quad:"on_track", flag:null, score:61, rpc:10 },

  { id:103, name:"Marcus Lee",        ini:"ML", col:"#C48A4A", role:"Senior Recruiter",   focus:"Sales & BD",
    bh:[{w:"W6",o:0.80,d:0.72,l:0.78,ob:0.68,cl:0.74},{w:"W5",o:0.78,d:0.70,l:0.76,ob:0.66,cl:0.72},{w:"W4",o:0.74,d:0.67,l:0.73,ob:0.63,cl:0.68},{w:"W3",o:0.68,d:0.62,l:0.68,ob:0.57,cl:0.62},{w:"W2",o:0.61,d:0.56,l:0.62,ob:0.50,cl:0.54},{w:"W1",o:0.55,d:0.50,l:0.57,ob:0.44,cl:0.48}],
    ch:[{s:1,c:5,b:80},{s:2,c:5,b:78},{s:3,c:5,b:76},{s:4,c:5,b:73},{s:5,c:4,b:70},{s:6,c:4,b:67},{s:7,c:4,b:64},{s:8,c:4,b:61},{s:9,c:4,b:58},{s:10,c:4,b:55}],
    avgConf:4.4, avgSkill:62, energy:[4,4,5,4,4,3,4,4,5,4,4,4,5,4], avgEnergy:4.2,
    sessW:3, sessLW:4, lastActive:2, status:"regressing", quad:"overconfident", flag:null, score:62, rpc:10,
    regressionSkill:"Opening & Close", regressionNote:"Opening scores dropped from 80% → 55% over 6 weeks. Confidence remains high — classic overconfidence blind spot." },

  { id:104, name:"Priya Sharma",      ini:"PS", col:"#7B9E6A", role:"Recruiter",          focus:"Healthcare & Allied",
    bh:[{w:"W6",o:0.32,d:0.28,l:0.38,ob:0.25,cl:0.22},{w:"W5",o:0.38,d:0.34,l:0.43,ob:0.30,cl:0.28},{w:"W4",o:0.45,d:0.40,l:0.50,ob:0.37,cl:0.34},{w:"W3",o:0.53,d:0.48,l:0.58,ob:0.44,cl:0.41},{w:"W2",o:0.62,d:0.55,l:0.66,ob:0.52,cl:0.48},{w:"W1",o:0.70,d:0.63,l:0.74,ob:0.60,cl:0.56}],
    ch:[{s:1,c:2,b:35},{s:2,c:2,b:40},{s:3,c:2,b:46},{s:4,c:3,b:52},{s:5,c:3,b:57},{s:6,c:3,b:62},{s:7,c:3,b:66},{s:8,c:3,b:69},{s:9,c:3,b:72},{s:10,c:3,b:70}],
    avgConf:2.7, avgSkill:57, energy:[3,3,4,3,4,4,3,4,4,5,4,4,5,4], avgEnergy:3.9,
    sessW:5, sessLW:4, lastActive:0, status:"improving", quad:"hidden_gem", flag:null, score:61, rpc:10,
    hiddenGemNote:"Skill improving fast but confidence hasn't caught up yet. Needs positive reinforcement this week." },

  { id:105, name:"Tom Walsh",         ini:"TW", col:"#6B8A7C", role:"Recruiter",          focus:"Construction & Infra",
    bh:[{w:"W6",o:0.60,d:0.55,l:0.65,ob:0.50,cl:0.45},{w:"W5",o:0.62,d:0.56,l:0.66,ob:0.51,cl:0.46},{w:"W4",o:0.61,d:0.55,l:0.65,ob:0.50,cl:0.45},{w:"W3",o:0.63,d:0.57,l:0.67,ob:0.52,cl:0.47},{w:"W2",o:0.62,d:0.56,l:0.66,ob:0.51,cl:0.46},{w:"W1",o:0.64,d:0.57,l:0.68,ob:0.53,cl:0.47}],
    ch:[{s:1,c:4,b:63},{s:2,c:4,b:64},{s:3,c:4,b:63},{s:4,c:4,b:65},{s:5,c:4,b:64},{s:6,c:4,b:63},{s:7,c:4,b:65},{s:8,c:4,b:64},{s:9,c:4,b:65},{s:10,c:4,b:64}],
    avgConf:4.0, avgSkill:64, energy:[4,3,4,4,3,0,0,0,0,0,0,0,0,0], avgEnergy:2.7,
    sessW:0, sessLW:3, lastActive:6, status:"stable", quad:"on_track", flag:"inactive", score:64, rpc:10,
    flagNote:"6 days without a session. Last energy check-in was 4/5 before the gap — reach out to check in." },

  { id:106, name:"Amy Davidson",      ini:"AD", col:"#C4839A", role:"Senior Recruiter",   focus:"Marketing & Comms",
    bh:[{w:"W6",o:0.42,d:0.38,l:0.46,ob:0.34,cl:0.30},{w:"W5",o:0.50,d:0.45,l:0.54,ob:0.41,cl:0.37},{w:"W4",o:0.58,d:0.52,l:0.62,ob:0.48,cl:0.44},{w:"W3",o:0.65,d:0.58,l:0.69,ob:0.55,cl:0.51},{w:"W2",o:0.71,d:0.65,l:0.75,ob:0.61,cl:0.57},{w:"W1",o:0.78,d:0.72,l:0.80,ob:0.68,cl:0.64}],
    ch:[{s:1,c:3,b:44},{s:2,c:3,b:50},{s:3,c:4,b:57},{s:4,c:4,b:63},{s:5,c:4,b:68},{s:6,c:4,b:72},{s:7,c:4,b:75},{s:8,c:5,b:78},{s:9,c:5,b:79},{s:10,c:5,b:80}],
    avgConf:4.1, avgSkill:67, energy:[4,5,4,5,5,4,5,5,4,5,4,5,5,4], avgEnergy:4.6,
    sessW:5, sessLW:4, lastActive:0, status:"improving", quad:"on_track", flag:null, score:72, rpc:10 },

  { id:107, name:"Ryan Carter",       ini:"RC", col:"#8A6F98", role:"Recruiter",           focus:"Legal",
    bh:[{w:"W6",o:0.65,d:0.58,l:0.68,ob:0.55,cl:0.50},{w:"W5",o:0.62,d:0.52,l:0.64,ob:0.50,cl:0.45},{w:"W4",o:0.57,d:0.45,l:0.59,ob:0.43,cl:0.38},{w:"W3",o:0.50,d:0.38,l:0.53,ob:0.36,cl:0.31},{w:"W2",o:0.44,d:0.32,l:0.47,ob:0.30,cl:0.25},{w:"W1",o:0.38,d:0.27,l:0.41,ob:0.24,cl:0.19}],
    ch:[{s:1,c:3,b:62},{s:2,c:3,b:58},{s:3,c:2,b:53},{s:4,c:2,b:48},{s:5,c:2,b:43},{s:6,c:2,b:39},{s:7,c:2,b:35},{s:8,c:2,b:32},{s:9,c:2,b:29},{s:10,c:2,b:28}],
    avgConf:2.2, avgSkill:43, energy:[3,2,2,1,2,1,2,1,2,2,1,1,2,2], avgEnergy:1.7,
    sessW:2, sessLW:4, lastActive:2, status:"regressing", quad:"needs_support", flag:"low_energy", score:43, rpc:10,
    regressionSkill:"Discovery & Close", regressionNote:"All behaviour scores declining for 6 consecutive weeks. Energy averaging 1.7/5 — this needs a 1:1 conversation before more roleplay.",
    hiddenGemNote:null },

  { id:108, name:"Ella Morton",       ini:"EM", col:"#B5956A", role:"Recruiter",           focus:"Property & Real Estate",
    bh:[{w:"W6",o:0.52,d:0.48,l:0.55,ob:0.44,cl:0.40},{w:"W5",o:0.53,d:0.49,l:0.56,ob:0.45,cl:0.41},{w:"W4",o:0.53,d:0.48,l:0.55,ob:0.44,cl:0.40},{w:"W3",o:0.54,d:0.50,l:0.57,ob:0.46,cl:0.42},{w:"W2",o:0.52,d:0.48,l:0.55,ob:0.44,cl:0.40},{w:"W1",o:0.53,d:0.49,l:0.56,ob:0.45,cl:0.41}],
    ch:[{s:1,c:2,b:55},{s:2,c:2,b:55},{s:3,c:2,b:56},{s:4,c:2,b:54},{s:5,c:2,b:55},{s:6,c:2,b:57},{s:7,c:2,b:55},{s:8,c:2,b:56},{s:9,c:2,b:54},{s:10,c:2,b:55}],
    avgConf:2.0, avgSkill:55, energy:[3,3,4,3,3,3,4,3,3,4,3,3,4,3], avgEnergy:3.2,
    sessW:3, sessLW:3, lastActive:1, status:"plateau", quad:"hidden_gem", flag:null, score:55, rpc:10,
    hiddenGemNote:"Consistent skill level but confidence chronically low. Has potential — a confidence-focused coaching session could unlock improvement." },

  { id:109, name:"James Xu",          ini:"JX", col:"#5C7B9E", role:"Senior Recruiter",   focus:"Finance & Banking",
    bh:[{w:"W6",o:0.70,d:0.65,l:0.72,ob:0.62,cl:0.58},{w:"W5",o:0.71,d:0.66,l:0.73,ob:0.63,cl:0.59},{w:"W4",o:0.70,d:0.65,l:0.72,ob:0.62,cl:0.58},{w:"W3",o:0.72,d:0.66,l:0.74,ob:0.63,cl:0.60},{w:"W2",o:0.71,d:0.66,l:0.73,ob:0.63,cl:0.59},{w:"W1",o:0.72,d:0.67,l:0.74,ob:0.63,cl:0.60}],
    ch:[{s:1,c:4,b:71},{s:2,c:4,b:72},{s:3,c:4,b:71},{s:4,c:4,b:72},{s:5,c:4,b:71},{s:6,c:4,b:73},{s:7,c:4,b:72},{s:8,c:4,b:72},{s:9,c:4,b:73},{s:10,c:4,b:72}],
    avgConf:4.0, avgSkill:72, energy:[4,4,4,5,4,4,4,4,5,4,4,4,5,4], avgEnergy:4.2,
    sessW:4, sessLW:4, lastActive:0, status:"stable", quad:"on_track", flag:null, score:72, rpc:10 },

  { id:110, name:"Sophie Blackwell",  ini:"SB", col:"#9E5C5C", role:"Senior Recruiter",   focus:"Executive & C-Suite",
    bh:[{w:"W6",o:0.78,d:0.74,l:0.80,ob:0.76,cl:0.80},{w:"W5",o:0.76,d:0.70,l:0.78,ob:0.72,cl:0.75},{w:"W4",o:0.72,d:0.65,l:0.74,ob:0.65,cl:0.67},{w:"W3",o:0.66,d:0.58,l:0.68,ob:0.55,cl:0.57},{w:"W2",o:0.58,d:0.50,l:0.60,ob:0.46,cl:0.48},{w:"W1",o:0.50,d:0.43,l:0.54,ob:0.38,cl:0.40}],
    ch:[{s:1,c:5,b:80},{s:2,c:5,b:76},{s:3,c:5,b:73},{s:4,c:5,b:69},{s:5,c:5,b:64},{s:6,c:4,b:60},{s:7,c:4,b:56},{s:8,c:4,b:53},{s:9,c:4,b:51},{s:10,c:4,b:50}],
    avgConf:4.5, avgSkill:63, energy:[4,4,5,4,4,4,5,4,4,4,5,4,4,4], avgEnergy:4.2,
    sessW:3, sessLW:5, lastActive:2, status:"regressing", quad:"overconfident", flag:null, score:63, rpc:10,
    regressionSkill:"Close & Objection Handling", regressionNote:"Close rate dropped from 80% → 40% over 6 weeks. High confidence masking the decline. Needs candid conversation." },

  { id:111, name:"Daniel Frost",      ini:"DF", col:"#7A8C6E", role:"Recruiter",           focus:"Supply Chain & Ops",
    bh:[{w:"W6",o:0.35,d:0.30,l:0.40,ob:0.28,cl:0.24},{w:"W5",o:0.42,d:0.37,l:0.46,ob:0.34,cl:0.30},{w:"W4",o:0.50,d:0.45,l:0.54,ob:0.42,cl:0.38},{w:"W3",o:0.58,d:0.52,l:0.62,ob:0.49,cl:0.45},{w:"W2",o:0.65,d:0.60,l:0.69,ob:0.56,cl:0.52},{w:"W1",o:0.72,d:0.66,l:0.75,ob:0.63,cl:0.58}],
    ch:[{s:1,c:3,b:37},{s:2,c:3,b:44},{s:3,c:3,b:51},{s:4,c:4,b:57},{s:5,c:4,b:63},{s:6,c:4,b:68},{s:7,c:4,b:72},{s:8,c:4,b:74},{s:9,c:5,b:75},{s:10,c:5,b:73}],
    avgConf:3.9, avgSkill:61, energy:[4,4,4,5,4,4,4,5,4,4,4,5,4,4], avgEnergy:4.2,
    sessW:5, sessLW:4, lastActive:0, status:"improving", quad:"on_track", flag:null, score:65, rpc:10 },

  { id:112, name:"Mia Nguyen",        ini:"MN", col:"#8E6AB8", role:"Recruiter",           focus:"Nursing & Healthcare",
    bh:[{w:"W6",o:0.34,d:0.30,l:0.37,ob:0.26,cl:0.22},{w:"W5",o:0.35,d:0.29,l:0.38,ob:0.27,cl:0.23},{w:"W4",o:0.35,d:0.30,l:0.38,ob:0.27,cl:0.22},{w:"W3",o:0.34,d:0.29,l:0.37,ob:0.26,cl:0.22},{w:"W2",o:0.35,d:0.30,l:0.38,ob:0.27,cl:0.23},{w:"W1",o:0.34,d:0.29,l:0.37,ob:0.26,cl:0.22}],
    ch:[{s:1,c:2,b:35},{s:2,c:2,b:34},{s:3,c:2,b:35},{s:4,c:2,b:34},{s:5,c:2,b:35},{s:6,c:2,b:34},{s:7,c:2,b:35},{s:8,c:2,b:34},{s:9,c:2,b:35},{s:10,c:2,b:34}],
    avgConf:2.0, avgSkill:35, energy:[2,3,2,3,2,2,3,2,3,2,2,3,2,3], avgEnergy:2.4,
    sessW:2, sessLW:2, lastActive:2, status:"plateau", quad:"needs_support", flag:"low_energy", score:35, rpc:10,
    flagNote:"Stuck at beginner level for 6+ weeks and energy chronically low. Likely needs structured mentoring, not more solo roleplay." },

  { id:113, name:"Connor Reilly",     ini:"CR", col:"#7A7A7A", role:"Recruiter",           focus:"Civil Engineering",
    bh:[{w:"W6",o:0.60,d:0.54,l:0.63,ob:0.50,cl:0.46},{w:"W5",o:0.61,d:0.55,l:0.64,ob:0.51,cl:0.47},{w:"W4",o:0.60,d:0.54,l:0.63,ob:0.50,cl:0.46},{w:"W3",o:0.62,d:0.56,l:0.65,ob:0.52,cl:0.48},{w:"W2",o:0.61,d:0.55,l:0.64,ob:0.51,cl:0.47},{w:"W1",o:0.60,d:0.54,l:0.63,ob:0.50,cl:0.46}],
    ch:[{s:1,c:3,b:60},{s:2,c:3,b:61},{s:3,c:3,b:60},{s:4,c:3,b:61},{s:5,c:3,b:60},{s:6,c:3,b:62},{s:7,c:3,b:61},{s:8,c:3,b:60},{s:9,c:3,b:61},{s:10,c:3,b:60}],
    avgConf:3.0, avgSkill:61, energy:[3,3,4,3,0,0,0,0,0,0,0,0,0,0], avgEnergy:1.9,
    sessW:0, sessLW:3, lastActive:8, status:"stable", quad:"on_track", flag:"inactive", score:60, rpc:10,
    flagNote:"8 days without any activity. Was showing stable progress before going quiet. Priority check-in this week." },

  { id:114, name:"Kira Patel",        ini:"KP", col:"#6B9E8C", role:"Recruiter",           focus:"HR & People",
    bh:[{w:"W6",o:0.28,d:0.24,l:0.32,ob:0.20,cl:0.18},{w:"W5",o:0.36,d:0.31,l:0.40,ob:0.28,cl:0.24},{w:"W4",o:0.45,d:0.40,l:0.49,ob:0.37,cl:0.33},{w:"W3",o:0.54,d:0.48,l:0.58,ob:0.45,cl:0.41},{w:"W2",o:0.63,d:0.56,l:0.67,ob:0.53,cl:0.49},{w:"W1",o:0.72,d:0.65,l:0.75,ob:0.61,cl:0.57}],
    ch:[{s:1,c:2,b:28},{s:2,c:2,b:34},{s:3,c:2,b:42},{s:4,c:2,b:49},{s:5,c:3,b:56},{s:6,c:3,b:62},{s:7,c:3,b:66},{s:8,c:3,b:70},{s:9,c:3,b:72},{s:10,c:3,b:73}],
    avgConf:2.6, avgSkill:55, energy:[4,3,4,4,5,4,4,5,4,5,4,5,4,5], avgEnergy:4.4,
    sessW:6, sessLW:5, lastActive:0, status:"improving", quad:"hidden_gem", flag:null, score:60, rpc:10,
    hiddenGemNote:"Fastest improver on the team — skill up 44pp in 6 weeks. Confidence still lagging behind real gains. Acknowledge progress explicitly." },

  { id:115, name:"Ben Fraser",        ini:"BF", col:"#6B7A8D", role:"Senior Recruiter",   focus:"Digital & Media",
    bh:[{w:"W6",o:0.68,d:0.62,l:0.70,ob:0.58,cl:0.54},{w:"W5",o:0.69,d:0.63,l:0.71,ob:0.59,cl:0.55},{w:"W4",o:0.68,d:0.62,l:0.70,ob:0.58,cl:0.54},{w:"W3",o:0.70,d:0.64,l:0.72,ob:0.60,cl:0.56},{w:"W2",o:0.69,d:0.63,l:0.71,ob:0.59,cl:0.55},{w:"W1",o:0.70,d:0.64,l:0.72,ob:0.60,cl:0.56}],
    ch:[{s:1,c:4,b:69},{s:2,c:4,b:69},{s:3,c:4,b:70},{s:4,c:4,b:69},{s:5,c:4,b:70},{s:6,c:4,b:70},{s:7,c:4,b:70},{s:8,c:4,b:71},{s:9,c:4,b:70},{s:10,c:4,b:71}],
    avgConf:4.0, avgSkill:70, energy:[4,4,4,4,4,4,4,4,4,4,4,4,4,4], avgEnergy:4.0,
    sessW:4, sessLW:4, lastActive:1, status:"stable", quad:"on_track", flag:null, score:70, rpc:10 },
];

/* ── Helpers ── */
const skillKeys = [
  {key:"o",label:"Opening"},
  {key:"d",label:"Discovery"},
  {key:"l",label:"Listening"},
  {key:"ob",label:"Objections"},
  {key:"cl",label:"Close"},
];

function Sparkline({data, color="#4A3F8C", height=28, width=80}){
  if(!data||data.length<2) return null;
  const min=Math.min(...data), max=Math.max(...data);
  const range=max-min||0.001;
  const pts=data.map((v,i)=>{
    const x=(i/(data.length-1))*width;
    const y=height-((v-min)/range)*(height-4)-2;
    return `${x},${y}`;
  }).join(" ");
  return(
    <svg width={width} height={height} style={{display:"block"}}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={pts.split(" ").pop().split(",")[0]} cy={pts.split(" ").pop().split(",")[1]} r={3} fill={color}/>
    </svg>
  );
}

function BehaviourSparkline({history, skillKey, color}){
  const vals = history.map(w=>w[skillKey]);
  return <Sparkline data={vals} color={color} height={24} width={64}/>;
}

function EnergyBar({energy, maxH=20}){
  const col = energy<=0?"#E5E7EB":energy<=2?"#F87171":energy===3?"#FBBF24":energy===4?"#34D399":"#10B981";
  const h = energy<=0 ? 3 : Math.max(4, (energy/5)*maxH);
  return <div style={{width:8,height:maxH,display:"flex",flexDirection:"column",justifyContent:"flex-end"}}><div style={{height:h,background:col,borderRadius:2,transition:"height 0.3s"}}/></div>;
}

function statusBadge(status){
  const map={
    improving:{bg:"#DCFCE7",c:"#166534",label:"Improving ↑"},
    regressing:{bg:"#FEE2E2",c:"#991B1B",label:"Regressing ↓"},
    plateau:{bg:"#FEF3C7",c:"#854D0E",label:"Plateau →"},
    stable:{bg:"#F3F4F6",c:"#6B7280",label:"Stable"},
  };
  const s=map[status]||map.stable;
  return <span style={{background:s.bg,color:s.c,borderRadius:999,padding:"2px 10px",fontSize:10,fontWeight:700}}>{s.label}</span>;
}

function quadrantStyle(quad){
  const map={
    on_track:{bg:"#F0FDF4",border:"#BBF7D0",c:"#166534",icon:"✓",label:"On Track"},
    overconfident:{bg:"#FEF3C7",border:"#FDE68A",c:"#92400E",icon:"⚠",label:"Overconfident"},
    hidden_gem:{bg:"#EDE9FE",border:"#C4B5FD",c:"#5B21B6",icon:"💎",label:"Hidden Gem"},
    needs_support:{bg:"#FEE2E2",border:"#FECACA",c:"#991B1B",icon:"🔴",label:"Needs Support"},
  };
  return map[quad]||map.on_track;
}


/* ══════════════════════════════════════════════════════════════
   MANAGER DASHBOARD
══════════════════════════════════════════════════════════════ */
function ManagerDashboard({go, userId=null}){
  const [activeTab, setActiveTab] = useState("overview");
  const [teamData, setTeamData]   = useState([]);
  const [inboxItems, setInboxItems] = useState([]);
  const [expandedInbox, setExpandedInbox] = useState(null);
  const [managerEmail, setManagerEmail] = useState(()=>loadManagerEmail()||"");
  const [addModal, setAddModal]   = useState(false);
  const [newMember, setNewMember] = useState({name:"",role:"",billings:"",focus:""});
  const [selLearner, setSelLearner] = useState(null);
  const [loadingData, setLoadingData] = useState(true);
  const [companyId, setCompanyId] = useState(()=>{ const p=loadProfile(); return p?.company_id||null; });
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteSent, setInviteSent]   = useState(false);
  const inviteLink = companyId ? `${window.location.origin}?company=${companyId}` : null;

  // Insight module state
  const [briefing, setBriefing]       = useState(null);
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [driftFilter, setDriftFilter] = useState("all");
  const [confSelected, setConfSelected] = useState(null);
  const [engFilter, setEngFilter]     = useState("all");

  useEffect(()=>{
    (async()=>{
      setLoadingData(true);
      try {
        const [team, inbox] = await Promise.all([
          Promise.race([sbLoadTeamData(), new Promise((_,r)=>setTimeout(()=>r(new Error('timeout')),4000))]),
          Promise.race([sbLoadManagerInbox(), new Promise((_,r)=>setTimeout(()=>r(new Error('timeout')),4000))]),
        ]);
        setTeamData(Array.isArray(team) ? team : loadTeamData());
        setInboxItems(Array.isArray(inbox) && inbox.length ? inbox : loadManagerInbox());
      } catch(e) {
        setTeamData(loadTeamData());
        setInboxItems(loadManagerInbox());
      }
      setLoadingData(false);
    })();
  },[]);

  // Use real team data only when it has analytics fields; otherwise show MOCK_TEAM as sample
  const hasRichData = teamData.length > 0 && teamData[0]?.bh;
  const usingSampleData = !hasRichData;
  const analyticsTeam = hasRichData ? teamData : MOCK_TEAM;

  const refreshInbox = async () => {
    const inbox = await sbLoadManagerInbox();
    setInboxItems(Array.isArray(inbox) ? inbox : loadManagerInbox());
  };

  const addMember = () => {
    if(!newMember.name.trim()) return;
    const member = {...newMember, id:Date.now(), score:0, ragFlags:[], emotionalReadiness:{}, smartGoals:[]};
    const updated = [...teamData, member];
    saveTeamData(updated);
    setTeamData(updated);
    setNewMember({name:"",role:"",billings:"",focus:""});
    setAddModal(false);
  };
  const removeMember = (id) => { const u=teamData.filter(m=>m.id!==id); saveTeamData(u); setTeamData(u); };

  // Generate Scott's briefing
  const generateBriefing = async () => {
    setBriefingLoading(true);
    const flags = analyticsTeam.filter(m=>m.flag||m.status==="regressing"||m.quad==="needs_support");
    const gems  = analyticsTeam.filter(m=>m.quad==="hidden_gem");
    const summary = `Team of ${analyticsTeam.length} recruiters.
Flags: ${flags.map(m=>`${m.name} (${m.status}, ${m.quad}${m.flag?", "+m.flag:""})`).join("; ")}.
Hidden gems: ${gems.map(m=>m.name).join(", ")}.
Inactive (5+ days): ${analyticsTeam.filter(m=>m.lastActive>=5).map(m=>`${m.name} (${m.lastActive}d)`).join(", ")||"none"}.
Low energy (<2.5): ${analyticsTeam.filter(m=>m.avgEnergy<2.5).map(m=>`${m.name} (${m.avgEnergy.toFixed(1)}/5)`).join(", ")||"none"}.
Regressing: ${analyticsTeam.filter(m=>m.status==="regressing").map(m=>`${m.name} (${m.regressionSkill||"skills"})`).join(", ")||"none"}.`;
    try {
      const text = await callAPI(
        [{role:"user",content:`Here is a summary of my 15-person recruitment team:\n\n${summary}\n\nGenerate a Scott's Briefing for me as their manager. Give me exactly 3 specific action items for today, naming the specific people and what to say or do. Be direct and practical. Format as JSON: {"headline":"one sentence summary of team state","actions":[{"priority":"high|medium","person":"name","action":"what to do","script":"exact opening line to say to them","why":"1 sentence reason"}]}`}],
        "You are Scott, a senior recruitment performance coach advising a manager. Be direct, specific, and practical. Focus on the 2-3 people who need immediate attention and 1 person with untapped potential. Return only valid JSON.",
        {max_tokens:600, temperature:0}
      );
      try {
        const parsed = parseJSON(text);
        setBriefing(parsed);
      } catch(e) {
        setBriefing({headline:"Team briefing generated", actions:[{priority:"high",person:"Team",action:"Review the Skill Drift and Engagement tabs for specific action items",script:"",why:"Manual review recommended"}]});
      }
    } catch(e) {
      setBriefing({headline:"Could not connect to AI — review tabs manually", actions:[]});
    }
    setBriefingLoading(false);
  };

  const tabs = [
    {id:"overview",   label:"Overview"},
    {id:"briefing",   label:"Scott's Briefing ✦"},
    {id:"drift",      label:"Skill Drift"},
    {id:"confidence", label:"Confidence Map"},
    {id:"engagement", label:"Engagement"},
    {id:"inbox",      label:`Inbox${inboxItems.filter(i=>!i.read).length?" ("+inboxItems.filter(i=>!i.read).length+")":""}` },
    {id:"goals",      label:"Dev Goals"},
    {id:"settings",   label:"Settings"},
  ];

  const EmptyTeam = ({message="Add team members to get started"}) => (
    <div style={{background:C.white,borderRadius:14,border:`1px solid ${C.border}`,padding:36,textAlign:"center"}}>
      <div style={{fontSize:28,marginBottom:8}}>👥</div>
      <div style={{fontWeight:700,color:C.navy,fontSize:14,marginBottom:4}}>No team members yet</div>
      <div style={{fontSize:13,color:C.muted,marginBottom:16}}>{message}</div>
      <button onClick={()=>setAddModal(true)} style={{background:C.purple,color:"#fff",border:"none",borderRadius:999,padding:"9px 20px",fontWeight:700,fontSize:13,cursor:"pointer"}}>+ Add member</button>
    </div>
  );

  /* ── Alert counts from analyticsTeam ── */
  const alertCount = analyticsTeam.filter(m=>m.status==="regressing"||m.flag==="inactive"||m.quad==="needs_support"||m.flag==="low_energy").length;
  const gemCount   = analyticsTeam.filter(m=>m.quad==="hidden_gem").length;

  return(
    <Shell page="team" go={go} userRole="manager" panel={false}>
      <div style={{animation:"fadeUp 0.35s ease both",maxWidth:960}}>

        {/* ── Header ── */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:10}}>
          <div>
            <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:2,color:C.muted,marginBottom:2}}>Manager View</div>
            <h1 style={{fontSize:22,fontWeight:800,color:C.navy}}>Team Development</h1>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            {alertCount>0 && (
              <div style={{background:"#FEE2E2",border:"1px solid #FECACA",borderRadius:999,padding:"6px 14px",fontSize:12,fontWeight:700,color:"#991B1B",cursor:"pointer"}} onClick={()=>setActiveTab("drift")}>
                ⚠ {alertCount} need attention
              </div>
            )}
            {gemCount>0 && (
              <div style={{background:"#EDE9FE",border:"1px solid #C4B5FD",borderRadius:999,padding:"6px 14px",fontSize:12,fontWeight:700,color:"#5B21B6",cursor:"pointer"}} onClick={()=>setActiveTab("confidence")}>
                💎 {gemCount} hidden gems
              </div>
            )}
            <button onClick={()=>go("admin")} style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:999,padding:"8px 16px",fontSize:12,fontWeight:600,color:C.muted,cursor:"pointer"}}>⚙ Firm Setup</button>
            <button onClick={()=>setAddModal(true)} style={{background:C.purple,color:"#fff",border:"none",borderRadius:999,padding:"8px 18px",fontSize:12,fontWeight:700,cursor:"pointer"}}>+ Add member</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{display:"flex",gap:4,marginBottom:20,background:C.white,borderRadius:5,padding:4,border:`1px solid ${C.border}`,overflowX:"auto",flexWrap:"wrap"}}>
          {tabs.map(t=>(
            <button key={t.id} onClick={()=>setActiveTab(t.id)}
              style={{padding:"7px 14px",borderRadius:9,border:"none",cursor:"pointer",fontSize:12,fontWeight:600,whiteSpace:"nowrap",background:activeTab===t.id?C.navy:"none",color:activeTab===t.id?"#fff":C.muted,transition:"all 0.15s"}}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════
            TAB: OVERVIEW
        ══════════════════════════════════════════ */}
        {activeTab==="overview" && (
          <div style={{animation:"fadeUp 0.3s ease both",display:"flex",flexDirection:"column",gap:14}}>

            {/* Sample data notice */}
            {usingSampleData && (
              <div style={{background:"#FEF3C7",borderRadius:10,border:"1px solid #FDE68A",padding:"10px 16px",display:"flex",gap:10,alignItems:"center"}}>
                <span style={{fontSize:16}}>📊</span>
                <span style={{fontSize:12,color:"#92400E"}}>Showing sample data. Invite your team to see their real analytics here.</span>
              </div>
            )}

            {/* Quick stats row */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
              {[
                {label:"Team size",      val:analyticsTeam.length,                                                    icon:"👥",  sub:"active consultants"},
                {label:"Need attention", val:alertCount,                                                              icon:"⚠",  sub:"regressions + flags",    accent:"#991B1B", bg:"#FEE2E2"},
                {label:"Hidden gems",    val:gemCount,                                                                icon:"💎", sub:"high skill, low conf",   accent:"#5B21B6", bg:"#EDE9FE"},
                {label:"Improving",      val:analyticsTeam.filter(m=>m.status==="improving").length,                  icon:"↑",   sub:"6-week trend up",         accent:"#166534", bg:"#DCFCE7"},
              ].map((s,i)=>(
                <div key={i} style={{background:s.bg||C.white,borderRadius:14,border:`1px solid ${s.bg?"transparent":C.border}`,padding:"16px 18px"}}>
                  <div style={{fontSize:20,marginBottom:2}}>{s.icon}</div>
                  <div style={{fontSize:26,fontWeight:900,color:s.accent||C.navy,lineHeight:1}}>{s.val}</div>
                  <div style={{fontSize:11,color:s.accent||C.muted,marginTop:3,fontWeight:600}}>{s.label}</div>
                  <div style={{fontSize:10,color:s.accent||C.muted,opacity:0.7}}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Quick status per person */}
            <div style={{background:C.white,borderRadius:14,border:`1px solid ${C.border}`,padding:18}}>
              <div style={{fontSize:12,fontWeight:700,color:C.navy,marginBottom:14}}>Team at a glance — last 6 weeks</div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {analyticsTeam.map(m=>{
                  const lastWeek = m.bh[m.bh.length-1];
                  const overall = Math.round(((lastWeek.o+lastWeek.d+lastWeek.l+lastWeek.ob+lastWeek.cl)/5)*100);
                  const qs = quadrantStyle(m.quad);
                  return(
                    <div key={m.id} style={{display:"flex",alignItems:"center",gap:12,padding:"8px 0",borderBottom:`1px solid ${C.bg}`}}>
                      <Av ini={m.ini} col={m.col} sz={32}/>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                          <span style={{fontWeight:700,color:C.navy,fontSize:13}}>{m.name}</span>
                          {statusBadge(m.status)}
                          {m.flag&&<span style={{background:"#FEF3C7",color:"#92400E",borderRadius:999,padding:"1px 8px",fontSize:10,fontWeight:700}}>{m.flag==="inactive"?"⏸ Inactive":"⚡ Low energy"}</span>}
                        </div>
                        <div style={{fontSize:11,color:C.muted}}>{m.role} · {m.focus}</div>
                      </div>
                      <div style={{display:"flex",gap:3,alignItems:"flex-end",height:20}}>
                        {m.bh.map((w,i)=>{
                          const s=Math.round(((w.o+w.d+w.l+w.ob+w.cl)/5)*100);
                          const h=Math.max(3,Math.round((s/100)*20));
                          const col=s>=70?"#34D399":s>=55?"#FBBF24":"#F87171";
                          return <div key={i} style={{width:6,height:h,background:col,borderRadius:2,opacity:0.7+i*0.05}}/>;
                        })}
                      </div>
                      <div style={{width:40,textAlign:"right",fontSize:13,fontWeight:800,color:overall>=70?C.green:overall>=55?C.amber:C.red}}>{overall}%</div>
                      <div style={{background:qs.bg,border:`1px solid ${qs.border}`,borderRadius:6,padding:"3px 8px",fontSize:10,fontWeight:700,color:qs.c,flexShrink:0}}>
                        {qs.icon}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick action prompt */}
            <div style={{background:C.navy,borderRadius:14,padding:"16px 20px",display:"flex",alignItems:"center",gap:14}}>
              <Av ini="SC" col={C.lavSoft} sz={36}/>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,color:"#fff",fontSize:14,marginBottom:3}}>Get Scott's briefing for today</div>
                <div style={{fontSize:12,color:"rgba(255,255,255,0.55)"}}>AI-generated action items based on your team's current data — who to talk to, what to say.</div>
              </div>
              <button onClick={()=>{ setActiveTab("briefing"); if(!briefing) generateBriefing(); }}
                style={{background:C.purple,color:"#fff",border:"none",borderRadius:999,padding:"10px 20px",fontWeight:700,fontSize:13,cursor:"pointer",whiteSpace:"nowrap"}}>
                Get briefing →
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════
            TAB: SCOTT'S BRIEFING
        ══════════════════════════════════════════ */}
        {activeTab==="briefing" && (
          <div style={{animation:"fadeUp 0.3s ease both",display:"flex",flexDirection:"column",gap:14}}>

            {/* Header card */}
            <div style={{background:C.navy,borderRadius:5,padding:"20px 22px",display:"flex",alignItems:"flex-start",gap:14}}>
              <Av ini="SC" col={C.lavSoft} sz={44}/>
              <div style={{flex:1}}>
                <div style={{fontWeight:800,color:"#fff",fontSize:16,marginBottom:4}}>Scott's Daily Briefing</div>
                <p style={{fontSize:13,color:"rgba(255,255,255,0.6)",lineHeight:1.65,margin:0}}>
                  I've analysed your team's recent activity, skill trends, confidence patterns, and engagement data.
                  Here are the 3 things that need your attention today — with exactly what to say.
                </p>
              </div>
              <button onClick={generateBriefing} disabled={briefingLoading}
                style={{background:"rgba(255,255,255,0.12)",color:"#fff",border:"1px solid rgba(255,255,255,0.2)",borderRadius:999,padding:"9px 18px",fontWeight:700,fontSize:12,cursor:briefingLoading?"not-allowed":"pointer",whiteSpace:"nowrap",opacity:briefingLoading?0.6:1}}>
                {briefingLoading?"Thinking…":"↺ Refresh"}
              </button>
            </div>

            {briefingLoading && (
              <div style={{background:C.white,borderRadius:14,border:`1px solid ${C.border}`,padding:40,textAlign:"center"}}>
                <div style={{display:"flex",justifyContent:"center",gap:6,marginBottom:12}}>
                  {[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:C.purple,animation:"bounce 1s infinite",animationDelay:`${i*0.2}s`}}/>)}
                </div>
                <div style={{fontSize:13,color:C.muted}}>Analysing team data…</div>
              </div>
            )}

            {!briefing && !briefingLoading && (
              <div style={{background:C.white,borderRadius:14,border:`1px solid ${C.border}`,padding:40,textAlign:"center"}}>
                <div style={{fontSize:36,marginBottom:12}}>📋</div>
                <div style={{fontWeight:700,color:C.navy,fontSize:15,marginBottom:8}}>Ready when you are</div>
                <p style={{fontSize:13,color:C.muted,marginBottom:20}}>Click the button above to generate today's briefing. Takes about 10 seconds.</p>
                <button onClick={generateBriefing} style={{background:C.purple,color:"#fff",border:"none",borderRadius:999,padding:"11px 28px",fontWeight:700,fontSize:14,cursor:"pointer"}}>
                  Generate briefing →
                </button>
              </div>
            )}

            {briefing && !briefingLoading && (
              <>
                {/* Headline */}
                <div style={{background:C.lavPale,borderRadius:14,border:`1px solid ${C.lavSoft}`,padding:"14px 18px"}}>
                  <div style={{fontSize:10,fontWeight:700,color:C.purple,textTransform:"uppercase",letterSpacing:1.5,marginBottom:4}}>Today's team status</div>
                  <div style={{fontSize:15,fontWeight:700,color:C.navy,lineHeight:1.5}}>{briefing.headline}</div>
                </div>

                {/* Action items */}
                {(briefing.actions||[]).map((action,i)=>(
                  <div key={i} style={{background:C.white,borderRadius:14,border:`2px solid ${action.priority==="high"?"#FECACA":action.priority==="medium"?"#FDE68A":C.border}`,padding:"18px 20px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                      <div style={{width:28,height:28,borderRadius:"50%",background:action.priority==="high"?"#FEE2E2":"#FEF3C7",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:900,color:action.priority==="high"?"#991B1B":"#92400E",flexShrink:0}}>{i+1}</div>
                      <div>
                        <div style={{fontSize:12,fontWeight:800,color:C.navy}}>{action.person}</div>
                        <span style={{background:action.priority==="high"?"#FEE2E2":"#FEF3C7",color:action.priority==="high"?"#991B1B":"#92400E",borderRadius:999,padding:"1px 8px",fontSize:10,fontWeight:700}}>{action.priority} priority</span>
                      </div>
                    </div>
                    <p style={{fontSize:13,color:C.navy,lineHeight:1.6,margin:"0 0 12px",fontWeight:500}}>{action.action}</p>
                    {action.script&&(
                      <div style={{background:C.bg,borderRadius:5,padding:"10px 14px",border:`1px solid ${C.border}`,marginBottom:8}}>
                        <div style={{fontSize:9,fontWeight:700,color:C.purple,textTransform:"uppercase",letterSpacing:1.5,marginBottom:4}}>What to say</div>
                        <p style={{fontSize:13,color:C.navy,fontStyle:"italic",lineHeight:1.55,margin:0}}>"{action.script}"</p>
                      </div>
                    )}
                    {action.why&&<div style={{fontSize:11,color:C.muted,lineHeight:1.55}}>Why: {action.why}</div>}
                  </div>
                ))}
              </>
            )}

            {/* Quick data panel */}
            <div style={{background:C.white,borderRadius:14,border:`1px solid ${C.border}`,padding:18}}>
              <div style={{fontSize:12,fontWeight:700,color:C.navy,marginBottom:12}}>Data behind the briefing</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                {[
                  {label:"Regressing", items:analyticsTeam.filter(m=>m.status==="regressing").map(m=>m.name), color:"#991B1B", bg:"#FEE2E2"},
                  {label:"Inactive 5+ days", items:analyticsTeam.filter(m=>m.lastActive>=5).map(m=>`${m.name} (${m.lastActive}d)`), color:"#92400E", bg:"#FEF3C7"},
                  {label:"Low energy", items:analyticsTeam.filter(m=>m.avgEnergy<2.5).map(m=>`${m.name} (${m.avgEnergy.toFixed(1)}/5)`), color:"#6B21A8", bg:"#EDE9FE"},
                ].map((section,i)=>(
                  <div key={i} style={{background:section.bg,borderRadius:5,padding:"12px 14px"}}>
                    <div style={{fontSize:10,fontWeight:800,color:section.color,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>{section.label}</div>
                    {section.items.length===0
                      ? <div style={{fontSize:12,color:section.color,opacity:0.6}}>None ✓</div>
                      : section.items.map((n,j)=><div key={j} style={{fontSize:12,color:section.color,fontWeight:600,marginBottom:2}}>• {n}</div>)
                    }
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════
            TAB: SKILL DRIFT
        ══════════════════════════════════════════ */}
        {activeTab==="drift" && (
          <div style={{animation:"fadeUp 0.3s ease both",display:"flex",flexDirection:"column",gap:14}}>

            {/* Explainer */}
            <div style={{background:C.lavPale,borderRadius:14,border:`1px solid ${C.lavSoft}`,padding:"13px 17px",display:"flex",gap:10,alignItems:"flex-start"}}>
              <span style={{fontSize:16}}>📉</span>
              <p style={{fontSize:12,color:C.purple,lineHeight:1.65,margin:0}}>
                <strong>Skill Drift</strong> tracks each consultant's behaviour scores across 6 weeks, per skill area.
                A <strong>regression</strong> means scores that were improving have reversed.
                A <strong>plateau</strong> means no meaningful progress for 4+ weeks.
                Both warrant different coaching conversations.
              </p>
            </div>

            {/* Filter chips */}
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {[
                {id:"all",    label:"All (15)"},
                {id:"regressing", label:"Regressing ("+analyticsTeam.filter(m=>m.status==="regressing").length+")"},
                {id:"plateau",    label:"Plateau ("+analyticsTeam.filter(m=>m.status==="plateau").length+")"},
                {id:"improving",  label:"Improving ("+analyticsTeam.filter(m=>m.status==="improving").length+")"},
                {id:"stable",     label:"Stable ("+analyticsTeam.filter(m=>m.status==="stable").length+")"},
              ].map(f=>(
                <button key={f.id} onClick={()=>setDriftFilter(f.id)}
                  style={{background:driftFilter===f.id?C.navy:C.white,color:driftFilter===f.id?"#fff":C.muted,border:`1px solid ${driftFilter===f.id?C.navy:C.border}`,borderRadius:999,padding:"6px 16px",fontSize:12,fontWeight:600,cursor:"pointer",transition:"all 0.15s"}}>
                  {f.label}
                </button>
              ))}
            </div>

            {/* Cards */}
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {analyticsTeam
                .filter(m=> driftFilter==="all" || m.status===driftFilter)
                .map(m=>{
                  const qs = quadrantStyle(m.quad);
                  const lastWeek = m.bh[m.bh.length-1];
                  const firstWeek = m.bh[0];
                  const overallNow = Math.round(((lastWeek.o+lastWeek.d+lastWeek.l+lastWeek.ob+lastWeek.cl)/5)*100);
                  const overallThen = Math.round(((firstWeek.o+firstWeek.d+firstWeek.l+firstWeek.ob+firstWeek.cl)/5)*100);
                  const delta = overallNow - overallThen;
                  return(
                    <div key={m.id} style={{background:C.white,borderRadius:14,border:`1px solid ${m.status==="regressing"?"#FECACA":m.status==="plateau"?"#FDE68A":C.border}`,padding:"16px 18px"}}>
                      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
                        <Av ini={m.ini} col={m.col} sz={38}/>
                        <div style={{flex:1}}>
                          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                            <span style={{fontWeight:800,color:C.navy,fontSize:14}}>{m.name}</span>
                            {statusBadge(m.status)}
                            <span style={{fontSize:12,fontWeight:700,color:delta>=0?"#166534":"#991B1B"}}>{delta>=0?"+":""}{delta}pp over 6 weeks</span>
                          </div>
                          <div style={{fontSize:11,color:C.muted}}>{m.role} · {m.focus}</div>
                        </div>
                        <div style={{textAlign:"right"}}>
                          <div style={{fontSize:22,fontWeight:900,color:overallNow>=70?C.green:overallNow>=55?C.amber:C.red}}>{overallNow}%</div>
                          <div style={{fontSize:10,color:C.muted}}>current</div>
                        </div>
                      </div>

                      {/* Skill sparklines */}
                      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8}}>
                        {skillKeys.map(sk=>{
                          const vals = m.bh.map(w=>w[sk.key]);
                          const now = vals[vals.length-1];
                          const then = vals[0];
                          const d = now - then;
                          const sparkColor = d>0.08?"#22C55E":d<-0.08?"#EF4444":C.muted;
                          return(
                            <div key={sk.key} style={{textAlign:"center"}}>
                              <div style={{fontSize:9,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:0.5,marginBottom:4}}>{sk.label}</div>
                              <div style={{display:"flex",justifyContent:"center"}}>
                                <BehaviourSparkline history={m.bh} skillKey={sk.key} color={sparkColor}/>
                              </div>
                              <div style={{fontSize:11,fontWeight:800,color:sparkColor,marginTop:3}}>{Math.round(now*100)}%</div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Regression/plateau note */}
                      {m.regressionNote && (
                        <div style={{background:"#FEF2F2",borderRadius:5,padding:"9px 12px",border:"1px solid #FECACA",marginTop:10}}>
                          <div style={{fontSize:9,fontWeight:800,color:"#991B1B",textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>⚠ Coaching note</div>
                          <p style={{fontSize:12,color:"#7F1D1D",lineHeight:1.55,margin:0}}>{m.regressionNote}</p>
                        </div>
                      )}
                      {m.status==="plateau" && !m.regressionNote && (
                        <div style={{background:"#FFFBEB",borderRadius:5,padding:"9px 12px",border:"1px solid #FDE68A",marginTop:10}}>
                          <div style={{fontSize:9,fontWeight:800,color:"#92400E",textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>→ Plateau detected</div>
                          <p style={{fontSize:12,color:"#78350F",lineHeight:1.55,margin:0}}>Scores consistent for 6 weeks with no breakthrough. Consider switching the practice format — paired roleplay or scenario variety often breaks a plateau.</p>
                        </div>
                      )}
                    </div>
                  );
              })}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════
            TAB: CONFIDENCE MAP
        ══════════════════════════════════════════ */}
        {activeTab==="confidence" && (
          <div style={{animation:"fadeUp 0.3s ease both",display:"flex",flexDirection:"column",gap:14}}>

            {/* Explainer */}
            <div style={{background:C.lavPale,borderRadius:14,border:`1px solid ${C.lavSoft}`,padding:"13px 17px",display:"flex",gap:10,alignItems:"flex-start"}}>
              <span style={{fontSize:16}}>🎯</span>
              <p style={{fontSize:12,color:C.purple,lineHeight:1.65,margin:0}}>
                <strong>Confidence Map</strong> plots each consultant's self-rated confidence against their actual behaviour scores from roleplays.
                The biggest coaching opportunities are <strong>Hidden Gems</strong> (high skill, low confidence — they're better than they think)
                and <strong>Overconfident</strong> (declining skill, but don't know it yet).
              </p>
            </div>

            {/* 2x2 quadrant grid */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              {[
                {quad:"on_track",    label:"On Track",      sub:"High confidence + Strong skill",       border:"#BBF7D0", bg:"#F0FDF4", headCol:"#166534", icon:"✓"},
                {quad:"overconfident",label:"Overconfident",sub:"High confidence + Skill declining",    border:"#FDE68A", bg:"#FFFBEB", headCol:"#92400E", icon:"⚠"},
                {quad:"hidden_gem",  label:"Hidden Gems",   sub:"Low confidence + Strong skill",        border:"#C4B5FD", bg:"#EDE9FE", headCol:"#5B21B6", icon:"💎"},
                {quad:"needs_support",label:"Needs Support",sub:"Low confidence + Lower skill",         border:"#FECACA", bg:"#FEF2F2", headCol:"#991B1B", icon:"🔴"},
              ].map(q=>{
                const people = analyticsTeam.filter(m=>m.quad===q.quad);
                return(
                  <div key={q.quad} style={{background:q.bg,borderRadius:14,border:`2px solid ${q.border}`,padding:"16px 18px",minHeight:160}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                      <span style={{fontSize:18}}>{q.icon}</span>
                      <div>
                        <div style={{fontWeight:800,color:q.headCol,fontSize:14}}>{q.label}</div>
                        <div style={{fontSize:11,color:q.headCol,opacity:0.7}}>{q.sub}</div>
                      </div>
                      <div style={{marginLeft:"auto",width:26,height:26,borderRadius:"50%",background:"rgba(255,255,255,0.6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:q.headCol}}>{people.length}</div>
                    </div>
                    <div style={{borderTop:`1px solid ${q.border}`,paddingTop:10,marginTop:8,display:"flex",flexDirection:"column",gap:8}}>
                      {people.length===0 && <div style={{fontSize:12,color:q.headCol,opacity:0.5,fontStyle:"italic"}}>Nobody here right now</div>}
                      {people.map(m=>(
                        <div key={m.id} style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",borderRadius:5,padding:"6px 8px",background:"rgba(255,255,255,0.5)",transition:"all 0.15s"}}
                          onClick={()=>setConfSelected(confSelected?.id===m.id?null:m)}
                          onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.8)"}
                          onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.5)"}>
                          <Av ini={m.ini} col={m.col} sz={26}/>
                          <div style={{flex:1}}>
                            <div style={{fontSize:12,fontWeight:700,color:q.headCol}}>{m.name}</div>
                            <div style={{fontSize:10,color:q.headCol,opacity:0.7}}>Conf: {m.avgConf.toFixed(1)}/5 · Skill: {m.avgSkill}%</div>
                          </div>
                          <span style={{fontSize:10,color:q.headCol,opacity:0.5}}>›</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Detail panel for selected person */}
            {confSelected && (
              <div style={{background:C.white,borderRadius:14,border:`1px solid ${C.border}`,padding:"18px 20px",animation:"fadeUp 0.2s ease both"}}>
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
                  <Av ini={confSelected.ini} col={confSelected.col} sz={40}/>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:800,color:C.navy,fontSize:15}}>{confSelected.name}</div>
                    <div style={{fontSize:12,color:C.muted}}>{confSelected.role} · {confSelected.focus}</div>
                  </div>
                  <button onClick={()=>setConfSelected(null)} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:18}}>×</button>
                </div>

                {/* Confidence vs Behaviour chart */}
                <div style={{fontSize:12,fontWeight:700,color:C.navy,marginBottom:10}}>Confidence vs Behaviour — last {confSelected.ch.length} sessions</div>
                <div style={{background:C.bg,borderRadius:5,padding:12,marginBottom:12}}>
                  <div style={{display:"flex",alignItems:"flex-end",gap:4,height:80}}>
                    {confSelected.ch.map((pt,i)=>{
                      const confH = Math.round((pt.c/5)*80);
                      const skillH = Math.round((pt.b/100)*80);
                      return(
                        <div key={i} style={{flex:1,display:"flex",gap:2,alignItems:"flex-end",justifyContent:"center"}}>
                          <div style={{width:6,height:confH,background:C.lavSoft,borderRadius:"3px 3px 0 0"}} title={`Confidence: ${pt.c}/5`}/>
                          <div style={{width:6,height:skillH,background:C.purple,borderRadius:"3px 3px 0 0"}} title={`Skill: ${pt.b}%`}/>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{display:"flex",gap:14,marginTop:6,fontSize:10,color:C.muted}}>
                    <span><span style={{display:"inline-block",width:8,height:8,background:C.lavSoft,borderRadius:2,marginRight:4}}/>Confidence (1-5)</span>
                    <span><span style={{display:"inline-block",width:8,height:8,background:C.purple,borderRadius:2,marginRight:4}}/>Skill score (%)</span>
                  </div>
                </div>

                {/* Coaching note */}
                {confSelected.hiddenGemNote && (
                  <div style={{background:"#EDE9FE",borderRadius:5,padding:"10px 14px",border:"1px solid #C4B5FD",marginBottom:10}}>
                    <div style={{fontSize:9,fontWeight:800,color:"#5B21B6",textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>💎 Coaching opportunity</div>
                    <p style={{fontSize:12,color:"#3B0764",lineHeight:1.6,margin:0}}>{confSelected.hiddenGemNote}</p>
                  </div>
                )}
                {confSelected.regressionNote && (
                  <div style={{background:"#FEF2F2",borderRadius:5,padding:"10px 14px",border:"1px solid #FECACA"}}>
                    <div style={{fontSize:9,fontWeight:800,color:"#991B1B",textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>⚠ Watch closely</div>
                    <p style={{fontSize:12,color:"#7F1D1D",lineHeight:1.6,margin:0}}>{confSelected.regressionNote}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════
            TAB: ENGAGEMENT
        ══════════════════════════════════════════ */}
        {activeTab==="engagement" && (
          <div style={{animation:"fadeUp 0.3s ease both",display:"flex",flexDirection:"column",gap:14}}>

            {/* Explainer */}
            <div style={{background:C.lavPale,borderRadius:14,border:`1px solid ${C.lavSoft}`,padding:"13px 17px",display:"flex",gap:10,alignItems:"flex-start"}}>
              <span style={{fontSize:16}}>⚡</span>
              <p style={{fontSize:12,color:C.purple,lineHeight:1.65,margin:0}}>
                <strong>Engagement Cadence</strong> tracks who's actively using HeyScott and how their energy is trending.
                Consistent usage drops and low energy scores are early warning signals — they usually precede performance issues by 2-3 weeks.
              </p>
            </div>

            {/* Summary row */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
              {[
                {label:"Active this week", val:analyticsTeam.filter(m=>m.sessW>0).length+"/"+analyticsTeam.length, icon:"✅", bg:"#F0FDF4", c:"#166534"},
                {label:"Inactive 5+ days", val:analyticsTeam.filter(m=>m.lastActive>=5).length, icon:"⏸", bg:"#FEF3C7", c:"#92400E"},
                {label:"Low energy (<2.5)", val:analyticsTeam.filter(m=>m.avgEnergy<2.5).length, icon:"🔋", bg:"#FEE2E2", c:"#991B1B"},
              ].map((s,i)=>(
                <div key={i} style={{background:s.bg,borderRadius:5,padding:"14px 16px",border:"1px solid transparent"}}>
                  <div style={{fontSize:22,marginBottom:4}}>{s.icon}</div>
                  <div style={{fontSize:24,fontWeight:900,color:s.c}}>{s.val}</div>
                  <div style={{fontSize:11,fontWeight:600,color:s.c,marginTop:2}}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Filter */}
            <div style={{display:"flex",gap:8}}>
              {[
                {id:"all",      label:"All"},
                {id:"inactive", label:"Inactive"},
                {id:"low_energy",label:"Low energy"},
                {id:"declining",label:"Usage declining"},
              ].map(f=>(
                <button key={f.id} onClick={()=>setEngFilter(f.id)}
                  style={{background:engFilter===f.id?C.navy:C.white,color:engFilter===f.id?"#fff":C.muted,border:`1px solid ${engFilter===f.id?C.navy:C.border}`,borderRadius:999,padding:"6px 16px",fontSize:12,fontWeight:600,cursor:"pointer",transition:"all 0.15s"}}>
                  {f.label}
                </button>
              ))}
            </div>

            {/* Per-person rows */}
            <div style={{background:C.white,borderRadius:14,border:`1px solid ${C.border}`,overflow:"hidden",overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
              <div style={{minWidth:640}}>
              {/* Header */}
              <div style={{display:"grid",gridTemplateColumns:"200px 1fr 80px 90px 80px 100px",gap:0,padding:"10px 16px",background:C.bg,borderBottom:`1px solid ${C.border}`,fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:0.5}}>
                <span>Consultant</span>
                <span>Energy — 14 days</span>
                <span style={{textAlign:"center"}}>Avg energy</span>
                <span style={{textAlign:"center"}}>Sessions</span>
                <span style={{textAlign:"center"}}>Last active</span>
                <span style={{textAlign:"center"}}>Flags</span>
              </div>

              {analyticsTeam
                .filter(m=>{
                  if(engFilter==="all") return true;
                  if(engFilter==="inactive") return m.lastActive>=5;
                  if(engFilter==="low_energy") return m.avgEnergy<2.5;
                  if(engFilter==="declining") return m.sessW < m.sessLW-1;
                  return true;
                })
                .sort((a,b)=>{
                  // Sort: flagged first, then by engagement descending
                  const aFlag = a.flag?1:0;
                  const bFlag = b.flag?1:0;
                  if(bFlag!==aFlag) return bFlag-aFlag;
                  return b.avgEnergy-a.avgEnergy;
                })
                .map((m,i,arr)=>{
                  const hasFlag = m.flag || m.lastActive>=5;
                  const lastBg = hasFlag?"#FFFBEB":C.white;
                  return(
                    <div key={m.id} style={{display:"grid",gridTemplateColumns:"200px 1fr 80px 90px 80px 100px",gap:0,padding:"12px 16px",borderBottom:i<arr.length-1?`1px solid ${C.bg}`:"none",background:lastBg,alignItems:"center"}}>
                      {/* Name */}
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <Av ini={m.ini} col={m.col} sz={28}/>
                        <div>
                          <div style={{fontSize:12,fontWeight:700,color:C.navy}}>{m.name}</div>
                          <div style={{fontSize:10,color:C.muted}}>{m.focus}</div>
                        </div>
                      </div>

                      {/* Energy sparkline — 14 days */}
                      <div style={{display:"flex",gap:2,alignItems:"flex-end",height:24}}>
                        {m.energy.map((e,j)=>(
                          <EnergyBar key={j} energy={e} maxH={22}/>
                        ))}
                      </div>

                      {/* Avg energy */}
                      <div style={{textAlign:"center"}}>
                        <div style={{fontSize:14,fontWeight:800,color:m.avgEnergy>=4?"#22C55E":m.avgEnergy>=2.5?"#FBBF24":"#EF4444"}}>{m.avgEnergy.toFixed(1)}</div>
                        <div style={{fontSize:9,color:C.muted}}>/5</div>
                      </div>

                      {/* Sessions this vs last week */}
                      <div style={{textAlign:"center"}}>
                        <div style={{fontSize:13,fontWeight:700,color:C.navy}}>{m.sessW} <span style={{fontSize:10,fontWeight:400,color:C.muted}}>this wk</span></div>
                        <div style={{fontSize:10,color:m.sessW<m.sessLW?"#EF4444":C.muted}}>{m.sessW<m.sessLW?"↓":m.sessW>m.sessLW?"↑":"="} {m.sessLW} last</div>
                      </div>

                      {/* Last active */}
                      <div style={{textAlign:"center"}}>
                        <div style={{fontSize:13,fontWeight:700,color:m.lastActive>=5?"#EF4444":m.lastActive>=3?"#FBBF24":C.navy}}>
                          {m.lastActive===0?"Today":m.lastActive===1?"Yesterday":`${m.lastActive}d ago`}
                        </div>
                      </div>

                      {/* Flags */}
                      <div style={{textAlign:"center",display:"flex",flexDirection:"column",gap:3,alignItems:"center"}}>
                        {m.flag==="inactive" && <span style={{background:"#FEF3C7",color:"#92400E",borderRadius:999,padding:"2px 8px",fontSize:9,fontWeight:700}}>⏸ Inactive</span>}
                        {m.flag==="low_energy" && <span style={{background:"#FEE2E2",color:"#991B1B",borderRadius:999,padding:"2px 8px",fontSize:9,fontWeight:700}}>🔋 Low energy</span>}
                        {m.sessW<m.sessLW-1 && <span style={{background:"#F3F4F6",color:"#6B7280",borderRadius:999,padding:"2px 8px",fontSize:9,fontWeight:700}}>↓ Dropping</span>}
                        {!m.flag && m.sessW>=m.sessLW && m.avgEnergy>=4 && <span style={{background:"#F0FDF4",color:"#166534",borderRadius:999,padding:"2px 8px",fontSize:9,fontWeight:700}}>✓ Active</span>}
                      </div>
                    </div>
                  );
              })}
              </div>{/* end minWidth wrapper */}
            </div>

            {/* Flag notes */}
            {analyticsTeam.filter(m=>m.flagNote).map(m=>(
              <div key={m.id} style={{background:C.white,borderRadius:5,border:`1px solid ${C.border}`,padding:"12px 16px",display:"flex",gap:10,alignItems:"flex-start"}}>
                <Av ini={m.ini} col={m.col} sz={28}/>
                <div>
                  <div style={{fontSize:12,fontWeight:700,color:C.navy,marginBottom:3}}>{m.name}</div>
                  <p style={{fontSize:12,color:C.muted,lineHeight:1.55,margin:0}}>{m.flagNote}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ══════════════════════════════════════════
            TAB: INBOX (preserved)
        ══════════════════════════════════════════ */}
        {activeTab==="inbox" && (
          <div style={{animation:"fadeUp 0.3s ease both"}}>
            {inboxItems.length===0 ? (
              <div style={{background:C.white,borderRadius:14,border:`1px solid ${C.border}`,padding:36,textAlign:"center"}}>
                <div style={{fontSize:28,marginBottom:8}}>📬</div>
                <div style={{fontWeight:700,color:C.navy,fontSize:14,marginBottom:4}}>No items yet</div>
                <div style={{fontSize:13,color:C.muted}}>Completed roleplays and reflections from your team will appear here.</div>
              </div>
            ):(
              <div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                  <div style={{fontSize:12,color:C.muted}}>{inboxItems.length} items · {inboxItems.filter(i=>!i.read).length} unread</div>
                  <button onClick={()=>{inboxItems.forEach((_,idx)=>markInboxRead(idx));refreshInbox();}} style={{background:"none",border:"none",color:C.purple,fontSize:12,fontWeight:600,cursor:"pointer"}}>Mark all read</button>
                </div>
                {[...inboxItems].reverse().map((item,i)=>{
                  const realIdx=inboxItems.length-1-i;
                  const isOpen=expandedInbox===realIdx;
                  const isRP=item.type==="roleplay_complete";
                  const borderCol=item.read?C.border:isRP?"#FDE68A":"#C4BCEE";
                  return(
                    <div key={i} style={{background:C.white,borderRadius:14,border:`1px solid ${borderCol}`,marginBottom:8,overflow:"hidden",opacity:item.read?0.88:1}}>
                      <div onClick={()=>{setExpandedInbox(isOpen?null:realIdx);if(!item.read){markInboxRead(realIdx);refreshInbox();}}}
                        style={{display:"flex",gap:12,alignItems:"center",padding:"12px 18px",cursor:"pointer"}}>
                        {!item.read&&<div style={{width:8,height:8,borderRadius:"50%",background:isRP?C.amber:C.purple,flexShrink:0}}/>}
                        <div style={{flex:1}}>
                          <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:2}}>
                            <div style={{fontSize:12,fontWeight:700,color:C.navy}}>{item.learner||"Learner"} — {isRP?"roleplay":"reflection"}</div>
                            {isRP&&<span style={{background:item.score>=80?C.greenBg:item.score>=65?"#FEF3C7":"#FEE2E2",color:item.score>=80?C.green:item.score>=65?C.amber:C.red,borderRadius:999,padding:"1px 8px",fontSize:10,fontWeight:700}}>{item.score}</span>}
                          </div>
                          <div style={{fontSize:11,color:C.muted}}>{isRP?`${item.scenario} · ${item.difficulty} · ${item.verdict}`:item.prompt?.slice(0,70)} · {item.savedAt?new Date(item.savedAt).toLocaleDateString():""}</div>
                        </div>
                        <span style={{fontSize:14,color:C.muted,transform:isOpen?"rotate(90deg)":"none",transition:"transform 0.2s"}}>›</span>
                      </div>
                      {isOpen&&(
                        <div style={{padding:"0 18px 18px",borderTop:`1px solid ${C.bg}`}}>
                          {isRP?(
                            <div style={{marginTop:14}}>
                              {item.coachSummary&&<div style={{background:C.lavPale,borderRadius:5,padding:"10px 14px",border:`1px solid ${C.lavSoft}`,marginBottom:12}}><div style={{fontSize:10,fontWeight:700,color:C.purple,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>Scott's summary</div><p style={{fontSize:12,color:C.navy,lineHeight:1.6,margin:0}}>{item.coachSummary}</p></div>}
                              {item.strongMoment&&<div style={{background:"#F0FDF4",borderRadius:5,padding:"10px 14px",border:"1px solid #BBF7D0",marginBottom:8}}><div style={{fontSize:10,fontWeight:700,color:C.green,textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>✓ Best moment</div><p style={{fontSize:12,color:"#14532D",lineHeight:1.5,margin:0,fontStyle:"italic"}}>"{item.strongMoment.quote||item.strongMoment}"</p></div>}
                              {item.nextFocus&&<div style={{background:C.navy,borderRadius:5,padding:"10px 14px"}}><div style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>Work on next</div><p style={{fontSize:12,color:"rgba(255,255,255,0.85)",margin:0}}>{item.nextFocus}</p></div>}
                            </div>
                          ):(
                            <div style={{marginTop:12}}>
                              <div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>Prompt</div>
                              <p style={{fontSize:12,color:C.muted,fontStyle:"italic",lineHeight:1.6,marginBottom:8}}>"{item.prompt}"</p>
                              <div style={{background:C.bg,borderRadius:5,padding:"10px 12px",fontSize:13,color:C.text,lineHeight:1.65}}>{item.text||<span style={{color:C.muted,fontStyle:"italic"}}>No response</span>}</div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════
            TAB: DEV GOALS (preserved)
        ══════════════════════════════════════════ */}
        {activeTab==="goals" && (
          <div style={{animation:"fadeUp 0.3s ease both"}}>
            {teamData.length===0 ? <EmptyTeam message="Add team members to view dev goals"/> : (
              <>
                <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14}}>
                  {teamData.map(m=>(
                    <button key={m.id} onClick={()=>setSelLearner(selLearner?.id===m.id?null:m)}
                      style={{background:selLearner?.id===m.id?C.navy:C.white,color:selLearner?.id===m.id?"#fff":C.text,border:`1px solid ${selLearner?.id===m.id?C.navy:C.border}`,borderRadius:999,padding:"6px 14px",fontSize:12,fontWeight:600,cursor:"pointer"}}>
                      {m.name}
                    </button>
                  ))}
                </div>
                {selLearner ? (
                  <div style={{background:C.white,borderRadius:14,border:`1px solid ${C.border}`,padding:18}}>
                    <div style={{fontSize:13,fontWeight:700,color:C.navy,marginBottom:12}}>Dev goals — {selLearner.name}</div>
                    {selLearner.smartGoals?.length ? (
                      selLearner.smartGoals.map((g,i)=>(
                        <div key={i} style={{background:C.bg,borderRadius:5,padding:"12px 14px",marginBottom:8}}>
                          <div style={{fontWeight:700,color:C.navy,fontSize:13,marginBottom:4}}>{g.title}</div>
                          <div style={{fontSize:12,color:C.muted,lineHeight:1.55}}>{g.specific}</div>
                        </div>
                      ))
                    ):(
                      <p style={{fontSize:13,color:C.muted,fontStyle:"italic"}}>No SMART goals generated yet for {selLearner.name}. Goals are generated automatically after 3 roleplays.</p>
                    )}
                  </div>
                ):(
                  <div style={{background:C.white,borderRadius:14,border:`1px solid ${C.border}`,padding:24,textAlign:"center"}}>
                    <p style={{fontSize:13,color:C.muted}}>Select a team member to view their development goals.</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════
            TAB: SETTINGS (preserved)
        ══════════════════════════════════════════ */}
        {activeTab==="settings" && (
          <div style={{animation:"fadeUp 0.3s ease both",display:"flex",flexDirection:"column",gap:14}}>

            {/* Team invite section */}
            <div style={{background:C.white,borderRadius:14,border:`1px solid ${C.border}`,padding:20}}>
              <div style={{fontSize:13,fontWeight:700,color:C.navy,marginBottom:4}}>Invite team members</div>
              <p style={{fontSize:12,color:C.muted,marginBottom:14}}>Share the link below or send an email invite. New members will be prompted to set up their profile.</p>

              {inviteLink ? (
                <>
                  <div style={{fontSize:11,fontWeight:600,color:C.muted,marginBottom:6}}>Shareable invite link</div>
                  <div style={{display:"flex",gap:8,marginBottom:16}}>
                    <div style={{flex:1,background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 12px",fontSize:11,color:C.muted,wordBreak:"break-all",lineHeight:1.4}}>{inviteLink}</div>
                    <button onClick={()=>navigator.clipboard?.writeText(inviteLink)}
                      style={{background:C.purple,color:"#fff",border:"none",borderRadius:8,padding:"9px 14px",fontSize:12,fontWeight:600,cursor:"pointer",flexShrink:0,alignSelf:"flex-start"}}>Copy</button>
                  </div>
                  <div style={{fontSize:11,fontWeight:600,color:C.muted,marginBottom:6}}>Or invite by email</div>
                  <div style={{display:"flex",gap:8}}>
                    <input type="email" value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)}
                      placeholder="recruiter@company.com"
                      style={{flex:1,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 12px",fontSize:13,color:C.text,outline:"none",background:C.bg,boxSizing:"border-box"}}/>
                    <button onClick={async()=>{
                      if(!inviteEmail.trim()) return;
                      try {
                        await fetch("/api/invite",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:inviteEmail.trim(),companyId})});
                        setInviteSent(true); setInviteEmail("");
                        setTimeout(()=>setInviteSent(false),3000);
                      } catch(e){}
                    }} disabled={!inviteEmail.trim()}
                      style={{background:inviteEmail.trim()?C.purple:C.border,color:inviteEmail.trim()?"#fff":C.muted,border:"none",borderRadius:8,padding:"9px 14px",fontSize:12,fontWeight:600,cursor:inviteEmail.trim()?"pointer":"not-allowed",flexShrink:0}}>
                      {inviteSent ? "Sent ✓" : "Send"}
                    </button>
                  </div>
                </>
              ) : (
                <div style={{background:C.bg,borderRadius:8,padding:"12px 16px",fontSize:12,color:C.muted}}>
                  Company ID not set. Sign up as a manager to generate your invite link.
                </div>
              )}
            </div>

            <div style={{background:C.white,borderRadius:14,border:`1px solid ${C.border}`,padding:20}}>
              <div style={{fontSize:13,fontWeight:700,color:C.navy,marginBottom:12}}>Manager email</div>
              <div style={{display:"flex",gap:8}}>
                <input value={managerEmail} onChange={e=>setManagerEmail(e.target.value)}
                  placeholder="your@email.com" type="email"
                  style={{flex:1,background:C.bg,border:`1px solid ${C.border}`,borderRadius:5,padding:"9px 12px",fontSize:13,color:C.text,outline:"none"}}/>
                <button onClick={()=>{saveManagerEmail(managerEmail);}}
                  style={{background:C.purple,color:"#fff",border:"none",borderRadius:5,padding:"9px 16px",fontWeight:700,fontSize:12,cursor:"pointer"}}>
                  Save
                </button>
              </div>
            </div>
            <div style={{background:C.white,borderRadius:14,border:`1px solid ${C.border}`,padding:20}}>
              <div style={{fontSize:13,fontWeight:700,color:C.navy,marginBottom:4}}>Firm coaching setup</div>
              <p style={{fontSize:13,color:C.muted,marginBottom:12}}>Configure how Scott coaches your team — firm voice, objection language, values.</p>
              <button onClick={()=>go("admin")} style={{background:C.navy,color:"#fff",border:"none",borderRadius:999,padding:"9px 20px",fontWeight:700,fontSize:13,cursor:"pointer"}}>Open firm setup →</button>
            </div>
            <div style={{background:C.lavPale,borderRadius:14,border:`1px solid ${C.lavSoft}`,padding:18}}>
              <div style={{fontSize:12,fontWeight:700,color:C.purple,marginBottom:6}}>About the analytics data</div>
              <p style={{fontSize:12,color:C.purple,lineHeight:1.65,margin:0}}>
                Skill Drift, Confidence Map, and Engagement data are pulled from your team's completed roleplays, confidence check-ins, and journal energy entries stored in Supabase.
                The data shown updates in real time as your team uses HeyScott.
                Mock data is displayed until live Supabase data is available.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Add member modal */}
      {addModal&&(
        <Modal onClose={()=>setAddModal(false)}>
          <div style={{fontWeight:800,color:C.navy,fontSize:16,marginBottom:16}}>Add team member</div>
          {[{f:"name",p:"Full name *"},{f:"role",p:"Job title"},{f:"focus",p:"Recruitment focus"},{f:"billings",p:"Annual billings"}].map(({f,p})=>(
            <input key={f} value={newMember[f]||""} onChange={e=>setNewMember(prev=>({...prev,[f]:e.target.value}))}
              placeholder={p}
              style={{width:"100%",background:C.bg,border:`1px solid ${C.border}`,borderRadius:5,padding:"9px 12px",fontSize:13,color:C.text,outline:"none",marginBottom:8,boxSizing:"border-box"}}/>
          ))}
          <div style={{display:"flex",gap:8,marginTop:8}}>
            <button onClick={()=>setAddModal(false)} style={{flex:1,background:C.bg,border:`1px solid ${C.border}`,borderRadius:999,padding:"10px",fontSize:13,color:C.muted,cursor:"pointer"}}>Cancel</button>
            <button onClick={addMember} disabled={!newMember.name.trim()} style={{flex:2,background:C.purple,color:"#fff",border:"none",borderRadius:999,padding:"10px",fontWeight:700,fontSize:13,cursor:newMember.name.trim()?"pointer":"not-allowed",opacity:newMember.name.trim()?1:0.5}}>Add member</button>
          </div>
        </Modal>
      )}
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
            go('setup');
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
    else  { go('setup'); }
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
