import Morph from 'src/components/widgets/lively-morph.js';
import { scriptFolder, stepFolder } from 'src/client/vivide/utils.js';

export default class VivideStepEditor extends Morph {
  get editor() { return this.get('#editor'); }
  
  async initialize() {
    this.windowTitle = "VivideStepEditor";
    this.editor.setOption('viewportMargin', Infinity);
    if (!this.editor.value) {
      this.editor.value = 'Initializing Script...';
    }
    this.editor.doSave = text => this.stepSaved(text);
  }
  
  setScriptEditor(scriptEditor) {
    this._scriptEditor = scriptEditor;
  }
  
  setStepScript(script) {
    this.editor.value = script;
  }
  async stepSaved(text) {
    if(!this.editor.value) {
      lively.warn('No script set for this editor.');
      return;
    }

    this.notifyChange();
  }
  notifyChange() {
    if(this._scriptEditor) {
      this._scriptEditor.stepChanged(this, this.editor.value);
    } else {
      lively.error('No script editor found for script.');
    }
  }
}