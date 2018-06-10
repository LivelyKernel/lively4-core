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
  }
  
  initialFocus() {
    
  }
  
  onAddScript() {
    this.typeMenu.style.left = this.addScriptX + "px";
    this.typeMenu.style.top = this.addScriptY + "px";
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
  
  async appendStepEditor(scriptType) {
    let script = await this.view.appendScript(scriptType);
    this.createStepEditorFor(script);
  }
  
  async setScripts(firstScript) {    
    this.editorList.innerHTML = '';
    
    await this.createStepEditorFor(firstScript);
    while (firstScript.nextScript != null) {
      firstScript = firstScript.nextScript;
      await this.createStepEditorFor(firstScript);
      
      if (firstScript.lastScript) break;
    }
  }
  
  async createStepEditorFor(script) {
    let stepEditor = await (<vivide-step-editor></vivide-step-editor>);
    stepEditor.setStepScript(script);
    this.editorList.appendChild(<span>-- {script.type} --</span>);
    this.editorList.appendChild(stepEditor);
  }
}