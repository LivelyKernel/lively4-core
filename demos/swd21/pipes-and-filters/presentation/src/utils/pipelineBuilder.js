export default class PipelineBuilder {
  
  constructor(context) {
    this.context = context;
  }
  
  onlyShowSpecificElements(elementsList) {
    console.log(elementsList)
    var divElement = lively.query(this.context, "div.lively-content")
    var allElements = lively.queryAll(divElement, "*")
    
    allElements.forEach(elem => {
      console.log(elem.id)

      !elementsList.includes(elem.id) ? elem.style.display = "none" : true
      
       
    })
    
  }
}