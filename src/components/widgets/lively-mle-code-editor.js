"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import SocketIO from 'src/external/socketio.js';

export default class LivelyMleCodeEditor extends Morph {
  async initialize() {
    this.successCount = 0;
    this.windowTitle = "MLE Code Editor";
    this.registerButtons()
    this.innerHTML = '';
    this.socket = SocketIO("http://132.145.55.192");
    this.socket.on('connection', socket => {
      socket.emit('options', );
      socket.on('busy', () => lively.warn('Resource currently busy'));
      socket.on('failure', err => lively.error('Resource failed processing', err));
      socket.on('success', () => {
        this.succesCount++;
        if(this.successCount < 2){
          socket.emit('deploy');
        } else {
          this.successCount = 0;
          lively.success('Resource successfully processed');
        }
      });
    }),
    lively.html.registerKeys(this); // automatically installs handler for some methods
    this.editor = <lively-code-mirror></lively-code-mirror>;
    const deploy = <button id='deploy' click={() => {
      this.editor.then(e => this.socket.emit('save', e.editor.getValue()));     
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