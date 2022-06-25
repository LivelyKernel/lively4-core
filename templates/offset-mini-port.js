
import { pt } from 'src/client/graphics.js';
// Grid.optSnapPosition(pos, evt);
import d3 from "src/external/d3.v5.js";

import { getEditor, remove } from './offset-mini-utils.js';

/*MD ## DragNewEdge Workflow

<graphviz-dot>
  <script type="graphiviz">
    digraph H {
      node [fontname="Arial"];
      createEdge [label="create-edge"];
      attachToPort1 [label="attach-to-port"];
      setEndPoint [label="set-end-point*"];
      attachToPort2 [label="attach-to-port"];
      openNodeMenu [label="open-node-menu"];
      detachToPort [label="detach-to-port"];
      removeNode [label="remove-node"];
      createNode [label="create-node"];
      attachToPort3 [label="attach-to-port"];
      removeNodeFinal [shape="box" fontcolor=blue fontsize=12 color=gray style="filled" label="remove-node"];
      createEdge -> attachToPort1;
      attachToPort1 -> setEndPoint;
      setEndPoint -> setEndPoint [color=grey style=dashed label="move mouse"];
      setEndPoint -> attachToPort2 [color=grey style=dashed label="mouse up: port compatible"];
      setEndPoint -> openNodeMenu [color=grey style=dashed label="mouse up: not yet connected"];
      detachToPort -> removeNode;
      removeNode -> createNode;
      createNode -> attachToPort3
      openNodeMenu -> createNode;
      attachToPort3 -> detachToPort [color=grey style=dashed label="select node (preview)"];
      attachToPort3 -> detachToPort [color=grey style=dashed label="pick node"];
      attachToPort3 -> removeNodeFinal [color=grey style=dashed label="cancel menu"];
    }
  </script>
</graphviz-dot>
MD*/


import Morph from 'src/components/widgets/lively-morph.js';

export default class GsVisualEditorPort extends Morph {

  get _editor() {
    return getEditor(this);
  }

  get _canvas() {
    return getEditor(this);
  }

  get _id() {
    return lively.ensureID(this);
  }

  get direction() {
    return this.getAttribute('direction');
  }
  getType() {
    return this.getAttribute('type');
  }
  getKind() {
    return this.getType();
  }
  incomingEdges() {
    const canvas = this._canvas;
    if (!canvas) {
      return [];
    }
    return Array.from(canvas.querySelectorAll(`[toElement="${this._id}"]`));
  }
  outgoingEdges() {
    const canvas = this._canvas;
    if (!canvas) {
      return [];
    }
    return Array.from(canvas.querySelectorAll(`[fromElement="${this._id}"]`));
  }
  incomingEdge() {
    const canvas = this._canvas;
    if (!canvas) {
      return null;
    }
    return canvas.querySelector(`[toElement="${this._id}"]`);
  }
  outgoingEdge() {
    const canvas = this._canvas;
    if (!canvas) {
      return null;
    }
    return canvas.querySelector(`[fromElement="${this._id}"]`);
  }

  role() {
    return this.getAttribute('slot');
  }

  /*MD ## Life-cycle MD*/
  initialize() {
    this.initializeShadowRoot();
    this.positionChangeObservers;
  }

  initializeShadowRoot() {

    const multiplicity = this.getAttribute('multiplicity');
    const label = this.getAttribute('label');

    if (label) {
      this.label.innerHTML = label;
    } else {
      this.label.innerHTML = '';
    }

    lively.removeEventListener('remove-optional-icon', this.iconRemoveOptional);
    lively.addEventListener('remove-optional-icon', this.iconRemoveOptional, 'pointerdown', evt => {
      evt.preventDefault();
      evt.stopPropagation();
      this.removeSelfThroughRemoveOptionalIcon();
    });

    this.updateKnobIcon

    // this.getAttribute('type', 'simple');
    ();
    this.updateContainerGrid();
  }

  removeYourself() {
    // lively.notify(`remove port: ${this.role()}`);
    this.removeConnectedEdges();
    this.$remove();
  }

  removeConnectedEdges() {
    this.incomingEdges().forEach(edge => edge.removeFromCanvas());
    this.outgoingEdges().forEach(edge => edge.removeFromCanvas());
  }

  $remove() {
    this.remove()
  }

  removeSelfThroughRemoveOptionalIcon() {
    const parent = lively.findParent(this, parent => ['gs-visual-editor-node', 'gs-visual-editor-port-list'].includes(parent.localName));
    if (parent) {
      parent.removePortFromYourself(this);
    } else {
      lively.warn('port wants to remove itself, but found no appropriate parent');
      this.removeYourself();
    }
  }

  get iconRemoveOptional() {
    return this.get('#remove-optional');
  }

  updateKnobIcon() {
    const type = this.getType();
    const isConnected = this.isConnected();

    const icon = {
      control: 'fa-play',
      data: 'fa-circle',
      callback: 'fa-square'
    }[type] || 'fa-question';

    this.setKnobIcon(`${icon} ${isConnected ? 'fa-solid' : 'fa-regular'}`);
  }

  updateContainerGrid() {
    const direction = this.direction;
    const containerCSS = this.get('style#container-grid');
    const container = this.get('#container');

    let inputFields = [];
    if (this.hasAttribute('inlineValues')) {
      inputFields = this.getJSONAttribute('inlineValues').inputFields;
    }

    function fieldKey(index) {
      return 'input-field-' + index;
    }

    container.querySelectorAll('slot').forEach(slot => slot.remove());
    const oldInputElements = this.querySelectorAll('.input');
    const oldInputs = new Map();
    oldInputElements.forEach(child => {
      const slotName = child.getAttribute('slot');
      if (oldInputs.has(slotName)) {
        // only support one input per name for now
        child.remove();
        return;
      }
      oldInputs.set(slotName, child);
    });

    inputFields.forEach((desc, index) => {
      const key = fieldKey(index);
      container.append(<slot id={key} name={key}>{key}</slot>);

      let input;
      if (oldInputs.has(key)) {
        input = oldInputs.get(key);
        oldInputs.delete(key);
      } else {
        input = this.buildAndLinkInputField(desc, index);
        input.setAttribute('slot', key);
        input.classList.add('input');
        input.style.gridArea = key;
      }
    });
    oldInputs.forEach(port => port.remove());

    let gridAreas;
    const inputFieldGridAreas = inputFields.map((_, index) => fieldKey(index)).join(' ');
    if (direction === 'in') {
      gridAreas = `"knob label ${inputFieldGridAreas} remove-optional"`;
    } else if (direction === 'out') {
      gridAreas = `"remove-optional ${inputFieldGridAreas} label knob"`;
    } else {
      lively.warn("port in neither 'in' nor 'out'");
      gridAreas = '""';
    }
    containerCSS.innerHTML = `
#container {
  grid-template-areas: ${gridAreas};
}`;
  }

  buildAndLinkInputField(desc, index) {
    const { type, initialValue, title } = desc;
    let element;
    const textTypes = ['string', 'integer', 'number', 'code'];
    if (textTypes.includes(type)) {
      element = gs.createElement('gs-visual-editor-input-text');
    } else if (type === 'bool') {
      element = gs.createElement('gs-visual-editor-input-checkbox');
    } else if (type === 'element') {
      element = gs.createElement('gs-visual-editor-input-select');
    } else {
      throw new RangeError(`input type should be ${textTypes.join(', ')}, or 'bool' but was '${type}'`);
    }
    this.append(element);
    element.applyOptions(desc, index, this);
    return element;
  }

  hasInlinedValue() {
    return this.hasAttribute('inlineValues');
  }
  getInlinedValue() {
    if (!this.hasInlinedValue()) {
      return undefined;
    }
    const description = this.getJSONAttribute('inlineValues');
    if (description.getAs === 'single') {
      const input = this.querySelector('.input');
      return input.getInterpretedValue();
    }
    lively.error(`unknown type of inlined value: '${description.getAs}' of `, 'port');
  }

  setKnobIcon(classes) {
    this.knob.className = classes;
  }

  get knob() {
    return this.get('#knob');
  }
  get label() {
    return this.get('#label');
  }
  get container() {
    return this.get('#container');
  }

  initializeShadowRootOLD() {
    this.setType(this.getType());
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
    lively.notify('moved ' + this.get('#label').innerHTML);
    this.positionChangeObservers.forEach(observer => {
      observer.anchorChanged();
    });
  }

  addPositionChangeObserver(observer) {
    this.positionChangeObservers.push(observer);
    requestAnimationFrame(() => this.updateConnected());
  }

  removePositionChangeObserver(observer) {
    this.positionChangeObservers::remove(observer);
    requestAnimationFrame(() => this.updateConnected());
  }

  /*MD ## --- MD*/
  applyOptions(options) {
    const { direction, multiplicity, label, type, inlineValues, optional } = options;

    this.setAttribute('direction', direction);
    this.setAttribute('multiplicity', multiplicity);
    if (label) {
      this.setAttribute('label', label);
    } else {
      this.removeAttribute('label');
    }
    this.setAttribute('type', type);
    if (inlineValues) {
      this.setJSONAttribute('inlineValues', inlineValues);
    } else {
      this.removeAttribute('inlineValues');
    }
    if (optional) {
      this.setJSONAttribute('optional', optional);
    } else {
      this.removeAttribute('optional');
    }

    this.initializeShadowRoot();
  }

  /*MD ## Geometry MD*/
  getAnchorPoint() {
    const knob = this.get('#knob');
    const fromBounds = this._canvas.boundsForElement(knob);
    const pos = fromBounds.center();
    const dir = pt(this.direction === 'out' ? 100 : -100, 0
    // const               point = pos.subPt(offset)
    //           const controlPoint = point.addPt(dir)
    );return {
      pos: fromBounds.center(),
      dir: pt(this.direction === 'out' ? 100 : -100, 0)
    };
  }

  /*MD ## Edges MD*/
  async createConnectedEdge() {
    const edge = await this._canvas.spawnEdge({});

    const succeeded = this.connectWithEdge(edge);
    if (!succeeded) {
      throw new Error("Could not create edge, port has no direction (in or out)");
    }

    return edge;
  }

  connectWithEdge(edge) {
    const direction = this.direction;
    if (direction === 'in') {
      edge.$connectElement('to', this);
      return true;
    } else if (direction === 'out') {
      edge.$connectElement('from', this);
      return true;
    }
    return false;
  }

  async connectWith(otherPort) {
    if (!this.isCompatibleWith(otherPort)) {
      throw new Error("Could not connect to other port, they are incompatible");
    }

    const edge = await this.createConnectedEdge();
    otherPort.connectWithEdge(edge);

    return edge;
  }

  isConnected() {
    return this.incomingEdges().concat(this.outgoingEdges()).length > 0;
  }

  updateConnected() {
    this.classList.toggle('connected', this.isConnected());
    this.updateKnobIcon();
  }

  static compatibleDirections(dirA, dirB) {
    return dirA === 'in' && dirB === 'out' || dirA === 'out' && dirB === 'in';
  }

  isCompatibleWith(port) {
    return this.getKind() === port.getKind() && GsVisualEditorPort.compatibleDirections(this.direction, port.direction);
  }

  isCompatibleWithNodeDesc(nodeDescription) {
    const { ports } = nodeDescription;
    // #TODO: are types compabile?
    return Object.values(ports).some(portDesc => {
      if (portDesc.optional && !portDesc.optional.startsVisible) {
        return false;
      }

      return portDesc.kind === this.getKind() && GsVisualEditorPort.compatibleDirections(portDesc.direction, this.direction);
    });
  }

  /*MD ## --- MD*/
  onDblClick() {
    this.animate([{ backgroundColor: "lightgray" }, { backgroundColor: "red" }, { backgroundColor: "lightgray" }], {
      duration: 1000
    });
  }

  // this method is autmatically registered through the ``registerKeys`` method
  onKeyDown(evt) {
    lively.notify("Key Down!" + evt.charCode, 'port');
  }

  /*MD ## Lively-specific API MD*/
  livelyPrepareSave() {}
  livelyPreMigrate() {}
  livelyMigrate(other) {}
  livelyInspect(contentNode, inspector) {}
  async livelyExample() {
    this.setAttribute('direction', 'in');
    this.setAttribute('type', 'simple');
    this.initializeShadowRoot();
  }

}