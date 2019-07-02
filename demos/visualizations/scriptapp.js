
// Simple Apps that are created inside a script tag in a MarkDown file
// a) Reason: Code reuse?
// b) #FutureWork wow does it relate to Components, Objects, HTML and MarkdDown files

// #ResearchQuestion "What is the unit of a Program/Tool/Application in Lively4?"  -> Object, MarkdownFile, Component ?

export default class ScriptApp {
  
  static connectInput(element, initValue, update) {
    element.value = initValue
    element.addEventListener("change", function(evt) {
        update(this.value)
    })
  }
 
  static get(query) {
    return lively.query(this.ctx, query)
  }  
}