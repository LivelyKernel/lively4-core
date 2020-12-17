"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import Connection from "src/components/halo/Connection.js";
import Rasterize, { CloneDeepHTML } from 'src/client/rasterize.js';

export default class LivelyConnectionEditor extends Morph {
  async initialize() {
    this.registerAttributes(["sourceId", "connectionId"])
    
    this.windowTitle = "LivelyConnectionEditor";
    this.registerButtons();
    this.activityCheckbox.addEventListener("click", () => this.activeChanged());
    
    this.findConnection()
    if (this.connection) {
      this.setConnection(this.connection)
    }
    
    // this.get("#labelField").value = this.getAttribute("data-mydata-label") || 0;

    this.trackingCodeField.editorLoaded().then(() => {this.trackingCodeField.doSave = () => this.saveConnection()})
    this.modifyingCodeField.editorLoaded().then(() => {this.modifyingCodeField.doSave = () => this.saveConnection()})
  }
  
  findConnection() {
    if (this.sourceId && this.connectionId) {
      var sourceElement = lively.elementByID(this.sourceId)
      this.connection = Connection.allConnectionsFor(sourceElement).find(ea => ea.id == this.connectionId)
      if (!this.connection) throw new Error("Could not find Connection " + this.connectionId)
    } 
  }
  
  /*MD ## UI MD*/
  
  drawArrowToSource(from, to) {
    
    if (from.pathHightlight) {
      from.pathHightlight.remove()
    }
    // let line = [lively.getGlobalCenter(from), lively.getGlobalCenter(to)];
    // from.pathHightlight = lively.showPath(line, "rgba(80,180,80,1)", true, false);

    
    from.pathHightlight = lively.showElement(to, false)
    from.pathHightlight.innerHTML = ""
    from.pathHightlight.style.border = "3px dashed orange"
  }
  
  removeArrowToSource(from, target) {
    if (from.pathHightlight) {
      from.pathHightlight.remove()
    }
  }
  
  
  
  registerHighlight(element, target) {
    element.addEventListener('mouseenter', () =>
      this.drawArrowToSource(element, target))
    element.addEventListener('mouseleave', () =>
      this.removeArrowToSource(element, target))

  }
  
  attacheCallback() {
    this.updateConnectorHighlight()
  }
  
  detachedCallback() {
    if (this.connection) this.connection.removeConnectionLine()
  }
  
  async updateConnectorHighlight() {
    if (!this.connection) return
    
    this.connection.drawConnectionLine();
  }
  
  updateEditors() {
    this.get("#trackingCodeField").editorLoaded().then(() => 
      this.get('#trackingCodeField').value = this.connection.getTrackingCode())
    this.get("#modifyingCodeField").editorLoaded().then(() => 
      this.get('#modifyingCodeField').value = this.connection.getModifyingCode())
  }
  
  
  setConnection(connection) {
    
    this.connection = connection;
    if (this.connection) {
      this.sourceId = this.connection.sourceId
      this.connectionId = this.connection.id
    }
    this.updateView()
  }

  updateView() {
    if (!this.connection) return
    
    this.get("#sourceLabel").innerHTML = lively.elementToCSSName(this.connection.getSource());
    this.get("#sourceProperty").innerHTML = this.connection.sourceProperty;
    
    this.get("#targetLabel").innerHTML = lively.elementToCSSName(this.connection.getTarget());
    this.get("#targetProperty").innerHTML = this.connection.targetProperty;
    
    this.activityCheckbox.checked = this.connection.isActive;
    this.updateEditors()
    this.registerHighlight(this.get("#sourceLabel"), this.connection.getSource())
    this.registerHighlight(this.get("#targetLabel"), this.connection.getTarget())      
    this.updateConnectorHighlight()    
  }

  addPictureForElement(element, container) {
    let copiedSource = CloneDeepHTML.deepCopyAsHTML(element);
    document.body.appendChild(copiedSource);
    lively.setGlobalPosition(copiedSource, lively.pt(0, 0));
    container.innerHTML = '';
    container.appendChild(copiedSource);
    copiedSource.style.position = 'relative';
    copiedSource.style.top = '0px';
    copiedSource.style.left = '0px';
  }

  chooseNewElement(isSource) {
    this._toBeChangedElementIsSource = isSource;
    
     lively.addEventListener("Connectors", document.body.parentElement, "pointermove",
      e => this.onPointerMove(e), { capture: true });
    lively.addEventListener("Connectors", document.body.parentElement, "pointerup",
      e => this.onPointerUp(e), { capture: true });
  }
  
  saveNewElement(object) {
    if(this._toBeChangedElementIsSource) {
      this.connection.setSource(object);
    } else {
      this.connection.setTarget(object);
    }
    this.setConnection(this.connection);
  }
  
  elementUnderHand(evt) {
    var path = evt.composedPath().slice(evt.composedPath().indexOf(evt.srcElement))
    return path[0]
  }
  
  getClassName(object){
    return (object.constructor&&object.constructor.name) || object.toString()
  }
  
  activeChanged() {
    this.connection.setActive(this.activityCheckbox.checked);
  }

  get activityCheckbox() {
    return this.get("#activityCheckbox");
  }
  
  saveConnection() {
    // this.connection.setLabel(this.get("#labelField").value);
    this.trackingCodeField.editorLoaded().then(() => this.connection.setTrackingCode(this.trackingCodeField.value))
    this.modifyingCodeField.editorLoaded().then(() => this.connection.setModifyingCode(this.modifyingCodeField.value))
  }
  
  get trackingCodeField() {
    return this.get("#trackingCodeField")
  }
  
  get modifyingCodeField() {
    return this.get("#modifyingCodeField")
  }
  /*MD ## Events MD*/
  
  onPointerMove(evt) {
    if (this.dropIndicator) this.dropIndicator.remove()
    this.dropTarget = this.elementUnderHand(evt)
    if (this.dropTarget) {
      this.dropIndicator = lively.showElement(this.dropTarget)
      this.dropIndicator.style.border = "3px dashed rgba(0,100,0,0.5)"
      this.dropIndicator.innerHTML = ""
    }
  }
  
  onPointerUp(evt) {
    lively.removeEventListener("Connectors")
    
    if (this.dropIndicator) this.dropIndicator.remove()
    var morph = this.elementUnderHand(evt)
    
    this.saveNewElement(morph);
  }
    
  
  onNewSourceButton() {
    this.chooseNewElement(true)
  }
  
  onNewTargetButton() {
    this.chooseNewElement(false)
  }
 
  onDestroyButton() {
    this.connection.destroy();
    if (this.parentElement && this.parentElement.localName === 'lively-window') {
      this.parentElement.remove();
    } else {
      this.remove();
    }
  }

  onSaveButton() {
    this.saveConnection();
  }
  
  onEditButton() {
    if (this.get("#editors").style.display == "block") {
      this.get("#editors").style.display = "none"
      // #TODO how windows and components.... haggle out their size... lässt zu wünschen übrig
      this.parentElement.style.height = "50px" 
    } else {
      this.get("#editors").style.display = "block"
      for (let ea of this.shadowRoot.querySelectorAll('lively-code-mirror')) {
        ea.value = ea.value // force update
      }
      this.parentElement.style.height = "250px"
    }
    
  }
    
  onCopyButton() {
    let copiedConnection = this.connection.copyAndActivate();
    this.openEditorForConnection(copiedConnection);
  }
  
  async openEditorForConnection(connection) {
    let editor = await lively.openComponentInWindow('lively-connection-editor')
    editor.setConnection(connection)
  }
  
  onToggleDirectionButton() {
    this.connection.toggleDirection();
    this.setConnection(this.connection);
  }

  /*MD ## Lively-specific API MD*/

  // store something that would be lost
  livelyPrepareSave() {
    // this.setAttribute("data-mydata-label", this.get("#labelField").value)
  }

  livelyPreMigrate() {
    // is called on the old object before the migration
  }

  livelyMigrate(other) {
    // this.setConnection(other.connection);
  }

  livelyInspect(contentNode, inspector) {
    // do nothing
  }

  async livelyExample() {
    // this customizes a default instance to a pretty example
    this.setConnection(new Connection(1, 'value', 2, 'value', false));
  }

}