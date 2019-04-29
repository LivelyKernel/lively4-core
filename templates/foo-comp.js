
import Morph from 'src/components/widgets/lively-morph.js';

export default class FooComp extends Morph {
  async initialize() {
    
    this.textContent = "sub says " + this.get("foo-comp-sub").bar()
    
    console.log("REGISTER foo component")
  }
  
  
  
}