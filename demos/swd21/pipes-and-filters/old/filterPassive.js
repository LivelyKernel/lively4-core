export default class FilterPassive{
  
  constructor(callback, outputPipe) {
    this.callback = callback
    this.outputPipe = outputPipe
  }
  
  filterData(element) {
    this.outputPipe.addElement(this.callback(element))
  }
}