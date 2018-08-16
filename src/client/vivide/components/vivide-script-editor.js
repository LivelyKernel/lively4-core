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
    }, 1000);
  }
  delayedFocusOnStepEditor(stepEditor) {
    stepEditor.delayedFocus();
  }
  
  onSetLoopStart() {
    this.settingLoopStart = true;
  }
  
  onRemoveLoop() {
    if (!this.firstStep) return;
    
    let script = this.firstStep.getLastStep();
    
    script.nextStep = null;
    this.loopMarker.style.display = "none";
    this.firstStep.update();
  }
  
  // #TODO: terminology
  // #TODO: the final script should not be removeable
  // #TODO: should focus next step editor
  removeStep(stepEditor, stepToBeRemoved) {
    if(this.firstStep === this.firstStep.getLastStep()) {
      lively.warn('Do not remove the final script step.');
      return;
    }
    
    let script = this.firstStep;
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
      this.firstStep = stepToBeRemoved.nextStep;
    }
    
    if (this.firstStep) {
      this.firstStep.update();
    }
  }
  
  async insertStepAfter(stepType, prevStep, prevEditor) {
    let step = await this.view.insertStepAfter(stepType, prevStep);

    if (step.lastScript) {
      this.lastScript = step;
    }
    
    const stepEditor = await this.insertNewStepEditorAfter(step, prevEditor);
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
  
  async setScripts(firstStep) {    
    this.editorList.innerHTML = '';
    this.firstStep = firstStep;
    
    firstStep.iterateLinearAsync(async step => {
      return await this.appendNewStepEditorFor(step);
    });
    
    this.lastScript = firstStep.getLastStep();
    this.updateLoopState();
  }
  getScripts() {
    return this.firstStep;
  }
  
  async createStepEditorFor(script) {
    const stepEditor = await (<vivide-step-editor></vivide-step-editor>);
    stepEditor.setStep(script);
    stepEditor.setScriptEditor(this);
    stepEditor.addEventListener('mousedown', () => {
      if (!this.settingLoopStart) return;
      
      stepEditor.setToLoopStart();
      this.updateLoopState();
      this.firstStep.update();
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