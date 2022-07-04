import { pt } from 'src/client/graphics.js';

import { getEditor } from './offset-mini-utils.js';
import ComponentLoader from 'src/client/morphic/component-loader.js'

const dragCapture = 'drag-capture';
class MoveNode {

  constructor(node) {
    this.node = node;
  }

  onPointerDown(evt) {
    evt.stopPropagation();

    this.startingPosition = lively.getPosition(this.node);
    this.dragStartingPoint = pt(evt.clientX, evt.clientY);

    this.node.classList.add('dragging');

    this.setupDrag()
  }
  
  setupDrag() {
    lively.removeEventListener(dragCapture);
    const target = document.documentElement;
    lively.addEventListener(dragCapture, target, 'pointermove', ::this.onPointerMove);
    lively.addEventListener(dragCapture, target, 'pointerup', ::this.onPointerUp);
  }

  onPointerMove(evt) {
    evt.preventDefault();
    evt.stopPropagation();

    const editor = this.node._editor;
    const k = editor ? editor.currentZoomScale : 1;
    const deltaPos = pt(evt.pageX, evt.pageY).subPt(this.dragStartingPoint).subPt(lively.getScroll());
    const offset = deltaPos.scaleBy(1 / k);
    
    this.positionAtOffset(offset);
  }

  onPointerUp(evt) {
    evt.preventDefault();
    this.node.classList.remove('dragging');
    lively.removeEventListener(dragCapture);
  }

  positionAtOffset(offset) {
    const pos = this.startingPosition.addPt(offset);
    lively.setPosition(this.node, pos);
  }

}

import Morph from 'src/components/widgets/lively-morph.js';

export default class OffsetMiniNode extends Morph {

  get _editor() {
    return getEditor(this);
  }

  get _id() {
    return lively.ensureID(this);
  }

  /*MD ## Life-cycle MD*/
  initialize() {
    this.windowTitle = "OffsetMiniNode";
    lively.html.registerKeys(this);

    this.setupDrag();
    this.setupPositionObserver();
  }
  
  /*MD ## Position Observer MD*/
  setupPositionObserver() {
    this.mutationObserver = new MutationObserver((mutations, observer) => {
      const anyStyleChanged = mutations.some(record => record.target == this && record.attributeName == "style");
      if (anyStyleChanged) {
        this.onPositionChange();
      }
    });
    this.mutationObserver.observe(this, {
      childList: false,
      subtree: false,
      characterData: false,
      attributes: true
    });
  }

  onPositionChange() {
    this.getAllSubmorphs('offset-mini-port').forEach(port => port.onPositionChange());
  }

  /*MD ## Node Configuration MD*/
  async applyOptions({ top, left }) {
    lively.setPosition(this, lively.pt(left, top));
    await this.setupPorts();
  }

  async setupPorts() {
    await this.ensurePort('in', {
      direction: 'in',
      label: 'in',
    })
    await this.ensurePort('out', {
      direction: 'out',
      label: 'out',
    })
  }
  
  async ensurePort(key, description) {
    if (!this.hasPort(key)) {
      await this.createNewPort(key, description);
    }
  }

  async createNewPort(key, portDescription) {
    const port = await (<offset-mini-port></offset-mini-port>)
    this.append(port);
    this.updatePort(port, key, portDescription);
  }

  updatePort(port, key, portDescription) {
    port.setAttribute('slot', key);
    port.style.gridArea = key;
    port.applyOptions(portDescription);
  }

  /*MD ## Navigation MD*/
  getPort(name) {
    return this.querySelector(`offset-mini-port[slot="${name}"]`);
  }

  hasPort(name) {
    return !!this.getPort(name);
  }

  /*MD ## Drag MD*/
  setupDrag() {
    this.addEventListener('pointerdown', evt => {
      this.onPointerDown(evt);
    });
  }

  onPointerDown(evt) {
    if (evt.pointerType !== "mouse") {
      lively.notify('non-mouse input');
      return;
    }

    // left mouse button
    if (evt.button === 0 && evt.buttons === 1) {
      return new MoveNode(this).onPointerDown(evt);
    }
  }

  /*MD ## Lively-specific API MD*/
  get livelyUpdateStrategy() {
    return 'inplace';
  }

  livelyUpdate() {
    this.shadowRoot.innerHTML = "";
    ComponentLoader.applyTemplate(this, this.localName);

    lively.showElement(this, 300);
  }

}