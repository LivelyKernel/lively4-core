"enable aexpr";
import Morph from 'src/components/widgets/lively-morph.js';
import { AExprRegistry } from 'src/client/reactive/active-expression/ae-registry.js';
import Poll from 'src/client/reactive/components/rewritten/poll.js';
import { Layer, proceed } from 'src/client/ContextJS/src/Layers.js';

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
  }
  
  addAE() {
    this.aes.push(aexpr(() => {
      if(this.mode) {
        return this.polls.map(p => p.getBestOption()).reduce((a, b) => a + b);
      }
      return this.x;      
    }).dataflow(lively.notify));
    
    this.x++;
    this.x++;
  }
  
  addILA() {
    let l = new Layer("highPerformance");
    let l2 = new Layer("debugOutput");
    this.layers.push(l);

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