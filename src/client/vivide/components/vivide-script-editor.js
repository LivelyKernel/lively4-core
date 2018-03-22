import Morph from 'src/components/widgets/lively-morph.js';

export default class VivideScriptEditor extends Morph {
  static get vivideScriptId() { return 'vivide_script_id'; }
  
  get editorList() { return this.get('#editor-list'); }
  get inspector() { return this.get('#inspector'); }
  get scriptURLString() {
    return this.getAttribute(VivideScriptEditor.vivideScriptId);
  }
  set scriptURLString(scriptURLString) {
    this.setAttribute(VivideScriptEditor.vivideScriptId, scriptURLString);
    return scriptURLString;
  }
  
  async initialize() {
    this.windowTitle = "VivideScriptEditor";
    
    // this.cm = await lively.create("lively-code-mirror");
    // this.cm.setOption('viewportMargin', Infinity);
    // this.cm.value = 'Initializing Script...';
    // this.cm.doSave = text => this.scriptSaved(text)
    // this.editorList.appendChild(this.cm);
    //this.setScriptURLString('src/client/vivide/scripts/scripts/test.json');
    this.inspector.hideWorkspace()
  }
  
  initialFocus() {
    lively.error('#TODO: implement this');
  }
  
  async setScriptURLString(urlString) {
    this.scriptURLString = urlString;
    let json = await fetch(urlString).then(res => res.json());
    
    let createStepEditorFor = url => {
      let stepEditor = document.createElement('vivide-step-editor');
      stepEditor.setScriptEditor(this);
      stepEditor.setStepURLString(url);
      
      this.editorList.appendChild(stepEditor);
    }

    this.editorList.innerHTML = '';
    json.forEach(level => {
      this.editorList.appendChild(<span>Next Level</span>);
      this.editorList.appendChild(<span>-- transform --</span>);
      level.transform.forEach(createStepEditorFor);
      this.editorList.appendChild(<span>-- extract --</span>);
      level.extract.forEach(createStepEditorFor);
      if(level.descent) {
        this.editorList.appendChild(<span>-- descent --</span>);
        createStepEditorFor(level.descent);
      }
    });
  }
  
  async scriptSaved(text) {
    if(!this.scriptURLString) {
      lively.warn('No file set for this editor.');
      return;
    }
    
    await lively.unloadModule(this.scriptURLString);
    await lively.files.saveFile(this.scriptURLString, text);    
    
    this.broadcastChange(this.scriptURLString);
  }
  broadcastChange(urlString) {
    Array.from(document.querySelectorAll('vivide-view'))
      .forEach(vivideView => {
        vivideView.scriptGotUpdated(urlString);
      });
  }
  stepChanged(editor, stepURLString) {
    if(this.scriptURLString) {
      this.broadcastChange(this.scriptURLString);
    } else {
      lively.warn('No url for script editor given.');
    }
  }
  
  livelyMigrate(other) {
    this.setScriptURLString(other.scriptURLString);
  }
}