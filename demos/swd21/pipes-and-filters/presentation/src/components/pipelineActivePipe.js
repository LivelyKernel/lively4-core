import PipesAndFiltersUtils from "../utils/pipesAndFiltersUtils.js"

export default class ActivePipe{
  
  constructor(inputObject, activePipe, outputObject) {
    this.inputObject = inputObject;
    this.activePipe = activePipe;
    this.outputObject = outputObject;
    
    this.timeout = 100;
    this.whileCondition = true;
    
    this.utils = new PipesAndFiltersUtils();
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  async pipeActive(filterCallback, drawCallback) {
    this.whileCondition = true;
    while (this.whileCondition && this.utils.isInView(this.activePipe.view)) {
        // show activ search
        this.activePipe.view.style.border = "2px solid green";
        await this.sleep(300);

        // set to normal border
        this.activePipe.view.style.border = "1px solid black";

        // get input buffer from input
        var bufferInput = this.inputObject.buffer;
        if (bufferInput === undefined) {
          bufferInput = this.inputObject.filterObject.bufferOutput;
        }

        // get new object from input
        var input = bufferInput.shift();
        if (input !== undefined) {
          this.activePipe.buffer.push(input);
          drawCallback();
        }

        // get output buffer input from
        var bufferOutputInput = this.outputObject.buffer;
        if (bufferOutputInput === undefined) {
          bufferOutputInput = this.outputObject.filterObject.bufferInput;
        }

        // get output buffer output from
        var bufferOutput = this.outputObject.buffer;
        if (bufferOutput === undefined) {
          bufferOutput = this.outputObject.filterObject.bufferOutput;
        }

        // push next pipe object to OutputObject
        var object = this.activePipe.buffer.shift();
        if (object !== undefined) {
          bufferOutputInput.push(object)
          drawCallback();
          var objectNew = await filterCallback(object);

          bufferOutputInput.shift()
          if (objectNew !== undefined) {
            bufferOutput.push(objectNew);
          }
        }
        drawCallback();
      await this.sleep(this.timeout);
    }
    this.activePipe.view.style.borderColor = "black"   
  }
  
  stop() {
    
    this.whileCondition = false;
  }
  
  start() {
    this.whileCondition = true;
  }
}
