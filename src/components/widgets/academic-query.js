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
    
    // alternativ immer das AcademicQuery object mitgeben
    // und dem Bescheid geben, wenn ein update ist
    // (alles kacke)
    var observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        //lively.notify("SUPER observation", mutation.type)
        if (mutation.type == "childList") {
          if (this.subquery) this.textContent = this.subquery.viewToQuery();
          lively.notify("TEXTCONTENT", this.textContent)
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
    var subquery = await (<academic-subquery id="main"></academic-subquery>);
    subquery.setQuery(q)
    
    this.textContent = q;
    this.subquery = subquery;
    
    this.updateView()
  }
  
  getQuery() {
    return this.textContent;
  }

  async updateView() {
    var pane = this.get("#pane")
    var queryView = <academic-subquery></academic-subquery>;
    if(this.subquery) {
      queryView = this.subquery;
    } else {
      lively.notify("Could not load query.");
    }
    var input = <input value={queryView.textContent} style="width: 300px"></input>;
    var updateButton = <button click={() => input.value = (this.getQuery())}>update</button>;
    
    pane.innerHTML = ""
    pane.appendChild(<div>
                       {input} {updateButton}
                       {queryView}
                     </div>);
  }

  viewToQuery() {
    return this.subquery.textContent;
  }
  
  async livelyExample() {
    this.setQuery("And(Or(Y='1985', Y='2008'), Ti='disordered electronic systems')")
    //this.setQuery("And(O='abc', Y='1000')")
    //this.setQuery("Y='1000'")
  }
  
  
}