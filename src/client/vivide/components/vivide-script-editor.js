import Morph from 'src/components/widgets/lively-morph.js';
import { clamp, uuid } from 'utils';

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
    setTimeout(() => {
      const editor = this.get('vivide-step-editor');
      this.delayedFocusOnStepEditor(editor);
      
    }, 1000)
  }
  delayedFocusOnStepEditor(stepEditor) {
    stepEditor.delayedFocus();
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
  // #TODO: last script should not be removeable
  // #TODO: should focus next step editor
  removeStep(stepEditor, stepToBeRemoved) {
    let script = this.script;
    let lastStep = null;
    
    while (!script.lastScript && script.nextStep) {
      if (stepToBeRemoved === script) break;
      lastStep = script;
      script = script.nextStep;
    }
    
    // #TODO: save editor index
    const editors = this.getAllSubmorphs('vivide-step-editor');
    let index = editors.indexOf(stepEditor);
    
    stepEditor.remove();

    const updatedEditors = this.getAllSubmorphs('vivide-step-editor');
    index = clamp.call(index, 0, updatedEditors.length - 1);
    this.delayedFocusOnStepEditor(updatedEditors[index]);

    if (lastStep) {
      lastStep.nextStep = script.nextStep;
    } else {
      // First script was removed
      this.script = stepToBeRemoved.nextStep;
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
    
    const stepEditor = await this.insertNewStepEditorAfter(script, prevEditor);
    this.updateLoopState();
    stepEditor.setFocus();
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
    
    return stepEditor;
  }
  async appendNewStepEditorFor(script) {
    const stepEditor = await this.createStepEditorFor(script);
    this.editorList.appendChild(stepEditor);
  }
  
  navigateStepEditors(from, moveDownwards) {
    const editors = this.getAllSubmorphs('vivide-step-editor');
    let index = editors.indexOf(from) + (moveDownwards ? 1 : -1);
    index = clamp.call(index, 0, editors.length - 1);
    this.delayedFocusOnStepEditor(editors[index]);
  }
  
  livelyMigrate(other) {
    this.setView(other.getView());
    this.setScripts(other.getScripts());
  }
}