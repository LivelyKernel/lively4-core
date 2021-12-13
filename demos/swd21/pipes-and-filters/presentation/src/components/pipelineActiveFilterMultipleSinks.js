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
    while (this.whileCondition && this.utils.isInView(this.filterObject.view)) {
      // show activ search
      this.filterObject.view.style.border = "2px solid green"
      await this.sleep(300)
      
      var bufferInput = this.inputPipe.buffer;
      if (bufferInput === undefined) {
        bufferInput = this.inputPipe.pipe.buffer;
      }
      
      // handle object
      //var object = this.inputPipe.buffer.shift();
      var object = this.filterObject.buffer[0];
      if (object === undefined) {
        object = bufferInput[0];
      }
      
      if (object !== undefined) {
        if (this.filterObject.buffer.length < 1) {
          bufferInput.shift();
          this.filterObject.buffer.push(object);
          drawCallback();
        }
        //this.filterObject.buffer.push(object);
        //drawCallback()
      
        var isObjectRedOrYellow = await filterCallback(object)
        //this.filterObject.buffer.shift()
      
        if (isObjectRedOrYellow !== undefined) {
          if (isObjectRedOrYellow) {
            let success = await this.outputPipe1.pushToPassivePipe(object, () => {
              drawCallback();
            })
            if (success) {
              this.filterObject.buffer.pop();
            }
          } else {
            let success = await this.outputPipe2.pushToPassivePipe(object, () => {
              drawCallback();
            })
            if (success) {
              this.filterObject.buffer.pop();
            }
          }
          

          
          //isObjectRedOrYellow ? this.outputPipe1.buffer.push(object) : this.outputPipe2.buffer.push(object)
        } else {
          this.filterObject.buffer.shift();
        }
        drawCallback()
      }
      
      // set to normal border and wait
      this.filterObject.view.style.border = "1px solid black"
      await this.sleep(this.timeout)
      
      
  /*
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
      */
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
