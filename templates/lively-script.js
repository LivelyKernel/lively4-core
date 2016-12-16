import Morph from './Morph.js';
import uuid from 'src/client/uuid.js'


export default class LivelyScript extends Morph {

  async initialize() {
    this.moduleId =  "workspace://"+ uuid() 
    var src = this.textContent
    var result = await this.boundEval(src)
    if (result.isError) {
      lively.showError(result.value)
      // lively.notify("Error loading: " + src, )
    }
  }
    
  async boundEval(str) {
    return lively.vm.runEval(str, {targetModule: this.moduleId, context: this})
  }
}
