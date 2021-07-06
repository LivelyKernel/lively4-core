export default class ActivePipe{
  
  constructor(pipe, filter) {
    this.pipe = pipe
    this.filter = filter
    
    this.timeout = 3000;
    this.whileCondition = true;
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  async pipeActive(filterCallback, drawCallback, context) {
    this.whileCondition = true;
    while (this.whileCondition /*&& lively.isInBody(button)*/) {
      
      var object = this.inputPipe.buffer.shift();
      if (this.pipe.buffer.length <= 1) {
        var objectNew = filterCallback(object)
        context.querySelector("#pipe1").style.borderColor = "green"
        if (objectNew !== undefined) {
          this.outputPipe.buffer.push(objectNew)
        }
        drawCallback()
      }  else {context.querySelector("#pipe1").style.borderColor = "black"}

      await this.sleep(this.timeout)
    }
    context.querySelector("#pipe1").style.borderColor = "black"
  }
  
  stop() {
    
    this.whileCondition = false;
  }
  
  start() {
    this.whileCondition = true;
  }
}
