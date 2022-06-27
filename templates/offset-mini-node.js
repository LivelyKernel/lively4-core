import { pt } from 'src/client/graphics.js';
import { domEvents } from 'src/client/constants.js';

import { remove, getEditor } from './offset-mini-utils.js';
import ComponentLoader from 'src/client/morphic/component-loader.js'

const key = 'gs-global-drag-capture';
const target = document.documentElement;
class DragCapture {
  constructor(pointermove, pointerup) {
    this.remove();
    this.add('pointermove', pointermove, true);
    this.add('pointerup', pointerup);
  }

  add(type, fn) {
    lively.addEventListener(key, target, type, fn);
  }

  remove() {
    lively.removeEventListener(key, target);
  }
}

class MoveNode {

  constructor(node) {
    this.node = node;
  }

  get canvas() {
    return this.node._canvas;
  }

  onPointerDown(evt) {
    evt.stopPropagation();

    this.startingPosition = lively.getPosition(this.node);
    this.dragStartingPoint = pt(evt.clientX, evt.clientY);

    this.node.classList.add('dragging', true);

    const drag = new DragCapture(evt => this.onPointerMove(evt), evt => this.onPointerUp(evt, drag));
  }

  onPointerMove(evt) {
    evt.preventDefault();
    evt.stopPropagation();

    const canvas = this.canvas;
    const k = canvas ? canvas.currentZoomScale : 1;
    const deltaPos = pt(evt.pageX, evt.pageY).subPt(this.dragStartingPoint).subPt(lively.getScroll());
    const offset = deltaPos.scaleBy(1 / k);
    this.positionSelectionAtOffset(offset);
  }

  onPointerUp(evt, drag) {
    evt.preventDefault();
    this.node.classList.remove('dragging');
    drag.remove();
  }

  positionSelectionAtOffset(offset) {
    const pos = this.startingPosition.addPt(offset);
    this.node.setPosition(pos);
  }

}

/*MD # ApplyTypeToNode MD*/
class ApplyTypeToNode {

  /*MD ## Method Object MD*/
  constructor(node, newType, oldType) {
    this.node = node;
    this.newType = newType;
    this.oldType = oldType;
  }

  async compute() {
    await this.ensurePort('in', {
      direction: 'in',
      multiplicity: '*',
      label: 'in',
      type: 'data',
    })
    await this.ensurePort('out', {
      direction: 'out',
      multiplicity: '1',
      label: 'out',
      type: 'data',
    })
  }
  
  async ensurePort(role, description) {
    const oldPortsByRole = this.getOldPorts();
    
      if (oldPortsByRole.has(role)) {
        this.keepOldPort(oldPortsByRole, role, description);
      } else {
        await this.node.createNewPort(role, description);
      }
  }
  /*MD ## Utils MD*/
  keepOldPort(oldPortsByRole, key, portDescription) {
    const oldPort = oldPortsByRole.get(key);

    // possible to keep the old port element?
    // #TODO: solve with polymorphism
    const requiredElementType = portDescription.multi ? 'offset-mini-port-list' : 'offset-mini-port';
    if (oldPort.localName === requiredElementType) {
      // keep the element by removing it from the to-remove list
      oldPortsByRole.delete(key);
      // #TODO: need to update the port: is this enough?
      this.node.updatePort(oldPort, key, portDescription);
    } else {
      // we need to switch from port to port-list or vice versa
      this.node.createNewPort(key, portDescription);
    }
  }

  getOldPorts() {
    // only include direct ports, not the ones in port-lists and nested nodes
    const ownSelector = `offset-mini-node[data-lively-id='${this.node._id}']`;
    const oldPortElements = this.node.querySelectorAll(`${ownSelector} > offset-mini-port`);

    const oldPortsByRole = new Map();
    oldPortElements.forEach(child => {
      const slotName = child.getAttribute('slot');
      if (oldPortsByRole.has(slotName)) {
        // only support one port per name for now
        child.remove();
        return;
      }
      oldPortsByRole.set(slotName, child);
    });

    return oldPortsByRole;
  }

}

import Morph from 'src/components/widgets/lively-morph.js';

export default class GsVisualEditorNode extends Morph {

  get _editor() {
    return getEditor(this);
  }

  get _canvas() {
    return getEditor(this);
  }

  get _id() {
    return lively.ensureID(this);
  }

  /*MD ## Tags MD*/
  isMovableMorph() {
    return true;
  }

  /*MD ## Life-cycle MD*/
  initialize() {
    this.windowTitle = "GsVisualEditorNode";
    lively.html.registerKeys(this);

    this.setupDrag();

    this.registerButtons();
    this.positionChangeObservers;
  }
  
  /*MD ## Position Observer MD*/
  get positionChangeObservers() {
    if (!this._positionChangeObservers) {
      this._positionChangeObservers = [];
      this.setupPositionObserver();
    }

    return this._positionChangeObservers;
  }

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
    lively.notify('moved ' + this.getAttribute('node-type'));
    this.positionChangeObservers.forEach(c`anchorChanged`);
    this.getAllSubmorphs('offset-mini-port').forEach(port => port.onPositionChange());
  }

  addPositionChangeObserver(observer) {
    this.positionChangeObservers.push(observer);
  }

  removePositionChangeObserver(observer) {
    this.positionChangeObservers::remove(observer);
  }

  /*MD ## Rendering MD*/
  rerender() {}

  setupTEST() {
    domEvents.forEach(name => {
      this.get('#TEST').addEventListener(name, e => {
        if (e.clientX && e.clientY) {
          const rect = lively.showEvent(e);
          rect.innerHTML = e.type;
        }
        lively.notify(name);
      });
    });
  }

  /*MD ## Node Configuration MD*/
  async applyOptions(options) {
    this.setJSONAttribute('node-options', options);
    this.classList.add(...(options.classes || []));
    await this.setType(options.type);
    this.setPositionFromOptions(options);
  }

  async setType(type) {
    const oldType = this.getAttribute('node-type');
    this.setAttribute('node-type', type);
    await this.applyType(type, oldType);
  }

  async applyType(type, oldType) {
    return await new ApplyTypeToNode(this, type, oldType).compute();
  }

  $append(...elements) {
    this.append(...elements);
  }

  $remove() {
    this.remove()
  }

  async createNewPort(key, portDescription) {
    const port = await (<offset-mini-port></offset-mini-port>)
    this.$append(port);
    this.updatePort(port, key, portDescription);
  }

  updatePort(port, key, portDescription) {
    port.setAttribute('slot', key);
    port.style.gridArea = key;
    port.applyOptions(portDescription);
  }

  getType() {
    return this.getAttribute('node-type');
  }

  /*MD ## Navigation MD*/
  getAllPorts() {
    return this.querySelectorAll(`offset-mini-port`);
  }

  getPort(name) {
    return this.querySelector(`offset-mini-port[slot="${name}"]`);
  }

  hasPort(name) {
    return !!this.getPort(name);
  }

  /*MD ## --- MD*/
  removeFromCanvas() {
    this.getAllPorts().forEach(port => port.removeConnectedEdges());
    this.remove()
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

  setPositionFromOptions(options) {
    const { left, top } = options;

    if (typeof left === 'number' && typeof top === 'number') {
      this.setPosition(pt(left, top));
    }
  }

  setPosition(pos) {
    lively.setPosition(this, pos);
    const { x: left, y: top } = pos;
    this.persistPosition(top, left);
  }

  persistPosition(top, left) {
    if (!this.hasAttribute('node-options')) {
      this.setJSONAttribute('node-options', {});
    }
    const json = this.getJSONAttribute('node-options');
    json.top = top;
    json.left = left;
    this.setJSONAttribute('node-options', json);
  }

  /*MD ## Lively-specific API MD*/
  livelyPrepareSave() {}
  livelyPreMigrate() {}
  livelyMigrate(other) {}
  livelyInspect(contentNode, inspector) {}
  async livelyExample() {}

  get livelyUpdateStrategy() {
    return 'inplace';
  }

  livelyUpdate() {
    this.shadowRoot.innerHTML = "";
    ComponentLoader.applyTemplate(this, this.localName);
    // this.initializeShadowRoot();

    lively.showElement(this, 300);
  }

}