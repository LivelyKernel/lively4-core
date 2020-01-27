"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import {SocketSingleton} from 'src/components/mle/socket.js';

export default class LivelyMleCodeEditor extends Morph {
  async initialize() {
    this.successCount = 0;
    this.initialized = false;
    this.windowTitle = "MLE Code Editor";
    this.registerButtons()
    this.innerHTML = '';
    this.socket = await SocketSingleton.get();
    this.socket.on('busy', () => lively.warn('Resource currently busy'));
    this.socket.on('failure', err => lively.error('Resource failed processing', err));
    this.socket.on('success', status => {
      if(status === "connected"){
        lively.notify('Connected');
      }
      if(status === "saved"){
        lively.success('Resource successfully saved');
        this.socket.emit('deploy',{
          connectionString: '132.145.55.192:1521/MLEEDITOR',
          user: 'system',
          password: 'MY_PASSWORD_123'
        });
      }
      if(status ==="deployed"){
        lively.success('Resource successfully deployed');
      }
    });
    this.editor = <lively-code-mirror></lively-code-mirror>;
    const deploy = <button id='deploy' className="button" click={() => {
      this.editor.then(e => {
        lively.notify('Now deploying');
        this.socket.emit('save', {
          file: e.editor.getValue()
      });
    });     
    }}>Deploy</button>;
    const surrounding = <div>{deploy}{this.editor}</div>;
    this.appendChild(surrounding);
  }
  
  /* Lively-specific API */

  // store something that would be lost
  livelyPrepareSave() {
    this.setAttribute("data-mydata", this.get("#textField").value)
  }
  
  livelyPreMigrate() {
    // is called on the old object before the migration
  }
  
  livelyMigrate(other) {
    // whenever a component is replaced with a newer version during development
    // this method is called on the new object during migration, but before initialization
    this.someJavaScriptProperty = other.someJavaScriptProperty
  }
  
  livelyInspect(contentNode, inspector) {
    // do nothing
  }
  
  async livelyExample() {
    // this customizes a default instance to a pretty example
    // this is used by the 
    this.style.backgroundColor = "lightgray"
    this.someJavaScriptProperty = 42
  }
  
  
}