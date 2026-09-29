/*
 * Variable-width brush for lively-toolbelt freeform strokes (P5).
 *
 * perfect-freehand turns a point list into a filled, tapered/capped outline, but it
 * only looks at pressure + point spacing. This module adds a DYNAMICS layer:
 *   - `dynamics`: weighted contributors (pressure, velocity) each read a channel and
 *     return a factor in [0,1]; their weighted mean is the base "effective pressure".
 *   - tilt is applied AFTER, as a broadening multiplier (a pen laid flat gets wider),
 *     so it only ever adds width — never dilutes a hard press the way an averaged
 *     contributor would.
 * The result is fed to getStroke with simulatePressure:false, so its `thinning` maps
 * our combined signal to width.
 *
 * Measured on Stefan's pen: pressure + tiltX/tiltY (→ altitude/azimuth) are real;
 * tangentialPressure, twist and contact size are NOT reported — so barrel/twist are
 * intentionally absent here. Everything tunable lives in the brush config; swap
 * presets via BRUSH_PRESETS.
 *
 * Points passed in are already in the target coordinate space and carry
 * { x, y, pressure, t, altitude, pointerType }.
 */

import { getStroke } from 'src/external/perfect-freehand.js'

const HALF_PI = Math.PI / 2
const clamp01 = (v) => Math.max(0, Math.min(1, v))

// --- base contributors: (point, i, points, brush) => number in [0,1], or null to abstain ---

// Real pen pressure, normalized so a pen that tops out below 1.0 still reaches full
// width. Abstains for mouse/touch (their pressure is flat).
export function pressureDynamic(p, i, points, brush) {
  if (p.pointerType !== 'pen') return null
  return clamp01((p.pressure || 0) / (brush.pressureMax || 1))
}

// Speed of the segment ending at point i (i >= 1), in px/ms.
function segSpeed(points, i) {
  const a = points[i - 1], b = points[i]
  const dt = Math.max(1, (b.t || 0) - (a.t || 0))
  return Math.hypot(b.x - a.x, b.y - a.y) / dt
}
// Speed at an interior point = mean of its two adjacent segment speeds.
function pointSpeed(points, i) {
  return (segSpeed(points, i) + segSpeed(points, i + 1)) / 2
}

// Fast → thin. Always returns a value, so a mouse (no real pressure) stays expressive.
// The two END points have no well-defined velocity of their own (the start has no
// previous sample; the release segment is often anomalously slow), which would make
// them max-width and, under a round cap, render as a fat dot. So the ends inherit
// their nearest interior point's speed — the terminus matches the local line width.
export function velocityDynamic(p, i, points, brush) {
  const n = points.length
  let v
  if (n < 2) v = 0
  else if (n === 2) v = segSpeed(points, 1)
  else v = pointSpeed(points, Math.min(Math.max(i, 1), n - 2))
  const norm = Math.min(1, v / (brush.vRef || 2))
  return 1 - norm * (brush.velStrength == null ? 0.7 : brush.velStrength)
}

// Tilt broadening (pen only): how far the pen is laid over, 0 (upright) → 1 (flat).
// altitudeAngle is π/2 upright, smaller when tilted.
function flatness(p, brush) {
  if (p.pointerType !== 'pen' || p.altitude == null) return 0
  const altFlat = brush.altFlat == null ? 0.7 : brush.altFlat // rad considered "fully flat"
  return clamp01((HALF_PI - p.altitude) / (HALF_PI - altFlat))
}

export const BALANCED_BRUSH = {
  icon: 'fa-pencil',  // shown in the preset menu + on the freeform button
  size: 10,          // base diameter (px); thinning modulates it
  thinning: 0.6,     // pressure→width strength
  smoothing: 0.5,    // edge softening
  streamline: 0.45,  // input stabilization (adds slight lag)
  cap: true,         // rounded caps
  taper: 0,          // 0 = rounded caps; >0 tapers each end to a point over N px
  pressureMax: 0.7,  // pen pressure that maps to full width (yours tops ~0.63)
  vRef: 2.0,         // px/ms treated as "fast"
  velStrength: 0.6,  // how strongly speed thins the stroke (0..1)
  tiltStrength: 0.6, // how much a flat pen broadens the stroke (0 disables)
  altFlat: 0.7,      // altitude (rad) treated as fully laid-over
  dynamics: [
    { fn: pressureDynamic, weight: 1.0 },
    { fn: velocityDynamic, weight: 0.6 },
  ],
}

// A few presets to draw with and compare (swap controller.brush).
export const BRUSH_PRESETS = {
  balanced: BALANCED_BRUSH,
  // Inky: expressive, high pressure/velocity contrast, more stabilization.
  ink: { ...BALANCED_BRUSH, icon: 'fa-paint-brush', size: 12, thinning: 0.72, streamline: 0.55, velStrength: 0.75, tiltStrength: 0.8 },
  // Marker: near-uniform, calm, minimal speed/tilt effect.
  marker: { ...BALANCED_BRUSH, icon: 'fa-tint', size: 8, thinning: 0.3, streamline: 0.4, velStrength: 0.3, tiltStrength: 0.3 },
}

export const DEFAULT_BRUSH = BALANCED_BRUSH

function effectivePressure(p, i, points, brush) {
  let sum = 0, w = 0
  for (const { fn, weight } of brush.dynamics) {
    const v = fn(p, i, points, brush)
    if (v != null && !Number.isNaN(v)) { sum += v * weight; w += weight }
  }
  let e = w ? sum / w : 0.5
  // Tilt only broadens — never reduces a hard press.
  const boost = (brush.tiltStrength || 0) * flatness(p, brush)
  e = e * (1 + boost)
  return Math.max(0.05, Math.min(1, e))
}

function options(brush, last) {
  return {
    size: brush.size,
    thinning: brush.thinning,
    smoothing: brush.smoothing,
    streamline: brush.streamline,
    simulatePressure: false,
    start: { cap: brush.cap, taper: brush.taper },
    end: { cap: brush.cap, taper: brush.taper },
    last,
  }
}

// perfect-freehand's outline → a filled SVG path (README helper, inlined).
function svgPathFromOutline(points) {
  if (!points.length) return ''
  const d = points.reduce((acc, [x0, y0], i, arr) => {
    const [x1, y1] = arr[(i + 1) % arr.length]
    acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2)
    return acc
  }, ['M', ...points[0], 'Q'])
  d.push('Z')
  return d.join(' ')
}

// Drop near-duplicate consecutive points. Coincident points — the pointerup landing
// on the last move, or a stationary pen emitting repeats — make a zero-length end
// segment whose "speed" is 0, i.e. MAX width, which the round cap renders as a ball.
// perfect-freehand only skips *exact* duplicates, so we filter sub-pixel ones here.
function dedupe(points, eps = 1) {
  if (points.length < 2) return points
  const out = [points[0]]
  let last = points[0]
  for (let i = 1; i < points.length; i++) {
    const p = points[i]
    if (Math.hypot(p.x - last.x, p.y - last.y) >= eps) { out.push(p); last = p }
  }
  return out
}

// Outline polygon for the stroke (array of [x,y]).
export function strokeOutline(points, brush = DEFAULT_BRUSH, { last = false } = {}) {
  const pts = dedupe(points)
  if (!pts.length) return []
  const input = pts.map((p, i) => [p.x, p.y, effectivePressure(p, i, pts, brush)])
  return getStroke(input, options(brush, last))
}

// Filled-outline SVG path string; shared by the live canvas (via Path2D) and commit.
export function strokePath(points, brush = DEFAULT_BRUSH, opts = {}) {
  return svgPathFromOutline(strokeOutline(points, brush, opts))
}
