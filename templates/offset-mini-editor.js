import d3 from "src/external/d3.v5.js";
import { pt, rect } from 'src/client/graphics.js';
import ComponentLoader from 'src/client/morphic/component-loader.js'

import { debounceFrame } from './offset-mini-utils.js';

const ZOOM_SCALE_MIN = 1 / 30;
const ZOOM_SCALE_MAX = 30;
const ZOOM_SLIDER_SCALE = d3.scaleLog().domain([ZOOM_SCALE_MIN, ZOOM_SCALE_MAX]).range([ZOOM_SCALE_MIN, ZOOM_SCALE_MAX]);

import Morph from 'src/components/widgets/lively-morph.js';

export default class GsVisualEditorCanvas extends Morph {

  /*MD ## Life-cycle MD*/
  initialize() {
    this.windowTitle = "GsVisualEditorCanvas";

    this.initializeShadowRoot();
  }

  initializeShadowRoot() {
    this.registerButtons();
    this.setupZoom();
  }

  /*MD ## Spawn Elements MD*/
  async spawnNode(options) {
    const node = await (<offset-mini-node></offset-mini-node>);
    await node.applyOptions(options);
    this.append(node);
    node.positionChangeObservers; // #TODO, #HACK: force-enable Mutation Observer
    return node;
  }

  async spawnEdge(options) {
    const edge = await (<offset-mini-edge></offset-mini-edge>);
    edge.applyOptions(options);
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

  onResetZoom() {
    this.animateZoomTo(d3.zoomIdentity);
  }

  animateZoomTo(zoom, duration = 750) {
    const zoomOuter = d3.select(this.zoomOuter);
    if (duration === 0) {
      this.zoom.transform(zoomOuter, zoom);
    } else {
      this.zoom.transform(zoomOuter.transition().duration(duration), zoom);
    }
  }

  /*MD ## Geometry MD*/

  // #important
  boundsForElement(element) {
    // lively.showElement(element)
    const zoomInner = this.zoomInner;
    let bounds = rect(pt(0, 0), lively.getExtent(element));
    let parent = element;
    // const parents = [];
    do {
      // parents.push(parent)
      // lively.showElement(parent)
      bounds = bounds.translatedBy(pt(parent.offsetLeft, parent.offsetTop));

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
    } while ((parent = parent.offsetParent) && parent !== zoomInner);
    // lively.openInspector(parents)
    // this.showRect(bounds);

    return bounds;
  }

  localPointToGlobal(point) {
    const [globalX, globalY] = this.currentZoom.apply([point.x, point.y]);
    return lively.getGlobalPosition(this).addPt(pt(globalX, globalY));
  }

  globalPointToLocal(point) {
    const relativePt = point.subPt(lively.getGlobalPosition(this));
    const [localX, localY] = this.currentZoom.invert([relativePt.x, relativePt.y]);
    return pt(localX, localY);
  }

  globalRectToLocal(rect) {
    const topLeft = this.globalPointToLocal(rect.topLeft());
    const bottomRight = this.globalPointToLocal(rect.bottomRight());
    return lively.rect(topLeft, bottomRight);
  }

  localPointForEvent(evt) {
    const globalPt = pt(evt.clientX, evt.clientY);
    return this.globalPointToLocal(globalPt);
  }

  myGlobalBounds() {
    return lively.getGlobalBounds(this.get('#zoom-outer'));
  }

  /*MD ## Messaging MD*/
//   notify(msg) {
//     lively.notify(msg, 'gs-ve-canvas');
//   }

//   warn(msg) {
//     lively.warn(msg, 'gs-ve-canvas');
//   }

//   error(msg) {
//     lively.error(msg, 'gs-ve-canvas');
//   }

  /*MD ## Rerendering MD*/
  // #TODO: maybe we should extract rerendering from the editor
  get elementsToRerender() {
    return this._elementsToRerender = this._elementsToRerender || new Set();
  }
  set elementsToRerender(value) {
    return this._elementsToRerender = value;
  }

  enqueueForRerender(element) {
    // lively.notify('debounce');
    this.elementsToRerender.add(element);
    // lively.nextFrame
    this::debounceFrame('rerender', () => this.rerenderChangedElements());
  }

  rerenderChangedElements() {
    // lively.notify('rerender');
    const changedElements = this.elementsToRerender;
    this.elementsToRerender = new Set();
    this.rerenderElements(changedElements);
  }

  // #TODO: proper rerender scheme:
  // - go up starting at most-nested components
  // - edges and other dependent elements
  rerenderElements(elements) {
    elements = [...elements];
    elements.reverse();
    elements.forEach(element => element.rerender && element.rerender());
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
  
  $append(...elements) {
    this.append(...elements)
  }

  /*MD ## Lively-specific API MD*/

  livelyPrepareSave() {}
  livelyPreMigrate() {}
  livelyMigrate(other) {}
  livelyInspect(contentNode, inspector) {}

  async livelyExample() {
    const n1 = await this.spawnNode({
      type: 'simple',
      top: 150,
      left: 50
    });
    const n2 = await this.spawnNode({
      type: 'simple',
      top: 150,
      left: 200
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
    [...this.querySelectorAll('offset-mini-edge')].forEach(::this.enqueueForRerender)

    lively.showElement(this, 300);
  }

}