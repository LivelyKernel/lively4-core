"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import { AExprRegistry } from 'src/client/reactive/active-expression/active-expression.js';
import Poll from 'src/client/reactive/components/rewritten/poll.js';
export default class AexprTest extends Morph {
  async initialize() {
    this.c = 100;
    this.windowTitle = "Active Expression Testing";
    this.aes = [];

    this.y = {foo: 4};
    this.mode = false;
    this.x = new Poll(4);
    this.createButton.addEventListener('click', () => this.addAE());
    this.changeButton.addEventListener('click', () => this.changeAEs());
    this.deleteButton.addEventListener('click', () => this.deleteAEs());
    this.purgeButton.addEventListener('click', () => this.purgeAEs());
  }

  addAE() {
    let z = this;
    let w = this;
    //this.aes.push(aexpr(() => this.x.getBestOption() + z + 8).onChange(() => this.y++));
    this.aes.push(aexpr(() => {
      if(this.mode) {
        return this.y.foo;
      }           
      return z + w + 15;      
    }).dataflow(lively.notify));
    //z++;
  }

  changeAEs() {
    this.y.foo++;
    this.mode = !this.mode;
    /*this.x.addVoteToOption(1);
    this.y++;*/
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