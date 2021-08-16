export default class OutputPipe {
  
  constructor() {
    this.elementArray = [];
    this.outputElement = "";
  }
  
  
  popElement() {
    return this.elementArray.pop()
  }
  
  putDataIntoDataSink() {
    var currentArray = []
    var tmpArray = []
    
    var currentValue = this.outputElement.value
    if (currentValue && currentValue.length > 0) {
      currentArray = JSON.parse(currentValue)
    }
    tmpArray.push(this.popElement())
    this.outputElement.value = JSON.stringify(currentArray.concat(tmpArray))
  }

  addElement(element) {
    this.elementArray.push(element)
    this.putDataIntoDataSink();
  }
  
  setOutputElement(outPutElement){
    this.outputElement = outPutElement;
  }
  
}