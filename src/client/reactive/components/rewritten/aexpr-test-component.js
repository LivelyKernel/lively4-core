"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import { AExprRegistry } from 'src/client/reactive/active-expression/active-expression.js';
import Poll from 'src/client/reactive/components/rewritten/poll.js';
export default class AexprTest extends Morph {
  async initialize() {
    this.c = 100;
    this.windowTitle = "Active Expression Testing";
    this.aes = [];
    
    this.y = 4;
    this.x = new Poll(4);
    this.createButton.addEventListener('click', () => this.addAE());
    this.changeButton.addEventListener('click', () => this.changeAEs());
    this.deleteButton.addEventListener('click', () => this.deleteAEs());
  }  
  
  addAE() {
    let z = 4;
    this.aes.push(aexpr(() => this.x.getBestOption() + this.y + z + 8).onChange(lively.notify));
    this.aes.push(aexpr(() => this.x.getBestOption() + this.y + z));
    z++;
  }
  
  changeAEs() {
    this.x.addVoteToOption(1);
    this.y++;
  }
  
  deleteAEs() {
    for(const ae of this.aes) {
      ae.dispose();
    }
    this.aes = [];
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

  async livelyExample() {
  }

}