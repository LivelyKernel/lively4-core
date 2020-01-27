"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import {SocketSingleton} from 'src/components/mle/socket.js';

export default class LivelyMleFunctionExecutor extends Morph {
  async initialize() {
    this.amount = 0;
    this.initialized = false;
    this.windowTitle = "MLE Function Executor";
    this.registerButtons()
    this.socket = await SocketSingleton.get();
    this.socket.on('busy', () => lively.warn('Resource currently busy'));
    this.socket.on('failure', err => lively.error('Resource failed processing', err));
    this.socket.on('success', status => {
      if(status === "connected"){
        lively.notify('Connected');
      }
      if (status === "tested") {
        lively.success('Resource successfully processed');
      }
    });
    this.socket.on('result', r => {if(r && r.rows) result.value = r.rows[0][0]});
    this.innerHTML = '';
    this.types = [];
    this.args= [];
    this.typeSelectors = <div></div>;
    const argsAmount = <input type="number" placeholder="Arguments Amount" change={e => {
      this.redrawTypes(this.amount, e.target.value);
      this.amount = e.target.value;
    }}/>;
    const functionName = <input placeholder="Function Name" type="text"></input>;
    const test = <button id='test' click={() => {
      this.socket.emit('test', {
        func: functionName.value,
        parameters: this.args.filter((_, i) => i<this.amount).map((x,i) => this.types[i] === "String" ? x : +x)
      })
    }}>Test</button>;
    const result = <input disabled type="text" />;
    const surrounding = <div>{functionName}{argsAmount}{this.typeSelectors}{test}{result}</div>;
    this.appendChild(surrounding);
  }

  redrawTypes(oA, nA){
    if(oA === nA) return;
    if(oA < nA){
      for(let i = 0; i< nA-oA; i++){
        this.typeSelectors.appendChild(<p><select change={e => this.types[+oA+i] = e.target.value}><option>Number</option><option>String</option></select><input type="text" change={e => this.args[+oA+i] = e.target.value}/></p>)
      }
    }
    if(oA > nA){
      for(let i =0; i< oA-nA; i++){
        this.typeSelectors.removeChild(this.typeSelectors.lastChild);
      }
    }
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