import Morph from './Morph.js';

export default class LivelyProgress extends Morph {
  
  get value() {
    return lively.getExtent(this.get("#progress")).x / lively.getExtent(this.get("#bar")).x 
  }
  
  set value(v) {
    this.get("#progress").style.width = v * lively.getExtent(this.get("#bar")).x + "px"
  }
}