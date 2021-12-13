export default class Pipe {
  
  constructor() {
    this.elementArray = []
  }
  
  pushElement(element){
    this.elementArray.push(element)
  }
  
  popElement() {
    return this.elementArray.shift()
  }

}