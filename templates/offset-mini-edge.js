import ComponentLoader from 'src/client/morphic/component-loader.js'
import Morph from 'src/components/widgets/lively-morph.js';

import { getEditor, elementByID } from './offset-mini-utils.js';

export default class OffsetMiniEdge extends Morph {

  /*MD ## Life-cycle MD*/
  initialize() {
    this.initializeShadowRoot();
  }

  initializeShadowRoot() {
    this.connect(this.getFromElement(), this.getToElement());
  }

  /*MD ## Accessors MD*/
  get _editor() {
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
    return elementByID(this.fromElementID, this._editor);
  }
  getToElement() {
    return elementByID(this.toElementID, this._editor);
  }

  get path() {
    return this.get("path#path");
  }

  /*MD ## Rendering MD*/
  rerender() {
    const offset = lively.getPosition(this);

    const fromElement = this.getFromElement();
    const toElement = this.getToElement();
    
    if (!fromElement && !toElement) {
      return;
    }

    const anchorFor = (port, hasArrowHead, other) => {
      const { pos, dir } = port.getAnchorPoint(hasArrowHead, other);
      const point = pos.subPt(offset);
      const controlPoint = point.addPt(dir);
      return { point: point, control: controlPoint };
    };

    const { point: start, control: controlStart } = anchorFor(fromElement, false, toElement);
    const { point: end, control: controlEnd } = anchorFor(toElement, true, fromElement);

    this.setPathData(`M ${start.x},${start.y} C ${controlStart.x},${controlStart.y} ${controlEnd.x},${controlEnd.y} ${end.x},${end.y}`);
  }

  setPathData(pathData) {
    this.path.setAttribute("d", pathData);
  }

  /*MD ## Connections MD*/
  connect(portA, portB) {
    this.connectFrom(portA);
    this.connectTo(portB);
  }

  connectFrom(port) {
    if (!port) {
      return;
    }
    this.fromElementID = lively.ensureID(port);

    this.observePositionChange(port, "fromObjectSubject");
    this._editor.enqueueForRerender(this);
  }

  connectTo(port) {
    if (!port) {
      return;
    }
    this.toElementID = lively.ensureID(port);

    this.observePositionChange(port, "toObjectSubject");
    this._editor.enqueueForRerender(this);
  }

  /*MD ## Position Observer MD*/
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
    this._editor.enqueueForRerender(this);
  }


  /*MD ## Lively-specific API MD*/
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