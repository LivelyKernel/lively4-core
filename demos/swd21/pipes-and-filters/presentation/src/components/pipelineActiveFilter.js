import PipesAndFiltersUtils from "../utils/pipesAndFiltersUtils.js"

export default class ActiveFilter{
  
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
  
  async filter(filterCallback, drawCallback) {
    this.whileCondition = true;
    var isOrangeBecauseOfBuffer = false;
    while (this.whileCondition && this.utils.isInView(this.filterObject.view)) {

      if(!isOrangeBecauseOfBuffer) {
         this.filterObject.view.style.border = "2px solid green";
        await this.sleep(300);
      
      var bufferInput = this.inputPipe.buffer;
      if (bufferInput === undefined) {
        bufferInput = this.inputPipe.pipe.buffer;
      }
      
      var object = this.filterObject.buffer[0];
      if (object === undefined) {
        object = bufferInput[0];
      }

      }
     
      if (object !== undefined) {
        if (this.filterObject.buffer.length < 1) {
          bufferInput.shift();
          this.filterObject.buffer.push(object);
          drawCallback();
        }
      
        var objectNew = await filterCallback(object)
        
        if (objectNew !== undefined && objectNew !== "error") {

          let success = await this.outputPipe.pushToPassivePipe(objectNew, () => {
            drawCallback()
          });
          if (success) {
            isOrangeBecauseOfBuffer = false
            this.filterObject.view.style.border = "2px solid green";
            this.filterObject.buffer.pop();
          } else {this.filterObject.view.style.border = "2px solid orange"; 
                  isOrangeBecauseOfBuffer = true;}
          
          
        } 
        
        else if (objectNew === "error") {
          this.filterObject.view.style.border = "2px solid red"
          await this.sleep(2000)
          this.filterObject.view.style.border = "2px solid green"
        } else {
          
          this.filterObject.buffer.shift();
          }
        
        
        drawCallback()
      } 
      
      !isOrangeBecauseOfBuffer ? this.filterObject.view.style.border = "1px solid black" : true
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
