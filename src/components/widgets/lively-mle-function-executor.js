"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import SocketIO from 'src/external/socketio.js';

export default class LivelyMleFunctionExecutor extends Morph {
  async initialize() {
    this.initialized = false;
    this.windowTitle = "MLE Function Executor";
    this.registerButtons()
    this.socket = SocketIO("http://132.145.55.192:8080");
    this.socket.emit('options',  {
      connectString: 'localhost:1521/MLE',
      user: 'system',
      password: 'MY_PASSWORD_123'
    });
    this.socket.on('busy', () => lively.warn('Resource currently busy'));
    this.socket.on('failure', err => lively.error('Resource failed processing', err));
    this.socket.on('success', () => {
      if(!this.initialized){
        this.initialized = true;
        lively.notify('Connected');
      }
      lively.success('Resource successfully processed');
    });
    this.socket.on('result', r => {result.values = JSON.stringify(r.rows)});
    lively.html.registerKeys(this); // automatically installs handler for some methods
    this.innerHTML = '';
    this.amount = 0;
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
        func: this.functionName.value,
        parameters: this.args.map((x,i) => this.types[i] === "String" ? x : +x)
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