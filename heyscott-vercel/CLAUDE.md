# HeyScott — Core Rules & Product Integrity Guide

This file defines the non-negotiable rules for HeyScott. Any change to the product — design, copy, features, or curriculum — must respect these constraints.

---

## 1. Brand Identity

- Name is always **HeyScott** — never split, hyphenated differently, or abbreviated
- The AI coach is always named **Scott** — never renamed or genericised
- Logo pattern: dark navy square icon (`#140F2D`) with a lavender `↗` glyph + "HeyScott" wordmark
- Tagline: **"AI coaching built for recruiters — feedback, milestones, and mindset in one place"**
- Positioning: The AI Coach for 360 Recruiters

---

## 2. Design System — Never Change

See `HeyScott_Design_System.md` for the full specification. Summary below.

### 2.1 Colour tokens (`const C` in App.jsx)

```js
const C = {
  // Backgrounds & surfaces
  bg:        "hsl(40,20%,97%)",    // cream canvas — NOT white, NOT grey
  bgDeep:    "hsl(40,20%,95%)",    // sidebar / secondary surface
  card:      "hsl(40,20%,99%)",    // card surface
  white:     "#FFFFFF",
  // Text
  text:      "hsl(220,70%,15%)",   // deep ink — primary text
  navy:      "hsl(220,70%,15%)",   // alias
  navyMid:   "hsl(220,70%,12%)",
  // Primary — muted sage
  primary:   "hsl(140,15%,40%)",   // CTAs, active states, brand mark
  purple:    "hsl(140,15%,40%)",   // legacy alias → sage
  // Structural
  border:    "hsl(40,15%,88%)",    // hairline — almost invisible
  secondary: "hsl(40,20%,92%)",    // chips, ghost buttons
  muted:     "hsl(220,20%,40%)",   // captions, "View all" links
  accent:    "hsl(40,20%,92%)",    // hover surface
  // Legacy tints (sage-derived)
  lav:       "hsl(140,20%,72%)",
  lavSoft:   "hsl(140,15%,67%)",
  lavPale:   "hsl(140,20%,92%)",
  // Semantic
  green: "#166534",  greenBg: "#DCFCE7",
  amber: "#854D0E",  amberBg: "#FEF9C3",
  red:   "hsl(0,84%,60%)",  redBg: "#FEE2E2",
};
```

### 2.2 Colour usage rules

- **One primary at a time.** One sage CTA visible per view.
- **No saturated backgrounds.** Large areas use `bg-primary/5` tints only.
- **Hairlines, not borders.** 1px, `--border` (`hsl(40,15%,88%)`).

### 2.3 Score colour system — consistent everywhere

- ≥ 80: sage (`hsl(140,15%,40%)`)
- 50–79: deep ink (`hsl(220,70%,15%)`)
- < 50: destructive red (`hsl(0,84%,60%)`)

### 2.4 Level badge colours

- Beginner: green bg (`#DCFCE7`) + green text
- Intermediate: amber bg (`#FEF9C3`) + amber text
- Advanced: blue bg (`#DBEAFE`) + blue text (`#1E40AF`)

### 2.5 Typography

| Family | Stack | Use |
|---|---|---|
| **Sans** | `Inter, sans-serif` | Body copy, navigation, buttons, form fields |
| **Serif** | `Instrument Serif, Georgia, serif` | All page H1/H2, key numeric scores |
| **Mono** | `Space Mono, Menlo, monospace` | Question numbers, methodology labels, transcripts |

Minimum body size: 13px interactive, 17px body copy.
Score/stat numbers: always serif bold.

### 2.6 Spacing & radius

- **Border-radius:** `5px` (0.3rem) on cards, inputs, buttons. `999px` for pill badges only.
- **Page container:** `max-width 960px, padding 24–40px, gap 40px` between sections.
- **Shadows:** barely-there — use background colour contrast, not blur depth.

### 2.7 Brand essence

| Trait | Product expression |
|---|---|
| Calm authority | Generous whitespace, serif headlines, restrained colour |
| Editorial warmth | Cream paper bg, deep ink type, sage-green accents |
| Practical, not theatrical | Scores and unlocked steps — no confetti, no XP bars |
| Coach in the room | Direct, plain English copy ("Pick up where you left off") |

**Tagline:** *Turn Every Call Into Your Next Win.*
**Sub-tagline:** *AI coaching built for recruiters — feedback, milestones, and mindset in one place.*

---

## 3. Scott's Coaching Voice — Absolute Rules

1. **Never sycophantic** — never say "great question", never open with praise
2. **One question at a time** — wait for the answer before going deeper
3. **Always include one exact script** per coaching response: "Try this: [exact words]"
4. **Feeling first, tactic second** — address the emotional state before offering technique
5. **Mirror their exact words** — if they say "freeze", use "freeze"
6. **3–4 short paragraphs max** — they are between calls, not in a lecture
7. **Never name the technique** being applied — apply it naturally, don't label it
8. **Evidence-based** — quote verbatim from transcripts when scoring calls
9. Warm, direct, immediately actionable — not academic, not vague

**Scott's system prompt identity:**
- Performance psychology coach who works with elite recruiters
- Blends sports psychology + CBT + 20 years of recruitment experience
- Peer-level authority, not a superior — never condescending

---

## 4. Product Pillars — Must Always Exist

| Feature | Purpose |
|---|---|
| Diagnostic | Entry point — maps skill level, personalises learning path |
| Curriculum (9 modules) | Theory-first structured learning |
| AI Roleplay | Named personas with backstory and psychological depth |
| Post-call debrief | Score + verdict + SPIN/frameworks analysis + transcript |
| Ask Scott | Live coaching chat with transcript paste capability |
| Progress tracking | Streaks, milestones, skill scores — always visible |
| Consultant Journal | Mood/energy check-ins tied to call performance |
| Manager Dashboard | Team analytics, at-risk alerts, coaching prompts |

---

## 5. Curriculum Rules — Never Break the Learning Structure

**Module pattern (every module):**
> Concept → Fundamentals → Application → Roleplay

**Reading lesson structure (every reading lesson):**
> TL;DR → Theory → Key Points → Reflection → Practice Task

**Progression rules:**
- Roleplay gates advancement — must score **65+** to progress
- Verdicts: `Developing` (65–69) · `Consistent` (70–79) · `Advanced` (80+)
- Quick Mode allowed: skips theory, jumps to roleplay in under 8 minutes

**Module sequence — order is intentional, each builds on the last:**
1. The Cold Call Mindset *(Foundations — Beginner)*
2. Discovery — The Art of Asking the Right Questions *(Core Skills — Beginner)*
3. Handling Objections Like a Pro *(Core Skills — Intermediate)*
4. Communicating Value — Making Opportunities Compelling *(Core Skills — Intermediate)*
5. Confidence, Consistency & Emotional Readiness *(Mindset — Intermediate)*
6. Advanced Cold Call Mastery *(Advanced)*
7. Pitching with a Limited Brief *(Skills — Beginner)*
8. Pitching with a Full Brief — Using Information to Win *(Skills — Intermediate)*
9. The Questioning Funnel *(Questioning Mastery — Intermediate)*

---

## 6. Post-Call Scoring Schema — Never Change the Shape

```json
{
  "score": 0-100,
  "verdict": "Developing | Consistent | Advanced",
  "summary": "1 strength (with verbatim quote) + 1 clear gap + 1 specific next step",
  "methodologies": {
    "openingHook": 0-100,
    "permissionAsked": 0-100,
    "discoveryDepth": 0-100,
    "listeningSignals": 0-100,
    "objectionHandling": 0-100,
    "closingStrength": 0-100,
    "talkRatioScore": 0-100,
    "toneAndRapport": 0-100,
    "questioningFunnel": 0-100,
    "valueArticulation": 0-100,
    "momentumControl": 0-100
  },
  "improvements": ["gap 1", "gap 2", "gap 3"],
  "redFlags": ["missed signal 1", "concern 2"],
  "nextFocus": "one specific skill to practice next"
}
```

---

## 7. Scott's Core Beliefs — Reflected in All Content

These must be present in curriculum content, coaching responses, and marketing copy:

1. Most recruitment problems are **mindset, not technique**
2. **Preparation creates confidence; confidence creates presence**
3. **Honesty is more persuasive than polish** — never bluff
4. Candidates respond to **invitation** (permission frame), not demand
5. **Listening before pitching** wins every time
6. **Rejection is data, not a verdict**
7. **Consistency beats peaks** — build the habit, not the highlight
8. Energy and emotional state **bleeds through the phone**
9. Top performers think **long-term**, not for the close
10. Growth mindset: reframe "failure" as "data for adjustment"

---

## 8. Coaching Frameworks — Always Applied, Never Named to the User

Full methodology specification: **`METHODOLOGY.md`** — this is the governing document for all assessment, scoring, and training logic. Read it before touching any roleplay, assessment, scoring, or SMART goal code.

**Active frameworks (applied in every roleplay and coaching response):**

| Framework | How it appears in product |
|---|---|
| **SPIN Selling** | Situation → Problem → Implication → Need-Payoff question sequencing; discovery scoring anchored here |
| **Permission-Based Opening** | Hook → Reason → Permission structure; scored under Opening/Pitch dimension |
| **Hook–Bridge–Ask** | Governs cold call structure; first 30 seconds scored for specificity and candidate-first framing |
| **Three-Layer Discovery** | Layer 1 (surface) → Layer 2 (situational) → Layer 3 (personal drivers); discovery depth scoring |
| **AEO Objection Handling** | Acknowledge → Explore → Overcome; replaces Acknowledge-Bridge-Redirect |
| **Micro-Close / Next Step Close** | Always close on a low-friction next step, never on "are you interested?"; closing dimension |
| **Mirror → Lead (Rapport Calibration)** | Match candidate energy first, then lead; rapport dimension scoring |
| **Commitment Ladder** | Build micro-agreements before any close |
| **Question Sequencing** | Situational → Experiential → Evaluative → Aspirational |

**The 5 scoring dimensions (used in assessment AND post-call debrief):**
1. Opening / Pitch — specific hook + permission earned
2. Rapport — calibrated to candidate energy, mirrors then leads
3. Open Questions — WHO/WHAT/HOW/TELL ME questions that reach Layer 2–3
4. Situation + Frustrations — discovery depth beyond surface facts
5. Closing — concrete micro-close with named next step

**Assessment level thresholds:**
- Score 1–8 → Beginner → 3 modules unlocked
- Score 9–12 → Intermediate → 4 modules unlocked
- Score 13–15 → Advanced → 5 modules unlocked

---

## 9. Target Audience — Never Drift

**Primary:** Agency recruiters and in-house talent acquisition professionals
- Age: approximately 25–45
- Trait: performance-oriented, coachable, time-poor
- Pain points: cold call rejection, weak discovery, objection handling, inconsistency, resilience

**Secondary:** Sales/recruitment team managers
- Use case: team analytics, at-risk identification, coaching prompts

**Always recruitment-specific** — all frameworks, personas, and scenarios are applied to candidate calls, not generic sales. The word "candidate" is always used, never "prospect" or "lead".

---

## 10. UX Patterns — Consistency Rules

- Navigation via `go()` function — single-page app, no hard routing
- All interactive elements: `transition: "all 0.15s"`
- Cards: `hsl(40,20%,99%)` bg, 1px `hsl(40,15%,88%)` border, **5px radius**, lift on hover (`translateY(-3px)`)
- Primary buttons: sage `hsl(140,15%,40%)` everywhere, 5px radius
- Secondary/ghost buttons: `hsl(40,20%,92%)` bg, 5px radius
- No emojis in UI except the avatar/icon system and lesson type indicators
- Background is always `hsl(40,20%,97%)` — never pure white, never grey
- Icons: Lucide-style line-weight only, `h-4 w-4` default
- Floating co-pilot FAB: 56px sage circle, bottom-right, every authenticated page

---

## 11. Assessment Architecture — Non-Negotiable Rules

The baseline assessment is **three live roleplays** at escalating difficulty. Never revert to multiple-choice questions.

**Three scenarios (in order):**
1. **Beginner** — Marcus Webb (cooperative, passive, software sales, 2 years in role)
2. **Intermediate** — Priya Nair (guarded, uses stock brush-offs, "happy where I am", pain point hidden beneath surface)
3. **Advanced** — James Sutherland (Director-level, aggressive, dismissive, only responds to calm authority)

**Candidate persona escalation rule:** Each level the candidate becomes more guarded, more dismissive, and more challenging. Warmth and enthusiasm fail at Level 3 — only composure and genuine insight work.

**Assessment scores 5 dimensions, 1–5 each (max 15):**
Opening/Pitch · Rapport · Open Questions · Situation+Frustrations · Closing

**Score → skill level → module unlock count → SMART goals.**
Full scoring rubric and SMART goal templates are in `METHODOLOGY.md`.

**SMART goals are always:**
- Generated from the two lowest-scoring dimensions
- Structured as: Immediate (next 3 roleplays) + Important (next 2 weeks) + Long-term arc
- Specific to the exact failure pattern observed, not generic advice
- Written in Scott's voice — warm, direct, no jargon, one exact script included
