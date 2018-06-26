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
    this.registerButtons();
    
    // Show script type dialog at mouse position
    this.get('#addScript').addEventListener("mousedown", event => {
      this.addScriptX = event.clientX;
      this.addScriptY = event.clientY;
    });
    
    this.container = this.get('#container');
    this.createTypeMenu();
    this.settingLoopStart = false;
    this.newScriptPosition = null;
  }
  
  initialFocus() {
    
  }
  
  onAddScript() {
    this.showTypeMenu(this.addScriptX, this.addScriptY);
  }
  
  onSetLoopStart() {
    this.settingLoopStart = true;
  }
  
  onRemoveLoop() {
    if (!this.script) return;
    
    let script = this.script;
    while (!script.lastScript && script.nextScript) {
      script = script.nextScript;
    }
    
    script.nextScript = null;
    this.get('#loop-marker').style.display = "none";
    this.script.update();
  }
  
  showTypeMenu(posX, posY, position = null) {
    this.newScriptPosition = position;
    this.typeMenu.style.left = posX + "px";
    this.typeMenu.style.top = posY + "px";
    this.container.insertBefore(this.typeMenu, this.editorList);
  }
  
  /**
   * Creates and initializes the context menu used to add
   * additional scripts.
   */
  createTypeMenu() {
    this.typeMenu = document.createElement('div');
    this.typeMenu.classList = "type-menu";

    let list = document.createElement('ul');
    let createListItem = (type) => {
      let listItem = document.createElement('li');
      listItem.setAttribute('data-type', type.toLowerCase());
      listItem.innerHTML = type;
      listItem.addEventListener("mousedown", () => {
        this.typeMenu.chosenType = listItem.dataset.type;
      });
      
      return listItem;
    }
    list.appendChild(createListItem('Transform'));
    list.appendChild(createListItem('Extract'));
    list.appendChild(createListItem('Descent'));

    this.typeMenu.appendChild(list);
    this.typeMenu.addEventListener("mousedown", () => {
      this.typeMenu.remove();
      this.appendStepEditor(this.typeMenu.chosenType);
    });
  }
  
  removeScript(stepEditor, removedScript) {
    var script = this.script;
    var lastScript = null
    
    while (!script.lastScript && script.nextScript) {
      if (removedScript === script) break;
      lastScript = script;
      script = script.nextScript;
    }
    
    stepEditor.previousSibling.remove();
    stepEditor.remove();
    
    if (lastScript) {
      lastScript.nextScript = script.nextScript;
    } else {
      // First script was removed
      this.script = removedScript.nextScript;
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
    let loopStart = this.lastScript.nextScript;
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
    while (script.nextScript != null) {
      script = script.nextScript;
      await this.createStepEditorFor(script);
      
      if (script.lastScript) break;
    }
    
    this.lastScript = script;
    this.updateLoopState();
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
}