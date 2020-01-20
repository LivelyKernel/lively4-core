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
    this.get("#sourcePropertyField").value = this.getAttribute("data-mydata1") || 0;
    this.get("#targetPropertyField").value = this.getAttribute("data-mydata2") || 0;
    this.get("#modifyingCodeField").value = this.getAttribute("data-mydata3") || 0;
    this.get("#blah").editorLoaded().then(() => lively.notify('editor loaded', 1+this.get('#blah').value))
  }

  setConnection(connection) {
    this.connection = connection;
    this.get("#connectionLabel").innerHTML = this.connection.connectionString();
    this.get("#sourceLabel").innerHTML = 'Source' + this.connection.getSource().toString();
    this.get("#targetLabel").innerHTML = 'Target' + this.connection.getTarget().toString();
    this.activityCheckbox.checked = this.connection.isActive;
    this.addPictureForElement(this.connection.getSource(), this.sourcePicture);
    this.addPictureForElement(this.connection.getTarget(), this.targetPicture);
    this.get("#sourcePropertyField").value = this.connection.  getSourceProperty();
    this.get("#targetPropertyField").value = this.connection.getTargetProperty();
    this.get("#modifyingCodeField").value = this.connection.getModifyingCodeString();
  }

  addPictureForElement(element, container) {
    let copiedSource = CloneDeepHTML.deepCopyAsHTML(element);
    document.body.appendChild(copiedSource);
    lively.setGlobalPosition(copiedSource, lively.pt(0, 0));
    container.innerHTML = '';
    container.appendChild(copiedSource);
    copiedSource.style.position = 'relative';
  }

  get sourcePicture() {
    return this.get("#sourcePicture");
  }

   get targetPicture() {
    return this.get("#targetPicture");
  }

  
  activeChanged() {
    this.connection.setActive(this.activityCheckbox.checked);
  }

  get activityCheckbox() {
    return this.get("#activityCheckbox");
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
    //lively.openInspector(this.get("#textField").value);
    this.connection.setSourceProperty(this.get("#sourcePropertyField").value);
    this.connection.setTargetProperty(this.get("#targetPropertyField").value);
    this.connection.setModifyingCodeString(this.get("#modifyingCodeField").value);
  }

  startDrawingArrowToSource(from, to){
    let line = [lively.getGlobalCenter(from), lively.getGlobalCenter(to)];
    lively.showPath(line, "rgba(80,180,80,1)", true);
  }
  
  /* Lively-specific API */

  // store something that would be lost
  livelyPrepareSave() {
    this.setAttribute("data-mydata1", this.get("#sourcePropertyField").value
    //How to do that with connection?
    );
    this.setAttribute("data-mydata2", this.get("#targetPropertyField").value);
    this.setAttribute("data-mydata3", this.get("#modifyingCodeField").value);
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
    // this is used by the 
    //this.style.backgroundColor = "lightgray"
    //this.someJavaScriptProperty = 42
    //this.appendChild(<div>This is my content</div>)
    this.setConnection(new Connection(1, 'width', 2, 'value', false));
  }

}