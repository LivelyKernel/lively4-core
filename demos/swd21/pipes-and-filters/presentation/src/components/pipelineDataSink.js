import PipesAndFiltersUtils from "../utils/pipesAndFiltersUtils.js"

export default class DataSink{
  
  constructor(dataSink, inputPipe) {
    this.dataSink = dataSink
    this.inputPipe = inputPipe
    
    this.timeout = 5000;
    this.whileCondition = true;
    
    this.utils = new PipesAndFiltersUtils()
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  async getFromPipe(drawCallback) {
    while (this.whileCondition && this.utils.isInView(this.dataSink.view)) {
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
