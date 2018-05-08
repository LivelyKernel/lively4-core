import Morph from 'src/components/widgets/lively-morph.js';
import { uuid } from 'utils';

export default class VivideScriptEditor extends Morph {
  static get vivideScript() { return 'vivide_script_id'; }
  
  get editorList() { return this.get('#editor-list'); }
  get inspector() { return this.get('#inspector'); }
  get scripts() {
    return this.getJSONAttribute(VivideScriptEditor.vivideScript);
  }
  set scripts(scripts) {
    this.setJSONAttribute(VivideScriptEditor.vivideScript, scripts);
    return scripts;
  }
  
  async initialize() {
    this.windowTitle = "VivideScriptEditor";
    this.inspector.hideWorkspace();
  }
  
  initialFocus() {
    lively.error('#TODO: implement this');
  }
  
  async setScripts(scripts) {
    this.scripts = scripts;
    
    let createStepEditorFor = (script, id) => {
      let stepEditor = document.createElement('vivide-step-editor');
      stepEditor.setScriptEditor(this);
      stepEditor.setStepScript(script);
      stepEditor.id = id;      
      this.editorList.appendChild(stepEditor);
    }
    
    this.editorList.innerHTML = '';
    this.editorList.appendChild(<span>Next Level</span>);
    this.editorList.appendChild(<span>-- transform --</span>);
    this.scripts.transform.forEach(element => createStepEditorFor(element, "transform"));
    this.editorList.appendChild(<span>-- extract --</span>);
    this.scripts.extract.forEach(element => createStepEditorFor(element, "extract"));
    if(this.scripts.descent) {
      this.editorList.appendChild(<span>-- descent --</span>);
      this.scripts.descent.forEach(element => createStepEditorFor(element, "descent"));
    }
  }
  
  async scriptSaved() {
    if(!this.scripts) {
      lively.warn('No file set for this editor.');
      return;
    }
    
    this.broadcastChange(this.scripts);
  }
  
  broadcastChange(scripts) {
    // TODO: Replace with proper ownership
    Array.from(document.querySelectorAll('vivide-view'))
      .forEach(vivideView => {
        vivideView.scriptGotUpdated(scripts);
      });
  }
  
  stepChanged(editor, stepScript) {
    let scripts = this.scripts;
    scripts[editor.id] = new Array(stepScript);
    this.scripts = scripts;
    
    if (this.scripts) {
      this.broadcastChange(this.scripts);
    } else {
      lively.warn('No url for script editor given.');
    }
  }
  
  livelyMigrate(other) {
    this.setScripts(other.scripts);
  }
}