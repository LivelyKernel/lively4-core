import Morph from 'src/components/widgets/lively-morph.js';
import AcademicSubquery from "src/components/widgets/academic-subquery.js";

/*const observer = new MutationObserver(function(mutations) {
  mutations.forEach(mutation => {
    //lively.notify("observation", mutation.type)
    if (mutation.type == "characterData") {
      var element = mutation.target;
      lively.notify("ELEMENT",element)
      while (element.parentNode && (element.nodeName != "ACADEMIC-QUERY")) {
        lively.notify("CURRENT ELEMENT",element)
        element = element.parentNode;
      }
      if (element.nodeName == "ACADEMIC-QUERY") {
        element.textContent = element.viewToQuery();
      } else {
        lively.notify("Could not find academic-query");
      }
    }
  })
})
const config = {
  attributes: true,
  childList: true,
  subtree: true,
  attributeOldValue: true,
  characterDataOldValue: true,
  //attributeFilter: true // breaks for some reason
}*/

export default class AcademicQuery extends Morph {
  constructor() {
    super();
  }
  
  async initialize() {
    this.updateView();
    
    var observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        //lively.notify("observation", mutation.type)
        if (mutation.type == "characterData") {
          if (this.subquery) this.textContent = this.subquery.viewToQuery();
          lively.notify("THIS in observer", this)
        }
      })
    });
    
    const config = {
      attributes: true,
      childList: true,
      subtree: true,
      attributeOldValue: true,
      characterDataOldValue: true,
      //attributeFilter: true // breaks for some reason
    };
    
    observer.observe(this.get('#pane'), config);
  }
  
  async setQuery(q) {
    var subquery = await (<academic-subquery></academic-subquery>);
    subquery.setQuery(q)
    
    this.textContent = q;
    this.subquery = subquery;
    
    this.updateView()
  }
  
  getQuery() {
    return this.textContent;
  }

  async updateView() {
    // TODO: input feld und button
    var pane = this.get("#pane")
    pane.innerHTML = ""
    
    if(this.subquery) {
      pane.appendChild(this.subquery)
    }
  }

  /*viewToQuery() {
    // TODO, rufen wir nur von hier auf der subquery auf?
    var pane = this.get("#pane")
    
    // if pane - div - b - span - table (complex)
      // table - tr - th.textContent?
    lively.notify("TEXTCONTENT", pane.textContent);
    
    var query = "... parsed from ui"
    
    return query
  }*/
  
  async livelyExample() {
    this.setQuery("And(Or(Y='1985', Y='2008'), Ti='disordered electronic systems')")
    //this.setQuery("And(O='abc', Y='1000')")
    //this.setQuery("Y='1000'")
  }
  
  
}