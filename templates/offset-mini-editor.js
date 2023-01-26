import d3 from "src/external/d3.v5.js";
import { pt, rect } from 'src/client/graphics.js';
import ComponentLoader from 'src/client/morphic/component-loader.js'

const ZOOM_SCALE_MIN = 1 / 30;
const ZOOM_SCALE_MAX = 30;
const ZOOM_SLIDER_SCALE = d3.scaleLog().domain([ZOOM_SCALE_MIN, ZOOM_SCALE_MAX]).range([ZOOM_SCALE_MIN, ZOOM_SCALE_MAX]);

import Morph from 'src/components/widgets/lively-morph.js';

export default class OffsetMiniCanvas extends Morph {

  /*MD ## Geometry MD*/

  // #important
  boundsForElement(element) {
    // lively.showElement(element)
    const zoomInner = this.zoomInner;
    let bounds = rect(pt(0, 0), lively.getExtent(element));
    let parent = element;
    // const parents = [];
    const table = [];
    do {
      // enabling this code seems to work, but only, if no further displacement happens above #zoom-inner in the shadow root of offset-mini-editor
      if (self.breakOnEditor && !lively.ancestry(parent).find(p => p.tagName === 'OFFSET-MINI-EDITOR')) {
        break;
      }

      // parents.push(parent)
      // lively.showElement(parent)
      const offsetLeft = window.offsetPolyfill.leftOriginal.apply(parent);
      const offsetTop = window.offsetPolyfill.topOriginal.apply(parent);
      bounds = bounds.translatedBy(pt(offsetLeft, offsetTop));
      // table.push({
      //   offsetLeft,
      //   offsetTop,
      //   parent
      // })

      /* #BUG: chrome bug on V102 sets offsetParent wrong in shadowroot
       * so we have to find a workaround:
       * for nodes (and everything under them), we need the livelyPosition,
       * because offsetParent points to the gs-ve-editor
       * and not to `zoomInner`
       */
      // if (parent.offsetParent && (parent.offsetParent.tagName === 'GS-VISUAL-EDITOR' || parent.offsetParent.id === 'clipboard-preview')) {
      //   bounds.translatedBy(lively.getPosition(parent));
      //   break;
      // }
    } while ((parent = window.offsetPolyfill.parentPolyfill.apply(parent)) && parent !== zoomInner);
    
    // console.table(table)
    // if (parent !== zoomInner) {
    //   lively.notify('WHAT')
    //   lively.showElement(parent)
    // } else {
    //   lively.notify('YES')
    // }
      
    // lively.openInspector(parents)
    // this.showRect(bounds);

    return bounds;
  }

  /*MD ## Life-cycle MD*/
  initialize() {
    this.windowTitle = "OffsetMiniCanvas";
    this.initializeShadowRoot();
  }

  initializeShadowRoot() {
    this.setupZoom();
  }

  /*MD ## Spawn Elements MD*/
  async spawnNode(options) {
    const node = await (<offset-mini-node></offset-mini-node>);
    await node.applyOptions(options);
    this.append(node);
    return node;
  }

  async spawnEdge() {
    const edge = await (<offset-mini-edge></offset-mini-edge>);
    this.prepend(edge);
    this.enqueueForRerender(edge);
    return edge;
  }

  /*MD ## Zoom MD*/
  get zoomOuter() {
    return this.get('#zoom-outer');
  }
  get zoomInner() {
    return this.get('#zoom-inner');
  }
  get zoomSlider() {
    return this.get('#zoom-slider');
  }
  get lastZoomTransform() {
    const json = this.getJSONAttribute('lastZoomTransform');
    if (!json) {
      return d3.zoomIdentity;
    }

    return d3.zoomIdentity.translate(json.x, json.y).scale(json.k);
  }
  set lastZoomTransform(transform) {
    if (transform) {
      const json = this.zoomTransformToJSON(transform);
      this.setJSONAttribute('lastZoomTransform', json);
    }
    return transform;
  }

  zoomTransformToJSON(transform) {
    return _.pick(transform, 'xyk'.split(''));
  }

  setupZoom() {
    this.zoom = d3.zoom().scaleExtent([ZOOM_SCALE_MIN, ZOOM_SCALE_MAX]).on("start", () => {
    }).on("zoom", () => {
      const transform = d3.event.transform;
      this.applyZoomTransform(transform);
      this.lastZoomTransform = transform;
    }).on("end", () => {
      self.__preventGlobalContextMenu__ = true;
      requestAnimationFrame(() => self.__preventGlobalContextMenu__ = false);
    });

    // zoom on right mouse button, instead of left mouse button
    const defaultFilterFunction = this.zoom.filter();
    this.zoom.filter(function (...args) {
      if (d3.event.type === "mousedown") {
        if (d3.event.button === 0) {
          return false;
        }
        if (d3.event.button === 2) {
          return true;
        }
      }
      return defaultFilterFunction.call(this, ...args);
    });

    const zoomOuter = d3.select(this.zoomOuter);
    zoomOuter.style("pointer-events", "all").call(this.zoom).on('dblclick.zoom', null);

    this.updateZoomSlider();

    // apply saved transformation
    const lastZoomTransform = this.lastZoomTransform;
    if (lastZoomTransform) {
      this.zoom.transform(zoomOuter, lastZoomTransform);
    }
  }

  applyZoomTransform(transform) {
    const zoomInner = d3.select(this.zoomInner);
    zoomInner.style("transform", `translate(${transform.x}px,${transform.y}px) scale(${transform.k})`);
    zoomInner.style("transform-origin", "0 0");

    this.updateZoomSlider();
  }

  get currentZoom() {
    return d3.zoomTransform(this.zoomOuter);
  }

  get currentZoomScale() {
    return this.currentZoom.k;
  }

  updateZoomSlider() {
    const zoomSlider = this.zoomSlider;
    zoomSlider.setAttribute('min', ZOOM_SCALE_MIN);
    zoomSlider.setAttribute('max', ZOOM_SCALE_MAX);
    zoomSlider.value = ZOOM_SLIDER_SCALE(this.currentZoomScale);
  }

  /*MD ## Rerendering MD*/
  enqueueForRerender(element) {
    requestAnimationFrame(() => element.rerender && element.rerender())
  }

  rerenderEdges() {
    this.querySelectorAll('offset-mini-edge').forEach(::this.enqueueForRerender)
  }

  /*MD ## Debug Rendering MD*/
  // methods here mirror lively.show* but for the editor's canvas

  showRect(rect) {
    const debugRect = lively.showRect(rect);
    lively.setPosition(debugRect, rect.topLeft());
    this.append(debugRect);
    return debugRect;
  }

  showPoint(point) {
    const debugPoint = lively.showPoint(point);
    lively.setPosition(debugPoint, point);
    this.append(debugPoint);
    return debugPoint;
  }

  /*MD ## Lively-specific API MD*/
  async livelyExample() {
    const n1 = await this.spawnNode({
      top: 150,
      left: 50
    });
    const n2 = await this.spawnNode({
      top: 200,
      left: 250
    });

    const outPort = n1.getPort('out');
    const inPort = n2.getPort('in');
    await outPort.connectWith(inPort);
  }

  get livelyUpdateStrategy() {
    return 'inplace';
  }

  livelyUpdate() {
    this.shadowRoot.innerHTML = "";
    ComponentLoader.applyTemplate(this, this.localName);
    this.initializeShadowRoot();
    this.rerenderEdges()

    lively.showElement(this, 300);
  }
  
}