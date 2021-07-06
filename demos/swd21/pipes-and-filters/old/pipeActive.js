export default class PipeActive {
  
  constructor(filter) {
    this.elementArray = []
    this.filter = filter
  }
  
  addElement(element){
    this.elementArray.push(element)
    this.filter.filterData(this.getElement())
  }
  
  getElement() {
    return this.elementArray.shift()
  }

}