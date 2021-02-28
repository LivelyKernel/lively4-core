import Morph from 'src/components/widgets/lively-morph.js';
import AcademicSubquery from "src/components/widgets/academic-subquery.js";

export default class AcademicQuery extends Morph {
  constructor() {
    super();
  }
  
  async initialize() {
    this.updateView();
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
  
  async update(){
    this.textContent = await this.subquery.viewToQuery();
    var queryText = this.get('#queryText');
    queryText.innerHTML = this.getQuery();
  }

  async updateView() {
    if(!this.subquery) { return }
    var pane = this.get("#pane")
    var queryView = <academic-subquery></academic-subquery>;
    queryView = this.subquery;
    queryView.parentQuery = this;

    var queryText = <span id="queryText" style="width: 300px; font-style: italic; color: lightgray;">{this.textContent}</span>;
    var searchButton = <button click={() => lively.openBrowser("academic://expr:" + this.textContent + "?count=100")}>search</button>;
    
    pane.innerHTML = ""
    pane.appendChild(<div>
        {searchButton}
        {queryView}
        {queryText}
      </div>);
  }

  viewToQuery() {
    return this.subquery.textContent;
  }
  
  async livelyExample() {
    this.setQuery("Composite(AA.AuId = 2055148755)")
  }
  
}