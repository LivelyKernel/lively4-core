import d3 from "src/external/d3.v5.js";
import { pt, rect } from 'src/client/graphics.js';

import MousePosition from 'src/client/mouse-position.js';

import { getEditor, debounceFrame } from './offset-mini-utils.js';

const ZOOM_SCALE_MIN = 1 / 30;
const ZOOM_SCALE_MAX = 30;
const ZOOM_SLIDER_SCALE = d3.scaleLog().domain([ZOOM_SCALE_MIN, ZOOM_SCALE_MAX]).range([ZOOM_SCALE_MIN, ZOOM_SCALE_MAX]);

function paperRectToLively(rect) {
  return lively.rect(rect.x, rect.y, rect.width, rect.height);
}

import Morph from 'src/components/widgets/lively-morph.js';

export default class GsVisualEditorCanvas extends Morph {

  get _editor() {
    return getEditor(this);
  }

  get programFileNameInput() {
    return this.get('#program-file-name');
  }

  get programFileName() {
    return this.getAttribute('program-file-name');
  }

  set programFileName(value) {
    return this.setAttribute('program-file-name', value);
  }

  /*MD ## Life-cycle MD*/
  initialize() {
    this.windowTitle = "GsVisualEditorCanvas";

    this.initializeShadowRoot();
  }

  initializeShadowRoot() {
    this.registerButtons();
    this.setupContextMenu();
    this.setupZoom();
  }

  /*MD ## Tags MD*/
  get isPlain() {
    return this.getAttribute('plain-canvas');
  }

  set isPlain(value) {
    return this.setAttribute('plain-canvas', value);
  }

  /*MD ## Navigating Elements MD*/
  myWindow() {
    return lively.findParent(this, e => e.localName === 'lively-window');
  }

  getTopLevelElements() {
    return [...this.querySelectorAll(':scope > *')];
  }

  /*MD ## Spawn Elements MD*/
  async spawnNode(options) {
    debugger
    const node = await (<offset-mini-node></offset-mini-node>);
    debugger
    await node.applyOptions(options);
    this.addNode(node);
    node.positionChangeObservers; // #TODO, #HACK: force-enable Mutation Observer
    return node;
  }

  addNode(node) {
    this.$append(node);
  }

  async spawnEdge(options) {
    const edge = await (<offset-mini-edge></offset-mini-edge>);
    edge.applyOptions(options);
    this.addEdge(edge);
    this.enqueueForRerender(edge);
    return edge;
  }

  addEdge(edge) {
    this.prepend(edge);
  }

  reviveElementsInto(data) {
    const div = document.createElement("div");
    div.innerHTML = data;
    // #TODO: initOnRevive

    {
      const all = Array.from(div.querySelectorAll("*"));
      lively.clipboard.initializeElements(all);
    }

    // paste oriented at a shared topLeft
    // somehow zIndex gets lost...
    // var zIndexMap = new Map()
    // topLevel.forEach(ea => {
    //    zIndexMap.set(ea, ea.style.zIndex)
    // })

    // topLevel.forEach(ea => div.appendChild(ea))
    // var offset = (pos || pt(0,0)).subPt(this.getTopLeft(topLevel))

    let topLevel = Array.from(div.querySelectorAll(":scope > *"));
    {
      /* cleanup orphaned edges */
      const orphans = topLevel.filter(element => element.isOrphaned && element.isOrphaned());

      /* remove from `div` */
      orphans.forEach(orphan => orphan.remove());
      topLevel = _.difference(topLevel, orphans);
    }

    topLevel.forEach(child => {
      // do we need to restore proper ordering?
      if (child.tagName === 'GS-VISUAL-EDITOR-EDGE') {
        this.$prepend(child);
      } else {
        this.$append(child);
      }
      this.enqueueForRerender(child);
    });

    return topLevel;
  }

  // best call this when already in the right parent (important for example for edges as they refer to other nodes)
  ensureInitializedAndRendered(elements) {
    this.initialize();
    elements.forEach(element => element.initialize());
    this.rerenderElements(elements);
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
    // https://github.com/d3/d3-zoom
    let isContextMenuing = false;

    this.zoom = d3.zoom().scaleExtent([ZOOM_SCALE_MIN, ZOOM_SCALE_MAX]).on("start", () => {
      // lively.warn('start', d3.event && d3.event.sourceEvent && d3.event.sourceEvent.type);
      isContextMenuing = true;
    }).on("zoom", () => {
      lively.warn('zoom', d3.event && d3.event.sourceEvent && d3.event.sourceEvent.type);
      isContextMenuing = false;

      const transform = d3.event.transform;

      this.applyZoomTransform(transform);
      this.lastZoomTransform = transform;
    }).on("end", () => {
      this.preventGlobalContextMenu();

      const type = d3.event && d3.event.sourceEvent && d3.event.sourceEvent.type;
      if (isContextMenuing && type === 'mouseup') {
      }
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

  zoomToBoundingBox(rect, { duration, margin = 0.1, outerMargin = 0 } = {}) {
    const bounds = this.myGlobalBounds();
    const { width: globalWidth, height: globalHeight } = bounds;

    const { width, height } = rect;
    const center = rect.center();

    const zoom = d3.zoomIdentity.translate(globalWidth / 2, globalHeight / 2).scale((1 - margin) / Math.max(width / (globalWidth - outerMargin), height / (globalHeight - outerMargin))).translate(-center.x, -center.y);

    this.animateZoomTo(zoom, duration);
  }

  zoomToElements(elements, { margin } = {}) {
    const rect = this.getBoundingBoxFor(elements);
    this.zoomToBoundingBox(rect, { margin });
  }

  /*MD ## Edge Update Preview MD*/
  updatePortToConnectTo(mousePoint, lastMousePoint) {
    this.portToConnectTo = this.getPortToConnectTo(mousePoint, lastMousePoint);
  }

  updateConnectionPreview(mousePoint) {
    if (this.portToConnectTo) {
      this.previewConnectionTo(this.portToConnectTo, mousePoint);
    } else {
      this.edge.classList.remove('show-connection-preview');
    }
  }

  getPortToConnectTo(mousePoint, lastMousePoint) {
    const canvas = this.canvas;
    const edge = this.edge;
    const ports = [...canvas.querySelectorAll('offset-mini-port')];

    /* #TODO: canvas has no extend right now, so we need `parentElement` */
    const canvasRect = lively.getGlobalBounds(canvas.parentElement);
    const relevantPorts = ports.filter(port => {
      return port.getAttribute('type') === this.port.getAttribute('type');
    }).filter(port => {
      const dir = port.direction;
      return ['in', 'out'].includes(dir) && dir !== this.port.direction;
    }).filter(port => {
      return canvasRect.intersects(lively.getGlobalBounds(port));
    });

    // relevantPorts.forEach(port => {
    //   lively.showRect(lively.getGlobalBounds(port));
    // });

    /* #TODO: useful extent */
    const voronoi = d3.voronoi().extent([[-10000, -10000], [10000, 10000]]);
    const voronoiDiagram = voronoi(relevantPorts.map(port => {
      const { x, y } = port.getAnchorPoint().pos;
      return [x, y, port];
    }));
    const match = voronoiDiagram.find(mousePoint.x, mousePoint.y);
    if (match) {
      const { data: [x, y, port] } = match;
      const portPoint = pt(x, y);

      let angle;
      {
        const dirToPort = portPoint.subPt(mousePoint);
        const movement = mousePoint.subPt(lastMousePoint);
        angle = dirToPort.angleToVec(movement);
        if (isNaN(angle)) {
          angle = Math.PI / 2;
        }
      }
      // movement towards port increases likelyhood
      // #TODO: maybe use weighted voronoi diagram instead -> https://github.com/Kcnarf/d3-weighted-voronoi
      const maximumDistance = angle.remap([0, Math.PI], [250, 50], true);

      /* max radius */
      if (mousePoint.dist(portPoint) < maximumDistance) {

        let dir = mousePoint.subPt(portPoint);
        if (this.port.direction === 'in') {
          dir = dir.negated();
        }
        const angle = dir.theta();

        const minAngle = 0.3;
        // am I behind the port?
        if (angle > minAngle || angle < -minAngle) {
          return port;
        }
      }
    }

    return;
  }

  previewConnectionTo(port, mousePoint) {
    const edge = this.edge;
    edge.classList.add('show-connection-preview');

    const circle = edge.get('#connection-preview circle');
    circle.setAttribute('cx', mousePoint.x);
    circle.setAttribute('cy', mousePoint.y);

    const { x, y } = port.getAnchorPoint().pos;
    const line = edge.get('#connection-preview line');
    line.setAttribute('x1', mousePoint.x);
    line.setAttribute('y1', mousePoint.y);
    line.setAttribute('x2', x);
    line.setAttribute('y2', y);
  }

  /*MD ## Geometry MD*/

  // #TODO: boundsForElement uses offsetParent, getBoundingBoxFor uses getCollisionShape -> remove one?
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

  getBoundingBoxFor(elements) {
    function getBoundsFor(element) {
      const bounds = element.getCollisionShape().bounds;

      return paperRectToLively(bounds);
    }

    return elements.map(getBoundsFor).reduce((previous, current) => previous.union(current));
  }

  myGlobalBounds() {
    return lively.getGlobalBounds(this.get('#zoom-outer'));
  }

  getCameraRect() {
    const outerBounds = this.myGlobalBounds();
    const inset = outerBounds.extent().scaleBy(0.0);
    return this.globalRectToLocal(outerBounds.insetByPt(inset));
  }

  /*MD ## Right-click to get create-components menu MD*/
  setupContextMenu() {
    const zoomOuter = this.zoomOuter;
    zoomOuter.addEventListener('click', evt => this.onClick(evt));
    zoomOuter.addEventListener('mouseup', evt => this.onMouseUp(evt));
    zoomOuter.addEventListener('contextmenu', evt => this.preventContextMenu(evt));
  }

  onClick() {
    lively.notify('click canvas');
  }

  onMouseUp(evt) {
    // lively.notify('onMouseUp')
    evt.stopPropagation();
    evt.preventDefault();
  }

  preventContextMenu(evt) {
    // lively.notify('prevent lively contextmenu')
    evt.stopPropagation();
    evt.preventDefault();
  }

  preventGlobalContextMenu() {
    self.__preventGlobalContextMenu__ = true;
    requestAnimationFrame(() => self.__preventGlobalContextMenu__ = false);
  }

  onContextMenu(evt) {

  }

  /*MD ## Event Handling MD*/

  onDblClick() {
    this.animate([{ backgroundColor: "lightgray" }, { backgroundColor: "red" }, { backgroundColor: "lightgray" }], {
      duration: 1000
    });
  }

  // #important
  onKeyDown(evt) {
    if (evt.path.first === this.programFileNameInput) {
      return;
    }

    const digit = evt.code.match(/^Digit([0-9])$/);
    if (digit && !evt.repeat && !evt.shift && !evt.alt && !evt.meta) {
      const number = parseInt(digit[1]);
      const cameraAttribute = 'camera' + number;
      const isAllCamera = number === 0;
      const isSelectionCamera = number === 9;
      const isResetCamera = number === 8;
      evt.stopPropagation();

      if (evt.ctrlKey) {
        evt.preventDefault();
        if (isAllCamera) {
          this.warn('cannot overwrite `all` camera');
        } else if (isSelectionCamera) {
          this.warn('cannot overwrite `selection` camera');
        } else if (isResetCamera) {
          this.warn('cannot overwrite `reset` camera');
        } else {
          this.notify('saved camera ' + number);
          const json = this.zoomTransformToJSON(this.currentZoom);
          this.setJSONAttribute(cameraAttribute, json);
        }
      } else {
        if (isAllCamera) {
          const topLevel = this.getTopLevelElements();
          if (topLevel.length > 0) {
            this.zoomToElements(topLevel);
          } else {
            this.onResetZoom();
          }
        } else if (isSelectionCamera) {
          const selection = this.getSelection();
          if (selection.length > 0) {
            this.zoomToElements(selection);
          } else {
            this.warn('cannot zoom: no elements selected');
          }
        } else if (isResetCamera) {
          this.onResetZoom();
        } else {
          if (this.hasAttribute(cameraAttribute)) {
            const json = this.getJSONAttribute(cameraAttribute);
            this.animateZoomTo(d3.zoomIdentity.translate(json.x, json.y).scale(json.k));
          } else {
            this.warn('cannot restore camera ' + number);
          }
        }
      }
      return;
    }

    if (evt.code === 'Space') {
      this.spawnNodeMenu();
      evt.preventDefault();
      evt.stopPropagation();
      return;
    }

    if (['KeyK', 'Backspace', 'Delete'].includes(evt.code)) {
      this.killSelection();
      evt.preventDefault();
      evt.stopPropagation();
      return;
    }
    if (evt.code === 'KeyZ') {
      this.undo();
      evt.preventDefault();
      evt.stopPropagation();
      return;
    }
    if (evt.code === 'KeyY') {
      this.redo();
      evt.preventDefault();
      evt.stopPropagation();
      return;
    }
    if (evt.code === 'KeyP') {
      this.printPortResult(evt);
      evt.preventDefault();
      evt.stopPropagation();
      return;
    }
    if (evt.code === 'KeyB') {
      this.showBoundingBoxOfSelection(evt);
      evt.preventDefault();
      evt.stopPropagation();
      return;
    }

    lively.notify(`Key Down, key: ${evt.key}, code: ${evt.code}`, "canvas");
  }

  onKeyUp(evt) {
    lively.notify("C::Key Up!" + evt.charCode, 'canvas');
  }

  /*MD ## User Interactions MD*/
  async spawnNodeMenu() {
    const pt = this.globalPointToLocal(MousePosition.pt);
    const menu = await gs.openComponentInWindow('offset-mini-add-node-menu');
    const closeMenu = () => {
      menu.closeYourself();
      this.focusYourself();
    };
    let previewNode;
    const removePreviewNode = () => {
      if (previewNode) {
        previewNode.$remove();
      }
    };
    const createNode = type => {
      const node = this.spawnNode({
        type,
        // left - center - right
        // top - middle - bottom

        // #TODO: spawn at desired location
        top: pt.y,
        left: pt.x
      });
      this.setSelection([node]);
      return node;
    };
    menu.applyOptions({
      onCancel: () => {
        closeMenu();
      },
      onSelect: (desc, type) => {
        removePreviewNode();
        previewNode = createNode(type);
      },
      onPick: (desc, type) => {
        closeMenu();
        removePreviewNode();
        createNode(type);
      }
    });
    menu.focusFilter();
  }

  killSelection() {
    var selection = this.getSelection();
    var groups = selection.groupBy(element => element.constructor.name);
    let edges;
    let nodes;
    let others;
    for (let [key, elements] of Object.entries(groups)) {
      if (key === 'offset-mini-edge') {
        edges = elements;
      } else if (key === 'offset-mini-node') {
        nodes = elements;
      } else {
        lively.warn('unknown element to kill in selection: ' + key);
      }
    }

    if (edges) {
      edges.forEach(edge => this.killEdge(edge));
    }

    if (nodes) {
      nodes.forEach(node => this.killNode(node));
    }

    this.focusYourself
    // const {
    //   ['']: edges, ['offset-mini-edges']: edgess } = groups
    ();
  }

  focusYourself() {
    const myWindow = this.myWindow();
    if (myWindow) {
      lively.focusWithoutScroll(myWindow);
    }
    lively.focusWithoutScroll(this);
  }

  killEdge(edge) {
    // #TODO: align terminology for removal with ports
    edge.removeFromCanvas();
  }

  killNode(node) {
    node.removeFromCanvas();
  }

  async printPortResult(evt) {
    // const hoveredElements = MousePosition.elementsFromPoint(MousePosition.pt);

    const hoveredPort = this.querySelector('offset-mini-port:hover');
    if (!hoveredPort) {
      return;
    }
    if (hoveredPort.direction !== 'out') {
      return;
    }
    if (hoveredPort.getType() !== 'data') {
      return;
    }

    lively.showElement(hoveredPort);
    const interpreter = new self.GSInterpreter();
    const { result, error } = await interpreter.printItPortResult(hoveredPort);

    if (error) {
      lively.error(result, 'print it: port error');
    } else {
      lively.success(result, 'print it: result');
    }
  }

  showBoundingBoxOfSelection(evt) {
    const selection = this.getSelection();
    if (selection.length === 0) {
      return;
    }

    const boundingBox = this.getBoundingBox(selection);
    this.showRect(boundingBox);
  }

  /*MD ## Undo History MD*/
  do(command) {
    return self.editorHistory.do(command);
  }

  undo() {
    self.editorHistory.undo();
  }

  redo() {
    self.editorHistory.redo();
  }

  /*MD ## Selections MD*/
  _updateSelectionTo(newElements) {
    const oldElements = this.getAllSubmorphs('.selected');
    const [onlyNew,, onlyOld] = newElements.computeDiff(oldElements);
    onlyOld.forEach(e => e.classList.remove('selected'));
    onlyNew.forEach(e => e.classList.add('selected'));
  }

  setSelection(elements) {
    this._updateSelectionTo(elements);
  }

  getSelection() {
    return this.getAllSubmorphs('.selected');
  }

  /*MD ## Messaging MD*/
  notify(msg) {
    lively.notify(msg, 'gs-ve-canvas');
  }

  warn(msg) {
    lively.warn(msg, 'gs-ve-canvas');
  }

  error(msg) {
    lively.error(msg, 'gs-ve-canvas');
  }

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
    debugger
        const n1 = await this.spawnNode({
      type: 'simple',
      top: 250,
      left: 100
    });
        const n2 = await this.spawnNode({
      type: 'simple',
      top: 250,
      left: 500
    });

    const outPort = n1.getPort('out');
    const inPort = n2.getPort('in');
    await outPort.connectWith(inPort);
  }

  livelyUpdate() {
    super.livelyUpdate();
  }

}