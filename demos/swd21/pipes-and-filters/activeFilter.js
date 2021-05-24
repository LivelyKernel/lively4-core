export default class ActiveFilter{
  
  constructor(pipeToObserve ,outputPipe) {
    this.pipe = pipeToObserve;
    this.outputPipe = outputPipe;
    this.activeFilterTimeout = 1000;
    this.whileCondition = true;
    this.filteredData = [];
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  async activeFilterData() {
    this.whileCondition = true
    while (this.whileCondition /*&& lively.isInBody(button)*/) {
      var dataFromPipe = this.pipe.popElement();
      if(dataFromPipe) {
        if (dataFromPipe.category === "fruit") {
          this.outputPipe.addElement(dataFromPipe)
        }
      }
      await this.sleep(this.activeFilterTimeout)
    }
  }
  
  stop() {
    this.whileCondition = false;
  }
}