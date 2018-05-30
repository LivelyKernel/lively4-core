import Morph from 'src/components/widgets/lively-morph.js';
import { scriptFolder, stepFolder } from 'src/client/vivide/utils.js';
import Script from 'src/client/vivide/script.js';

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
  
  setStepScript(script) {
    this.script = script;
    this.editor.value = script.source;
  }
  async stepSaved(text) {
    this.script.source = text;
    this.script.update();
  }
}