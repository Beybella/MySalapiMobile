// Palette family: sage green · dusty rose · steel blue · cream
// Strategy: deep rich primary for actions/headers, palette swatches for backgrounds/surfaces,
// each ledger gets its own hue from the palette family for personality.

export const LightColors = {
  // ── Backgrounds ──────────────────────────────────────────────────────
  background: '#F5F7F4',      // near-white with a hint of sage — easy on the eyes
  surface: '#FFFFFF',

  // ── Primary (Sage Green — darkened for contrast) ──────────────────────
  primary: '#5A7A5C',         // deep sage — readable on white, rich not neon
  primaryDark: '#426044',     // pressed / darker state
  secondary: '#8BA5A0',       // muted teal-sage — secondary actions

  // ── Text ──────────────────────────────────────────────────────────────
  textPrimary: '#2C3B2D',     // near-black with green undertone — warm and grounded
  textSecondary: '#637464',   // mid sage-grey — labels, subtitles
  textLight: '#9FB5A0',       // light sage — placeholders, hints

  // ── Borders & UI chrome ───────────────────────────────────────────────
  border: '#D4DDD4',          // very light sage border
  borderLight: '#EDF2EB',     // palette mint — section dividers
  highlight: '#E5CACA',       // dusty rose — warnings, highlights

  // ── Status ────────────────────────────────────────────────────────────
  error: '#B85C5C',           // muted rose-red — matches dusty rose family
  warning: '#B8935C',         // warm amber-tan
  success: '#5A7A5C',         // same as primary — green = good
  info: '#7A97B0',            // steel blue family

  // ── Health status ──────────────────────────────────────────────────────
  healthy: '#5A7A5C',
  atRisk: '#B8935C',
  critical: '#B85C5C',

  // ── Ledger accents — each distinct, all from palette family ──────────
  // Personal: deep sage (earthy, grounded for daily expenses)
  personalLedger: '#5A7A5C',
  // Pautang: steel blue (trustworthy, financial)
  pautangLedger: '#7A97B0',
  // Ambagan: dusty rose-mauve (social, group energy)
  ambaganLedger: '#A67878',
  // Budget: warm taupe-green (planning, careful)
  budgetPlanner: '#7A9478',

  // ── Overlay ───────────────────────────────────────────────────────────
  overlay: 'rgba(44,59,45,0.45)',
};

export const DarkColors = {
  // ── Backgrounds ──────────────────────────────────────────────────────
  background: '#1C2420',      // deep dark sage-green
  surface: '#253027',         // slightly lighter dark green

  // ── Primary ───────────────────────────────────────────────────────────
  primary: '#8BB88D',         // lighter sage for dark — enough contrast on dark bg
  primaryDark: '#6A9A6C',
  secondary: '#8BA5A0',

  // ── Text ──────────────────────────────────────────────────────────────
  textPrimary: '#EDF2EB',     // light mint — warm white
  textSecondary: '#9FB5A0',   // muted sage
  textLight: '#637464',       // dim sage-grey

  // ── Borders ───────────────────────────────────────────────────────────
  border: '#334535',
  borderLight: '#2C3B2D',
  highlight: '#5C3E3E',       // deep dusty rose tint

  // ── Status ────────────────────────────────────────────────────────────
  error: '#D48989',
  warning: '#C9A87A',
  success: '#8BB88D',
  info: '#9AB5C8',

  // ── Health status ──────────────────────────────────────────────────────
  healthy: '#8BB88D',
  atRisk: '#C9A87A',
  critical: '#D48989',

  // ── Ledger accents ─────────────────────────────────────────────────────
  personalLedger: '#8BB88D',
  pautangLedger: '#9AB5C8',
  ambaganLedger: '#C8A0A0',
  budgetPlanner: '#9AB89A',

  // ── Overlay ───────────────────────────────────────────────────────────
  overlay: 'rgba(0,0,0,0.6)',
};

export const Colors = LightColors;
