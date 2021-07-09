export default class ActiveFilter{
  
  constructor(inputPipe, outputPipe) {
    this.inputPipe = inputPipe
    this.outputPipe = outputPipe
    
    this.timeout = 3000;
    this.whileCondition = true;
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  async filter(filterCallback, drawCallback, activeObject) {
    this.whileCondition = true;
    while (this.whileCondition && lively.isInBody(context.querySelector("#filter"))) { 

      
    var object = this.inputPipe.buffer.shift();
    if (object !== undefined) {
      activeObject.style.borderColor = "green"
      var objectNew = filterCallback(object)
      
      if (objectNew !== undefined) {
        this.outputPipe.buffer.push(objectNew)
      }
        drawCallback()
      } else {activeObject.style.borderColor = "black"}

      await this.sleep(this.timeout)
    }
    activeObject.style.borderColor = "black"
  }
  
  stop() {
    this.whileCondition = false;
  }
  
  start() {
    this.whileCondition = true;
  }
}
