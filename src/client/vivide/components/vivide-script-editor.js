import Morph from 'src/components/widgets/lively-morph.js';

export default class VivideScriptEditor extends Morph {
  get editorList() { return this.get('#editor-list'); }
  
  async initialize() {
    this.windowTitle = "VivideScriptEditor";
    
    this.cm = await lively.create("lively-code-mirror");
    this.cm.setOption('viewportMargin', Infinity);
    this.cm.value = 'Initializing Script...';
    this.cm.doSave = text => this.scriptSaved(text)
    this.editorList.appendChild(this.cm);
  }
  
  initialFocus() {
    lively.error('#TODO: implement this');
  }
  
  async setScriptURLString(urlString) {
    this.urlString = urlString;
    let txt = await fetch(urlString).then(res => res.text());
    
    this.cm.value = txt;
  }
  async scriptSaved(text) {
    if(!this.urlString) {
      lively.warn('No file set for this editor.');
      return;
    }
    
    await lively.unloadModule(this.urlString);
    await lively.files.saveFile(this.urlString, text);    
    
    this.broadcastChange(this.urlString);
  }
  broadcastChange(urlString) {
    Array.from(document.querySelectorAll('vivide-view'))
      .forEach(vivideView => {
        vivideView.scriptGotUpdated(urlString);
      });
  }
}