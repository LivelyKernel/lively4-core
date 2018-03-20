import Morph from 'src/components/widgets/lively-morph.js';
import { scriptFolder, stepFolder } from 'src/client/vivide/utils.js';

export default class VivideStepEditor extends Morph {
  get editor() { return this.get('#editor'); }
  
  async initialize() {
    this.windowTitle = "VivideStepEditor";
    
    this.editor.setOption('viewportMargin', Infinity);
    this.editor.value = 'Initializing Script...';
    this.editor.doSave = text => this.stepSaved(text);
  }
  
  setScriptEditor(scriptEditor) {
    this._scriptEditor = scriptEditor;
  }
  async setStepURLString(urlString) {
    this._urlString = urlString;
    let txt = await fetch(urlString).then(res => res.text());
    
    this.editor.value = txt;
  }
  async stepSaved(text) {
    if(!this._urlString) {
      lively.warn('No file set for this editor.');
      return;
    }
    
    await lively.unloadModule(this._urlString);
    await lively.files.saveFile(this._urlString, text);    

    this.notifyChange();
  }
  notifyChange() {
    if(this._scriptEditor) {
      this._scriptEditor.stepChanged(this, this._urlString);
    } else {
      lively.error('No script editor found for ' + this._urlString);
    }
  }
}