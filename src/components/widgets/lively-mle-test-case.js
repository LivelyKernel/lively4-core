"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import {SocketSingleton} from 'src/components/mle/socket.js';

export default class LivelyMleTestCase extends Morph {
  async initialize() {
    this.windowTitle = "LivelyMleTestCase";
    this.socket = await SocketSingleton.get();
    this.socket.on("result", (r, status) => {
      if(status === "multipleTests"){
        lively.notify("Test executed");
        r.forEach(res => {
          this.cases[res.id].value = res.result;
          this.cases[res.id].result = this.cases[res.id].expected == res.result;
        })
        this.paintCases();
      }
    });
    this.cases = [];
    this.button = <button id="add" click={_ => {
      this.cases.push({
        id: this.cases.length,
        func: "func",
        params: [],
        types: [],
        expected: 0,
        value: ""
      });
      this.paintCases();
    }}>New Test Case</button>;
    this.execute = <button id="execute" click={_ =>{
      this.socket.emit("multipleTests", this.cases.map((el, i) => ({
          id: el.id,
          func: el.func,
          params: el.params.map((p, x) => el.types[x] === "String" ? ""+p : +p)
        })
      ));    
    }}>Execute</button>
    this.paintCases();
  }
  
  paintCases(){
    this.get("#content").innerHTML ="";
    const canvas = this.cases.map(c => { return (
    <div>
      <p>
        {c.id}
      <input
        placeholder="Function Name"
        type="text"
        value={c.func}
        change={e => {
          this.cases[c.id].func = e.target.value;
          this.paintCases();
        }}
      />
      <input
        type="number"
        placeholder="Arguments amount"
        value={c.params.length}
        change={e => {
          if(e.target.value > c.params.length){
            this.cases[c.id].types.push("string");
            this.cases[c.id].params.push("string");
          }
          if(e.target.value < c.params.length){
            this.cases[c.id].types.pop();
            this.cases[c.id].params.pop();
          }
            
          this.paintCases();
        }}
      />
      <input
        type="text"
        placeholder="Expected"
        value={c.expected}
        change={e => {
          this.cases[c.id].expected = e.target.value;
          this.paintCases();
        }}
      />
      </p>
      {...c.params.map((param,i) => <p><select change={e => this.cases[c.id].types[i] = e.target.value}><option>Number</option><option>String</option></select><input value={param} type="text" change={e => this.cases[c.id].params[i] = e.target.value}/></p>)}
      <p>
        <input
          disabled
          value={c.value}
        />
        {c.result ? <i class="fa fa-check"></i> : <i class="fa fa-times"></i>}
        <button click={_ => {
            this.cases = this.cases.filter(el => {
              return el.id !== c.id
            })
            this.paintCases();
        }}>Remove</button>
      </p>
    </div>
    )});
    this.get("#content").appendChild(<div>{...canvas}{this.button}{this.execute}</div>);
  }

  /* Lively-specific API */

  // store something that would be lost
  livelyPrepareSave() {
  }
  
  livelyPreMigrate() {
    // is called on the old object before the migration
  }
  
  livelyMigrate(other) {
    // whenever a component is replaced with a newer version during development
    // this method is called on the new object during migration, but before initialization
  }
  
  livelyInspect(contentNode, inspector) {
    // do nothing
  }
  
  async livelyExample() {
    // this customizes a default instance to a pretty example
    // this is used by the 
  }
  
  
}