"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import SocketIO from 'src/external/socketio.js';

export default class LivelyMleTableViewer extends Morph {
  async initialize() {
    this.windowTitle = "LivelyMleTableViewer";
    this.registerButtons()

    lively.html.registerKeys(this); // automatically installs handler for some methods
    this.innerHTML = '';
    this.socket = SocketIO("http://132.145.55.192");
    this.socket.on('connection', socket => {
      socket.emit('options', );
      socket.on('busy', () => lively.warn('Resource currently busy'));
      socket.on('failure', err => lively.error('Resource failed processing', err));
      socket.on('success', () => {
        lively.success('Resource successfully processed');
      });
      socket.on('result', r => {
        result.innerHTML ='';
        const header = <thead><tr></tr></thead>;
        const body = <tbody></tbody>;
        Object.keys(r.rows[1]).forEach(k => header.firstChild.appendChild(<th>{k}</th>))
        r.rows.forEach(r => {
          const row = <tr></tr>;
          Object.values(r).forEach(v => row.appendChild(<td>{v}</td>));
          body.appendChild(row);
        })
        result.appendChild(header);
        result.appendChild(body);
      });
    });
    const selector = <input type="text" placeholder="Table Name"/>;
    const execute = <button id="execute" click={() => this.socket.emit('getTable', {
      table: selector.value          
    })}>View Table</button>
    const result = <table></table>;
    const surrounding = <div><p>{selector}{execute}</p>{result}</div>;
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