import Morph from 'src/components/widgets/lively-morph.js';
import { clamp, uuid, shake } from 'utils';

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
  
  removeLoop() {
    if (!this.firstStep) return;
    
    let script = this.firstStep.getLastStep();
    
    script.nextStep = null;
    this.updateLoopState();
    this.firstStep.update();
  }
  
  // #TODO: terminology and reuse
  removeStep(stepEditor, stepToBeRemoved) {
    if(this.currentScript.numberOfSteps() <= 1) {
      lively.warn('Do not remove the final script step.');
      shake(this.get('vivide-step-editor'));
      return;
    }
    
    this.removeStepEditor(stepEditor);

    this.currentScript.removeStep(stepToBeRemoved);
    
    this.currentScript.gotUpdated();
  }
  removeStepEditor(stepEditor) {
    // save editor index
    const editors = this.getAllSubmorphs('vivide-step-editor');
    let index = editors.indexOf(stepEditor);
    
    stepEditor.remove();

    // focus suitable editor
    const updatedEditors = this.getAllSubmorphs('vivide-step-editor');
    index = clamp.call(index, 0, updatedEditors.length - 1);
    this.delayedFocusOnStepEditor(updatedEditors[index]);
  }
  
  async insertStepAfter(stepType, prevStep, prevEditor) {
    let step = await this.view.insertStepAfter(stepType, prevStep);

    const stepEditor = await this.insertNewStepEditorAfter(step, prevEditor);
    this.updateLoopState();
    stepEditor.setFocus();
  }
  
  updateLoopState() {
    const editorListContent = Array.from(this.editorList.children);
    const loopStart = this.currentScript.getLoopStartStep();
    
    editorListContent.forEach(stepEditor => stepEditor.hideLoopMarker());
    if(loopStart) {
      const loopEditor = editorListContent.find(stepEditor => stepEditor.containsStep(loopStart));
      loopEditor && loopEditor.showLoopMarker();
    }
  }
  
  async setScript(currentScript) {
    this.currentScript = currentScript;
    
    this.editorList.innerHTML = '';
    this.firstStep.iterateLinearAsync(async step => {
      return await this.appendNewStepEditorFor(step);
    });
    
    this.updateLoopState();
  }
  
  get firstStep() {
    return this.currentScript && this.currentScript.getInitialStep();
  }
  
  async createStepEditorFor(script) {
    const stepEditor = await (<vivide-step-editor></vivide-step-editor>);
    stepEditor.setStep(script);
    stepEditor.setScriptEditor(this);
    stepEditor.addEventListener('mousedown', () => {
      if (!this.settingLoopStart) return;
      
      stepEditor.setToLoopStart();
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
    this.setScript(other.currentScript);
  }
}