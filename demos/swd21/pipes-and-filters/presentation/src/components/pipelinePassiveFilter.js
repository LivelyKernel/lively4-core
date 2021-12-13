import PipesAndFiltersUtils from "../utils/pipesAndFiltersUtils.js"

export default class PassiveFilter{
  
  constructor(filterObject) {
    this.filterObject = filterObject
    
    this.timeout = 100;
    this.whileCondition = true;
    
    this.utils = new PipesAndFiltersUtils()
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  async filter(filterCallback, drawCallback) {
    var object = this.filterObject.bufferInput[0];
    if (object !== undefined) {
      var filteredObject = await filterCallback(object)
      if (filteredObject !== undefined) {
        this.filterObject.bufferInput.shift();
        this.filterObject.bufferInput.push(filteredObject);
        await this.sleep(this.timeout);
        
        let tmpObject = this.filterObject.bufferInput.shift();
        this.filterObject.bufferOutput.push(tmpObject);
      }
    }
    
    
    
    
    /*
      // handle object
      var object = this.inputPipe.buffer[0]
      if (object !== undefined) {
        this.filterObject.buffer.push(object);
        drawCallback()
      
        var objectNew = await filterCallback(object)
        this.filterObject.buffer.shift()
      
        if (objectNew !== undefined) {
          this.outputPipe.buffer.push(objectNew)
        }
        drawCallback()
      }
      
      // set to normal border and wait
      //this.filterObject.view.style.border = "1px solid black"
      await this.sleep(this.timeout)    
    */
    
    
    
    /*
    this.whileCondition = true;
    while (this.whileCondition && this.utils.isInView(this.filterObject.view)) {
      // handle object
      var object = this.inputPipe.buffer.shift();
      if (object !== undefined) {
        this.filterObject.buffer.push(object);
        drawCallback()
      
        var objectNew = await filterCallback(object)
        this.filterObject.buffer.shift()
      
        if (objectNew !== undefined) {
          this.outputPipe.buffer.push(objectNew)
        }
        drawCallback()
      }
      
      // set to normal border and wait
      this.filterObject.view.style.border = "1px solid black"
      await this.sleep(this.timeout)
      */
      
      
      /*
      this.filterObject.view.style.borderColor = "green"
      var object = this.inputPipe.buffer.shift();
      
      if (object !== undefined) {
        this.filterObject.buffer.push(object);
        drawCallback()
        //this.filterObject.view.style.borderColor = "black"
      
        var objectNew = await filterCallback(object)
        this.filterObject.buffer.shift()
      
        if (objectNew !== undefined) {
          this.outputPipe.buffer.push(objectNew)
        }
        drawCallback()
      } else {
        //this.filterObject.view.style.borderColor = "black"
      }

      await this.sleep(this.timeout)
      this.filterObject.view.style.borderColor = "black"
      */
    /*}
    this.filterObject.view.style.borderColor = "black"
    */
  }
  
  stop() {
    this.whileCondition = false;
  }
  
  start() {
    this.whileCondition = true;
  }
  
  

}
