import Morph from 'src/components/widgets/lively-morph.js';

export default class VivideStepEditor extends Morph {
  get editor() { return this.get('#editor'); }
  
  async initialize() {
    this.windowTitle = "VivideStepEditor";
    this.editor.setOption('viewportMargin', Infinity);
    this.registerButtons();
    if (!this.editor.value) {
      this.editor.value = 'Initializing Script...';
    }
    this.editor.doSave = text => this.stepSaved(text);
  }
  
  containsScript(script) {
    return script === this.script;
  }
  
  setScriptEditor(scriptEditor) {
    this.scriptEditor = scriptEditor;
  }
  
  onInsertScript(evt) {
    if (!this.scriptEditor) return;
    
    let position = {};
    position.editor = this;
    position.script = this.script;
    this.scriptEditor.showTypeMenu(evt, position);
  }
  
  onRemoveScript() {
    if (!this.scriptEditor) return;
    
    this.scriptEditor.removeScript(this, this.script);
  }
  
  setToLoopStart() {
    // Go to last script
    let script = this.script;
    while (script.nextStep != null && !script.lastScript) {
      script = script.nextStep;
    }
    
    // Reconfigure loop
    script.nextStep = this.script;
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