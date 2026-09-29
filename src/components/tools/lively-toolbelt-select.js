/*
 * Selection model + overlay for lively-toolbelt (P6).
 *
 * The overlay is a WORLD-SPACE svg (position:absolute at document.body's origin), so it
 * pans and zooms with the world exactly like the cluster figures — no scroll listeners,
 * no client-coordinate recomputation. Everything in it is drawn in world coordinates,
 * the same space `DrawingController.worldPoint` produces.
 *
 * It is pointer-events:none throughout: the toolbelt does its own geometric hit testing
 * from the capture-phase input stubs (handleAt / containsPoint below), so the overlay
 * never competes with Lively for events.
 *
 * Selected strokes are tinted by toggling a class, with the rule living in a stylesheet
 * injected into document.head — never into a figure, so it can never be serialized into
 * persisted content. The rules are tag-based, which is exact here: freeform is always a
 * filled <path>, rectangle/arrow are always stroked.
 */

import { pt, rect } from 'src/client/graphics.js'
import {
  hitPolyline, boundsOf, polylineIntersectsRect, polylineIntersectsPolygon, rectsOverlap,
  distPointToPolyline,
} from 'src/components/tools/lively-toolbelt-geometry.js'

const SVGNS = 'http://www.w3.org/2000/svg'

export const HANDLE_HIT = 12       // px radius for grabbing a corner handle
const HANDLE_SIZE = 8
// Slack around the drawn content so handles and ant strokes are never clipped.
const VIEWPORT_PAD = 24
const ACCENT = '#1b7fd4'
const SELECTED_CLASS = 'lively-toolbelt-selected'
const ERASING_CLASS = 'lively-toolbelt-erasing'
const STYLE_ID = 'lively-toolbelt-select-style'

// Corner handles only: brush width is a scalar, so a non-uniformly scaled stroke could
// not be re-derived from points + brush. Uniform scale about the opposite corner.
export const HANDLES = ['topLeft', 'topRight', 'bottomRight', 'bottomLeft']
export const OPPOSITE = {
  topLeft: 'bottomRight', topRight: 'bottomLeft',
  bottomRight: 'topLeft', bottomLeft: 'topRight',
}

// Marquee shapes offered by the toolbelt's #more-select menu, mirroring BRUSH_PRESETS.
// FontAwesome 4.7 has no lasso glyph; fa-circle-o-notch reads as an open loop and
// fa-object-group is literally a marquee. Swap freely — only the icon is cosmetic.
export const SELECT_SHAPES = {
  lasso: { icon: 'fa-circle-o-notch' },
  rectangle: { icon: 'fa-object-group' },
}

function svgEl(tag, attrs = {}) {
  const el = document.createElementNS(SVGNS, tag)
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v)
  return el
}

// vector-effect keeps the ants and handle borders crisp under world zoom.
//
// The rules are REWRITTEN every time, not just created when missing: bailing out on
// "element already exists" means every later edit to this CSS is silently ignored for
// the life of the page, which under module reloading is the normal case. (That is how
// the inferred-lasso rule went missing — its <line> fell back to stroke:none and was
// invisible while every other check said it was being rendered.)
function ensureStyle() {
  let style = document.getElementById(STYLE_ID)
  if (!style) {
    style = document.createElement('style')
    style.id = STYLE_ID
    document.head.appendChild(style)
  }
  style.textContent = `
    @keyframes lively-toolbelt-ants { to { stroke-dashoffset: -12; } }
    .lively-toolbelt-ants {
      fill: none;
      stroke: ${ACCENT};
      stroke-width: 1.5;
      stroke-dasharray: 6 6;
      vector-effect: non-scaling-stroke;
      animation: lively-toolbelt-ants .5s linear infinite;
    }
    /* The segment the lasso closes for you: same crawl, muted, so it reads as implied
       rather than drawn. */
    .lively-toolbelt-ants-inferred {
      fill: none;
      stroke: #999;
      stroke-width: 1.5;
      stroke-dasharray: 4 5;
      vector-effect: non-scaling-stroke;
      animation: lively-toolbelt-ants .5s linear infinite;
    }
    .lively-toolbelt-origin {
      fill: white;
      stroke: ${ACCENT};
      stroke-width: 2;
      vector-effect: non-scaling-stroke;
    }
    .lively-toolbelt-handle {
      fill: white;
      stroke: ${ACCENT};
      stroke-width: 1.5;
      vector-effect: non-scaling-stroke;
    }
    /* Area of effect, not a hairline: you need to see how much a sweep will take. */
    .lively-toolbelt-eraser-cursor {
      fill: rgba(120, 120, 120, .18);
      stroke: #555;
      stroke-width: 1.5;
      vector-effect: non-scaling-stroke;
    }
    path.${SELECTED_CLASS} { fill: ${ACCENT}; }
    rect.${SELECTED_CLASS}, line.${SELECTED_CLASS} { stroke: ${ACCENT}; }
    /* A stroke the eraser would remove: greyed while the survivors are drawn bright
       on top, so what stays vs. what goes is legible before you release. */
    .${ERASING_CLASS} { opacity: .22; }
  `
}

// A shape's world-space outline. Falls back to the element's bbox for pre-P6 strokes
// restored without data-points: they stay selectable and deletable, just not splittable.
export function worldOutline(shape) {
  const poly = hitPolyline(shape)
  if (poly) return poly
  const bb = shape.el.getBBox()
  const f = (shape.cluster && shape.cluster.frame) || { x: 0, y: 0 }
  const r = rect(pt(bb.x + f.x, bb.y + f.y), pt(bb.x + bb.width + f.x, bb.y + bb.height + f.y))
  return [r.topLeft(), r.topRight(), r.bottomRight(), r.bottomLeft(), r.topLeft()]
}

// Half the visible thickness of a shape: freeform strokes are as wide as their brush,
// rect/arrow as wide as their stroke-width.
function halfWidthOf(shape) {
  const w = shape.type === 'freeform'
    ? (shape.brush && shape.brush.size) || 10
    : shape.strokeWidth || 2.5
  return w / 2
}

// Intersect semantics (touching selects), matching Illustrator/Figma marquees.
// `region` is { rect } or { polygon }. Bbox-prefiltered — a dense lasso against a dense
// stroke is O(|lasso| x |stroke|), which is fine once per gesture but not worth paying
// for shapes that obviously can't match.
export function pickShapes(shapes, region) {
  const regionBounds = region.rect || boundsOf(region.polygon)
  if (!regionBounds) return []
  return shapes.filter(shape => {
    const outline = worldOutline(shape)
    const b = boundsOf(outline)
    if (!b || !rectsOverlap(b, regionBounds)) return false
    return region.rect
      ? polylineIntersectsRect(outline, region.rect)
      : polylineIntersectsPolygon(outline, region.polygon)
  })
}

// Extra slack beyond a stroke's own half-width when clicking it, so hitting a thin
// line doesn't demand pixel precision.
export const CLICK_TOLERANCE = 6

// The single stroke under a point, or null. Nearest wins, which for overlapping
// strokes is what you mean when you click a specific one.
export function pickShapeAt(shapes, worldPt) {
  let best = null, bestDist = Infinity
  for (const shape of shapes) {
    const outline = worldOutline(shape)
    const b = boundsOf(outline)
    const reach = halfWidthOf(shape) + CLICK_TOLERANCE
    if (!b || !rectsOverlap(b.expandBy(reach), rect(worldPt, worldPt))) continue
    const d = distPointToPolyline(worldPt, outline)
    if (d <= reach && d < bestDist) { best = shape; bestDist = d }
  }
  return best
}

export default class Selection {
  constructor() {
    ensureStyle()
    document.querySelectorAll('#lively-toolbelt-select').forEach(el => el.remove())
    // A predecessor selection cannot untint its shapes once its controller has been
    // dropped (migration, module reload, F5 mid-selection), so the class would linger
    // on those elements — visibly, and into anything persisted. Sweep it document-wide.
    document.querySelectorAll('.' + SELECTED_CLASS)
      .forEach(el => el.classList.remove(SELECTED_CLASS))
    // A predecessor could also leave strokes greyed by an interrupted erase preview.
    document.querySelectorAll('.' + ERASING_CLASS)
      .forEach(el => el.classList.remove(ERASING_CLASS))
    this.shapes = []
    // World-space rect of each thing currently drawn; their union sizes the viewport.
    this.parts = { marquee: null, chrome: null, eraser: null, erasePreview: null }
    this.overlay = this.createOverlay()
    document.body.appendChild(this.overlay)
  }

  /*MD ## Viewport MD*/
  // An outer <svg> CLIPS everything outside its viewport — `overflow: visible` does
  // not save you, and a 0x0 svg therefore paints nothing at all. That is exactly what
  // happens here by default: Lively's world `body` is a 0x0 absolutely-positioned
  // element, so `width: 100%` resolves to zero too.
  //
  // So the overlay is sized to whatever it currently draws, and given a viewBox equal
  // to that same WORLD rect. The viewBox makes world coordinates land correctly inside
  // the viewport at 1:1 scale, so everything else can keep drawing in world space.
  setPart(name, rect) {
    this.parts[name] = rect
    this.fitViewport()
  }

  fitViewport() {
    const rects = Object.values(this.parts).filter(Boolean)
    const s = this.overlay.style
    if (!rects.length) {
      s.width = '0px'; s.height = '0px'
      return
    }
    const u = rects.reduce((a, r) => a.union(r)).expandBy(VIEWPORT_PAD)
    s.left = `${u.x}px`; s.top = `${u.y}px`
    s.width = `${u.width}px`; s.height = `${u.height}px`
    this.overlay.setAttribute('viewBox', `${u.x} ${u.y} ${u.width} ${u.height}`)
  }

  createOverlay() {
    const svg = svgEl('svg', { id: 'lively-toolbelt-select' })
    // Size is set per render by fitViewport — see the note there. Starting at 0x0 is
    // correct: nothing is shown yet.
    Object.assign(svg.style, {
      position: 'absolute', left: '0', top: '0', width: '0', height: '0',
      overflow: 'visible', pointerEvents: 'none', zIndex: '1000',
    })
    // Assign before the hide* calls below: they route through fitViewport, which
    // needs this.overlay.
    this.overlay = svg
    // Survivor strokes for the erase preview; below the marquee/handles so ant lines and
    // grips stay on top, above nothing else it needs to occlude.
    this.eraseLayer = svgEl('g')
    this.marqueeEl = svgEl('path', { class: 'lively-toolbelt-ants' })
    // The lasso's auto-closing segment is inferred, not drawn by you, so it is styled
    // apart from the part you actually traced.
    this.closeEl = svgEl('line', { class: 'lively-toolbelt-ants-inferred' })
    this.originEl = svgEl('circle', { class: 'lively-toolbelt-origin', r: 4 })
    this.boundsEl = svgEl('rect', { class: 'lively-toolbelt-ants' })
    this.eraserEl = svgEl('circle', { class: 'lively-toolbelt-eraser-cursor' })
    this.handleEls = HANDLES.map(name => svgEl('rect', { class: 'lively-toolbelt-handle', 'data-handle': name }))
    svg.append(this.eraseLayer, this.marqueeEl, this.closeEl, this.boundsEl, ...this.handleEls, this.originEl, this.eraserEl)
    this.hide(this.marqueeEl)
    this.hide(this.closeEl)
    this.hide(this.originEl)
    this.hideChrome()
    this.hide(this.eraserEl)
    return svg
  }

  hide(el) { el.style.display = 'none' }
  show(el) { el.style.display = '' }

  /*MD ## Selection state MD*/
  get isEmpty() { return this.shapes.length === 0 }

  set(shapes) {
    this.setPreview(shapes)
    this.refresh()
  }

  // Tint only, no box or handles. Used while a marquee is still being dragged: you want
  // to see WHICH strokes you are about to take, without a bounding box fighting the
  // marquee for attention.
  setPreview(shapes) {
    this.untint()
    this.shapes = [...new Set(shapes)]
    this.tint()
  }

  // Drop shapes that no longer exist (erased, undone, or split into fragments).
  prune(isAlive) {
    const alive = this.shapes.filter(isAlive)
    if (alive.length !== this.shapes.length) this.set(alive)
  }

  clear() {
    this.untint()
    this.shapes = []
    this.hideChrome()
  }

  tint() { for (const s of this.shapes) s.el.classList.add(SELECTED_CLASS) }
  untint() { for (const s of this.shapes) s.el.classList.remove(SELECTED_CLASS) }

  /*MD ## Geometry MD*/
  // World-space bounds of the whole selection, or null when empty.
  //
  // Padded by each shape's half stroke width, so the box surrounds what you SEE
  // rather than the centerline. That also keeps the box grabbable for a perfectly
  // straight stroke, whose centerline bounds would otherwise be zero-height and
  // impossible to hit.
  bounds() {
    if (this.isEmpty) return null
    return this.shapes
      .map(s => boundsOf(worldOutline(s)).expandBy(halfWidthOf(s)))
      .reduce((a, r) => a.union(r))
  }

  containsPoint(worldPt) {
    const b = this.bounds()
    return !!b && b.containsPoint(worldPt)
  }

  // Which corner handle is under the pointer, if any. Rectangle.partNameNear does the
  // work: hit testing, naming and rendering all come from the same rect.
  handleAt(worldPt) {
    const b = this.bounds()
    return b ? b.partNameNear(HANDLES, worldPt, HANDLE_HIT) : null
  }

  anchorFor(handle) {
    const b = this.bounds()
    return b ? b.partNamed(OPPOSITE[handle]) : null
  }

  /*MD ## Rendering MD*/
  refresh() {
    const b = this.bounds()
    if (!b) return this.hideChrome()
    this.renderChromeAt(b)
  }

  // Draw the box + handles at an explicit world rect. During a move/resize the shapes'
  // points have not changed yet (only an element transform previews it), so the chrome
  // has to be driven from the transformed rect or it would sit at the old position
  // until pointerup.
  renderChromeAt(b) {
    this.setPart('chrome', b)
    this.show(this.boundsEl)
    this.boundsEl.setAttribute('x', b.x)
    this.boundsEl.setAttribute('y', b.y)
    this.boundsEl.setAttribute('width', b.width)
    this.boundsEl.setAttribute('height', b.height)
    for (const el of this.handleEls) {
      const p = b.partNamed(el.getAttribute('data-handle'))
      this.show(el)
      el.setAttribute('x', p.x - HANDLE_SIZE / 2)
      el.setAttribute('y', p.y - HANDLE_SIZE / 2)
      el.setAttribute('width', HANDLE_SIZE)
      el.setAttribute('height', HANDLE_SIZE)
    }
  }

  hideChrome() {
    this.hide(this.boundsEl)
    for (const el of this.handleEls) this.hide(el)
    this.setPart('chrome', null)
  }

  // In-progress marquee: one path element serves both shapes (a rect is just a closed
  // 4-point path), so the ants styling is shared.
  renderMarquee(region, origin) {
    const poly = region.rect
      ? [region.rect.topLeft(), region.rect.topRight(), region.rect.bottomRight(), region.rect.bottomLeft()]
      : region.polygon
    if (!poly || poly.length < 2) return this.clearMarquee()
    this.setPart('marquee', boundsOf(poly))
    this.show(this.marqueeEl)
    // A rect is closed by definition; a lasso's closing segment is drawn separately so
    // it can be styled as inferred.
    const open = poly.map(p => `${p.x} ${p.y}`).join(' L ')
    this.marqueeEl.setAttribute('d', `M ${open}${region.rect ? ' Z' : ''}`)
    if (region.rect) {
      this.hide(this.closeEl)
    } else {
      const first = poly[0], last = poly[poly.length - 1]
      this.show(this.closeEl)
      this.closeEl.setAttribute('x1', last.x); this.closeEl.setAttribute('y1', last.y)
      this.closeEl.setAttribute('x2', first.x); this.closeEl.setAttribute('y2', first.y)
    }
    // For a lasso the first traced point IS the origin, but a rect region has been
    // normalised to min/max corners by then, which loses which corner you started from
    // — so the caller passes the real gesture start.
    const start = origin || poly[0]
    this.show(this.originEl)
    this.originEl.setAttribute('cx', start.x)
    this.originEl.setAttribute('cy', start.y)
  }

  clearMarquee() {
    this.hide(this.marqueeEl)
    this.hide(this.closeEl)
    this.hide(this.originEl)
    this.setPart('marquee', null)
  }

  showEraserCursor(worldPt, radius) {
    this.setPart('eraser', rect(
      pt(worldPt.x - radius, worldPt.y - radius),
      pt(worldPt.x + radius, worldPt.y + radius)))
    this.show(this.eraserEl)
    this.eraserEl.setAttribute('cx', worldPt.x)
    this.eraserEl.setAttribute('cy', worldPt.y)
    this.eraserEl.setAttribute('r', radius)
  }

  hideEraserCursor() {
    this.hide(this.eraserEl)
    this.setPart('eraser', null)
  }

  /*MD ## Erase preview MD*/
  // `paths` are the surviving runs as { d, color } (world-space filled outlines), drawn
  // bright on top of the greyed originals. `bounds` is the world rect they occupy, so
  // the viewport grows to contain them (survivors can extend well past the small eraser
  // cursor rect, and an undersized viewport would clip them).
  setErasePreview(paths, bounds) {
    this.setPart('erasePreview', bounds || null)
    const layer = this.eraseLayer
    while (layer.firstChild) layer.removeChild(layer.firstChild)
    for (const { d, color } of paths) {
      layer.appendChild(svgEl('path', { d, fill: color, stroke: 'none' }))
    }
  }

  clearErasePreview() {
    this.setPart('erasePreview', null)
    const layer = this.eraseLayer
    while (layer.firstChild) layer.removeChild(layer.firstChild)
  }
}
