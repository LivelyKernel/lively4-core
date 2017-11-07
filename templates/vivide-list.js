import Morph from './Morph.js';

export default class VivideList extends Morph {
  async initialize() {
    this.windowTitle = "VivideList";
    
  }
  
  makePrefix(level) {
    let prefix = "";
    for(let i=0; i<level; ++i) {
      prefix += "&nbsp;&nbsp;";
    }
    return prefix;
  }
  
  display(array, level) {
       
    let prefix = this.makePrefix(level);
    
    if(!Array.isArray(array)) {
      this.innerHTML += prefix + array + "<br\>";
      return;
    }
     
    for(let i in array) {
      if(Array.isArray(array[i])) {
        this.display(array[i], level+1);
      } else {
        this.display(array[i], level);
      }
    }
  }
  
  show(model) {
    this.display(model, 0);
  }
  

}