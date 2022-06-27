import ComponentLoader from 'src/client/morphic/component-loader.js'
import { pt } from 'src/client/graphics.js';
import { getEditor, remove } from './offset-mini-utils.js';

/*MD ## DragNewEdge Workflow

<graphviz-dot>
  <script type="graphiviz">
    digraph H {
      node [fontname="Arial"];
      createEdge [label="canvas"];
      attachToPort1 [label="attach-to-port"];
      setEndPoint [label="set-end-point*"];
      attachToPort2 [label="attach-to-port"];
      openNodeMenu [label="open-node-menu"];
      detachToPort [label="detach-to-port"];
      removeNode [label="remove-node"];
      createNode [label="create-node"];
      attachToPort3 [label="attach-to-port"];
      removeNodeFinal [shape="box" fontcolor=blue fontsize=12 color=gray style="filled" label="remove-node"];
      createEdge -> attachToPort1 [headlabel="123" taillabel="456"];
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

    const label = this.getAttribute('label');

    if (label) {
      this.label.innerHTML = label;
    } else {
      this.label.innerHTML = '';
    }

    this.updateContainerGrid();
  }

  removeConnectedEdges() {
    this.incomingEdges().forEach(edge => edge.removeFromCanvas());
    this.outgoingEdges().forEach(edge => edge.removeFromCanvas());
  }

  $remove() {
    this.remove()
  }

  updateContainerGrid() {
    const direction = this.direction;
    const containerCSS = this.get('style#container-grid');

    let gridAreas;
    if (direction === 'in') {
      gridAreas = `"knob label"`;
    } else if (direction === 'out') {
      gridAreas = `"label knob"`;
    } else {
      lively.warn("port in neither 'in' nor 'out'");
      gridAreas = '""';
    }
    containerCSS.innerHTML = `
#container {
  grid-template-areas: ${gridAreas};
}`;
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
    const { direction, label, type, optional } = options;

    this.setAttribute('direction', direction);
    if (label) {
      this.setAttribute('label', label);
    } else {
      this.removeAttribute('label');
    }
    this.setAttribute('type', type);
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
    return {
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