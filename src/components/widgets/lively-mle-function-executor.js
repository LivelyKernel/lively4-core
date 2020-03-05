"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import { SocketSingleton } from 'src/components/mle/socket.js';

function parseType(type) {
  switch(type){
    case 0: return "String";
    case 1: return "Number";
    default: return "";
  }
}

function drawParam(type, name) {
  return <div class="field has-addons">
    <p class="control">
      <button class="button is-static" tabindex="-1">{name}</button>
    </p>
    <p class="control is-expanded">
    <input type={type == 1 ? "number" : "text"} class="input" id={`param-${name}`}/>
    </p>
    <p class="control">
      <button class="button is-static" tabindex="-1">{parseType(type)}</button>
    </p>
  </div>;
}

export default class LivelyMleFunctionExecutor extends Morph {
  async initialize() {
    this.windowTitle = "MLE Function Executor";
    this.registerButtons();
    this.id = this.getAttribute("id");
    this.socket = await SocketSingleton.get();
    this.socket.emit("getTypes");
    this.shadowRoot.getElementById("function").onchange = evt => {
      this.shadowRoot.getElementById("params").innerHTML = "";
      this.shadowRoot.getElementById("testButton").disabled = this.types
        .filter(t => t.name === evt.target.value)[0].returnType === 2 ? true : false;
      this.types.find(t => t.name === evt.target.value).parameters
        .forEach(p => {
          this.shadowRoot.getElementById("params").appendChild(drawParam(p.type, p.name))
        });
    }
    this.socket.on('failure', () => {
      this.loading = false;
    })
    this.socket.on('busy', m => {
      this.loading = false;
    });
    this.socket.on('result', (r, status) => {
        if (status === "tested" && r.id == this.id) {
          this.result=r.data.rows[0][0];
          this.loading = false;
        }
        if (status === "gotTypes") {
          if(JSON.stringify(this.types) === JSON.stringify(r)) return;
          this.types = r;
          const select = this.shadowRoot.getElementById("function");
          select.innerHTML = "";
          this.shadowRoot.getElementById("params").innerHTML = "";
          r
            .map(f => {
              select.appendChild(<option>{f.name}</option>);
              return f.parameters;
            })[0]
            .forEach(p => {
              this.shadowRoot.getElementById("params").appendChild(drawParam(p.type, p.name));
            });
        }
      }
    );
  }

  onDeleteButton() {
    lively.error("Deletion function not implemented");
  }

  onTestButton() {
    this.loading = true;   
    this.socket.emit('test', {
      id: this.id,
      func: this.func,
      parameters: this.params
    })
  }
  
  get func(){
     return this.shadowRoot.getElementById("function").value;
  }
  
  get params(){
    return this.types.find(t => t.name == this.func).parameters.map(p => {
        const value = this.shadowRoot.getElementById(`param-${p.name}`).value;
        return p.type === 1 ? +value : value;
    })
  }
  
  set result(res){
    this.loading = false;
    const result = this.shadowRoot.getElementById("result");
    result.value = res;
    const expected = this.shadowRoot.getElementById("expected").value;
    if(expected){
      const indication = this.shadowRoot.getElementById("indicator");
      if(expected == res){
        result.className="input is-success";
        indication.className="button is-success";
      } else {
        result.className="input is-danger";
        indication.className="button is-danger";
      }
    }
  }
  
  set loading(v){
    this.shadowRoot.getElementById("indicator").className = `button ${v ? "is-loading" : ""} is-static`;
    if (this.types){
      this.types.find(t => t.name == this.func).parameters.forEach(p => {
        this.shadowRoot.getElementById(`param-${p.name}`).disabled = v;
      })
    }
    this.shadowRoot.getElementById("function").disabled = v;
    this.shadowRoot.getElementById("testButton").disabled =v;
    this.shadowRoot.getElementById("testButton").className = `button is-primary ${v ? "is-loading" : ""}`;
  }

  /* Lively-specific API */

  // store something that would be lost
  livelyPrepareSave() {
    this.setAttribute("id", this.id)
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
}
