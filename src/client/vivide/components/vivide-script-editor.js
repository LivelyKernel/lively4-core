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
    this.showTypeMenu(this.addScriptX, this.addScriptY);
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
  
  async appendStepEditor(scriptType) {
    let script = await this.view.appendScript(scriptType);
    this.lastScript = script;
    this.createStepEditorFor(script);
    this.updateStepEditorState();
  }
  
  updateStepEditorState() {
    let editorListContent = this.editorList.children;
    let loopStart = this.lastScript.nextScript;
    
    for (let element of editorListContent) {
      if (element.localName != 'vivide-step-editor') continue;
      if (!element.containsScript(loopStart)) continue;
      
      debugger;
      
      let loopmarker = this.get('#loop-marker');
      loopmarker.style.display = "inline-block";
      loopmarker.style.top = element.offsetTop + "px";
      loopmarker.style.height = element.offsetHeight + "px";
    }
  }
  
  async setScripts(script) {    
    this.editorList.innerHTML = '';
    
    await this.createStepEditorFor(script);
    while (script.nextScript != null) {
      script = script.nextScript;
      await this.createStepEditorFor(script);
      
      if (script.lastScript) break;
    }
    
    this.lastScript = script;
    this.updateStepEditorState();
  }
  
  async createStepEditorFor(script) {
    let stepEditor = await (<vivide-step-editor></vivide-step-editor>);
    stepEditor.setStepScript(script);
    stepEditor.setScriptEditor(this);
    this.editorList.appendChild(<span>-- {script.type} --</span>);
    this.editorList.appendChild(stepEditor);
  }
}