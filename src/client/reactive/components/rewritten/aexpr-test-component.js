"enable aexpr";
import Morph from 'src/components/widgets/lively-morph.js';
import { AExprRegistry } from 'src/client/reactive/active-expression/ae-registry.js';
import Poll from 'src/client/reactive/components/rewritten/poll.js';
export default class AexprTest extends Morph {
  async initialize() {
    
    this.t = 3;
    
    always: this.d = this.c * 3;
    always: this.c = this.d * 3;
    this.windowTitle = "Active Expression Testing";
    this.aes = [];
    
    aexpr(() => this.c).dataflow(lively.notify);
    this.t++;
    this.polls = [new Poll(4), new Poll(3)];
    this.mode = false;
    this.x = 3;
    this.createButton.addEventListener('click', () => this.addAE());
    this.changeButton.addEventListener('click', () => this.changeAEs());
    this.deleteButton.addEventListener('click', () => this.deleteAEs());
    this.purgeButton.addEventListener('click', () => this.purgeAEs());
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

  changeAEs() {
    this.mode = !this.mode;
    this.polls[0].addVoteToOption(1);
  }

  deleteAEs() {
    for (const ae of this.aes) {
      ae.dispose();
    }
    this.aes = [];
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

  async livelyExample() {}

}