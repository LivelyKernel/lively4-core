/*
 * Pure geometry for lively-toolbelt selection + eraser (P6).
 *
 * DOM-free and side-effect-free, so it is directly unit-testable. Built ON Lively's
 * Point/Rectangle/Line (src/client/graphics.js) — only what that library genuinely
 * lacks lives here.
 *
 * NOTE on Point: stroke points stay PLAIN OBJECTS
 * ({ x, y, pressure, t, altitude, pointerType }) because they carry dynamics channels
 * a Point has no room for. Convert to Point at the geometry boundary (toPt) and use
 * translatePoints/scalePoints — which preserve those channels — to transform strokes.
 */

import { pt, rect, Line } from 'src/client/graphics.js'

const toPt = p => pt(p.x, p.y)

/*MD ## Bounds MD*/

// Bounding Rectangle of a list of points (plain objects or Points). null when empty.
export function boundsOf(points) {
  if (!points || !points.length) return null
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const p of points) {
    if (p.x < minX) minX = p.x
    if (p.y < minY) minY = p.y
    if (p.x > maxX) maxX = p.x
    if (p.y > maxY) maxY = p.y
  }
  return rect(pt(minX, minY), pt(maxX, maxY))
}

// Inclusive rectangle overlap, tolerating DEGENERATE rects.
//
// Not Rectangle.intersects: that is `intersection(r).isNonEmpty()`, and isNonEmpty
// demands width > 0 AND height > 0. A perfectly horizontal stroke has a zero-HEIGHT
// bounding rect, so it would never overlap anything — making straight strokes
// impossible to select or erase. Touching edges count as overlapping here, which is
// also what a bbox prefilter wants: it must never be stricter than the real test.
export function rectsOverlap(a, b) {
  return a.x <= b.maxX() && b.x <= a.maxX() && a.y <= b.maxY() && b.y <= a.maxY()
}

/*MD ## Shapes as polylines MD*/

// A shape's world-space centerline as a polyline of Points, for hit testing.
// Returns null when the centerline is unknown — pre-P6 strokes restored without
// data-points — so callers can fall back to the element's bbox.
export function hitPolyline(shape) {
  const P = shape.points
  if (!P || P.length < 2) return null
  if (shape.type === 'rectangle') {
    // The two drag corners describe the rect; hit-test its outline, not the diagonal.
    const r = boundsOf([P[0], P[P.length - 1]])
    return [r.topLeft(), r.topRight(), r.bottomRight(), r.bottomLeft(), r.topLeft()]
  }
  if (shape.type === 'arrow') return [toPt(P[0]), toPt(P[P.length - 1])]
  return P.map(toPt)
}

/*MD ## Hit testing MD*/

// Ray casting. Lively's Rectangle covers rect containment, but nothing covers an
// arbitrary polygon — which is what the lasso is.
export function pointInPolygon(p, polygon) {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i], b = polygon[j]
    if ((a.y > p.y) !== (b.y > p.y) &&
        p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) {
      inside = !inside
    }
  }
  return inside
}

// INTERSECT semantics (touching selects), matching Illustrator/Figma marquees: a
// vertex inside the region, or any segment crossing its boundary.
export function polylineIntersectsRect(polyline, r) {
  if (polyline.some(p => r.containsPoint(p))) return true
  const edges = r.edges()
  for (let i = 1; i < polyline.length; i++) {
    const seg = new Line(polyline[i - 1], polyline[i])
    if (edges.some(e => seg.intersection(e))) return true
  }
  return false
}

// Callers should bbox-prefilter before this: a dense lasso against a dense stroke is
// O(|lasso| x |stroke|). Fine once per gesture, not per frame.
export function polylineIntersectsPolygon(polyline, polygon) {
  if (polygon.length < 3) return false
  if (polyline.some(p => pointInPolygon(p, polygon))) return true
  for (let i = 1; i < polyline.length; i++) {
    const seg = new Line(polyline[i - 1], polyline[i])
    for (let j = 0, k = polygon.length - 1; j < polygon.length; k = j++) {
      if (seg.intersection(new Line(polygon[k], polygon[j]))) return true
    }
  }
  return false
}

// Distance from a point to a SEGMENT (clamped projection).
//
// Deliberately not Point.nearestPointOnLineBetween: that projects onto the INFINITE
// line without clamping, and its parameter divides by both dx and dy — unstable for
// the near-axis-aligned segments an eraser sweep produces constantly.
export function distPointToSegment(p, a, b) {
  const vx = b.x - a.x, vy = b.y - a.y
  const len2 = vx * vx + vy * vy
  if (len2 === 0) return Math.hypot(p.x - a.x, p.y - a.y)
  let t = ((p.x - a.x) * vx + (p.y - a.y) * vy) / len2
  t = t < 0 ? 0 : t > 1 ? 1 : t
  return Math.hypot(p.x - (a.x + t * vx), p.y - (a.y + t * vy))
}

// Is a point within `radius` of the eraser's swept polyline?
export function sweptWithin(p, sweep, radius) {
  if (!sweep.length) return false
  if (sweep.length === 1) return Math.hypot(p.x - sweep[0].x, p.y - sweep[0].y) <= radius
  for (let i = 1; i < sweep.length; i++) {
    if (distPointToSegment(p, sweep[i - 1], sweep[i]) <= radius) return true
  }
  return false
}

// Do two polylines come within `radius` of each other? Checks endpoint proximity both
// ways plus true segment crossings — the crossing test matters for a long straight edge
// swept perpendicularly, where every vertex pair can still be far apart.
export function polylineNearPolyline(a, b, radius) {
  if (!a.length || !b.length) return false
  for (const p of a) if (sweptWithin(p, b, radius)) return true
  for (const p of b) if (sweptWithin(p, a, radius)) return true
  for (let i = 1; i < a.length; i++) {
    const seg = new Line(a[i - 1], a[i])
    for (let j = 1; j < b.length; j++) {
      if (seg.intersection(new Line(b[j - 1], b[j]))) return true
    }
  }
  return false
}

/*MD ## Eraser MD*/

// Linear interpolation that carries the dynamics channels, so a cut end keeps the
// pressure/tilt it had at that spot instead of jumping.
function lerpPoint(a, b, t) {
  const mix = (u, v) => (u == null || v == null ? (u == null ? v : u) : u + (v - u) * t)
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    pressure: mix(a.pressure, b.pressure),
    t: mix(a.t, b.t),
    altitude: mix(a.altitude, b.altitude),
    pointerType: a.pointerType,
  }
}

// Walk a stroke at a resolution fine enough that the eraser cannot slip between two
// stored points. THIS IS THE POINT OF THE FUNCTION: a fast stroke has widely spaced
// samples, so testing only the stored points lets the eraser pass straight through the
// gap between them and erase nothing, even though the drawn line visibly crosses it.
// The eraser region is 2*radius across, so a step of radius/2 cannot miss a crossing.
function densify(points, step) {
  const out = []
  for (let i = 0; i < points.length; i++) {
    out.push({ p: points[i], original: true })
    const a = points[i], b = points[i + 1]
    if (!b) break
    const d = Math.hypot(b.x - a.x, b.y - a.y)
    for (let k = 1; k * step < d; k++) {
      out.push({ p: lerpPoint(a, b, (k * step) / d), original: false })
    }
  }
  return out
}

// Cut a stroke with an eraser sweep. Tri-state result:
//   null  -> untouched, keep the original shape as-is
//   []    -> fully erased, drop the shape
//   [run] -> the surviving runs, each becoming its own stroke
// Runs shorter than 2 points can't be rendered and are dropped. Surviving runs keep
// their original points, plus an interpolated point exactly at each cut, so the cut
// lands where the eraser actually passed rather than at the nearest sample.
export function splitStroke(points, sweep, radius) {
  if (!points || points.length < 2 || !sweep || !sweep.length) return null
  const samples = densify(points, Math.max(1, radius / 2))
  const hit = samples.map(s => sweptWithin(s.p, sweep, radius))
  if (!hit.some(Boolean)) return null

  const runs = []
  let run = []
  for (let i = 0; i < samples.length; i++) {
    if (hit[i]) {
      if (run.length >= 2) runs.push(run)
      run = []
      continue
    }
    // Interpolated samples are scaffolding; keep one only when it forms a cut edge.
    const isCutEdge = (i > 0 && hit[i - 1]) || (i < samples.length - 1 && hit[i + 1])
    if (samples[i].original || isCutEdge) run.push(samples[i].p)
  }
  if (run.length >= 2) runs.push(run)
  return runs
}

// Smallest distance from a point to a polyline — the click hit test for selection.
export function distPointToPolyline(p, polyline) {
  if (!polyline.length) return Infinity
  if (polyline.length === 1) return Math.hypot(p.x - polyline[0].x, p.y - polyline[0].y)
  let min = Infinity
  for (let i = 1; i < polyline.length; i++) {
    const d = distPointToSegment(p, polyline[i - 1], polyline[i])
    if (d < min) min = d
  }
  return min
}

/*MD ## Transforms (channel-preserving) MD*/

// Point.addPt / subPt would drop pressure, t and altitude — these keep them.
export function translatePoints(points, d) {
  return points.map(p => ({ ...p, x: p.x + d.x, y: p.y + d.y }))
}

export function scalePoints(points, scale, origin) {
  return points.map(p => ({
    ...p,
    x: origin.x + (p.x - origin.x) * scale,
    y: origin.y + (p.y - origin.y) * scale,
  }))
}
