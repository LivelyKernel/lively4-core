import Morph from 'src/components/widgets/lively-morph.js';
import { clamp, uuid, shake } from 'utils';

export default class VivideScriptEditor extends Morph {
  static get vivideScript() { return 'vivide_script_id'; }
  
  get editorList() { return this.get('#editor-list'); }
  get inspector() { return this.get('#inspector'); }
  
  setView(view) { return this.view = view; }
  getView() { return this.view; }
  
  async initialize() {
    this.windowTitle = "VivideScriptEditor";

    // this.inspector.hideWorkspace();
  }
  
  initialFocus() {
    setTimeout(() => {
      const stepEditor = this.get('vivide-step-editor');
      this.delayedFocusOnStepEditor(stepEditor);
    }, 1000);
  }
  delayedFocusOnStepEditor(stepEditor) {
    stepEditor && stepEditor.delayedFocus && stepEditor.delayedFocus();
  }
  
  removeLoop() {
    this.currentScript.removeLoop();
    
    this.updateLoopState();
    this.currentScript.gotUpdated();
  }
  setLoopStart(step) {
    this.currentScript.setLoopStart(step);
    
    this.updateLoopState();
    this.currentScript.gotUpdated();
  }
  
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
    const step = await this.currentScript.insertStepAfter(stepType, prevStep);

    const stepEditor = await this.insertNewStepEditorAfter(step, prevEditor);
    this.updateLoopState();
    stepEditor.setFocus();
  }
  
  updateLoopState() {
    const stepEditors = this.getAllSubmorphs('vivide-step-editor');
    stepEditors.forEach(stepEditor => stepEditor.hideLoopMarker());
    
    const loopStart = this.currentScript.getLoopStartStep();
    if(!loopStart) { return; }
    
    const loopEditor = stepEditors.find(stepEditor => stepEditor.containsStep(loopStart));
    if(loopEditor) {
      loopEditor.showLoopMarker();
    }
  }
  
  getScript() { return this.currentScript; }
  async setScript(currentScript) {
    this.currentScript = currentScript;
    
    this.editorList.innerHTML = '';
    await this.currentScript.forEachStepAsync(
      async step => {
        console.warn('start processing step:', step);
        return await this.appendNewStepEditorFor(step);
      }
    );
    
    this.updateLoopState();
  }
  
  async createStepEditorFor(step) {
    const stepEditor = await (<vivide-step-editor></vivide-step-editor>);
    
    stepEditor.setStep(step);
    stepEditor.setScriptEditor(this);

    return stepEditor;
  }
  async insertNewStepEditorAfter(step, prevEditor) {
    const stepEditor = await this.createStepEditorFor(step);
    this.editorList.insertBefore(stepEditor, prevEditor.nextSibling);
    
    return stepEditor;
  }
  async appendNewStepEditorFor(step) {
    const stepEditor = await this.createStepEditorFor(step);
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
    
    // we are missing the loop indecator otherwise, even though we update it
    requestAnimationFrame(() => this.updateLoopState());
  }
}