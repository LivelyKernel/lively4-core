import Morph from 'src/components/widgets/lively-morph.js';
import ContextMenu from 'src/client/contextmenu.js';
import {pt} from 'src/client/graphics.js';


const NEWLINE = "\n";
const TAB = "\t";


export default class LivelyPetrinetCodeEditor extends Morph {
  
  
  
  // Initialization
  
  
  

  async initialize() {
    this.windowTitle = "LivelyPetrinetCodeEditor";
    this.registerButtons();
    this.codeMirror.value = "function onTransition() {" + NEWLINE
    + TAB + 'lively.notify("test")' + NEWLINE
    + "}";
    this.onSave = undefined;

}
  
  
  // Access
  
  setOnSave(saveFunction) {
    this.onSave = saveFunction
  }
  
  get codeMirror() {
    return this.get("lively-code-mirror");
  }
  
  get code() {
    return this.codeMirror.value
  }
  
  set code(codeString) {
    this.codeMirror.value = codeString;
  }
  
  
  // Button
  
  onSaveButton() {
    this.onSave(this.code);
    this.parentNode.onCloseButtonClicked(this);
  }

  

}