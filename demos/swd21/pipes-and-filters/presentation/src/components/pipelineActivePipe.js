import PipesAndFiltersUtils from "../utils/pipesAndFiltersUtils.js"

export default class ActivePipe{
  
  constructor(inputPipe, outputPipe, filterObject) {
    this.inputPipe = inputPipe
    this.outputPipe = outputPipe
    this.filterObject = filterObject
    
    this.timeout = 100;
    this.whileCondition = true;
    
    this.utils = new PipesAndFiltersUtils()
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  async pipeActive(filterCallback, drawCallback) {
    this.whileCondition = true;
    while (this.whileCondition && this.utils.isInView(this.filterObject.view)) {
      var object = this.inputPipe.buffer.shift();
      
    if (object !== undefined) {
      this.inputPipe.view.style.borderColor = "green"
      this.filterObject.buffer.push(object);
      drawCallback()
      
      var objectNew = await filterCallback(object)
      this.filterObject.buffer.shift()
      if (objectNew !== undefined) {
        this.outputPipe.buffer.push(objectNew)
      }
      drawCallback()
      } else {
        this.inputPipe.view.style.borderColor = "black"
      }

      await this.sleep(this.timeout)
    }
    this.inputPipe.view.style.borderColor = "black"   
  }
  
  stop() {
    
    this.whileCondition = false;
  }
  
  start() {
    this.whileCondition = true;
  }
}
