/*
 * Rendering/interaction layer for lively-toolbelt's drawing modes
 * (freeform, rectangle, arrow, eraser, select). Statically imported by lively-toolbelt.
 *
 * WORLD-SPACE, CLUSTERED (P1)
 * ---------------------------
 * Drawings live in the Lively world (document.body space), so they pan/zoom
 * with the world. Finished shapes are grouped into CLUSTERS: each cluster is a
 * `lively-figure` (class lively-content) positioned in the world, holding its
 * shapes as SVG children. The figure is the unit Lively moves/selects/persists
 * (halos come for free); individual-shape editing is P6, below.
 *
 * A freshly drawn shape joins a cluster when it is RECENT (within JOIN_MS of the
 * cluster's last stroke) OR NEAR (its start point within JOIN_DIST of the
 * cluster's world bounds); otherwise it starts a new cluster.
 *
 * Input: this controller does NOT own any pointer listeners. Permanent,
 * first-in-line capture-phase stubs live in lively-toolbelt-input.js (installed at
 * boot, before graffle/selection); this controller just registers its handlers
 * into them via setToolbeltInputHandler. Because the stubs run first, a claimed
 * gesture calls stopImmediatePropagation and graffle/selection never fire — no
 * unregistering/restoring them. Non-claimed gestures fall through to Lively (world
 * pan/nav, halos). `shouldDraw` is the routing seam. Crosshair cursor and
 * touch-action:none scope to documentElement. getCoalescedEvents() gives sub-frame
 * freehand density; pointer capture keeps a fast drag tracking off-element.
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
 *
 * SELECTION + SUB-STROKE ERASER (P6): individual strokes (not just whole cluster
 * figures, which Lively's halos already handle) can be picked with a lasso or rect
 * marquee, moved, uniformly resized and deleted; the eraser CUTS strokes rather than
 * deleting them whole. All of that needs a stroke's centerline, so committed shapes
 * now PERSIST their point list in `data-points` (see persistShape/parsePoints) —
 * `adoptExistingClusters` reads it back, making restored shapes first-class. Strokes
 * committed before P6 have no such attribute: they stay selectable and deletable but
 * cannot be split or transformed. Undo entries are typed actions (draw/erase/move/
 * resize) so every one of these operations is reversible.
 */

import { setToolbeltInputHandler } from 'src/components/tools/lively-toolbelt-input.js'
import { strokePath, DEFAULT_BRUSH, BRUSH_PRESETS } from 'src/components/tools/lively-toolbelt-brush.js'
import { pt, rect } from 'src/client/graphics.js'
import Selection, { pickShapes, pickShapeAt, worldOutline } from 'src/components/tools/lively-toolbelt-select.js'
import {
  boundsOf, splitStroke, polylineNearPolyline, translatePoints, scalePoints, rectsOverlap,
} from 'src/components/tools/lively-toolbelt-geometry.js'

const SVGNS = 'http://www.w3.org/2000/svg'
const HALF_PI = Math.PI / 2

// Clustering thresholds (tunable).
const JOIN_MS = 1500   // temporal: join the active cluster within this window
const JOIN_DIST = 80   // spatial: join a cluster whose world bounds are this near

// Touch contact patch (px) above which a touch is treated as a palm, not a finger —
// rejected only when BOTH dimensions exceed it. Set generously: fingers press larger
// than expected, and drawing must not be blocked. Tune from measured finger sizes.
const PALM_CONTACT = 80

const ERASER_RADIUS = 20

// Pointer travel (px) below which a select gesture counts as a click, not a marquee.
const CLICK_SLOP = 4

// World-px nudge for a duplicated selection, so copies are visibly distinct.
const DUPLICATE_OFFSET = 16

// Ink floats above the window band (lively-window z-indices climb from ~200 into the
// low hundreds) but below the toolbelt (1001), the live canvases (1000), halos (9999+)
// and menus (10000): drawings overlay windows and tools, yet you can still halo-grab a
// stroke or right-click over it.
const INK_Z_INDEX = 900

// Quasimode keys. A quick TAP switches into the mode (toggles back to normal if you're
// already in it); a HOLD lets you draw in it and reverts to the previous mode on release.
// "Reverts" fires when you drew while holding OR held longer than SPRING_MS — a slow tap
// without drawing still switches.
//
// F and S overlap graffle's freehand/shape hold-keys. Per Stefan: while the toolbelt is
// present it wins — so these run in CAPTURE phase (document-capture fires before graffle's
// body-capture) and stopPropagation, keeping graffle from also seeing the key. Still
// skipped when focus is in a field, so typing is never stolen. With no toolbelt in the
// world the listener isn't installed and graffle keeps the keys.
// N is the exception: 'normal' has nothing to hold-draw in, so it switches instantly
// (no spring) — see onModeKeyDown.
const MODE_KEYS = { n: 'normal', f: 'freeform', r: 'rectangle', a: 'arrow', s: 'select', e: 'eraser' }
// Instant-action keys (not modes, so no spring/hold): fire once on keydown.
const ACTION_KEYS = { z: 'undo', y: 'redo' }
const SPRING_MS = 250

// Two-finger tap = undo (redo stays on the toolbelt button). Only while a drawing mode
// is active — in normal mode two fingers stay Lively's pan/zoom. Strict, so a pinch or
// drag never fires it: all fingers down-and-up within TAP_MS, each moving under TAP_MOVE.
const TAP_MS = 300
const TAP_MOVE = 12

// Cursor shown per corner handle while hovering it.
const HANDLE_CURSOR = {
  topLeft: 'nwse-resize', bottomRight: 'nwse-resize',
  topRight: 'nesw-resize', bottomLeft: 'nesw-resize',
}

function svgEl(tag, attrs = {}) {
  const el = document.createElementNS(SVGNS, tag)
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v)
  return el
}

// Is a key event headed for a text-editable target — i.e. the user is typing, so a mode
// key must NOT be stolen? Everything else (world, the toolbelt itself, a focused morph)
// is fair game. `composedPath()[0]` on a composed key event is the innermost target, so
// it sees through shadow DOM into editors. This deliberately replaces graffle's stricter
// isGlobalKeyboardFocusElement, which only accepts document.body and so rejected the
// common case where the toolbelt (a focusable morph) holds focus after a reload.
function isTypingTarget(el) {
  if (!el || !el.tagName) return false
  const tag = el.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  if (el.isContentEditable) return true
  return el.getAttribute && el.getAttribute('role') === 'textbox'
}

// Sub-frame pointer samples. A real move always reports at least itself, but a
// synthetic (untrusted) event returns an EMPTY list — which would silently drop the
// whole move — so fall back to the event itself rather than trusting the length.
function coalescedSamples(evt) {
  const coalesced = evt.getCoalescedEvents ? evt.getCoalescedEvents() : []
  return coalesced.length ? coalesced : [evt]
}

const round = (v, digits) => {
  const f = 10 ** digits
  return Math.round(v * f) / f
}

/*MD ## Point persistence MD*/
// Frame-local `x,y,pressure,dt,altitude` per point, space separated. dt is ms since
// the stroke's first sample: absolute timestamps are never needed, because the
// velocity dynamic only ever reads deltas — and relative values stay small.
function serializePoints(points, origin) {
  if (!points || !points.length) return ''
  const t0 = points[0].t || 0
  return points.map(p => [
    round(p.x - origin.x, 1),
    round(p.y - origin.y, 1),
    round(p.pressure == null ? 0.5 : p.pressure, 2),
    Math.round((p.t || 0) - t0),
    round(p.altitude == null ? HALF_PI : p.altitude, 2),
  ].join(',')).join(' ')
}

function parsePoints(str, frame, pointerType) {
  if (!str) return []
  return str.trim().split(' ').filter(Boolean).map(chunk => {
    const [x, y, pressure, dt, altitude] = chunk.split(',').map(Number)
    return { x: x + frame.x, y: y + frame.y, pressure, t: dt, altitude, pointerType }
  })
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
    this.brushName = (host.getAttribute && host.getAttribute('brush-preset')) || 'balanced'
    this.brush = BRUSH_PRESETS[this.brushName] || DEFAULT_BRUSH

    // Rectangle/arrow live preview stays on this screen-fixed SVG.
    this.draftSvg = this.createDraftSvg()
    document.body.appendChild(this.draftSvg)

    // Freeform live preview: one canvas, fully redrawn each frame (the brush outline
    // is reprocessed globally, so P4's append-only confirmed layer no longer applies).
    this.liveCanvas = this.createCanvas('lively-toolbelt-live', '1000')
    document.body.appendChild(this.liveCanvas)
    this.rafId = null

    // Lift committed ink above windows/tools (see INK_Z_INDEX).
    this.ensureInkStyle()

    // Selection state + its world-space overlay (P6).
    this.selection = new Selection()

    // Clusters (lively-figures) and the most recently drawn-into one.
    this.clusters = []
    this.active = null

    // Per-commit undo/redo history (this session only; restored shapes aren't in it).
    this.undoStack = []
    this.redoStack = []

    this.activePointerId = null
    this.gesture = null

    // Multi-finger-tap (undo/redo) bookkeeping. activeTouches holds the non-palm touch
    // pointers currently down; the max simultaneous count + whether any moved decide the
    // gesture when the last finger lifts.
    this.activeTouches = new Map()
    this.touchTapMax = 0
    this.touchTapMoved = false
    this.touchTapStart = 0
    // Two-finger pan: last centroid (for incremental world drag) + whether we panned.
    this.panCentroid = null
    this.panned = false

    // Quasimode key state: the held mode key + a revert deferred past an active stroke.
    this.spring = null
    this.pendingRevert = null

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

    // Escape-to-abort. keydown isn't part of the pointer stub set, so it is registered
    // directly — through a single window slot so that a migrated/reloaded controller
    // removes its predecessor's listener rather than stacking (self-healing by
    // replacement, same principle as the pointer handler set above). Capture phase so it
    // can pre-empt other Escape handlers while a gesture is live.
    this.onKeyDown = this.onKeyDown.bind(this)
    if (window.__toolbeltKeydown) document.removeEventListener('keydown', window.__toolbeltKeydown, true)
    window.__toolbeltKeydown = this.onKeyDown
    document.addEventListener('keydown', window.__toolbeltKeydown, true)

    // Same slot pattern for contextmenu: a two-finger tap (and the pen barrel button)
    // emits `contextmenu`, which the pointer stubs don't cover — so it would slip
    // through to Lively's world menu mid-gesture, and opening that menu can scroll the
    // viewport. Swallowed while any drawing mode is active (see onContextMenu).
    this.onContextMenu = this.onContextMenu.bind(this)
    if (window.__toolbeltContextMenu) document.removeEventListener('contextmenu', window.__toolbeltContextMenu, true)
    window.__toolbeltContextMenu = this.onContextMenu
    document.addEventListener('contextmenu', window.__toolbeltContextMenu, true)

    // Quasimode keys (F/R/A/S) — CAPTURE phase on document, which fires before graffle's
    // body-capture handler, so the toolbelt wins the overlapping keys (see MODE_KEYS).
    // Same self-healing window slots.
    this.onModeKeyDown = this.onModeKeyDown.bind(this)
    this.onModeKeyUp = this.onModeKeyUp.bind(this)
    if (window.__toolbeltModeKeyDown) document.removeEventListener('keydown', window.__toolbeltModeKeyDown, true)
    if (window.__toolbeltModeKeyUp) document.removeEventListener('keyup', window.__toolbeltModeKeyUp, true)
    window.__toolbeltModeKeyDown = this.onModeKeyDown
    window.__toolbeltModeKeyUp = this.onModeKeyUp
    document.addEventListener('keydown', window.__toolbeltModeKeyDown, true)
    document.addEventListener('keyup', window.__toolbeltModeKeyUp, true)

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

  // One head stylesheet lifts every drawing cluster above the window band AND makes it
  // click-through except on the actual ink. Kept out of the figures' inline style (like
  // the selection tint) so none of it serializes into persisted lively-content.
  //
  // The figure box now floats over windows, so pointer-events:none on the figure stops
  // its (mostly empty) bounding rect from stealing clicks meant for the window beneath;
  // the shapes opt back in with visiblePainted, so only the painted ink is hit — the
  // filled freeform path, the rect's outline (its hollow interior passes through), the
  // arrow's line. A Ctrl+click on ink still finds the enclosing figure for its halo.
  // Rewrites the rule every call (never bails on existence) so a hot-swapped rule can't
  // go stale.
  ensureInkStyle() {
    let style = document.getElementById('lively-toolbelt-ink-style')
    if (!style) {
      style = document.createElement('style')
      style.id = 'lively-toolbelt-ink-style'
      document.head.appendChild(style)
    }
    style.textContent = `
      lively-figure[data-toolbelt-cluster] { z-index: ${INK_Z_INDEX}; pointer-events: none; }
      lively-figure[data-toolbelt-cluster] svg :is(path, rect, line) { pointer-events: visiblePainted; }
    `
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
    const active = !!mode
    // Cursor + gesture suppression scope live on the root (graffle sets
    // documentElement.style.touchAction); the page stays interactive otherwise.
    // No need to unregister lively-selection here: our input stubs run BEFORE
    // selection/graffle, so a claimed gesture stopImmediatePropagation's them out.
    const root = document.documentElement
    root.style.touchAction = active ? 'none' : ''
    // Stop pen/mouse from starting a text selection while drawing.
    root.style.userSelect = active ? 'none' : ''
    root.style.webkitUserSelect = active ? 'none' : ''
    this.updateCursor()
    if (mode !== 'eraser') this.selection.hideEraserCursor()
    // The selection is a select-mode concept; leaving the mode drops it (and with it
    // the tint class, which must never linger into persisted content).
    if (mode !== 'select') this.selection.clear()
    if (!active) this.abortGesture()
    // Drop any in-flight multi-finger tracking so a mode switch can't strand a finger.
    this.activeTouches.clear()
    this.touchTapMax = 0
    this.panCentroid = null
    this.panned = false
    this.host.refreshDrawingButtons?.()
  }

  // Crosshair while drawing; over a selection, the cursor previews what a drag does.
  updateCursor(worldPt) {
    const root = document.documentElement
    if (!this.mode) return void (root.style.cursor = '')
    if (this.mode === 'eraser') return void (root.style.cursor = 'none')
    if (this.mode === 'select' && worldPt && !this.selection.isEmpty) {
      const handle = this.selection.handleAt(worldPt)
      if (handle) return void (root.style.cursor = HANDLE_CURSOR[handle])
      if (this.selection.containsPoint(worldPt)) return void (root.style.cursor = 'move')
    }
    root.style.cursor = 'crosshair'
  }

  // A pointer is over toolbelt UI (the interactive icon bar / actions panel, or a
  // popup menu tagged with .lively-toolbelt-ui) — such gestures interact with the UI,
  // they never draw. This is what makes the brush-preset menu touchable mid-draw.
  //
  // NOTE: we key on the actual interactive boxes — the #container icon bar and the
  // .actions-panel — NOT the host or #stack. The host's #wrapper carries a wide
  // invisible hover-buffer (the ::before/::after flex items, 100px each side); and
  // #stack, centering a narrow actions panel above the wider icon bar, leaves
  // transparent flanks beside the panel that span the icon-bar width. Both share
  // pointer-events:auto, so keying on either made those regions un-drawable. The
  // buffer targets #wrapper and the flanks target #stack/#actions — none of which
  // are #container or .actions-panel — so only the real controls block drawing.
  isUiTarget(evt) {
    const path = evt.composedPath()
    if (path.some(el => el.classList && el.classList.contains('lively-toolbelt-ui'))) return true
    if (!path.includes(this.host)) return false
    return path.some(el => el.id === 'container' ||
      (el.classList && el.classList.contains('actions-panel')))
  }

  // The pen's ERASER TIP reports button 5 / buttons 32. Flipping the pen erases
  // regardless of which mode is active, and leaves that mode unchanged afterwards.
  effectiveMode(evt) {
    if (evt.button === 5 || (evt.buttons & 32)) return 'eraser'
    return this.mode
  }

  // Pen/mouse always act; a finger may act; a PALM is rejected by its contact patch.
  // Measured: pen reports 1×1, a palm reports ~50–110px in BOTH dimensions. Requiring
  // both dims large (not either) keeps an elongated finger from being mistaken for a
  // palm. (The `activePointerId` guard only rejects a second pointer once one is
  // already active, so it can't catch a palm that lands first — hence the size test.)
  shouldDraw(evt) {
    if (this.activePointerId !== null) return false
    if (evt.button !== 0 && evt.button !== 5) return false
    // The pen's eraser tip (button 5 / buttons 32) works from ANY mode, including normal:
    // flipping the pen to erase shouldn't require first entering a drawing mode. Every
    // other gesture needs an active mode — otherwise normal mode belongs to Lively.
    const eraserTip = evt.button === 5 || (evt.buttons & 32)
    if (!this.mode && !eraserTip) return false
    if (this.isUiTarget(evt)) return false
    if (evt.pointerType === 'touch' && evt.width > PALM_CONTACT && evt.height > PALM_CONTACT) return false
    return true
  }

  /*MD ## Multi-finger tap (undo/redo) MD*/
  // Tracked BEFORE shouldDraw, because the 2nd/3rd finger would fail shouldDraw (a
  // pointer is already active) and never reach the draw path. The first finger starts a
  // normal draw; when a second lands we recognise a multi-finger gesture, cancel that
  // in-progress draw, and claim the touches so Lively doesn't pan. Palms (large contact)
  // are excluded so a resting palm can't inflate the finger count.
  onTouchDown(evt) {
    if (evt.width > PALM_CONTACT && evt.height > PALM_CONTACT) return false // palm, not a finger
    if (this.activeTouches.size === 0) {
      this.touchTapStart = performance.now()
      this.touchTapMoved = false
      this.touchTapMax = 0
    }
    this.activeTouches.set(evt.pointerId, { x0: evt.clientX, y0: evt.clientY, x: evt.clientX, y: evt.clientY })
    this.touchTapMax = Math.max(this.touchTapMax, this.activeTouches.size)
    if (this.activeTouches.size >= 2) {
      this.abortGesture() // the first finger's draft draw is not a stroke, it's a tap/pan
      // Reset the pan reference to the new centroid so adding a finger doesn't jump.
      this.panCentroid = this.touchCentroid()
      evt.preventDefault(); evt.stopImmediatePropagation()
      return true
    }
    return false
  }

  // Centroid of the currently-down fingers (client coords), or null if none.
  touchCentroid() {
    let sx = 0, sy = 0, n = 0
    for (const t of this.activeTouches.values()) { sx += t.x; sy += t.y; n++ }
    return n ? { x: sx / n, y: sy / n } : null
  }

  // Two-finger drag pans the world by scrolling. We scroll by the NEGATIVE centroid
  // delta so content follows the fingers (grab-the-paper). Lively already re-aligns the
  // background grid on its own scroll listener (ViewNav), so nothing else is needed.
  // Incremental (vs. an absolute anchor) so adding or lifting a finger mid-drag just
  // resets the reference without a jump.
  //
  // Gated on touchTapMoved: a resting two-finger TAP still jitters a few pixels between
  // samples, which would otherwise scroll a hair and — worse — set `panned`, killing the
  // undo. So we only pan once the gesture has clearly moved (past TAP_MOVE), while still
  // advancing the reference every frame so panning begins without a jump.
  panWorld() {
    const c = this.touchCentroid()
    if (this.panCentroid && c && this.touchTapMoved) {
      const dx = c.x - this.panCentroid.x, dy = c.y - this.panCentroid.y
      if (dx || dy) {
        window.scrollBy(-dx, -dy)
        this.panned = true
      }
    }
    this.panCentroid = c
  }

  // Fired when the last finger of a multi-finger sequence lifts. A two-finger DRAG pans
  // (handled per-move); a still two-finger TAP undoes. Redo lives on the toolbelt button
  // (three-finger taps are unreliable — the OS eats the third touch on this hardware).
  // Strict: quick + still.
  fireTouchTap() {
    const dur = performance.now() - this.touchTapStart
    const max = this.touchTapMax
    this.touchTapMax = 0
    if (this.panned) { this.panned = false; return } // a drag is never also an undo
    if (max !== 2 || this.touchTapMoved || dur > TAP_MS) return
    this.undo()
  }

  // Block native pan/scroll while a pen is near the surface, so a pen drag (notably the
  // eraser from NORMAL mode, where touch-action is otherwise auto) can't scroll the world.
  // Armed PROACTIVELY on pen hover — setting touch-action inside pointerdown is too late,
  // the browser has already committed to the scroll — and released a beat after the pen
  // leaves (each pen event resets the idle timer). setMode's own touch-action still wins
  // while a drawing mode is active.
  armPenScrollBlock() {
    document.documentElement.style.touchAction = 'none'
    clearTimeout(this._penIdleTimer)
    this._penIdleTimer = setTimeout(() => {
      if (this.activePointerId === null) document.documentElement.style.touchAction = this.mode ? 'none' : ''
    }, 700)
  }

  /*MD ## Pointer handling MD*/
  onPointerDown(evt) {
    if (evt.pointerType === 'pen') this.armPenScrollBlock()
    if (this.mode && evt.pointerType === 'touch' && this.onTouchDown(evt)) return
    if (!this.shouldDraw(evt)) return // let Lively handle non-claimed gestures
    // Starting a gesture (outside any menu — shouldDraw excludes UI) closes an open
    // toolbelt popup, so the brush menu doesn't linger while you draw.
    document.querySelectorAll('lively-menu.lively-toolbelt-ui').forEach(m => m.remove())
    // Anything may have been deleted via halos since the last gesture.
    this.syncWithDom()
    this.activePointerId = evt.pointerId
    try { document.documentElement.setPointerCapture(evt.pointerId) } catch (e) { /* ignore */ }
    // Claim the gesture: keep it from page/components/world-nav. Our stubs run first,
    // so stopImmediatePropagation (not just stopPropagation) blocks every other
    // pointerdown handler on the same element — graffle, selection, Hand, ViewNav.
    evt.preventDefault()
    evt.stopImmediatePropagation()
    window.getSelection?.()?.removeAllRanges() // pen can otherwise start a selection

    const mode = this.effectiveMode(evt)
    if (this.spring) this.spring.used = true // drawing while a mode key is held = "used it"
    const p = this.worldPoint(evt)
    if (mode === 'select') return this.beginSelectGesture(evt, p)
    if (mode === 'eraser') return this.beginEraseGesture(p)
    this.beginDrawGesture(mode, p)
  }

  onPointerMove(evt) {
    // Keep native scroll blocked while the pen hovers (arms before it ever touches down).
    if (evt.pointerType === 'pen') this.armPenScrollBlock()
    // Multi-finger tracking: record this finger's position (a moved finger disqualifies
    // the tap), and once we're multi-finger, pan the world by the centroid delta and
    // swallow the event so Lively doesn't also pan/pinch.
    if (this.mode && evt.pointerType === 'touch' && this.activeTouches.has(evt.pointerId)) {
      const t = this.activeTouches.get(evt.pointerId)
      t.x = evt.clientX; t.y = evt.clientY
      if (Math.hypot(evt.clientX - t.x0, evt.clientY - t.y0) > TAP_MOVE) this.touchTapMoved = true
      if (this.touchTapMax >= 2) { this.panWorld(); evt.preventDefault(); evt.stopImmediatePropagation(); return }
    }
    // Hover (no active gesture): only update cursors/affordances, never claim. Limited
    // to the two modes that have hover affordances — the drawing modes would otherwise
    // pay for a world-coordinate conversion on every mousemove across the page.
    if (evt.pointerId !== this.activePointerId || !this.gesture) {
      if (this.activePointerId !== null) return
      if (this.mode !== 'select' && this.mode !== 'eraser') return
      const p = this.worldPoint(evt)
      if (this.mode === 'eraser') this.selection.showEraserCursor(pt(p.x, p.y), ERASER_RADIUS)
      else this.updateCursor(pt(p.x, p.y))
      return
    }
    evt.preventDefault()
    evt.stopImmediatePropagation()
    const g = this.gesture
    if (g.kind === 'draw') return this.moveDrawGesture(evt, g)
    if (g.kind === 'erase') return this.moveEraseGesture(evt, g)
    this.moveSelectGesture(evt, g)
  }

  async onPointerUp(evt) {
    // Multi-finger tap: bookkeeping runs BEFORE the activePointerId guard (these fingers
    // aren't the active drawing pointer). When the last finger of a >=2 sequence lifts,
    // fire undo/redo. `claim` covers the tail-end frames after count drops back to 1.
    if (this.mode && evt.pointerType === 'touch' && this.activeTouches.has(evt.pointerId)) {
      const claim = this.touchTapMax >= 2
      this.activeTouches.delete(evt.pointerId)
      if (claim) { evt.preventDefault(); evt.stopImmediatePropagation() }
      if (this.activeTouches.size === 0) this.fireTouchTap()
      // A finger lifted but others remain: reset the pan reference to avoid a jump.
      else this.panCentroid = this.touchCentroid()
      if (claim) return
    }
    if (evt.pointerId !== this.activePointerId) return
    evt.stopImmediatePropagation()
    const g = this.gesture
    this.gesture = null
    if (this.rafId != null) { cancelAnimationFrame(this.rafId); this.rafId = null }
    this.endStroke(evt.pointerId)
    if (!g) return this.applyPendingRevert()
    if (g.kind === 'draw') {
      if (evt.type !== 'pointercancel') g.shape.points.push(this.worldPoint(evt))
      if (g.shape.type === 'freeform') { g.shape.predicted = []; this.clearCanvases() }
      await this.commit(g.shape)
    } else if (g.kind === 'erase') {
      this.commitErase(g)
    } else {
      this.finishSelectGesture(g)
    }
    // A mode-key release during the stroke was deferred to here so it couldn't abort it.
    this.applyPendingRevert()
  }

  applyPendingRevert() {
    if (this.pendingRevert == null) return
    const m = this.pendingRevert
    this.pendingRevert = null
    // The marquee has now set the selection; if it grabbed something, stay in select.
    if (this.keepsSelectionOnRelease()) return
    this.host.enterMode(m)
  }

  /*MD ## Drawing gesture MD*/
  beginDrawGesture(mode, p) {
    // Live preview renders in CLIENT coords (screen-fixed layers), so it is
    // reliable regardless of world position. origin = -bodyOrigin maps stored
    // world samples back to client space; committed geometry is re-localized on up.
    const bo = lively.getClientPosition(document.body)
    const shape = {
      type: mode,
      el: makeShapeEl(mode, this.color),
      points: [p],
      origin: { x: -bo.x, y: -bo.y },
      // Live and commit derive identical geometry from the same points + brush (P5),
      // so nothing snaps. brush/color/width stay on the shape so commit, undo, split
      // and rescale all re-render with the same settings.
      brush: this.brush,
      brushName: this.brushName,
      color: this.color,
      strokeWidth: this.baseWidth,
      pointerType: p.pointerType,
    }
    this.gesture = { kind: 'draw', shape }

    if (mode === 'freeform') {
      // Freeform previews on the canvas; the SVG el stays detached until commit.
      this.ensureCanvasSize()
      shape.predicted = []
      this.paintFreeform()
    } else {
      // Rectangle/arrow preview on the SVG draft layer.
      this.draftSvg.appendChild(shape.el)
      renderShape(shape)
    }
  }

  moveDrawGesture(evt, g) {
    const s = g.shape
    if (s.type === 'freeform') {
      for (const c of coalescedSamples(evt)) s.points.push(this.worldPoint(c))
      // Speculative future samples; overwritten each move, never committed.
      s.predicted = evt.getPredictedEvents ? evt.getPredictedEvents().map(pe => this.worldPoint(pe)) : []
      this.scheduleFreeformPaint()
    } else {
      s.points.push(this.worldPoint(evt))
      renderShape(s)
    }
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
    const s = this.gesture && this.gesture.kind === 'draw' ? this.gesture.shape : null
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

  /*MD ## Select gesture MD*/
  // Dispatch order matters: handles sit ON the bounds edge, so they must win over the
  // move test, which in turn must win over starting a fresh marquee.
  beginSelectGesture(evt, p) {
    const worldPt = pt(p.x, p.y)
    const handle = this.selection.handleAt(worldPt)
    if (handle) {
      this.gesture = {
        kind: 'resize', handle, anchor: this.selection.anchorFor(handle),
        start: worldPt, scale: 1, startBounds: this.selection.bounds(),
        entries: this.transformSnapshot(),
      }
      return
    }
    if (this.selection.containsPoint(worldPt)) {
      this.gesture = {
        kind: 'move', start: worldPt, delta: pt(0, 0),
        startBounds: this.selection.bounds(), entries: this.transformSnapshot(),
      }
      return
    }
    const useRect = (this.host.getAttribute && this.host.getAttribute('select-shape')) === 'rectangle'
    // Starting a fresh marquee drops the previous selection immediately, rather than at
    // pointerup — otherwise the old strokes stay lit while you draw the new region.
    const additive = evt.shiftKey
    const base = additive ? [...this.selection.shapes] : []
    if (!additive) this.selection.clear()
    this.gesture = { kind: 'marquee', useRect, start: worldPt, points: [worldPt], additive, base }
  }

  // Re-pick at most once per frame while the marquee is being dragged, so the strokes
  // you are about to select light up as you go instead of only on release.
  scheduleMarqueePick() {
    if (this.rafId != null) return
    this.rafId = requestAnimationFrame(() => {
      this.rafId = null
      const g = this.gesture
      if (!g || g.kind !== 'marquee') return
      this.selection.setPreview([...g.base, ...pickShapes(this.allShapes(), this.marqueeRegion(g))])
    })
  }

  moveSelectGesture(evt, g) {
    const p = this.worldPoint(evt)
    const worldPt = pt(p.x, p.y)
    if (g.kind === 'marquee') {
      g.points = g.useRect ? [g.start, worldPt] : [...g.points, worldPt]
      this.selection.renderMarquee(this.marqueeRegion(g), g.start)
      this.scheduleMarqueePick()
      return
    }
    // Move/resize preview as an element transform: cheap (no re-render per frame) and
    // for scaling it previews exactly what baking produces, since a transform scales
    // the filled outline the same way a larger brush.size does.
    if (g.kind === 'move') {
      g.delta = worldPt.subPt(g.start)
      const t = `translate(${g.delta.x} ${g.delta.y})`
      for (const e of g.entries) e.shape.el.setAttribute('transform', t)
      this.selection.renderChromeAt(g.startBounds.translatedBy(g.delta))
    } else {
      const startLen = g.start.subPt(g.anchor).magnitude()
      g.scale = startLen < 1 ? 1 : Math.max(0.05, worldPt.subPt(g.anchor).magnitude() / startLen)
      this.previewResize(g)
      this.selection.renderChromeAt(g.startBounds.scaleScalarFromAbsOrigin(g.scale, g.anchor))
    }
  }

  // The anchor is a WORLD point, but each element's coordinates are LOCAL to its
  // cluster frame. A pure translate survives that change of basis unchanged — which is
  // why the move preview can use world deltas directly — but a scale ABOUT A POINT does
  // not: feeding it the world anchor displaces every stroke by frame x (1 - scale),
  // i.e. further the further its cluster sits from the world origin. So the anchor has
  // to be localised per shape.
  previewResize(g) {
    for (const e of g.entries) {
      const o = e.shape.origin
      const ax = g.anchor.x - o.x, ay = g.anchor.y - o.y
      e.shape.el.setAttribute('transform',
        `translate(${ax} ${ay}) scale(${g.scale}) translate(${-ax} ${-ay})`)
    }
  }

  marqueeRegion(g) {
    if (g.useRect) {
      const [a, b] = [g.start, g.points[g.points.length - 1]]
      return { rect: rect(pt(Math.min(a.x, b.x), Math.min(a.y, b.y)), pt(Math.max(a.x, b.x), Math.max(a.y, b.y))) }
    }
    return { polygon: g.points }
  }

  async finishSelectGesture(g) {
    if (g.kind === 'marquee') {
      this.selection.clearMarquee()
      // Barely moved? That was a click, not a marquee: take the stroke under the
      // pointer. Clicking empty space still picks nothing, so it clears the selection.
      const moved = g.points[g.points.length - 1].dist(g.start)
      const picked = moved <= CLICK_SLOP
        ? [pickShapeAt(this.allShapes(), g.start)].filter(Boolean)
        : pickShapes(this.allShapes(), this.marqueeRegion(g))
      this.selection.set([...g.base, ...picked])
      this.host.refreshDrawingButtons?.()
      return
    }
    await this.bakeTransform(g)
  }

  // Shapes whose centerline is unknown (committed before P6) cannot be transformed:
  // there is nothing to translate or scale, and their filled outline can't be turned
  // back into points. They stay selectable and deletable.
  transformSnapshot() {
    return this.selection.shapes
      .filter(s => s.points && s.points.length >= 2)
      .map(s => ({
        shape: s,
        fromPoints: s.points,
        fromCluster: s.cluster,
        fromBrushSize: s.brush ? s.brush.size : null,
        fromStrokeWidth: s.strokeWidth,
      }))
  }

  async bakeTransform(g) {
    const entries = g.entries
    for (const e of entries) e.shape.el.removeAttribute('transform')
    if (!entries.length) return
    const isMove = g.kind === 'move'
    if (isMove && g.delta.x === 0 && g.delta.y === 0) return
    if (!isMove && g.scale === 1) return

    for (const e of entries) {
      if (isMove) {
        e.toPoints = translatePoints(e.fromPoints, g.delta)
        e.toBrushSize = e.fromBrushSize
        e.toStrokeWidth = e.fromStrokeWidth
      } else {
        e.toPoints = scalePoints(e.fromPoints, g.scale, g.anchor)
        e.toBrushSize = e.fromBrushSize == null ? null : e.fromBrushSize * g.scale
        e.toStrokeWidth = e.fromStrokeWidth * g.scale
      }
    }
    // Where the moved shapes land decides their cluster. Resolved once, from the
    // selection's new top-left, so a multi-stroke selection stays together.
    const landing = boundsOf(entries.flatMap(e => e.toPoints))
    const target = await this.resolveClusterAt(landing.topLeft())
    for (const e of entries) e.toCluster = target

    const action = { type: g.kind, entries }
    this.applyAction(action)
    this.undoStack.push(action)
    this.redoStack = []
    this.selection.refresh()
    this.host.refreshDrawingButtons?.()
  }

  /*MD ## Eraser gesture MD*/
  // The eraser is a PREVIEW-then-commit gesture, not destructive per frame. Nothing is
  // cut until pointerup: while you sweep, the material that would be erased is greyed
  // and the surviving structure is drawn on top, and Escape aborts back to the untouched
  // state. Deferring the split to commit also means it happens ONCE over the whole
  // sweep — so there are no intermediate fragments to net out of the undo entry, which
  // is what the frame-by-frame version had to guard against.
  beginEraseGesture(p) {
    const worldPt = pt(p.x, p.y)
    this.gesture = { kind: 'erase', sweep: [worldPt], dimmed: [] }
    this.selection.showEraserCursor(worldPt, ERASER_RADIUS)
    this.scheduleErase()
  }

  moveEraseGesture(evt, g) {
    for (const c of coalescedSamples(evt)) {
      const p = this.worldPoint(c)
      g.sweep.push(pt(p.x, p.y))
    }
    this.selection.showEraserCursor(g.sweep[g.sweep.length - 1], ERASER_RADIUS)
    this.scheduleErase()
  }

  scheduleErase() {
    if (this.rafId != null) return
    this.rafId = requestAnimationFrame(() => {
      this.rafId = null
      if (this.gesture && this.gesture.kind === 'erase') this.previewErase(this.gesture)
    })
  }

  // Which shapes the sweep would touch, and what survives each. Non-destructive:
  // returns { shape, runs } per affected shape (runs = [] means the whole shape goes,
  // i.e. a rect/arrow or a pointless stroke). Recomputed over the FULL sweep each frame
  // — bbox-prefiltered — so the preview always reflects the whole gesture, not a delta.
  computeErase(g) {
    const sweep = g.sweep
    if (!sweep.length) return []
    const sweepBounds = boundsOf(sweep).expandBy(ERASER_RADIUS)
    const affected = []
    for (const cluster of this.clusters) {
      for (const shape of cluster.shapes) {
        const outline = worldOutline(shape)
        const b = boundsOf(outline)
        if (!b || !rectsOverlap(b, sweepBounds)) continue
        const splittable = shape.type === 'freeform' && shape.points && shape.points.length >= 2
        if (!splittable) {
          if (polylineNearPolyline(outline, sweep, ERASER_RADIUS)) affected.push({ shape, runs: [] })
        } else {
          const runs = splitStroke(shape.points, sweep, ERASER_RADIUS)
          if (runs !== null) affected.push({ shape, runs })
        }
      }
    }
    return affected
  }

  // Grey the doomed strokes (dim the real element) and draw the survivors bright on top,
  // so what stays vs. what goes is legible before you release.
  previewErase(g) {
    const affected = this.computeErase(g)
    const now = new Set(affected.map(a => a.shape))
    for (const s of g.dimmed) if (!now.has(s)) s.el.classList.remove('lively-toolbelt-erasing')
    for (const { shape } of affected) shape.el.classList.add('lively-toolbelt-erasing')
    g.dimmed = affected.map(a => a.shape)

    const paths = []
    let bounds = null
    for (const { shape, runs } of affected) {
      const ob = boundsOf(worldOutline(shape))
      if (ob) bounds = bounds ? bounds.union(ob) : ob
      for (const run of runs) {
        paths.push({ d: strokePath(run, shape.brush, { last: true }), color: shape.color || this.color })
      }
    }
    this.selection.setErasePreview(paths, bounds)
  }

  makeFragment(shape, run, cluster) {
    return {
      type: 'freeform',
      el: makeShapeEl('freeform', shape.color || this.color),
      points: run,
      origin: cluster.frame,
      brush: shape.brush,
      brushName: shape.brushName,
      color: shape.color || this.color,
      strokeWidth: shape.strokeWidth,
      pointerType: shape.pointerType,
    }
  }

  // pointerup: do the cut for real, once, as a single undo entry.
  commitErase(g) {
    this.selection.hideEraserCursor()
    this.selection.clearErasePreview()
    for (const s of g.dimmed) s.el.classList.remove('lively-toolbelt-erasing')

    const affected = this.computeErase(g)
    const removed = [], added = []
    for (const { shape, runs } of affected) {
      const cluster = shape.cluster
      removed.push({ shape, cluster })
      this.detachShape(shape)
      for (const run of runs) {
        const frag = this.makeFragment(shape, run, cluster)
        this.attachShape(frag, cluster)
        added.push({ shape: frag, cluster })
      }
    }
    this.selection.prune(s => !!s.cluster)
    if (!removed.length) return
    this.undoStack.push({ type: 'erase', removed, added })
    this.redoStack = []
    this.host.refreshDrawingButtons?.()
  }

  // Escape: drop the preview, leaving every stroke exactly as it was (nothing was cut).
  abortErase(g) {
    this.selection.hideEraserCursor()
    this.selection.clearErasePreview()
    for (const s of g.dimmed) s.el.classList.remove('lively-toolbelt-erasing')
  }

  /*MD ## Delete MD*/
  deleteSelection() {
    const removed = this.selection.shapes.map(s => ({ shape: s, cluster: s.cluster }))
    if (!removed.length) return
    this.selection.clear()
    for (const { shape } of removed) this.detachShape(shape)
    this.undoStack.push({ type: 'erase', removed, added: [] })
    this.redoStack = []
    this.host.refreshDrawingButtons?.()
  }

  /*MD ## Duplicate MD*/
  // Copy the selection nudged down-right; the copies become the new selection (ready to
  // drag). Purely additive, so it reuses the erase action shape (removed empty) and gets
  // undo/redo for free. Shapes without a centerline (pre-P6) can't be re-rendered at an
  // offset, so they're skipped.
  async duplicateSelection() {
    const originals = this.selection.shapes.filter(s => s.points && s.points.length >= 2)
    if (!originals.length) return
    const offset = pt(DUPLICATE_OFFSET, DUPLICATE_OFFSET)
    const copies = originals.map(s => this.copyShape(s, offset))
    // One target cluster for the whole batch, by where the copies land, so a multi-stroke
    // duplicate stays together (they land near the source, so they usually rejoin it).
    const target = await this.resolveClusterAt(boundsOf(copies.flatMap(c => c.points)).topLeft())
    const added = []
    for (const copy of copies) { this.attachShape(copy, target); added.push({ shape: copy, cluster: target }) }
    this.selection.set(copies)
    this.undoStack.push({ type: 'erase', removed: [], added })
    this.redoStack = []
    this.host.refreshDrawingButtons?.()
  }

  copyShape(shape, offset) {
    return {
      type: shape.type,
      el: makeShapeEl(shape.type, shape.color || this.color),
      points: translatePoints(shape.points, offset),
      origin: null, // set by attachShape
      brush: shape.brush,
      brushName: shape.brushName,
      color: shape.color || this.color,
      strokeWidth: shape.strokeWidth,
      pointerType: shape.pointerType,
    }
  }

  // Swallow the click a tap emits while a mode is active (except over toolbelt UI,
  // whose clicks switch modes / pick menu items) so it can't select/grab a drawing.
  onClick(evt) {
    if (!this.mode) return
    if (this.isUiTarget(evt)) return
    evt.preventDefault()
    evt.stopImmediatePropagation()
  }

  // Cancel the active gesture, leaving the world as it was before it started. Reached
  // by Escape (onKeyDown) and by leaving the mode. Never commits.
  abortGesture() {
    if (this.rafId != null) { cancelAnimationFrame(this.rafId); this.rafId = null }
    if (this.activePointerId !== null) this.endStroke(this.activePointerId)
    const g = this.gesture
    this.gesture = null
    if (!g) { this.selection.clearMarquee(); this.clearCanvases(); return }
    if (g.kind === 'draw') g.shape.el.remove()
    else if (g.kind === 'move' || g.kind === 'resize') {
      // Drop the preview transform; the real points were never changed.
      for (const e of g.entries) e.shape.el.removeAttribute('transform')
      this.selection.refresh()
    } else if (g.kind === 'erase') {
      this.abortErase(g)
    }
    this.selection.clearMarquee()
    this.clearCanvases()
  }

  // Escape aborts the gesture in progress. Only claimed while a gesture is live, so a
  // stray Escape elsewhere is left alone.
  onKeyDown(evt) {
    if (evt.key !== 'Escape' || !this.gesture) return
    evt.preventDefault()
    evt.stopImmediatePropagation()
    this.abortGesture()
  }

  // While a drawing mode is active, right-click / two-finger tap / barrel button must
  // not open Lively's world menu (it pops mid-gesture and can scroll the viewport).
  // Outside a mode it is left alone.
  onContextMenu(evt) {
    if (!this.mode) return
    evt.preventDefault()
    evt.stopImmediatePropagation()
  }

  /*MD ## Quasimode keys MD*/
  // A bare (no ctrl/alt/meta/shift) toolbelt key while not typing — i.e. ours to claim.
  // Returns the lowercase key (in MODE_KEYS or ACTION_KEYS), else null.
  claimedKey(evt) {
    if (evt.ctrlKey || evt.altKey || evt.metaKey || evt.shiftKey) return null
    const k = evt.key && evt.key.toLowerCase()
    if (!MODE_KEYS[k] && !ACTION_KEYS[k]) return null
    if (isTypingTarget(evt.composedPath()[0])) return null
    return k
  }

  // Mode keys (F/R/A/S/E): tap to switch (tapping the current mode's key toggles back to
  // normal), hold to draw in it and revert on release. Action keys (Z/Y): undo/redo, fired
  // once per press.
  //
  // CLAIM FIRST, decide second: preventDefault + stopPropagation happen before any early
  // return, so graffle (whose freehand/shape keys are F/S) never sees the key even on
  // auto-repeat or when a prior spring is still set. Bailing before claiming was the bug
  // that let a stuck spring (from a missed keyup) leak every subsequent key to graffle.
  onModeKeyDown(evt) {
    const k = this.claimedKey(evt)
    if (!k) return
    evt.preventDefault()
    evt.stopPropagation()
    if (ACTION_KEYS[k]) {
      if (!evt.repeat) (ACTION_KEYS[k] === 'undo' ? this.undo() : this.redo())
      return
    }
    if (evt.repeat) return // held: the OS auto-repeats keydown; nothing new to do
    // Normal mode is NOT a quasimode — there's nothing to hold-draw in it. Just switch
    // once, and clear any pending spring so a stale hold-revert can't yank us back out.
    if (MODE_KEYS[k] === 'normal') { this.spring = null; this.host.enterMode('normal'); return }
    // A fresh press replaces any stale spring (e.g. a hold whose keyup was lost to a
    // window blur), so mode switching can't get wedged.
    const mode = MODE_KEYS[k] === this.host.mode ? 'normal' : MODE_KEYS[k] // toggle out of the current mode
    this.spring = { key: k, prevMode: this.host.mode, start: performance.now(), used: false }
    this.host.enterMode(mode) // switch now, so a hold draws in it
  }

  onModeKeyUp(evt) {
    const k = this.claimedKey(evt)
    if (!k) return
    evt.preventDefault()
    evt.stopPropagation()
    if (!this.spring || k !== this.spring.key) return
    const held = performance.now() - this.spring.start
    const revert = this.spring.used || held > SPRING_MS
    const prevMode = this.spring.prevMode
    this.spring = null
    if (revert) {
      // A quasimode 'select' that captured something stays put — see keepsSelectionOnRelease.
      if (this.keepsSelectionOnRelease()) return
      // Don't yank the mode out from under an in-progress stroke (releasing the key mid-
      // draw would abort it) — defer the revert until the stroke finishes (onPointerUp).
      if (this.gesture) this.pendingRevert = prevMode
      else this.host.enterMode(prevMode)
    }
  }

  // A quasimode 'select' that captured a non-empty selection must survive the key
  // release: you held S to pick strokes, and releasing must not drop them — you still
  // want to delete/duplicate/move what you grabbed. An empty select (or any other
  // quasimode) reverts as usual. Checked both on key-up and when a deferred revert
  // flushes at pointerup (by which point the marquee has set the selection).
  keepsSelectionOnRelease() {
    return this.host.mode === 'select' && !this.selection.isEmpty
  }

  endStroke(pointerId) {
    const root = document.documentElement
    if (root.hasPointerCapture?.(pointerId)) root.releasePointerCapture(pointerId)
    this.activePointerId = null
    // touch-action restore is owned by the pen idle-timer (armPenScrollBlock): while the
    // pen keeps hovering it stays blocked, and it reverts to the mode baseline a beat
    // after the pen leaves. A drawing mode's own touch-action:none (setMode) is unaffected.
  }

  /*MD ## Clustering & commit MD*/
  async commit(shape) {
    const cluster = await this.resolveCluster(shape.points[0])
    shape.el.remove() // detach from the draft layer before re-parenting
    this.attachShape(shape, cluster)
    cluster.lastTime = performance.now()
    this.active = cluster

    // Record for undo; a fresh commit invalidates the redo branch.
    this.undoStack.push({ type: 'draw', shape, cluster })
    this.redoStack = []
    this.host.refreshDrawingButtons?.()
  }

  // Add a shape to a cluster (re-creating the figure if a previous undo removed it),
  // re-render it in the cluster's frame, and persist its centerline.
  attachShape(shape, cluster) {
    if (!this.clusters.includes(cluster)) {
      this.clusters.push(cluster)
      document.body.appendChild(cluster.figure)
    }
    if (!cluster.shapes.includes(shape)) cluster.shapes.push(shape)
    shape.cluster = cluster
    shape.origin = cluster.frame
    cluster.group.appendChild(shape.el)
    renderShape(shape)
    this.persistShape(shape)
    this.layoutCluster(cluster)
  }

  // Remove a shape from its cluster, dropping the figure if that emptied it.
  detachShape(shape) {
    const cluster = shape.cluster
    shape.el.remove()
    shape.cluster = null
    if (!cluster) return
    const i = cluster.shapes.indexOf(shape)
    if (i >= 0) cluster.shapes.splice(i, 1)
    if (cluster.shapes.length === 0) {
      cluster.figure.remove()
      const ci = this.clusters.indexOf(cluster)
      if (ci >= 0) this.clusters.splice(ci, 1)
      if (this.active === cluster) this.active = null
    } else {
      this.layoutCluster(cluster)
    }
  }

  // Write the centerline (and the settings needed to re-render it) onto the element,
  // so a stroke stays splittable and transformable across a page reload.
  persistShape(shape) {
    const el = shape.el
    if (shape.points && shape.points.length) {
      el.setAttribute('data-points', serializePoints(shape.points, shape.origin))
      if (shape.pointerType) el.setAttribute('data-pointer-type', shape.pointerType)
    }
    if (shape.type === 'freeform' && shape.brush) {
      if (shape.brushName) el.setAttribute('data-brush', shape.brushName)
      el.setAttribute('data-brush-size', round(shape.brush.size, 2))
    }
  }

  allShapes() {
    return this.clusters.flatMap(c => c.shapes)
  }

  /*MD ## Reconciling with the DOM MD*/
  // THE DOM IS THE TRUTH. In normal mode Lively's halos can delete a stroke, or a whole
  // cluster figure, without telling this controller. Acting on the stale model then
  // RESURRECTS that geometry, because attachShape re-appends the element — which is how
  // erasing could suddenly bring a deleted line back as fragments.
  //
  // So reconcile before every gesture: drop shapes whose element left the document (or
  // was reparented), drop clusters whose figure is gone or which are now empty, and
  // adopt figures that appeared from elsewhere.
  syncWithDom() {
    const dropped = []
    for (const cluster of [...this.clusters]) {
      const figureGone = !cluster.figure.isConnected
      const alive = figureGone ? [] : cluster.shapes.filter(s =>
        s.el.isConnected && s.el.parentNode === cluster.group)
      if (alive.length !== cluster.shapes.length) {
        dropped.push(...cluster.shapes.filter(s => !alive.includes(s)))
        cluster.shapes = alive
      }
      if (figureGone || !cluster.shapes.length) {
        if (!figureGone) cluster.figure.remove()
        this.clusters.splice(this.clusters.indexOf(cluster), 1)
        if (this.active === cluster) this.active = null
      }
    }
    if (dropped.length) {
      const gone = new Set(dropped)
      for (const s of dropped) s.cluster = null
      // History referencing vanished shapes has to go too, or an unrelated undo would
      // put externally deleted geometry back.
      const refs = a => a.type === 'draw' ? [a.shape]
        : a.type === 'erase' ? [...a.removed, ...a.added].map(x => x.shape)
        : a.entries.map(e => e.shape)
      this.undoStack = this.undoStack.filter(a => !refs(a).some(s => gone.has(s)))
      this.redoStack = this.redoStack.filter(a => !refs(a).some(s => gone.has(s)))
      this.selection.prune(s => !gone.has(s))
      this.host.refreshDrawingButtons?.()
    }
    this.adoptExistingClusters()
    return dropped.length
  }

  /*MD ## Undo / redo MD*/
  // Entries are typed actions, so draw, erase, delete, move and resize are all
  // reversible through the same two methods.
  async undo() {
    const action = this.undoStack.pop()
    if (!action) return
    this.revertAction(action)
    this.redoStack.push(action)
    this.afterHistoryChange()
  }

  async redo() {
    const action = this.redoStack.pop()
    if (!action) return
    this.applyAction(action)
    this.undoStack.push(action)
    this.afterHistoryChange()
  }

  // Every cluster an action refers to already exists (it was captured when the action
  // was recorded), so replaying one never needs to create a figure — hence no await.
  applyAction(action) {
    if (action.type === 'draw') {
      this.attachShape(action.shape, action.cluster)
      this.active = action.cluster
    } else if (action.type === 'erase') {
      for (const { shape } of action.removed) this.detachShape(shape)
      for (const { shape, cluster } of action.added) this.attachShape(shape, cluster)
    } else {
      this.applyTransform(action.entries, 'to')
    }
  }

  revertAction(action) {
    if (action.type === 'draw') {
      this.detachShape(action.shape)
    } else if (action.type === 'erase') {
      for (const { shape } of action.added) this.detachShape(shape)
      for (const { shape, cluster } of action.removed) this.attachShape(shape, cluster)
    } else {
      this.applyTransform(action.entries, 'from')
    }
  }

  applyTransform(entries, dir) {
    for (const e of entries) {
      const shape = e.shape
      this.detachShape(shape)
      shape.points = dir === 'to' ? e.toPoints : e.fromPoints
      const size = dir === 'to' ? e.toBrushSize : e.fromBrushSize
      if (shape.brush && size != null) shape.brush = { ...shape.brush, size }
      shape.strokeWidth = dir === 'to' ? e.toStrokeWidth : e.fromStrokeWidth
      this.attachShape(shape, dir === 'to' ? e.toCluster : e.fromCluster)
    }
  }

  afterHistoryChange() {
    // A selected shape may have just been detached (or re-attached) by the action.
    this.selection.prune(s => !!s.cluster)
    this.selection.refresh()
    this.host.refreshDrawingButtons?.()
  }

  // Recent OR near, else a new cluster.
  async resolveCluster(startWorld) {
    const now = performance.now()
    if (this.active && now - this.active.lastTime < JOIN_MS) return this.active
    return this.nearestCluster(startWorld) || this.createCluster(startWorld)
  }

  // Like resolveCluster but WITHOUT the recency shortcut, which is meaningless for a
  // move: where the strokes land is the only thing that should decide their cluster.
  async resolveClusterAt(worldPoint) {
    return this.nearestCluster(worldPoint) || this.createCluster(worldPoint)
  }

  nearestCluster(startWorld) {
    let best = null, bestDist = Infinity
    for (const c of this.clusters) {
      if (!c.shapes.length) continue
      const d = distPointToRect(startWorld, this.worldBounds(c))
      if (d < JOIN_DIST && d < bestDist) { best = c; bestDist = d }
    }
    return best
  }

  async createCluster(startWorld) {
    const figure = await lively.create('lively-figure')
    return this.initCluster(figure, startWorld)
  }

  initCluster(figure, startWorld) {
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

      // Ensure the marker so the ink z-index rule lifts even figures persisted before it existed.
      figure.setAttribute('data-toolbelt-cluster', '')
      const shapes = shapeEls.map(el => ({ type: shapeTypeOf(el), el, points: [], origin: null }))
      const cluster = { figure, svg, group, frame: { x: 0, y: 0 }, shapes, lastTime: 0 }
      // figurePos === frame + localBounds.topLeft  =>  frame = figurePos - topLeft
      const b = this.localBounds(cluster)
      const wx = parseFloat(figure.style.left) || 0
      const wy = parseFloat(figure.style.top) || 0
      cluster.frame = { x: wx - (b ? b.x : 0), y: wy - (b ? b.y : 0) }
      for (const s of shapes) {
        s.origin = cluster.frame
        s.cluster = cluster
        this.restoreShape(s)
      }
      this.clusters.push(cluster)
    }
  }

  // Read back what persistShape wrote. Strokes committed before P6 have no
  // data-points: they keep an empty point list and degrade gracefully (selectable and
  // deletable, but not splittable or transformable).
  restoreShape(shape) {
    const el = shape.el
    shape.pointerType = el.getAttribute('data-pointer-type') || 'mouse'
    shape.color = el.getAttribute('fill') !== 'none' && el.getAttribute('fill')
      ? el.getAttribute('fill')
      : (el.getAttribute('stroke') || this.color)
    shape.strokeWidth = parseFloat(el.getAttribute('stroke-width')) || this.baseWidth
    shape.points = parsePoints(el.getAttribute('data-points'), shape.cluster.frame, shape.pointerType)
    if (shape.type === 'freeform') {
      const name = el.getAttribute('data-brush') || 'balanced'
      const size = parseFloat(el.getAttribute('data-brush-size'))
      const preset = BRUSH_PRESETS[name] || DEFAULT_BRUSH
      shape.brushName = name
      shape.brush = Number.isFinite(size) ? { ...preset, size } : preset
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
        : (HALF_PI - Math.hypot(evt.tiltX || 0, evt.tiltY || 0) * Math.PI / 180),
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

function renderShape(shape) {
  const { type, el, points, origin } = shape
  // A shape restored from before P6 has no centerline; its geometry only lives in the
  // element. Re-rendering it would blank the element, so leave it exactly as it is
  // (this path is reached when such a shape is erased and then undone).
  if (!points || points.length < 2) return
  const width = shape.strokeWidth == null ? 2.5 : shape.strokeWidth
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
    el.setAttribute('stroke-width', width)
    el.setAttribute('x', Math.min(a.x, b.x))
    el.setAttribute('y', Math.min(a.y, b.y))
    el.setAttribute('width', Math.abs(b.x - a.x))
    el.setAttribute('height', Math.abs(b.y - a.y))
  } else if (type === 'arrow') {
    const a = P[0], b = P[P.length - 1]
    el.setAttribute('stroke-width', width)
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
