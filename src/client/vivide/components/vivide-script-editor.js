import Morph from 'src/components/widgets/lively-morph.js';
import { uuid } from 'utils';

export default class VivideScriptEditor extends Morph {
  static get vivideScript() { return 'vivide_script_id'; }
  
  get editorList() { return this.get('#editor-list'); }
  get inspector() { return this.get('#inspector'); }
  
  setView(view) {
    this.view = view;
    return view;
  }
  
  async initialize() {
    this.windowTitle = "VivideScriptEditor";
    this.inspector.hideWorkspace();
  }
  
  initialFocus() {
    
  }
  
  async setScripts(scripts) {
    let createStepEditorFor = (script) => {
      let stepEditor = document.createElement('vivide-step-editor');
      stepEditor.setStepScript(script);    
      this.editorList.appendChild(stepEditor);
    }
    
    this.editorList.innerHTML = '';
    this.editorList.appendChild(<span>Next Level</span>);
    this.editorList.appendChild(<span>-- transform --</span>);
    scripts.transform.forEach(script => createStepEditorFor(script));
    this.editorList.appendChild(<span>-- extract --</span>);
    scripts.extract.forEach(script => createStepEditorFor(script));
    if (scripts.descent) {
      this.editorList.appendChild(<span>-- descent --</span>);
      scripts.descent.forEach(script => createStepEditorFor(script));
    }
  }
}