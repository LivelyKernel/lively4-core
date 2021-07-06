export default class DataSource{
  
  constructor(dataSource, outputPipe) {
    this.dataSource = dataSource
    this.outputPipe = outputPipe
    
    this.timeout = 1000;
    this.whileCondition = true;
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  async pushToPipe(drawCallback) {
    while (this.whileCondition /*&& lively.isInBody(button)*/) {
      var object = this.dataSource.buffer.shift();
      if (object !== undefined) {
        this.outputPipe.buffer.push(object)
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
