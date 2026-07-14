/*
 * Rendering/interaction layer for lively-toolbelt's drawing modes
 * (freeform, rectangle, arrow, eraser). Loaded lazily by lively-toolbelt the
 * first time a drawing mode is entered — never at boot.
 *
 * WORLD-SPACE, TWO LAYERS
 * -----------------------
 * Drawings live in the Lively world (document.body coordinate space), so they
 * pan/zoom with the world instead of being glued to the screen. That needs two
 * layers, because one element can't be both a viewport-sized hit target and a
 * world-anchored canvas once the world is panned:
 *
 *   - hitLayer  : position:fixed, spans the viewport, catches pointer events and
 *                 owns pointer capture. Only active while a drawing mode is on.
 *   - surface   : an SVG anchored at the world origin (inside document.body),
 *                 overflow visible, pointer-events:none. Holds the shapes in
 *                 WORLD coordinates, so scrolling/panning the world moves them.
 *
 * pointOf() maps a viewport pointer to world space by subtracting the surface's
 * client origin (lively.getClientPosition) — the same conversion graffle uses.
 *
 * Input uses Pointer Events with pointer capture (robust drags), touch-action
 * none (no scroll/zoom while drawing), and getCoalescedEvents() for full
 * sub-frame sample density on freehand strokes.
 *
 * HIGH-QUALITY FREEFORM (planned — see renderFreeform seam)
 * ---------------------------------------------------------
 * The retained per-stroke sample model here is the fixed foundation. The HQ
 * pass keeps capture/model and swaps rendering to the hybrid pipeline: live
 * stroke on a fast canvas hosted by hitLayer (+ getPredictedEvents for latency),
 * committed on pointerup to a world-space SVG `lively-content` element
 * (persistence + select/move), with a pressure+velocity+taper brush growing
 * toward a full tilt/twist/flow nib.
 */

const SVGNS = 'http://www.w3.org/2000/svg'

function svgEl(tag, attrs = {}) {
  const el = document.createElementNS(SVGNS, tag)
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v)
  return el
}

export default class ToolbeltInteraction {
  // Called on every mode switch by lively-toolbelt.
  static activate(host, mode) {
    this.controllerFor(host).setMode(mode)
  }

  static deactivate(host, mode) {
    host.__toolbeltDrawing?.setMode(null)
  }

  // One controller (hit layer + world surface) per toolbelt host.
  static controllerFor(host) {
    return host.__toolbeltDrawing ??= new DrawingController(host)
  }
}

class DrawingController {
  constructor(host) {
    this.host = host
    this.mode = null

    // Style knobs (could later be driven by toolbelt UI).
    this.color = '#1b1b1b'
    this.baseWidth = 2.5

    this.surface = this.createSurface()   // world-anchored render layer
    this.hitLayer = this.createHitLayer() // screen-fixed input layer
    document.body.appendChild(this.surface)
    document.body.appendChild(this.hitLayer)

    // One shape being drawn at a time; the pointer that owns the drag.
    this.activePointerId = null
    this.current = null

    // Retained model: every committed stroke keeps its raw (world-space) samples
    // so it can be re-rendered later (HQ pass, zoom, export) without recapture.
    this.strokes = []

    // Bind once so add/removeEventListener match and `this` is the controller.
    this.onPointerDown = this.onPointerDown.bind(this)
    this.onPointerMove = this.onPointerMove.bind(this)
    this.onPointerUp = this.onPointerUp.bind(this)

    this.hitLayer.addEventListener('pointerdown', this.onPointerDown)
    this.hitLayer.addEventListener('pointermove', this.onPointerMove)
    this.hitLayer.addEventListener('pointerup', this.onPointerUp)
    this.hitLayer.addEventListener('pointercancel', this.onPointerUp)
  }

  // World-space SVG: absolute at the world origin, overflow visible so shapes
  // may extend past the initial viewport, and transparent to pointers (the hit
  // layer handles input). Because it lives in document.body it pans/zooms with
  // the world.
  createSurface() {
    const svg = svgEl('svg', { id: 'lively-toolbelt-drawing' })
    Object.assign(svg.style, {
      position: 'absolute', left: '0', top: '0', width: '100%', height: '100%',
      overflow: 'visible', pointerEvents: 'none', zIndex: '1000',
    })
    const defs = svgEl('defs')
    const marker = svgEl('marker', {
      id: 'lively-toolbelt-arrowhead',
      viewBox: '0 0 10 10', refX: '9', refY: '5',
      markerWidth: '7', markerHeight: '7', orient: 'auto-start-reverse',
    })
    marker.appendChild(svgEl('path', { d: 'M 0 0 L 10 5 L 0 10 z', fill: this.color }))
    defs.appendChild(marker)
    svg.appendChild(defs)
    return svg
  }

  // Screen-fixed input catcher. pointer-events toggle with the active mode so
  // the page stays interactive in normal mode.
  createHitLayer() {
    const div = document.createElement('div')
    div.id = 'lively-toolbelt-drawing-input'
    Object.assign(div.style, {
      position: 'fixed', inset: '0',
      // Below the toolbelt (z-index 1001) so its buttons stay clickable.
      zIndex: '1000', pointerEvents: 'none', touchAction: 'none',
    })
    return div
  }

  setMode(mode) {
    this.mode = mode
    const drawing = !!mode
    this.hitLayer.style.pointerEvents = drawing ? 'auto' : 'none'
    this.hitLayer.style.cursor = drawing ? 'crosshair' : ''
    if (!drawing) this.abortStroke()
  }

  /*MD ## Pointer handling MD*/
  onPointerDown(evt) {
    // Ignore secondary buttons and extra pointers mid-stroke.
    if (!this.mode || this.activePointerId !== null || evt.button !== 0) return
    this.activePointerId = evt.pointerId
    this.hitLayer.setPointerCapture(evt.pointerId)
    evt.preventDefault()

    this.current = this.startShape(this.mode, this.pointOf(evt))
  }

  onPointerMove(evt) {
    if (evt.pointerId !== this.activePointerId || !this.current) return
    evt.preventDefault()
    // Freehand consumes every sub-frame sample; shapes only need the latest.
    const samples = this.mode === 'freeform' && evt.getCoalescedEvents
      ? evt.getCoalescedEvents()
      : [evt]
    for (const s of samples) this.current.extend(this.pointOf(s))
  }

  onPointerUp(evt) {
    if (evt.pointerId !== this.activePointerId) return
    this.current?.finish(this.pointOf(evt))
    this.endStroke(evt.pointerId)
  }

  abortStroke() {
    if (this.activePointerId !== null) this.endStroke(this.activePointerId)
  }

  endStroke(pointerId) {
    if (this.hitLayer.hasPointerCapture?.(pointerId)) this.hitLayer.releasePointerCapture(pointerId)
    this.activePointerId = null
    this.current = null
  }

  // Viewport pointer -> WORLD coordinates (relative to the surface's origin in
  // document.body), plus the extra channels a high-quality stroke would use.
  // getClientPosition accounts for world scroll/pan (graffle's conversion).
  pointOf(evt) {
    const origin = lively.getClientPosition(this.surface)
    return {
      x: evt.clientX - origin.x,
      y: evt.clientY - origin.y,
      pressure: evt.pressure || 0.5,
      tiltX: evt.tiltX || 0,
      tiltY: evt.tiltY || 0,
      pointerType: evt.pointerType,
    }
  }

  /*MD ## Shapes MD*/
  startShape(mode, p) {
    if (mode === 'freeform') return this.startFreeform(p)
    if (mode === 'rectangle') return this.startRectangle(p)
    if (mode === 'arrow') return this.startArrow(p)
    return null
  }

  startFreeform(p) {
    // Retain the raw samples (with pressure/tilt) as the stroke's source of
    // truth. Capture and model stay fixed; only renderFreeform changes when the
    // high-quality variant lands.
    const stroke = { mode: 'freeform', color: this.color, baseWidth: this.baseWidth, points: [p] }
    const el = svgEl('path', {
      fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
    })
    this.surface.appendChild(el)
    this.strokes.push(stroke)
    this.renderFreeform(el, stroke)
    return {
      extend: q => { stroke.points.push(q); this.renderFreeform(el, stroke) },
      finish: () => {},
    }
  }

  // #Swap seam. Current: smoothed constant-width centerline (width from mean
  // pressure). The high-quality variant replaces this body only — e.g. a
  // spline-fit, variable-width FILLED OUTLINE from points+pressure+velocity
  // (perfect-freehand style), or the hybrid canvas re-render — reading the same
  // stroke model. Everything above (capture, coalesced samples, retained
  // world-space points) is unaffected.
  renderFreeform(el, stroke) {
    const pts = stroke.points
    const avgPressure = pts.reduce((s, p) => s + p.pressure, 0) / pts.length
    el.setAttribute('stroke', stroke.color)
    el.setAttribute('stroke-width', stroke.baseWidth * (0.5 + avgPressure))
    el.setAttribute('d', smoothPath(pts))
  }

  startRectangle(p) {
    const rect = svgEl('rect', {
      fill: 'none', stroke: this.color, 'stroke-width': this.baseWidth,
      x: p.x, y: p.y, width: 0, height: 0,
    })
    this.surface.appendChild(rect)
    const update = q => {
      rect.setAttribute('x', Math.min(p.x, q.x))
      rect.setAttribute('y', Math.min(p.y, q.y))
      rect.setAttribute('width', Math.abs(q.x - p.x))
      rect.setAttribute('height', Math.abs(q.y - p.y))
    }
    return { extend: update, finish: update }
  }

  startArrow(p) {
    const line = svgEl('line', {
      stroke: this.color, 'stroke-width': this.baseWidth, 'stroke-linecap': 'round',
      x1: p.x, y1: p.y, x2: p.x, y2: p.y,
      'marker-end': 'url(#lively-toolbelt-arrowhead)',
    })
    this.surface.appendChild(line)
    const update = q => {
      line.setAttribute('x2', q.x)
      line.setAttribute('y2', q.y)
    }
    return { extend: update, finish: update }
  }
}

// Quadratic-midpoint smoothing: draw each segment as a Q curve whose control
// point is the raw sample and whose endpoint is the midpoint to the next
// sample. Cheap, and removes the faceting of a raw polyline.
function smoothPath(points) {
  if (points.length < 2) return `M ${points[0].x} ${points[0].y}`
  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 1; i < points.length - 1; i++) {
    const mx = (points[i].x + points[i + 1].x) / 2
    const my = (points[i].y + points[i + 1].y) / 2
    d += ` Q ${points[i].x} ${points[i].y} ${mx} ${my}`
  }
  const last = points[points.length - 1]
  d += ` L ${last.x} ${last.y}`
  return d
}
