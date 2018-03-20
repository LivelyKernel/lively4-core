import Morph from 'src/components/widgets/lively-morph.js';

export default class VivideScriptEditor extends Morph {
  get editorList() { return this.get('#editor-list'); }
  
  async initialize() {
    this.windowTitle = "VivideScriptEditor";
    
    // this.cm = await lively.create("lively-code-mirror");
    // this.cm.setOption('viewportMargin', Infinity);
    // this.cm.value = 'Initializing Script...';
    // this.cm.doSave = text => this.scriptSaved(text)
    // this.editorList.appendChild(this.cm);
    //this.setScriptURLString('src/client/vivide/scripts/scripts/test.json');
  }
  
  initialFocus() {
    lively.error('#TODO: implement this');
  }
  
  async setScriptURLString(urlString) {
    this._urlString = urlString;
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
    if(!this._urlString) {
      lively.warn('No file set for this editor.');
      return;
    }
    
    await lively.unloadModule(this._urlString);
    await lively.files.saveFile(this._urlString, text);    
    
    this.broadcastChange(this._urlString);
  }
  broadcastChange(urlString) {
    Array.from(document.querySelectorAll('vivide-view'))
      .forEach(vivideView => {
        vivideView.scriptGotUpdated(urlString);
      });
  }
  stepChanged(editor, stepURLString) {
    if(this._urlString) {
      this.broadcastChange(this._urlString);
    } else {
      lively.warn('No url for script editor given.');
    }
  }
}