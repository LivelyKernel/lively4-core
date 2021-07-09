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
  
  async pipeActive(filterCallback, drawCallback, activeObject) {
    this.whileCondition = true;
    while (this.whileCondition /*&& lively.isInBody(button)*/) {
      

      if (this.pipe.buffer.length >= 1) {
        activeObject.style.borderColor = "green"
        var object = this.inputPipe.buffer.shift();
        var objectNew = filterCallback(object)

        if (objectNew !== undefined) {
          this.filter.buffer.push(objectNew)
        }
        drawCallback()
      }  else {activeObject.style.borderColor = "black"}

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
