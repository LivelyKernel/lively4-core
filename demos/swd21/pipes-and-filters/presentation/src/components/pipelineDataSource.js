import PipesAndFiltersUtils from "../utils/pipesAndFiltersUtils.js"

export default class DataSource{
  
  constructor(dataSource, outputPipe) {
    this.dataSource = dataSource
    this.outputPipe = outputPipe
    
    this.timeout = 1000;
    this.whileCondition = true;
    
    this.utils = new PipesAndFiltersUtils()
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  async pushToPipe(drawCallback) {
    while (this.whileCondition && this.utils.isInView(this.dataSource.view)) {
      var object = this.dataSource.buffer[0];//.shift();
      if (object !== undefined) {
      
        var bufferOutput = this.outputPipe.buffer;
        if (bufferOutput !== undefined) {
          bufferOutput.push(object);
        } else {
          bufferOutput = this.outputPipe;
          let success = await bufferOutput.pushToPassivePipe(object, () => {
            drawCallback();
          });
          if (success) {
            this.dataSource.buffer.shift();
          }
        }
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
