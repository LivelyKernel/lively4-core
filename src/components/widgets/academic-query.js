import Morph from 'src/components/widgets/lively-morph.js';

export default class AcademicQuery extends Morph {
  async initialize() {
    this.updateView()
  }
  
  setQuery(s) {
    this.textContent = s
    this.updateView()
  }
  
  
  

  updateView() {
    var pane = this.get("#pane")
    pane.innerHTML = ""

    pane.appendChild(<b><span class="blub">Query:</span>{this.textContent}</b>)
  }
  
  viewToQuery() {
    var pane = this.get("#pane")
        
    var s = "... parsed from ui"
    
    return s
  }
  
  
  async livelyExample() {
    this.setQuery("And(Y='2000', Y='2001')")
  }
  
  
}