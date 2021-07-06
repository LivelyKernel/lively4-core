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
  
  async filter(filterCallback, drawCallback, context) {
    this.whileCondition = true;
    while (this.whileCondition && lively.isInBody(context.querySelector("#filter"))) { 

      
    var object = this.inputPipe.buffer.shift();
    if (object !== undefined) {
      context.querySelector("#filter").style.borderColor = "green"
      var objectNew = filterCallback(object)
      
      if (objectNew !== undefined) {
        this.outputPipe.buffer.push(objectNew)
      }
        drawCallback()
      } else {context.querySelector("#filter").style.borderColor = "black"}

      await this.sleep(this.timeout)
    }
    context.querySelector("#filter").style.borderColor = "black"
  }
  
  stop() {
    this.whileCondition = false;
  }
  
  start() {
    this.whileCondition = true;
  }
}
