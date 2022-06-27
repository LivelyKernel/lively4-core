import SVG from "src/client/svg.js";
import { pt, Point, rect } from 'src/client/graphics.js';
import { debounce } from "utils";
import ComponentLoader from 'src/client/morphic/component-loader.js'

import { getEditor, elementByID } from './offset-mini-utils.js';

import Morph from 'src/components/widgets/lively-morph.js';

export default class GsVisualEditorEdge extends Morph {

  /*MD ## Life-cycle MD*/
  initialize() {
    this.initializeShadowRoot();
  }

  initializeShadowRoot() {
    this.resetBoundsDelay = () => this.resetBounds()::debounce(500);

    this.connect(this.getFromElement(), this.getToElement());

    this.withAttributeDo("stroke", color => this.stroke = color);
    this.withAttributeDo("stroke-width", width => this.strokeWidth = width);
  }
  
  applyOptions(options) {}
  
  /*MD ## Accessors MD*/
  get _editor() {
    return getEditor(this);
  }

  get _canvas() {
    return getEditor(this);
  }

  get fromElementID() {
    return this.getAttribute("fromElement");
  }
  set fromElementID(id) {
    return this.setAttribute("fromElement", id);
  }
  get toElementID() {
    return this.getAttribute("toElement");
  }
  set toElementID(id) {
    return this.setAttribute("toElement", id);
  }

  getFromElement() {
    return elementByID(this.fromElementID, this._canvas);
  }
  getToElement() {
    return elementByID(this.toElementID, this._canvas);
  }

  get stroke() {
    return this.getPath().getAttribute("stroke");
  }

  set stroke(c) {
    this.setAttribute("stroke", c);
    return this.shadowRoot.querySelectorAll("path").forEach(ea => ea.setAttribute("stroke", c));
  }

  get strokeWidth() {
    return this.getPath().getAttribute("stroke-width");
  }

  set strokeWidth(w) {
    this.setAttribute("stroke-width", w);
    return this.getPath().setAttribute("stroke-width", w);
  }

  indicateError() {
    this.style.backgroundColor = "red";
    this.style.minWidth = "50px";
    this.style.minHeight = "50px";
  }

  get path() {
    return this.get("path#path");
  }

  get interactHelper() {
    return this.get("path#interact-helper");
  }

  /*MD ## Rendering MD*/
  updateConnector() {
    const offset = lively.getPosition(this);

    const fromElement = this.getFromElement() || pt(0, 0);
    const toElement = this.getToElement() || pt(0, 0);

    const anchorFor = (port, hasArrowHead, other) => {
      if (port instanceof Point) {
        return { point: port, control: port };
      }
      const { pos, dir } = port.getAnchorPoint(hasArrowHead, other);
      const point = pos.subPt(offset);
      const controlPoint = point.addPt(dir);
      return { point: point, control: controlPoint };
    };

    const { point: start, control: controlStart } = anchorFor(fromElement, false, toElement);
    const { point: end, control: controlEnd } = anchorFor(toElement, true, fromElement);

    this.setPathData(`M ${start.x},${start.y} C ${controlStart.x},${controlStart.y} ${controlEnd.x},${controlEnd.y} ${end.x},${end.y}`);
    this.renderConnectionPreview();
  }

  observePositionChange(subject, subjectName) {
    if (!subject) {
      return;
    }
    if (this[subjectName]) {
      this[subjectName].removePositionChangeObserver(this);
    }
    this[subjectName] = subject;
    subject.addPositionChangeObserver(this);
  }

  anchorChanged() {
    lively.notify('anchorChanged');
    this._canvas.enqueueForRerender(this);
  }

  removeFromCanvas() {
    const fromElement = this.getFromElement();
    const toElement = this.getToElement();

    if (fromElement) {
      this.disconnectFromElement();
    }
    if (toElement) {
      this.disconnectToElement();
    }

    this.remove()
  }

  rerender() {
    this.updateConnector();
  }

  connect(a, b) {
    this.connectFrom(a);
    this.connectTo(b);
  }

  connectElement(end, element) {
    this.$connectElement(end, element)
  }
  $connectElement(end, element) {
    if (end === 'from') {
      this.connectFrom(element);
    } else {
      this.connectTo(element);
    }
  }


  connectFrom(a) {
    if (!a) {
      return;
    }
    this.fromElementID = lively.ensureID(a);

    this.observePositionChange(a, "fromObjectSubject");
    this._canvas.enqueueForRerender(this);
  }

  connectTo(b) {
    if (!b) {
      return;
    }
    this.toElementID = lively.ensureID(b);

    this.observePositionChange(b, "toObjectSubject");
    this._canvas.enqueueForRerender(this);
  }

  disconnect() {
    this.disconnectFromElement();
    this.disconnectToElement();
  }

  disconnectElement(end) {
    this.$disconnectElement(end);
  }
  $disconnectElement(end) {
    if (end === 'from') {
      this.disconnectFromElement();
    } else {
      this.disconnectToElement();
    }
  }

  disconnectFromElement() {
    if (this.fromObjectSubject) {
      this.fromObjectSubject.removePositionChangeObserver(this);
    }
    this.removeAttribute('fromElement');
  }

  disconnectToElement() {
    if (this.toObjectSubject) {
      this.toObjectSubject.removePositionChangeObserver(this);
    }
    this.removeAttribute('toElement');
  }

  /*MD ## Internal Vertices MD*/
  getPath() {
    return this.path;
  }

  getVertices() {
    return SVG.getPathVertices(this.getPath());
  }

  setVertices(vertices) {
    return SVG.setPathVertices(this.getPath(), vertices);
  }

  resetBounds() {
    const svg = this.get("#svg");
    SVG.resetBounds(svg, this.getPath());
    lively.setExtent(this, lively.getExtent(svg));
    const pos = lively.getPosition(svg);
    lively.moveBy(this, pos);
    lively.setPosition(svg, pt(0, 0));
  }

  setPathData(pathData) {
    this.path.setAttribute("d", pathData);
    this.interactHelper.setAttribute("d", pathData);
  }

  /*MD ## Connection Preview MD*/
  activateConnectionPreview() {
    this.setJSONAttribute('connectionPreview', true);
  }

  deactivateConnectionPreview(evt) {
    this.setJSONAttribute('connectionPreview', false);
  }

  renderConnectionPreview() {
    if (!this.classList.contains('show-connection-preview')) {
      return;
    }
  }

  /*MD ## Validity MD*/
  
  // an edge is not valid, if it does not find it from- and to-element in its container
  isOrphaned() {
    const container = this.parentNode;

    if (!container) {
      return true
    }
    
    if (!elementByID(this.fromElementID, container)) {
      return true
    }
    
    return !elementByID(this.toElementID, container)
  }

  /*MD ## Lively-specific API MD*/
  livelyPrepareSave() {}

  livelyPreMigrate() {}
  livelyMigrate(other) {}

  livelyInspect(contentNode, inspector) {
    // do nothing
  }

  livelyHalo() {
    return {
      configureHalo(halo) {
        halo.setHandleVisibility(true);

        let path = this.getPath();
        // halo.get("lively-halo-drag-item").style.visibility= "hidden"
        halo.ensureControlPoint(path, 0, true);
        halo.ensureControlPoint(path, 1, true);
      },
      dragBehaviorMove(halo, evt, pos) {}
    };
  }

    get livelyUpdateStrategy() {
    return 'inplace';
  }

  livelyUpdate() {
    this.shadowRoot.innerHTML = "";
    ComponentLoader.applyTemplate(this, this.localName);
    this.initializeShadowRoot();

    lively.showElement(this, 300);
  }
}