/* ════════════════════════════════════════════════════════════════
   DESIGN SYSTEM  —  use these constants everywhere. Never use raw
   hex/hsl values inline; always reference C / R / Sh / F below.

   COLOR ROLES
   ─────────────────────────────────────────────────────────────
   C.bg          warm cream canvas — page background
   C.bgDeep      one shade darker — sidebar, secondary surfaces
   C.white       pure white — card surfaces
   C.navy        primary text + dark filled elements
   C.primary     sage green CTA — buttons, active states
   C.muted       secondary text, placeholders, disabled labels
   C.border      dividers, card outlines
   C.lavPale     sage tint — AI bubble bg, coach highlights
   C.lavSoft     sage tint mid — AI bubble border
   C.lav         sage mid — decorative numbers, inverted text on dark

   RADIUS SCALE (R)
   ─────────────────────────────────────────────────────────────
   R.xs   4px   tiny icon squares, avatar frames
   R.sm   8px   inputs, form fields, inline buttons, small chips
   R.md   12px  banners, alerts, option lists, sidebar stat block
   R.lg   16px  cards, panels, main content blocks
   R.xl   20px  modals, floating overlays, large panels
   R.pill 999px tags, pill buttons, toggle tracks

   SHADOW SCALE (Sh)
   ─────────────────────────────────────────────────────────────
   Sh.none  no shadow — default card state
   Sh.sm    subtle lift — card hover
   Sh.md    floating panel — modals, dropdowns
   Sh.lg    prominent — feature cards on landing

   FONT SIZE SCALE (F)
   ─────────────────────────────────────────────────────────────
   F.display  serif 36-48px — page hero titles (Instrument Serif)
   F.h1       22px 800w     — section headings
   F.h2       18px 700w     — sub-section headings
   F.body     14px 400w     — body copy
   F.sm       13px 400w     — compact body, card descriptions
   F.xs       12px 400w     — metadata, secondary labels
   F.xxs      11px 600w     — badges, caps labels
   F.tiny     10px 700w     — uppercase tracking labels
════════════════════════════════════════════════════════════════ */
export const C = {
  // Surfaces
  bg:        "hsl(40,20%,97%)",
  bgDeep:    "hsl(40,20%,95%)",
  card:      "hsl(40,20%,99%)",
  white:     "#FFFFFF",
  // Text
  text:      "hsl(220,70%,15%)",
  navy:      "hsl(220,70%,15%)",
  navyMid:   "hsl(220,70%,12%)",
  // Primary — muted sage green
  primary:   "hsl(140,15%,40%)",
  purple:    "hsl(140,15%,40%)",   // legacy alias → sage
  // Structure
  border:    "hsl(40,15%,88%)",
  secondary: "hsl(40,20%,92%)",
  muted:     "hsl(220,20%,40%)",
  accent:    "hsl(40,20%,92%)",
  // Sage tints (used for AI bubbles, coach highlights)
  lav:       "hsl(140,20%,72%)",
  lavSoft:   "hsl(140,15%,67%)",
  lavPale:   "hsl(140,20%,92%)",
  // Semantic status
  green: "#166534",  greenBg: "#DCFCE7",
  amber: "#854D0E",  amberBg: "#FEF9C3",
  red:   "hsl(0,84%,60%)",  redBg: "#FEE2E2",
};

/* Radius scale — see table above */
export const R = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  pill: 999,
};

/* Shadow scale */
export const Sh = {
  none: "none",
  sm:   "0 2px 12px rgba(20,15,45,0.07)",
  md:   "0 4px 24px rgba(20,15,45,0.10)",
  lg:   "0 8px 40px rgba(20,15,45,0.12)",
};

/* Font sizes */
export const F = {
  h1:   22,
  h2:   18,
  body: 14,
  sm:   13,
  xs:   12,
  xxs:  11,
  tiny: 10,
};
