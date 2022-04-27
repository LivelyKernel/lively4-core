"enable aexpr";
import Morph from 'src/components/widgets/lively-morph.js';
import { AExprRegistry } from 'src/client/reactive/active-expression/ae-registry.js';
import Poll from 'src/client/reactive/components/rewritten/poll/poll.js';
import { Layer, proceed } from 'src/client/ContextJS/src/Layers.js';

class Node {
  constructor(value) {
    this.value = value;
  }
}
class LinkedList {
  constructor() {
    this.length = 0;
  }
  pushBack(value) {
    // this.length++; // increasing the length here produces an invalid internal state
    if(!this.start) {
      this.start = new Node(value);
      this.end = this.start;
    } else {
      this.end.child = new Node(value);
      this.end = this.end.child;
    }    
    this.length++; // This is the correct position for increasing the length
  }
  
  average() {
    let sum = 0;
    let current = this.start;
    for(let i = 0; i < this.length; i++) {
      if(!current) break;
      sum += current.value;
      current = current.child;
    }
    return sum / this.length;
  }
  
  median() {
    if(!this.start) return undefined;
    let list = [];
    let current = this.start;
    for(let i = 0; i < this.length; i++) {
      if(!current) break;
      list[i] = current.value;
      current = current.child;
    }
    list.sort();
    if(list.length % 2 === 1) {
      return list[(list.length - 1) / 2];
    } else {
      return (list[list.length / 2 - 1] + list[list.length / 2]) / 2;
    }
  }
  
  map(f) {
    if(!this.start) return [];
    let current = this.start;
    let list = [];
    const l = this.length;
    for(let i = 0; i < l; i++) {
      list[i] = f(current.value);
      current = current.child;
    }
    return list;
  }
  
  mininum() {
    if(!this.start) return undefined;
    let min = this.start.value;
    let current = this.start;
    // Missing dependency if we do not extract this
    const l = this.length;
    for(let i = 0; i < l; i++) {
      if(!current) break;
      if(current.value < min) {  
        min = current.value;
      }      
      current = current.child;
    }
    return min;
  }
}

export default class AexprTest extends Morph {
  async initialize() {
    this.t = 3;
    
    /*always: this.d = this.c * 3;
    always: this.c = this.d * 3;
    aexpr(() => this.c).dataflow(lively.notify);*/
    this.windowTitle = "Active Expression Testing";
    
    this.aes = [];
    this.layersEnabled = false;
    this.layers = [];
        
    this.t++;    
    this.polls = [new Poll(4), new Poll(3)];
    this.mode = false;
    
    this.x = 3;
    this.createButton.addEventListener('click', () => this.addAE());
    this.changeButton.addEventListener('click', () => this.changeAEs());
    this.deleteButton.addEventListener('click', () => this.deleteAEs());
    this.purgeButton.addEventListener('click', () => this.purgeAEs());
    this.createILAButton.addEventListener('click', () => this.addILA());
    this.toggleILAButton.addEventListener('click', () => this.toggleLayers());
    // always: this.y = this.x * 3;
    
    
    const data = new LinkedList();
    /**/// Using AEs
    
    let mean, median, sd, skew;
       
    aexpr(() => (mean - median) / sd) // Wrong order, as this is now prioritized leading to wrong intermediate values
      .onChange(v => skew = v);
    aexpr(() => data.average())
      .onChange(v => mean = v);    
    aexpr(() => data.median())
      .onChange(v => median = v);
    aexpr(() => {
      return Math.sqrt(data.map(x => (x - mean) * (x - mean)).reduce((s, a) => s + a, 0) / data.length)
    }).onChange(v => sd = v);

    data.pushBack(4);
    data.pushBack(1);
    data.pushBack(1);
    debugger;
  }
  
  addAE() {
    this.aes.push(aexpr(() => {
      if(this.mode) {
        return this.polls.map(p => p.getBestOption()).reduce((a, b) => a + b);
      }
      return this.y;      
    }).dataflow(lively.notify));
    
    this.x++;
    this.x++;
  }
  
  addILA() {
    let l = new Layer("highPerformance");
    let l2 = new Layer("debugOutput");
    this.layers.push(l);
    this.layers.push(l2);

    let bool = false;

    const obj = {
      fn() {
        return 17;
      }
    };

    l.refineObject(obj, {
      fn() {
        return 42 + proceed();
      }
    }).activeWhile(() => this.layersEnabled)
      .onActivate(() => lively.notify("Enabled"))
      .onDeactivate(() => lively.notify("Disabled"));

    l2.refineObject(this.polls[0], {
      addVoteToOption(x) {        
        lively.notify("Added " + x + " votes!");
        proceed(x);
      }
    })
    l2.refineObject(obj, {
      fn() {
        const result = proceed();
        lively.notify(result);
        return result;
      }
    });
    l2.activeWhile(() => this.mode)
      .onActivate(() => lively.notify("Start Logging"));
    
  }
  
  toggleLayers() {
    this.layersEnabled = !this.layersEnabled;
    this.toggleILAButton.value = (this.layersEnabled ? "Disable" : "Enable") + " layers."
  }

  changeAEs() {
    this.layers[0].markTimestamp("change mode");
    this.mode = !this.mode;
    this.polls[0].addVoteToOption(1);
  }

  deleteAEs() {
    for (const ae of this.aes) {
      ae.dispose();
    }
    for (const ila of this.layers) {
      ila.remove();
    }
    this.aes = [];
    this.layers = [];
  }
  
  purgeAEs() {
    AExprRegistry.purge();
  }

  get createButton() {
    return this.get("#create");
  }

  get changeButton() {
    return this.get("#change");
  }

  get deleteButton() {
    return this.get("#delete");
  }

  get purgeButton() {
    return this.get("#purge");
  }

  get createILAButton() {
    return this.get("#createILA");
  }
  
  get toggleILAButton() {
    return this.get("#toggleILA");
  }

  async livelyExample() {}

}