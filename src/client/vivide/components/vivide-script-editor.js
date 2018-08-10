import Morph from 'src/components/widgets/lively-morph.js';
import { uuid } from 'utils';

export default class VivideScriptEditor extends Morph {
  static get vivideScript() { return 'vivide_script_id'; }
  
  get editorList() { return this.get('#editor-list'); }
  get inspector() { return this.get('#inspector'); }
  get loopMarker() { return this.get('#loop-marker'); }
  
  setView(view) { return this.view = view; }
  getView() { return this.view; }
  
  async initialize() {
    this.windowTitle = "VivideScriptEditor";
    this.inspector.hideWorkspace();
    this.registerButtons();
    
    this.container = this.get('#container');
    this.settingLoopStart = false;
  }
  
  initialFocus() {
    
  }
  
  onSetLoopStart() {
    this.settingLoopStart = true;
  }
  
  onRemoveLoop() {
    if (!this.script) return;
    
    let script = this.script.getLastStep();
    
    script.nextStep = null;
    this.loopMarker.style.display = "none";
    this.script.update();
  }
  
  // #TODO: terminology
  removeStep(stepEditor, removedScript) {
    var script = this.script;
    var lastScript = null
    
    while (!script.lastScript && script.nextStep) {
      if (removedScript === script) break;
      lastScript = script;
      script = script.nextStep;
    }
    
    stepEditor.remove();
    
    if (lastScript) {
      lastScript.nextStep = script.nextStep;
    } else {
      // First script was removed
      this.script = removedScript.nextStep;
    }
    
    if (this.script) {
      this.script.update();
    }
  }
  
  async insertStepAfter(scriptType, prevStep, prevEditor) {
    let script = await this.view.insertStepAfter(scriptType, prevStep);

    if (script.lastScript) {
      this.lastScript = script;
    }
    
    this.insertNewStepEditorAfter(script, prevEditor);
    this.updateLoopState();
  }
  
  updateLoopState() {
    let editorListContent = this.editorList.children;
    let loopStart = this.lastScript.nextStep;
    for (let element of editorListContent) {
      if (element.localName != 'vivide-step-editor') continue;
      if (!element.containsStep(loopStart)) continue;
      
      Object.assign(this.loopMarker.style, {
        display: "inline-block",
        top: element.offsetTop + "px",
        height: element.offsetHeight + "px"
      });
    }
  }
  
  async setScripts(script) {    
    this.editorList.innerHTML = '';
    this.script = script;
    
    await this.appendNewStepEditorFor(script);
    while (script.nextStep != null) {
      script = script.nextStep;
      await this.appendNewStepEditorFor(script);
      
      if (script.lastScript) break;
    }
    
    this.lastScript = script;
    this.updateLoopState();
  }
  getScripts() {
    return this.script;
  }
  
  async createStepEditorFor(script) {
    const stepEditor = await (<vivide-step-editor></vivide-step-editor>);
    stepEditor.setStep(script);
    stepEditor.setScriptEditor(this);
    stepEditor.addEventListener('mousedown', () => {
      if (!this.settingLoopStart) return;
      
      stepEditor.setToLoopStart();
      this.updateLoopState();
      this.script.update();
      this.settingLoopStart = false;
    });
    
    return stepEditor;
  }
  async insertNewStepEditorAfter(script, prevEditor) {
    const stepEditor = await this.createStepEditorFor(script);
    this.editorList.insertBefore(stepEditor, prevEditor.nextSibling);
  }
  async appendNewStepEditorFor(script) {
    const stepEditor = await this.createStepEditorFor(script);
    this.editorList.appendChild(stepEditor);
  }
  
  navigateStepEditors(from, moveDownwards) {
    const editors = this.getAllSubmorphs('vivide-step-editor');
    let index = editors.indexOf(from) + (moveDownwards ? 1 : -1);
    index = Math.min(index, editors.length - 1);
    index = Math.max(0, index);
    setTimeout(() => {
      editors[index].editor.focus();
    });
  }
  
  livelyMigrate(other) {
    this.setView(other.getView());
    this.setScripts(other.getScripts());
  }
}