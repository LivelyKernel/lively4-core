"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import { AExprRegistry } from 'src/client/reactive/active-expression/active-expression.js';
import Poll from 'src/client/reactive/components/rewritten/poll.js';

export default class AexprTest extends Morph {

  async initialize() {
    this.windowTitle = "Active Expression Testing";
    this.aes = [];
    this.y = 4;
    this.x = new Poll(4);
    this.createButton.addEventListener('click', () => this.addAE());
    this.changeButton.addEventListener('click', () => this.changeAEs());
  }
  
  addAE() {
    let z = 4;
    this.aes.push(aexpr(() => this.x.getBestOption() + this.y + z));
    z++;
  }
  
  changeAEs() {
    this.x.addVoteToOption(1);
    this.y++;
  }
  
  get createButton() {
    return this.get("#create");
  }

  get changeButton() {
    return this.get("#change");
  }

  async livelyExample() {}

}