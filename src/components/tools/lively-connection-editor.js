"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import Connection from "src/components/halo/Connection.js";
import Rasterize, { CloneDeepHTML } from 'src/client/rasterize.js';

export default class LivelyConnectionEditor extends Morph {
  async initialize() {
    this.windowTitle = "LivelyConnectionEditor";
    this.registerButtons();
    this.activityCheckbox.addEventListener("click", () => this.activeChanged());
    this.sourcePicture.addEventListener('mouseenter', () => this.startDrawingArrowToSource(this.sourcePicture.children[0], this.connection.getSource()))
    this.targetPicture.addEventListener('mouseenter', () => this.startDrawingArrowToSource(this.targetPicture.children[0], this.connection.getTarget()))
    this.get("#labelField").value = this.getAttribute("data-mydata1") || 0;
    this.trackingCodeField.editorLoaded().then(() => {this.trackingCodeField.doSave = () => this.saveConnection()})
    this.modifyingCodeField.editorLoaded().then(() => {this.modifyingCodeField.doSave = () => this.saveConnection()})
    
    
  }

  setConnection(connection) {
    this.connection = connection;
    this.get("#labelField").value = this.connection.getLabel();
    this.get("#sourceLabel").innerHTML = 'Source: ' + this.getClassName(this.connection.getSource());
    this.get("#targetLabel").innerHTML = 'Target: ' + this.getClassName(this.connection.getTarget());
    this.activityCheckbox.checked = this.connection.isActive;
    this.addPictureForElement(this.connection.getSource(), this.sourcePicture);
    this.addPictureForElement(this.connection.getTarget(), this.targetPicture);
    this.get("#trackingCodeField").editorLoaded().then(() => this.get('#trackingCodeField').value = this.connection.getTrackingCode())
    this.get("#modifyingCodeField").editorLoaded().then(() => this.get('#modifyingCodeField').value = this.connection.getModifyingCode())
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
  
  get trackingCodeField(){
    return this.get("#trackingCodeField")
  }
  
  get modifyingCodeField(){
    return this.get("#modifyingCodeField")
  }
  
  onCopyButton() {
    let copiedConnection = this.connection.copyAndActivate();
    this.openEditorForConnection(copiedConnection);
  }
  
  async openEditorForConnection(connection){
    let editor = await lively.openComponentInWindow('lively-connection-editor')
    editor.setConnection(connection)
  }
  
  onToggleDirectionButton() {
    this.connection.toggleDirection();
    this.setConnection(this.connection);
  }

  startDrawingArrowToSource(from, to){
    let line = [lively.getGlobalCenter(from), lively.getGlobalCenter(to)];
    lively.showPath(line, "rgba(80,180,80,1)", true);
  }
  
  /* Lively-specific API */

  // store something that would be lost
  livelyPrepareSave() {
    this.setAttribute("data-mydata1", this.get("#labelField").value);
    /*this.setAttribute("data-mydata2", this.get("#trackingCodeField").value);
    this.setAttribute("data-mydata3", this.get("#modifyingCodeField").value);*/
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
    this.setConnection(new Connection(1, 'width', 2, 'value', false));
  }

}