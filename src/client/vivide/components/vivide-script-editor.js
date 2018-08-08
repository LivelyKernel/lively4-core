import Morph from 'src/components/widgets/lively-morph.js';
import { uuid } from 'utils';
import ContextMenu from "src/client/contextmenu.js";

export default class VivideScriptEditor extends Morph {
  static get vivideScript() { return 'vivide_script_id'; }
  
  get editorList() { return this.get('#editor-list'); }
  get inspector() { return this.get('#inspector'); }
  
  setView(view) { return this.view = view; }
  getView() { return this.view; }
  
  async initialize() {
    this.windowTitle = "VivideScriptEditor";
    this.inspector.hideWorkspace();
    this.registerButtons();
    
    this.container = this.get('#container');
    this.settingLoopStart = false;
    this.newScriptPosition = null;
  }
  
  initialFocus() {
    
  }
  
  onAddScript(evt) {
    this.showTypeMenu(evt);
  }
  
  onSetLoopStart() {
    this.settingLoopStart = true;
  }
  
  onRemoveLoop() {
    if (!this.script) return;
    
    let script = this.script;
    while (!script.lastScript && script.nextStep) {
      script = script.nextStep;
    }
    
    script.nextStep = null;
    this.get('#loop-marker').style.display = "none";
    this.script.update();
  }
  
  async showTypeMenu(evt, position = null) {
    this.newScriptPosition = position;
    
    const menuItems = ['Transform', 'Extract', 'Descent'].map(type => {
      return [
        type,
        evt => {
          menu.remove();
          this.appendStepEditor(type.toLowerCase());
        }, type, '<i class="fa fa-arrow-right" aria-hidden="true"></i>'
      ]
    })

    const menu = await ContextMenu.openIn(document.body, evt, undefined, document.body, menuItems);
  }
  
  removeScript(stepEditor, removedScript) {
    var script = this.script;
    var lastScript = null
    
    while (!script.lastScript && script.nextStep) {
      if (removedScript === script) break;
      lastScript = script;
      script = script.nextStep;
    }
    
    stepEditor.previousSibling.remove();
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
  
  async appendStepEditor(scriptType) {
    let position = this.newScriptPosition != null ? this.newScriptPosition.script : null;
    let script = await this.view.insertScript(scriptType, position);

    if (script.lastScript) {
      this.lastScript = script;
    }
    
    this.createStepEditorFor(script);
    this.updateLoopState();
  }
  
  updateLoopState() {
    let editorListContent = this.editorList.children;
    let loopStart = this.lastScript.nextStep;
    for (let element of editorListContent) {
      if (element.localName != 'vivide-step-editor') continue;
      if (!element.containsScript(loopStart)) continue;
      
      let loopmarker = this.get('#loop-marker');
      loopmarker.style.display = "inline-block";
      loopmarker.style.top = element.offsetTop + "px";
      loopmarker.style.height = element.offsetHeight + "px";
    }
  }
  
  async setScripts(script) {    
    this.editorList.innerHTML = '';
    this.script = script;
    
    await this.createStepEditorFor(script);
    while (script.nextStep != null) {
      script = script.nextStep;
      await this.createStepEditorFor(script);
      
      if (script.lastScript) break;
    }
    
    this.lastScript = script;
    this.updateLoopState();
  }
  getScripts() {
    return this.script;
  }
  
  async createStepEditorFor(script) {
    let stepEditor = await (<vivide-step-editor></vivide-step-editor>);
    stepEditor.setStepScript(script);
    stepEditor.setScriptEditor(this);
    stepEditor.addEventListener("mousedown", () => {
      if (!this.settingLoopStart) return;
      
      stepEditor.setToLoopStart();
      this.updateLoopState();
      this.script.update();
      this.settingLoopStart = false;
    });
    
    if (this.newScriptPosition) {
      this.editorList.insertBefore(stepEditor, this.newScriptPosition.editor.nextSibling);
      this.editorList.insertBefore(<span>-- {script.type} --</span>, this.newScriptPosition.editor.nextSibling);
      this.newScriptPosition = null;
    } else {
      this.editorList.appendChild(<span>-- {script.type} --</span>);
      this.editorList.appendChild(stepEditor);
    }
  }
  
  livelyMigrate(other) {
    this.setView(other.getView());
    this.setScripts(other.getScripts());
  }
}