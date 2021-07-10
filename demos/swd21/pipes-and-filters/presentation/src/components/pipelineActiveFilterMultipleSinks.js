import PipesAndFiltersUtils from "../utils/pipesAndFiltersUtils.js"

export default class ActiveFilterMultipleSinks{
  
  constructor(inputPipe, outputPipe1, outputPipe2, filterObject) {
    this.inputPipe = inputPipe
    this.outputPipe1 = outputPipe1
    this.outputPipe2 = outputPipe2
    this.filterObject = filterObject
    this.timeout = 100;
    this.whileCondition = true;
    
    this.utils = new PipesAndFiltersUtils()
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
async filter(filterCallback, drawCallback) {
    this.whileCondition = true;
    while (this.whileCondition && this.utils.isInView(this.filterObject.view/*context.querySelector("#filter")*/)) { 
  
    var object = this.inputPipe.buffer.shift();
    if (object !== undefined) {
      this.filterObject.view.style.borderColor = "green"
      this.filterObject.buffer.push(object);
      drawCallback()
      
      var objectRedOrYellow = await filterCallback(object)
      this.filterObject.buffer.shift()
      
      if (objectRedOrYellow !== undefined) {
        objectRedOrYellow ? this.outputPipe1.buffer.push(object) : this.outputPipe2.buffer.push(object)
        }
      drawCallback()
      } else {
        this.filterObject.view.style.borderColor = "black"
      }

      await this.sleep(this.timeout)
    }
    this.filterObject.view.style.borderColor = "black"
  }
  
  stop() {
    this.whileCondition = false;
  }
  
  start() {
    this.whileCondition = true;
  }
}
