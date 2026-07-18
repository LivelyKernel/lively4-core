/*
 * Rendering/interaction layer for lively-toolbelt's drawing modes
 * (freeform, rectangle, arrow, eraser). Statically imported by lively-toolbelt.
 *
 * WORLD-SPACE, CLUSTERED (P1)
 * ---------------------------
 * Drawings live in the Lively world (document.body space), so they pan/zoom
 * with the world. Finished shapes are grouped into CLUSTERS: each cluster is a
 * `lively-figure` (class lively-content) positioned in the world, holding its
 * shapes as SVG children. The figure is the unit Lively moves/selects/persists
 * (halos come for free); individual-shape editing is a later refinement.
 *
 * A freshly drawn shape joins a cluster when it is RECENT (within JOIN_MS of the
 * cluster's last stroke) OR NEAR (its start point within JOIN_DIST of the
 * cluster's world bounds); otherwise it starts a new cluster.
 *
 * Input: this controller does NOT own any pointer listeners. Permanent,
 * first-in-line capture-phase stubs live in lively-toolbelt-input.js (installed at
 * boot, before graffle/selection); this controller just registers its handlers
 * into them via setToolbeltInputHandler. Because the stubs run first, a claimed
 * draw gesture calls stopImmediatePropagation and graffle/selection never fire —
 * no unregistering/restoring them. Non-draw gestures fall through to Lively (world
 * pan/nav, halos). `shouldDraw` is the routing seam (later: pen draws, touch pans,
 * palm rejected). Crosshair cursor and touch-action:none scope to documentElement.
 * getCoalescedEvents() gives sub-frame freehand density; pointer capture keeps a
 * fast drag tracking off-element.
 *
 *   - draftSvg : world-positioned SVG holding the in-progress stroke; on
 *                pointerup the shape is committed into its cluster figure.
 *
 * Shape geometry is stored relative to its cluster's fixed frame (small local
 * coords even for far-away clusters → no SVG float jitter); the figure is
 * positioned/sized to the union bounds via a <g> transform as the cluster grows.
 *
 * HYBRID LIVE FREEFORM (P4) + VARIABLE-WIDTH BRUSH (P5): the freeform preview
 * renders on a screen-fixed `liveCanvas`, rAF-batched, using getPredictedEvents()
 * for a low-latency dimmed tip. Freeform commits as a FILLED, tapered outline (not a
 * stroked centerline): lively-toolbelt-brush.js turns the point list into that
 * outline via perfect-freehand, driven by a dynamics layer (pressure + velocity +
 * taper). The live canvas fills the SAME brush path each frame — confirmed+predicted
 * dimmed underneath, confirmed solid on top — so live == commit and nothing snaps.
 * Rectangle/arrow still preview on `draftSvg` (SVG) and commit unchanged.
 */

import { setToolbeltInputHandler } from 'src/components/tools/lively-toolbelt-input.js'
import { strokePath, DEFAULT_BRUSH, BRUSH_PRESETS } from 'src/components/tools/lively-toolbelt-brush.js'

const SVGNS = 'http://www.w3.org/2000/svg'

// Clustering thresholds (tunable).
const JOIN_MS = 1500   // temporal: join the active cluster within this window
const JOIN_DIST = 80   // spatial: join a cluster whose world bounds are this near

// Touch contact patch (px) above which a touch is treated as a palm, not a finger —
// rejected only when BOTH dimensions exceed it. Set generously: fingers press larger
// than expected, and drawing must not be blocked. Tune from measured finger sizes.
const PALM_CONTACT = 80

function svgEl(tag, attrs = {}) {
  const el = document.createElementNS(SVGNS, tag)
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v)
  return el
}

export default class ToolbeltInteraction {
  static activate(host, mode) {
    this.controllerFor(host).setMode(mode)
  }

  static deactivate(host, mode) {
    host.__toolbeltDrawing?.setMode(null)
  }

  static controllerFor(host) {
    return host.__toolbeltDrawing ??= new DrawingController(host)
  }
}

class DrawingController {
  constructor(host) {
    this.host = host
    this.mode = null

    // The pointer listeners are permanent stubs in lively-toolbelt-input.js; this
    // controller only points them at itself (below). A migration/reload just
    // overwrites the handler set, so older controllers go inert — no stacked
    // listeners. Clear any live-layer a predecessor left behind.
    document.querySelectorAll('#lively-toolbelt-draft, #lively-toolbelt-confirmed, #lively-toolbelt-predict, #lively-toolbelt-live')
      .forEach(el => el.remove())

    // Style knobs (could later be driven by toolbelt UI).
    this.color = '#1b1b1b'
    this.baseWidth = 2.5
    // Variable-width brush config; the chosen preset persists on the host attribute
    // (survives controller recreation / reload). See lively-toolbelt-brush.js.
    this.brush = BRUSH_PRESETS[host.getAttribute && host.getAttribute('brush-preset')] || DEFAULT_BRUSH

    // Rectangle/arrow live preview stays on this screen-fixed SVG.
    this.draftSvg = this.createDraftSvg()
    document.body.appendChild(this.draftSvg)

    // Freeform live preview: one canvas, fully redrawn each frame (the brush outline
    // is reprocessed globally, so P4's append-only confirmed layer no longer applies).
    this.liveCanvas = this.createCanvas('lively-toolbelt-live', '1000')
    document.body.appendChild(this.liveCanvas)
    this.rafId = null

    // Clusters (lively-figures) and the most recently drawn-into one.
    this.clusters = []
    this.active = null

    // Per-commit undo/redo history (this session only; restored shapes aren't in it).
    this.undoStack = []
    this.redoStack = []

    this.activePointerId = null
    this.current = null

    // Point the permanent first-in-line stubs (lively-toolbelt-input.js) at this
    // controller; overwriting the global handler set makes any older controller
    // inert (self-healing by replacement). Handlers are gated by `this.mode`.
    // pointercancel reuses onPointerUp; onClick swallows the click a tap emits.
    this.onPointerDown = this.onPointerDown.bind(this)
    this.onPointerMove = this.onPointerMove.bind(this)
    this.onPointerUp = this.onPointerUp.bind(this)
    this.onClick = this.onClick.bind(this)
    setToolbeltInputHandler({
      pointerdown: this.onPointerDown,
      pointermove: this.onPointerMove,
      pointerup: this.onPointerUp,
      pointercancel: this.onPointerUp,
      click: this.onClick,
    })

    // Rehydrate clusters from lively-figures that lively-content persistence
    // restored, so new strokes can join drawings that survived a page reload.
    this.adoptExistingClusters()
  }

  // Transient screen-fixed layer for the stroke being drawn — a reliable
  // full-viewport preview (rendered in client coords); the committed geometry is
  // re-localized to world space on pointerup. Never captures pointers.
  createDraftSvg() {
    const svg = svgEl('svg', { id: 'lively-toolbelt-draft' })
    Object.assign(svg.style, {
      position: 'fixed', inset: '0', width: '100%', height: '100%',
      overflow: 'visible', pointerEvents: 'none', zIndex: '1000',
    })
    svg.appendChild(this.arrowMarkerDefs())
    return svg
  }

  // Screen-fixed, non-interactive canvas covering the viewport. Backing-store
  // resolution is set to match device pixels at stroke start (ensureCanvasSize).
  createCanvas(id, zIndex) {
    const canvas = document.createElement('canvas')
    canvas.id = id
    Object.assign(canvas.style, {
      position: 'fixed', inset: '0', width: '100%', height: '100%',
      pointerEvents: 'none', zIndex,
    })
    return canvas
  }

  // Size the live canvas from its ACTUAL rendered rect (getBoundingClientRect,
  // which excludes scrollbars) — not window.innerWidth. innerWidth includes the
  // scrollbar, so a `width:100%` canvas backing store sized to innerWidth is squeezed
  // into a slightly smaller CSS box, scaling all drawing about the top-left corner.
  // backing = renderedCSS × dpr keeps the preview crisp and positionally exact.
  // Resizing clears the canvas, so this runs at freeform pointerdown, never mid-stroke.
  ensureCanvasSize() {
    const dpr = window.devicePixelRatio || 1
    const canvas = this.liveCanvas
    const rect = canvas.getBoundingClientRect()
    this.canvasOffset = { x: rect.left, y: rect.top } // usually (0,0) for a fixed layer
    const w = Math.round(rect.width * dpr)
    const h = Math.round(rect.height * dpr)
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w
      canvas.height = h
    } else {
      canvas.getContext('2d').clearRect(0, 0, w, h)
    }
    const ctx = canvas.getContext('2d')
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0) // draw in CSS pixels
  }

  clearCanvases() {
    const ctx = this.liveCanvas.getContext('2d')
    ctx.clearRect(0, 0, this.liveCanvas.width, this.liveCanvas.height)
  }

  arrowMarkerDefs() {
    const defs = svgEl('defs')
    const marker = svgEl('marker', {
      id: 'lively-toolbelt-arrowhead',
      viewBox: '0 0 10 10', refX: '9', refY: '5',
      markerWidth: '7', markerHeight: '7', orient: 'auto-start-reverse',
    })
    marker.appendChild(svgEl('path', { d: 'M 0 0 L 10 5 L 0 10 z', fill: this.color }))
    defs.appendChild(marker)
    return defs
  }

  setMode(mode) {
    this.mode = mode
    const drawing = !!mode
    // Cursor + gesture suppression scope live on the root (graffle sets
    // documentElement.style.touchAction); the page stays interactive otherwise.
    // No need to unregister lively-selection here: our input stubs run BEFORE
    // selection/graffle, so a claimed draw stopImmediatePropagation's them out.
    const root = document.documentElement
    root.style.cursor = drawing ? 'crosshair' : ''
    root.style.touchAction = drawing ? 'none' : ''
    // Stop pen/mouse from starting a text selection while drawing.
    root.style.userSelect = drawing ? 'none' : ''
    root.style.webkitUserSelect = drawing ? 'none' : ''
    if (!drawing) this.abortStroke()
  }

  // Whether this pointer should draw (vs. fall through to Lively for pan/nav).
  // P1: primary button in a drawing mode, not on the toolbelt. Seam for later
  // A pointer is over toolbelt UI (the toolbelt itself, or a popup menu tagged with
  // .lively-toolbelt-ui) — such gestures interact with the UI, they never draw. This
  // is what makes the brush-preset menu touchable while in a drawing mode.
  isUiTarget(evt) {
    return evt.composedPath().some(el =>
      el === this.host || (el.classList && el.classList.contains('lively-toolbelt-ui')))
  }

  // Pen/mouse always draw; a finger may draw; a PALM is rejected by its contact patch.
  // Measured: pen reports 1×1, a palm reports ~50–110px in BOTH dimensions. Requiring
  // both dims large (not either) keeps an elongated finger from being mistaken for a
  // palm. (The `activePointerId` guard only rejects a second pointer once one is
  // already drawing, so it can't catch a palm that lands first — hence the size test.)
  shouldDraw(evt) {
    if (!this.mode || this.activePointerId !== null || evt.button !== 0) return false
    if (this.isUiTarget(evt)) return false
    if (evt.pointerType === 'touch' && evt.width > PALM_CONTACT && evt.height > PALM_CONTACT) return false
    return true
  }

  /*MD ## Pointer handling MD*/
  onPointerDown(evt) {
    if (!this.shouldDraw(evt)) return // let Lively handle non-draw gestures
    // Starting a stroke (outside any menu — shouldDraw excludes UI) closes an open
    // toolbelt popup, so the brush menu doesn't linger while you draw.
    document.querySelectorAll('lively-menu.lively-toolbelt-ui').forEach(m => m.remove())
    this.activePointerId = evt.pointerId
    try { document.documentElement.setPointerCapture(evt.pointerId) } catch (e) { /* ignore */ }
    // Claim the gesture: keep it from page/components/world-nav during the draw.
    // Our stubs run first, so stopImmediatePropagation (not just stopPropagation)
    // blocks every other pointerdown handler on the same element — graffle,
    // selection, Hand, ViewNav — none of which have run yet.
    evt.preventDefault()
    evt.stopImmediatePropagation()
    window.getSelection?.()?.removeAllRanges() // pen can otherwise start a selection

    const p = this.worldPoint(evt)
    // Live preview renders in CLIENT coords (screen-fixed layers), so it is
    // reliable regardless of world position. origin = -bodyOrigin maps stored
    // world samples back to client space; committed geometry is re-localized on up.
    const bo = lively.getClientPosition(document.body)
    const el = makeShapeEl(this.mode, this.color)
    // Live and commit derive identical geometry from the same points + brush (P5),
    // so nothing snaps — no per-stroke frozen width needed. brush stays on the shape
    // so commit/undo/redo re-render with the same settings.
    this.current = { type: this.mode, el, points: [p], origin: { x: -bo.x, y: -bo.y }, brush: this.brush }

    if (this.mode === 'freeform') {
      // Freeform previews on the canvas; the SVG el stays detached until commit.
      this.ensureCanvasSize()
      this.current.predicted = []
      this.paintFreeform()
    } else {
      // Rectangle/arrow preview on the SVG draft layer.
      this.draftSvg.appendChild(el)
      renderShape(this.current, this.baseWidth)
    }
  }

  onPointerMove(evt) {
    if (evt.pointerId !== this.activePointerId || !this.current) return
    evt.preventDefault()
    evt.stopImmediatePropagation()
    const s = this.current
    if (s.type === 'freeform') {
      const samples = evt.getCoalescedEvents ? evt.getCoalescedEvents() : [evt]
      for (const c of samples) s.points.push(this.worldPoint(c))
      // Speculative future samples; overwritten each move, never committed.
      s.predicted = evt.getPredictedEvents ? evt.getPredictedEvents().map(pe => this.worldPoint(pe)) : []
      this.scheduleFreeformPaint()
    } else {
      s.points.push(this.worldPoint(evt))
      renderShape(s, this.baseWidth)
    }
  }

  async onPointerUp(evt) {
    if (evt.pointerId !== this.activePointerId) return
    evt.stopImmediatePropagation()
    const shape = this.current
    if (evt.type !== 'pointercancel') shape.points.push(this.worldPoint(evt))
    if (this.rafId != null) { cancelAnimationFrame(this.rafId); this.rafId = null }
    if (shape.type === 'freeform') { shape.predicted = []; this.clearCanvases() }
    this.endStroke(evt.pointerId)
    await this.commit(shape)
  }

  // Paint the in-progress freeform stroke at most once per frame.
  scheduleFreeformPaint() {
    if (this.rafId != null) return
    this.rafId = requestAnimationFrame(() => {
      this.rafId = null
      this.paintFreeform()
    })
  }

  // Fill the brush outline each frame (client space, via Path2D so live == commit):
  // the confirmed+predicted outline dimmed underneath, then the confirmed-only
  // outline solid on top — so the speculative tip reads faint. One canvas, full
  // redraw (perfect-freehand reprocesses the whole stroke, so no incremental append).
  paintFreeform() {
    const s = this.current
    if (!s || s.type !== 'freeform') return
    const confirmed = s.points.map(p => this.toBrushPoint(p, s.origin))
    const predicted = (s.predicted || []).map(p => this.toBrushPoint(p, s.origin))

    const ctx = this.liveCanvas.getContext('2d')
    ctx.clearRect(0, 0, this.liveCanvas.width, this.liveCanvas.height)
    ctx.fillStyle = this.color

    if (predicted.length) {
      ctx.save()
      ctx.globalAlpha = 0.4
      ctx.fill(new Path2D(strokePath(confirmed.concat(predicted), s.brush, { last: false })))
      ctx.restore()
    }
    ctx.fill(new Path2D(strokePath(confirmed, s.brush, { last: false })))
  }

  // Stored world point -> canvas-local (CSS-pixel) brush point. p.x - origin.x
  // recovers the viewport client coord; subtracting the canvas rect offset makes it
  // local to the canvas (a no-op while the layer sits at the viewport origin). Carries
  // the dynamics channels the brush needs (pressure, timestamp, pointerType).
  toBrushPoint(p, origin) {
    const o = this.canvasOffset || { x: 0, y: 0 }
    return {
      x: p.x - origin.x - o.x, y: p.y - origin.y - o.y,
      pressure: p.pressure, t: p.t, altitude: p.altitude, pointerType: p.pointerType,
    }
  }

  // Swallow the click a tap emits while drawing (except over toolbelt UI, whose
  // clicks switch modes / pick menu items) so it can't select/grab a drawing.
  onClick(evt) {
    if (!this.mode) return
    if (this.isUiTarget(evt)) return
    evt.preventDefault()
    evt.stopImmediatePropagation()
  }

  abortStroke() {
    if (this.rafId != null) { cancelAnimationFrame(this.rafId); this.rafId = null }
    if (this.activePointerId !== null) this.endStroke(this.activePointerId)
    // Drop an unfinished draft shape.
    if (this.current) { this.current.el.remove(); this.current = null }
    this.clearCanvases()
  }

  endStroke(pointerId) {
    const root = document.documentElement
    if (root.hasPointerCapture?.(pointerId)) root.releasePointerCapture(pointerId)
    this.activePointerId = null
  }

  /*MD ## Clustering & commit MD*/
  async commit(shape) {
    this.current = null
    const cluster = await this.resolveCluster(shape.points[0])
    // Re-render relative to the cluster's fixed frame, then move into its group.
    shape.origin = cluster.frame
    renderShape(shape, this.baseWidth)
    shape.el.remove()
    cluster.group.appendChild(shape.el)
    cluster.shapes.push(shape)
    cluster.lastTime = performance.now()
    this.active = cluster
    this.layoutCluster(cluster)

    // Record for undo; a fresh commit invalidates the redo branch.
    this.undoStack.push({ shape, cluster })
    this.redoStack = []
    this.host.refreshDrawingButtons?.()
  }

  /*MD ## Undo / redo MD*/
  undo() {
    const action = this.undoStack.pop()
    if (!action) return
    const { shape, cluster } = action
    const i = cluster.shapes.indexOf(shape)
    if (i >= 0) cluster.shapes.splice(i, 1)
    shape.el.remove()
    if (cluster.shapes.length === 0) {
      // The shape had created this cluster — drop the (now empty) figure.
      cluster.figure.remove()
      const ci = this.clusters.indexOf(cluster)
      if (ci >= 0) this.clusters.splice(ci, 1)
      if (this.active === cluster) this.active = null
    } else {
      this.layoutCluster(cluster)
    }
    this.redoStack.push(action)
    this.host.refreshDrawingButtons?.()
  }

  redo() {
    const action = this.redoStack.pop()
    if (!action) return
    const { shape, cluster } = action
    if (!this.clusters.includes(cluster)) {
      // Re-attach the figure this shape had created.
      this.clusters.push(cluster)
      document.body.appendChild(cluster.figure)
    }
    cluster.group.appendChild(shape.el)
    cluster.shapes.push(shape)
    renderShape(shape, this.baseWidth)
    this.layoutCluster(cluster)
    this.active = cluster
    this.undoStack.push(action)
    this.host.refreshDrawingButtons?.()
  }

  // Recent OR near, else a new cluster.
  async resolveCluster(startWorld) {
    const now = performance.now()
    if (this.active && now - this.active.lastTime < JOIN_MS) return this.active

    let best = null, bestDist = Infinity
    for (const c of this.clusters) {
      const d = distPointToRect(startWorld, this.worldBounds(c))
      if (d < JOIN_DIST && d < bestDist) { best = c; bestDist = d }
    }
    if (best) return best

    return this.createCluster(startWorld)
  }

  async createCluster(startWorld) {
    const figure = await lively.create('lively-figure')
    figure.classList.add('lively-content')
    figure.setAttribute('data-toolbelt-cluster', '') // marker for rehydration after reload
    figure.style.position = 'absolute'
    const svg = svgEl('svg', { style: 'position:absolute; left:0; top:0; width:100%; height:100%; overflow:visible; pointer-events:none;' })
    svg.appendChild(this.arrowMarkerDefs())
    const group = svgEl('g')
    svg.appendChild(group)
    figure.appendChild(svg)
    document.body.appendChild(figure)

    // frame: fixed world anchor; shapes render relative to it (small coords).
    const cluster = { figure, svg, group, frame: { x: startWorld.x, y: startWorld.y }, shapes: [], lastTime: performance.now() }
    this.clusters.push(cluster)
    return cluster
  }

  // Rebuild the in-memory cluster model from lively-figures already in the DOM
  // (restored by persistence). Reconstructs each cluster's frame from the
  // figure's world position and content bounds so new strokes join correctly.
  adoptExistingClusters() {
    const figures = [...document.querySelectorAll('lively-figure')]
      .filter(f => this.isDrawingFigure(f) && !this.clusters.some(c => c.figure === f))
    for (const figure of figures) {
      const svg = figure.querySelector('svg')
      const group = svg && svg.querySelector('g')
      if (!group) continue
      const shapeEls = [...group.children].filter(el => /^(path|rect|line)$/i.test(el.tagName))
      if (!shapeEls.length) continue

      // points are unknown for restored shapes (only their SVG geometry survives);
      // bounds/joining use getBBox, so an empty points array is fine.
      const shapes = shapeEls.map(el => ({ type: shapeTypeOf(el), el, points: [], origin: null, restored: true }))
      const cluster = { figure, svg, group, frame: { x: 0, y: 0 }, shapes, lastTime: 0 }
      // figurePos === frame + localBounds.topLeft  =>  frame = figurePos - topLeft
      const b = this.localBounds(cluster)
      const wx = parseFloat(figure.style.left) || 0
      const wy = parseFloat(figure.style.top) || 0
      cluster.frame = { x: wx - (b ? b.x : 0), y: wy - (b ? b.y : 0) }
      for (const s of shapes) s.origin = cluster.frame
      this.clusters.push(cluster)
    }
  }

  isDrawingFigure(figure) {
    if (figure.hasAttribute('data-toolbelt-cluster')) return true
    // Fallback for figures persisted before the marker: our structure is
    // <lively-figure> … <svg><g>{path|rect|line}…</g></svg>.
    const group = figure.querySelector('svg g')
    return !!(group && [...group.children].some(el => /^(path|rect|line)$/i.test(el.tagName)))
  }

  // Position/size the figure to the union of its shapes and offset the group so
  // the union's top-left maps to the figure's (0,0). Shape coords never change.
  layoutCluster(cluster) {
    const b = this.localBounds(cluster)
    if (!b) return
    lively.setPosition(cluster.figure, lively.pt(cluster.frame.x + b.x, cluster.frame.y + b.y))
    lively.setExtent(cluster.figure, lively.pt(b.width, b.height))
    cluster.group.setAttribute('transform', `translate(${-b.x}, ${-b.y})`)
  }

  // Union of child bboxes in the cluster's frame-local coordinates (+ stroke pad).
  localBounds(cluster) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const s of cluster.shapes) {
      const bb = s.el.getBBox()
      minX = Math.min(minX, bb.x); minY = Math.min(minY, bb.y)
      maxX = Math.max(maxX, bb.x + bb.width); maxY = Math.max(maxY, bb.y + bb.height)
    }
    if (minX === Infinity) return null
    const pad = this.baseWidth
    return { x: minX - pad, y: minY - pad, width: (maxX - minX) + 2 * pad, height: (maxY - minY) + 2 * pad }
  }

  worldBounds(cluster) {
    const b = this.localBounds(cluster)
    if (!b) return { x: cluster.frame.x, y: cluster.frame.y, width: 0, height: 0 }
    return { x: cluster.frame.x + b.x, y: cluster.frame.y + b.y, width: b.width, height: b.height }
  }

  // Viewport pointer -> WORLD coordinates (document.body space) + stroke channels.
  // getClientPosition accounts for world scroll/pan (graffle's conversion).
  worldPoint(evt) {
    const origin = lively.getClientPosition(document.body)
    return {
      x: evt.clientX - origin.x,
      y: evt.clientY - origin.y,
      pressure: evt.pressure || 0.5,
      tiltX: evt.tiltX || 0,
      tiltY: evt.tiltY || 0,
      // altitudeAngle (rad, π/2 = upright) for tilt→width; fall back from tilt if absent.
      altitude: evt.altitudeAngle != null
        ? evt.altitudeAngle
        : (Math.PI / 2 - Math.hypot(evt.tiltX || 0, evt.tiltY || 0) * Math.PI / 180),
      t: evt.timeStamp, // for velocity dynamics (P5)
      pointerType: evt.pointerType,
    }
  }
}

/*MD ## Shape rendering MD*/
// Elements are created once; renderShape redraws from the retained world-space
// points, localized by shape.origin (the cluster frame, or the draft start).
function shapeTypeOf(el) {
  const t = el.tagName.toLowerCase()
  return t === 'rect' ? 'rectangle' : t === 'line' ? 'arrow' : 'freeform'
}

function makeShapeEl(type, color) {
  if (type === 'freeform') {
    // Filled variable-width outline (P5), not a stroked centerline.
    return svgEl('path', { fill: color, stroke: 'none' })
  }
  if (type === 'rectangle') {
    return svgEl('rect', { fill: 'none', stroke: color })
  }
  if (type === 'arrow') {
    return svgEl('line', { stroke: color, 'stroke-linecap': 'round', 'marker-end': 'url(#lively-toolbelt-arrowhead)' })
  }
}

function renderShape(shape, baseWidth) {
  const { type, el, points, origin } = shape
  const P = points.map(p => ({
    x: p.x - origin.x, y: p.y - origin.y,
    pressure: p.pressure, t: p.t, altitude: p.altitude, pointerType: p.pointerType,
  }))
  if (type === 'freeform') {
    // #Swap seam (P5): variable-width filled outline via the brush. Same points +
    // brush as the live canvas, finalized (last:true adds the end taper).
    el.setAttribute('d', strokePath(P, shape.brush ?? DEFAULT_BRUSH, { last: true }))
  } else if (type === 'rectangle') {
    const a = P[0], b = P[P.length - 1]
    el.setAttribute('stroke-width', baseWidth)
    el.setAttribute('x', Math.min(a.x, b.x))
    el.setAttribute('y', Math.min(a.y, b.y))
    el.setAttribute('width', Math.abs(b.x - a.x))
    el.setAttribute('height', Math.abs(b.y - a.y))
  } else if (type === 'arrow') {
    const a = P[0], b = P[P.length - 1]
    el.setAttribute('stroke-width', baseWidth)
    el.setAttribute('x1', a.x); el.setAttribute('y1', a.y)
    el.setAttribute('x2', b.x); el.setAttribute('y2', b.y)
  }
}

// Euclidean distance from a point to a rectangle (0 if inside).
function distPointToRect(p, r) {
  const dx = Math.max(r.x - p.x, 0, p.x - (r.x + r.width))
  const dy = Math.max(r.y - p.y, 0, p.y - (r.y + r.height))
  return Math.hypot(dx, dy)
}
