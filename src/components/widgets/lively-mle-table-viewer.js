"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import {SocketSingleton} from 'src/components/mle/socket.js';

export default class LivelyMleTableViewer extends Morph {
  async initialize() {
    this.length = 0;
    this.windowTitle = "LivelyMleTableViewer";
    this.registerButtons();
    this.initialized = false;
    lively.html.registerKeys(this); // automatically installs handler for some methods
    this.innerHTML = '';
    this.socket = await SocketSingleton.get();
    this.socket.on('busy', () => lively.warn('Resource currently busy'));
    this.socket.on('failure', err => lively.error('Resource failed processing', err));
    this.socket.on('success', status => {
      if(status === "connected"){
        lively.notify('Connected');
      }
      if(status === "gotTable" ) {
        lively.success('Resource successfully processed');
      }
    });
    this.socket.on('result', r => {
      if(r.rows !== undefined && r.metaData !== undefined){
        result.innerHTML ='';
        const header = <thead><tr></tr></thead>;
        const body = <tbody></tbody>;
        r.metaData.forEach(k => header.firstChild.appendChild(<th>{k.name}</th>))
        r.rows.forEach(r => {
          const row = <tr></tr>;
          Object.values(r).forEach(v => row.appendChild(<td>{v}</td>));
          body.appendChild(row);
        });
        result.appendChild(header);
        result.appendChild(body);
      }
    });
    const selector = <input type="text" placeholder="Table Name"/>;
    const execute = <button id="execute" className="button" click={() => {
      this.socket.emit('getTable', {
        table: selector.value          
      });
    }}>View Table</button>
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