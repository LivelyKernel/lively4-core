export default class DataSink{
  
  constructor(dataSink, inputPipe) {
    this.dataSink = dataSink
    this.inputPipe = inputPipe
    
    this.timeout = 2000;
    this.whileCondition = true;
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  async getFromPipe(drawCallback) {
    while (this.whileCondition /*&& lively.isInBody(button)*/) {
      var object = this.inputPipe.buffer.shift();
      if (object !== undefined) {
        this.dataSink.buffer.push(object)
      }
      drawCallback()
      
      await this.sleep(this.timeout)
    }
  }
  
  stop() {
    this.whileCondition = false;
  }
  
  start() {
    this.whileCondition = true;
  }
}
