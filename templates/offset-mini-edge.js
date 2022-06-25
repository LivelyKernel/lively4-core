import SVG from "src/client/svg.js";
import { pt, Point, rect } from 'src/client/graphics.js';
import { debounce } from "utils";

import { getEditor, elementByID } from './offset-mini-utils.js';

import Command from 'https://lively-kernel.org/lively4/gs/components/command.js';

function unknownEnd(edge, end) {
  throw new Error(`unknown 'end' of edge: ${end}`);
}

function setEndPoint(edge, end, point) {
  if (end === 'from') {
    edge.endPointFrom = point;
  } else if (end === 'to') {
    edge.endPointTo = point;
  } else {
    unknownEnd(edge, end);
  }
  edge._canvas && edge._canvas.enqueueForRerender(edge);
}

function deleteEndPoint(edge, end) {
  if (end === 'from') {
    edge.endPointFrom = undefined;
  } else if (end === 'to') {
    edge.endPointTo = undefined;
  } else {
    unknownEnd(edge, end);
  }
  edge._canvas && edge._canvas.enqueueForRerender(edge);
}

function getEndPoint(edge, end) {
  if (end === 'from') {
    return edge.endPointFrom;
  } else if (end === 'to') {
    return edge.endPointTo;
  } else {
    unknownEnd(edge, end);
  }
}

class EndPointMemento {

  constructor(edge, end) {
    this.end = end;
    this.endPoint = getEndPoint(edge, end);
  }

  applyTo(edge) {
    if (this.endPoint) {
      setEndPoint(edge, this.end, this.endPoint);
    } else {
      deleteEndPoint(edge, this.end);
    }
  }

}

class SubclassResponsibilityError extends Error {
  constructor(...params) {
    super(...params);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SubclassResponsibilityError);
    }

    this.name = this.constructor.name;
  }
}

class EndPointCommand extends Command {

  constructor(edge, end) {
    super();

    this.edge = edge;
    this.end = end;

    this.priorState = new EndPointMemento(edge, end);
  }

  do() {
    throw new SubclassResponsibilityError();
  }
  undo() {
    this.priorState.applyTo(this.edge);
  }
  redo() {
    return this.do();
  }

  sameEndPoint(command) {
    return this.edge === command.edge && this.end === command.end;
  }

}

class SetEndPointCommand extends EndPointCommand {

  constructor(edge, end, point) {
    super(edge, end);
    this.point = point;
  }

  do() {
    setEndPoint(this.edge, this.end, this.point);
  }

  // #TODO: correct redo behavior, but not undo behavior!
  mergeWith(command) {
    const cmdType = command.constructor.name;

    if (cmdType === 'SetEndPointCommand' && this.sameEndPoint(command)) {
      return command;
    }

    if (cmdType === 'RemoveEndPointCommand' && this.sameEndPoint(command)) {
      return command;
    }
  }
}

class RemoveEndPointCommand extends EndPointCommand {

  do() {
    deleteEndPoint(this.edge, this.end);
  }

  mergeWith(command) {
    const cmdType = command.constructor.name;

    if (cmdType === 'SetEndPointCommand' && this.sameEndPoint(command)) {
      return command;
    }

    if (cmdType === 'RemoveEndPointCommand' && this.sameEndPoint(command)) {
      return command;
    }
  }

}

function getElement(edge, end) {
  if (end === 'from') {
    return edge.getFromElement();
  } else if (end === 'to') {
    return edge.getToElement();
  } else {
    unknownEnd(edge, end);
  }
}

function connectElement(edge, end, element) {
  if (end === 'from') {
    edge.connectFrom(element);
  } else if (end === 'to') {
    edge.connectTo(element);
  } else {
    unknownEnd(edge, end);
  }
}

function disconnectElement(edge, end) {
  if (end === 'from') {
    edge.disconnectFromElement();
  } else if (end === 'to') {
    edge.disconnectToElement();
  } else {
    unknownEnd(edge, end);
  }
}

class EdgeConnectionMemento {

  constructor(edge, end) {
    this.end = end;
    this.element = getElement(edge, end);
  }

  applyTo(edge) {
    if (this.element) {
      connectElement(edge, this.end, this.element);
    } else {
      disconnectElement(edge, this.end);
    }
  }

}

class ConnectEdgeCommand extends Command {

  constructor(edge, end, element) {
    super();
    this.edge = edge;
    this.end = end;
    this.element = element;

    this.priorState = new EdgeConnectionMemento(edge, end);
  }

  do() {
    connectElement(this.edge, this.end, this.element);
  }

  undo() {
    this.priorState.applyTo(this.edge);
  }

  redo() {
    return this.do();
  }

}

class DisconnectEdgeCommand extends Command {

  constructor(edge, end) {
    super();
    this.edge = edge;
    this.end = end;

    this.priorState = new EdgeConnectionMemento(edge, end);
  }

  do() {
    disconnectElement(this.edge, this.end);
  }

  undo() {
    this.priorState.applyTo(this.edge);
  }

  redo() {
    return this.do();
  }

}

import Morph from 'src/components/widgets/lively-morph.js';

export default class GsVisualEditorEdge extends Morph {

  get isConnector() {
    return true;
  }

  /*MD ## Life-cycle MD*/
  initialize() {
    this.addEventListener('pointerdown', evt => {
      this.onPointerDown(evt);
    });

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

    const fromElement = this.getFromElement() || this.endPointFrom || pt(0, 0);
    const toElement = this.getToElement() || this.endPointTo || pt(0, 0);

    const anchorFor = (element, hasArrowHead, other) => {
      if (element instanceof Point) {
        // this._canvas.showPoint(element)
        return { point: element, control: element };
      }
      const { pos, dir } = element.getAnchorPoint(hasArrowHead, other);
      const point = pos.subPt(offset);
      const controlPoint = point.addPt(dir);
      return { point: point, control: controlPoint };
    };

    const { point: start, control: controlStart } = anchorFor(fromElement, false, toElement);
    const { point: end, control: controlEnd } = anchorFor(toElement, true, fromElement);

    this.setPathData(`M ${start.x},${start.y} C ${controlStart.x},${controlStart.y} ${controlEnd.x},${controlEnd.y} ${end.x},${end.y}`
    // svg.resetBounds(c, p)
    // #TODO: correct gradient implementation (if needed)
    // this.updateGradientDirection(v[0], v[1]);
    // this.resetBoundsDelay()
    );this.renderConnectionPreview();
  }

  updateGradientDirection() {
    var l = this.get('#path');
    var x1 = parseFloat(l.getAttribute("x1"));
    var y1 = parseFloat(l.getAttribute("y1"));
    var x2 = parseFloat(l.getAttribute("x2"));
    var y2 = parseFloat(l.getAttribute("y2"));
    var w = parseFloat(l.getAttribute("stroke-width"));

    // step 1
    var dx = x2 - x1;
    var dy = y2 - y1;

    // step 2
    var len = Math.sqrt(dx * dx + dy * dy);
    dx = dx / len;
    dy = dy / len;

    // step 3
    var temp = dx;
    dx = -dy;
    dy = temp;

    //step 4
    dx = w * dx;
    dy = w * dy;

    //step 5
    var gradient_x1 = x1 + dx * 0.5;
    var gradient_y1 = y1 + dy * 0.5;
    var gradient_x2 = x1 - dx * 0.5;
    var gradient_y2 = y1 - dy * 0.5;

    var e = this.get("#gradient");
    e.setAttribute("x1", gradient_x1);
    e.setAttribute("y1", gradient_y1);
    e.setAttribute("x2", gradient_x2);
    e.setAttribute("y2", gradient_y2);
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
    const canvas = this._canvas;

    const fromElement = this.getFromElement();
    const toElement = this.getToElement();

    const fromPoint = this.endPointFrom;
    const toPoint = this.endPointTo;

    if (fromElement) {
      this.disconnectFromElement();
    }
    if (toElement) {
      this.disconnectToElement();
    }

    if (fromPoint) {
      this.endPointFrom = undefined;
    }
    if (toPoint) {
      this.endPointTo = undefined;
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

  $connectElement(end, element) {
    editorHistory.do(new ConnectEdgeCommand(this, end, element));
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

  $disconnectElement(end) {
    editorHistory.do(new DisconnectEdgeCommand(this, end));
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

  $setEndPoint(end, point) {
    editorHistory.do(new SetEndPointCommand(this, end, point));
  }

  $removeEndPoint(end) {
    editorHistory.do(new RemoveEndPointCommand(this, end));
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

  pointTo(p) {
    this.disconnectToElement();
    var path = this.getPath();
    var v = SVG.getPathVertices(path);
    v[1].x1 = p.x;
    v[1].y1 = p.y;
    SVG.setPathVertices(path, v);
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

  /*MD ## --- MD*/
  onDblClick() {
    this.animate([{ backgroundColor: "lightgray" }, { backgroundColor: "red" }, { backgroundColor: "lightgray" }], {
      duration: 1000
    });
  }

  // this method is autmatically registered through the ``registerKeys`` method
  onKeyDown(evt) {
    lively.notify("Key Down!" + evt.charCode, 'edge');
  }

  onPointerDown(evt) {
    this._canvas.setSelection([this]);
    evt.stopPropagation();
    evt.preventDefault();
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

  /*MD ## Geometry MD*/
  getCollisionShape() {
    return new paper.Path(this.path.getAttribute("d"));
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

  livelyExample() {}

}