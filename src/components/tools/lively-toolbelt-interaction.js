/*
 * Rendering/interaction layer for lively-toolbelt's drawing modes
 * (freeform, rectangle, arrow, eraser). Loaded lazily by lively-toolbelt the
 * first time a drawing mode is entered — never at boot.
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
 * Input: global capture-phase pointer listeners on document.documentElement
 * (graffle's approach). They see input before page/components, so a claimed draw
 * gesture calls stopPropagation while non-draw gestures fall through to Lively
 * (world pan/nav, halos). `shouldDraw` is the routing seam (later: pen draws,
 * touch pans, palm rejected). Capture, crosshair cursor, and touch-action:none
 * all scope to documentElement. getCoalescedEvents() gives sub-frame freehand
 * density; pointer capture keeps a fast drag tracking off-element.
 *
 *   - draftSvg : world-positioned SVG holding the in-progress stroke; on
 *                pointerup the shape is committed into its cluster figure.
 *
 * Shape geometry is stored relative to its cluster's fixed frame (small local
 * coords even for far-away clusters → no SVG float jitter); the figure is
 * positioned/sized to the union bounds via a <g> transform as the cluster grows.
 *
 * HIGH-QUALITY FREEFORM (planned — see renderShape 'freeform' branch): keep this
 * capture/commit/cluster structure; swap freehand rendering to a hybrid canvas
 * live layer + predicted events + a pressure/velocity/taper variable-width
 * outline brush.
 */

import Selection from 'src/components/halo/lively-selection.js'

const SVGNS = 'http://www.w3.org/2000/svg'

// Clustering thresholds (tunable).
const JOIN_MS = 1500   // temporal: join the active cluster within this window
const JOIN_DIST = 80   // spatial: join a cluster whose world bounds are this near

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

    // Style knobs (could later be driven by toolbelt UI).
    this.color = '#1b1b1b'
    this.baseWidth = 2.5

    this.draftSvg = this.createDraftSvg()
    document.body.appendChild(this.draftSvg)

    // Clusters (lively-figures) and the most recently drawn-into one.
    this.clusters = []
    this.active = null

    this.activePointerId = null
    this.current = null

    // Global capture-phase pointer listeners (graffle's approach): they see
    // input before page/components, so a claimed draw gesture can stopPropagation
    // while non-draw gestures (pan/nav, palm) fall through to Lively. Always
    // registered; gated inside the handlers by `this.mode`.
    this.onPointerDown = this.onPointerDown.bind(this)
    this.onPointerMove = this.onPointerMove.bind(this)
    this.onPointerUp = this.onPointerUp.bind(this)
    this.onClick = this.onClick.bind(this)
    const root = document.documentElement
    lively.addEventListener('ToolbeltDrawing', root, 'pointerdown', this.onPointerDown, true)
    lively.addEventListener('ToolbeltDrawing', root, 'pointermove', this.onPointerMove, true)
    lively.addEventListener('ToolbeltDrawing', root, 'pointerup', this.onPointerUp, true)
    lively.addEventListener('ToolbeltDrawing', root, 'pointercancel', this.onPointerUp, true)
    // A pen/mouse tap is a draw AND emits a click; swallow that click while
    // drawing so it can't also select/grab the surrounding drawing.
    lively.addEventListener('ToolbeltDrawing', root, 'click', this.onClick, true)

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
    const root = document.documentElement
    root.style.cursor = drawing ? 'crosshair' : ''
    root.style.touchAction = drawing ? 'none' : ''
    // Stop pen/mouse from starting a text selection while drawing.
    root.style.userSelect = drawing ? 'none' : ''
    root.style.webkitUserSelect = drawing ? 'none' : ''
    // Suppress Lively's world rubber-band selection while drawing: its
    // capture-phase pointerdown (lively-selection.js) runs before ours, so
    // stopPropagation can't stop it — unregister it and restore on exit.
    if (drawing) lively.removeEventListener('Selection', document.documentElement)
    else Selection.current?.registerOn(document.documentElement)
    if (!drawing) this.abortStroke()
  }

  // Whether this pointer should draw (vs. fall through to Lively for pan/nav).
  // P1: primary button in a drawing mode, not on the toolbelt. Seam for later
  // pen-vs-touch-vs-palm routing (pen -> draw; touch -> pan; palm rejected via
  // width/height/isPrimary or while a pen pointer is active).
  shouldDraw(evt) {
    if (!this.mode || this.activePointerId !== null || evt.button !== 0) return false
    // Clicks on the toolbelt switch/exit the mode — never draw there.
    if (evt.composedPath().includes(this.host)) return false
    return true
  }

  /*MD ## Pointer handling MD*/
  onPointerDown(evt) {
    if (!this.shouldDraw(evt)) return // let Lively handle non-draw gestures
    this.activePointerId = evt.pointerId
    try { document.documentElement.setPointerCapture(evt.pointerId) } catch (e) { /* ignore */ }
    // Claim the gesture: keep it from page/components/world-nav during the draw.
    // stopImmediatePropagation (not just stopPropagation) also blocks the Lively
    // pointerdown handlers registered AFTER ours on the same element (Hand, ViewNav).
    evt.preventDefault()
    evt.stopImmediatePropagation()
    window.getSelection?.()?.removeAllRanges() // pen can otherwise start a selection

    const p = this.worldPoint(evt)
    // Preview renders on the screen-fixed draft layer in CLIENT coords, so it is
    // reliable regardless of world position. origin = -bodyOrigin maps world
    // samples back to client space; committed geometry is re-localized on up.
    const bo = lively.getClientPosition(document.body)
    const el = makeShapeEl(this.mode, this.color)
    this.draftSvg.appendChild(el)
    this.current = { type: this.mode, el, points: [p], origin: { x: -bo.x, y: -bo.y } }
    renderShape(this.current, this.baseWidth)
  }

  onPointerMove(evt) {
    if (evt.pointerId !== this.activePointerId || !this.current) return
    evt.preventDefault()
    evt.stopImmediatePropagation()
    const samples = this.current.type === 'freeform' && evt.getCoalescedEvents
      ? evt.getCoalescedEvents()
      : [evt]
    for (const s of samples) this.current.points.push(this.worldPoint(s))
    renderShape(this.current, this.baseWidth)
  }

  async onPointerUp(evt) {
    if (evt.pointerId !== this.activePointerId) return
    evt.stopImmediatePropagation()
    if (evt.type !== 'pointercancel') this.current.points.push(this.worldPoint(evt))
    const shape = this.current
    this.endStroke(evt.pointerId)
    await this.commit(shape)
  }

  // Swallow the click a tap emits while drawing (except on the toolbelt, whose
  // clicks switch/exit the mode) so it can't select/grab the surrounding drawing.
  onClick(evt) {
    if (!this.mode) return
    if (evt.composedPath().includes(this.host)) return
    evt.preventDefault()
    evt.stopImmediatePropagation()
  }

  abortStroke() {
    if (this.activePointerId !== null) this.endStroke(this.activePointerId)
    // Drop an unfinished draft shape.
    if (this.current) { this.current.el.remove(); this.current = null }
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
    return svgEl('path', { fill: 'none', stroke: color, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' })
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
  const P = points.map(p => ({ x: p.x - origin.x, y: p.y - origin.y, pressure: p.pressure }))
  if (type === 'freeform') {
    // #Swap seam: HQ variant replaces this with a variable-width outline.
    const avg = P.reduce((s, p) => s + p.pressure, 0) / P.length
    el.setAttribute('stroke-width', baseWidth * (0.5 + avg))
    el.setAttribute('d', smoothPath(P))
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

// Quadratic-midpoint smoothing: each segment is a Q curve whose control point is
// the raw sample and whose endpoint is the midpoint to the next — cheap, removes
// polyline faceting.
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

// Euclidean distance from a point to a rectangle (0 if inside).
function distPointToRect(p, r) {
  const dx = Math.max(r.x - p.x, 0, p.x - (r.x + r.width))
  const dy = Math.max(r.y - p.y, 0, p.y - (r.y + r.height))
  return Math.hypot(dx, dy)
}
