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
    
    scripts.forEach(script => {
      this.editorList.appendChild(<span>-- {script.type} --</span>);
      createStepEditorFor(script);
    });
  }
}