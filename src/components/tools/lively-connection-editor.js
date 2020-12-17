"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import Connection from "src/components/halo/Connection.js";
import Rasterize, { CloneDeepHTML } from 'src/client/rasterize.js';

export default class LivelyConnectionEditor extends Morph {
  async initialize() {
    this.windowTitle = "LivelyConnectionEditor";
    this.registerButtons();
    this.activityCheckbox.addEventListener("click", () => this.activeChanged());
    this.get("#sourceLabel").addEventListener('mouseenter', () =>
      this.drawArrowToSource(this.get("#sourceLabel"), this.connection.getSource()))
    this.get("#targetLabel").addEventListener('mouseenter', () =>
      this.drawArrowToSource(this.get("#targetLabel"), this.connection.getTarget()))
    // this.get("#labelField").value = this.getAttribute("data-mydata-label") || 0;
    this.trackingCodeField.editorLoaded().then(() => {this.trackingCodeField.doSave = () => this.saveConnection()})
    this.modifyingCodeField.editorLoaded().then(() => {this.modifyingCodeField.doSave = () => this.saveConnection()})
  }

  setConnection(connection) {
    this.connection = connection;
    // this.get("#labelField").value = this.connection.getLabel();
    this.get("#sourceLabel").innerHTML = lively.elementToCSSName(this.connection.getSource());
    this.get("#targetLabel").innerHTML = lively.elementToCSSName(this.connection.getTarget());
    this.activityCheckbox.checked = this.connection.isActive;
    this.get("#trackingCodeField").editorLoaded().then(() => 
      this.get('#trackingCodeField').value = this.connection.getTrackingCode())
    this.get("#modifyingCodeField").editorLoaded().then(() => 
      this.get('#modifyingCodeField').value = this.connection.getModifyingCode())
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
  
  get sourcePicture() {
    return this.get("#sourcePicture");
  }

  get targetPicture() {
    return this.get("#targetPicture");
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
  
  onNewSourceButton() {
    this.chooseNewElement(true)
  }
  
  onNewTargetButton() {
    this.chooseNewElement(false)
  }

  onDrawConnectionArrowButton() {
    this.connection.drawConnectionLine();
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
  
  saveConnection() {
    this.connection.setLabel(this.get("#labelField").value);
    this.trackingCodeField.editorLoaded().then(() => this.connection.setTrackingCode(this.trackingCodeField.value))
    this.modifyingCodeField.editorLoaded().then(() => this.connection.setModifyingCode(this.modifyingCodeField.value))
  }
  
  get trackingCodeField() {
    return this.get("#trackingCodeField")
  }
  
  get modifyingCodeField() {
    return this.get("#modifyingCodeField")
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

  drawArrowToSource(from, to) {
    let line = [lively.getGlobalCenter(from), lively.getGlobalCenter(to)];
    
    if (from.pathHightlight) {
      from.pathHightlight.remove()
    }
    // from.pathHightlight = lively.showPath(line, "rgba(80,180,80,1)", true, false);
    from.pathHightlight = lively.showPath(line, "rgba(80,180,80,1)", true);
  }
  
  removeArrowToSource(from) {
    if (from.pathHightlight) {
      from.pathHightlight.remove()
    }
  }
  
  /* Lively-specific API */

  // store something that would be lost
  livelyPrepareSave() {
    this.setAttribute("data-mydata-label", this.get("#labelField").value)
  }

  livelyPreMigrate() {
    // is called on the old object before the migration
  }

  livelyMigrate(other) {
    this.setConnection(other.connection);
  }

  livelyInspect(contentNode, inspector) {
    // do nothing
  }

  async livelyExample() {
    // this customizes a default instance to a pretty example
    this.setConnection(new Connection(1, 'value', 2, 'value', false));
  }

}