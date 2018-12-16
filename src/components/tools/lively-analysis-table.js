import d3 from "src/external/d3.v5.js"
//import D3Component from "src/components/d3/d3-component.js"
import Morph from 'src/components/widgets/lively-morph.js';

//export default class LivelyAnalysisTable extends D3Component {
export default class LivelyAnalysisTable extends Morph {

  async initialize() {
    this.windowTitle = "Lively Semantic Code Analysis -Table";
    this.registerButtons()
    lively.html.registerKeys(this); // automatically installs handler for some methods
     
    lively.addEventListener("template", this, "dblclick", 
      evt => this.onDblClick(evt))
  }
    // this method is autmatically registered through the ``registerKeys`` method
  onKeyDown(evt) {
    lively.notify("Key Down!" + evt.charCode)
  }

  /* Lively-specific API */

  livelyPreMigrate() {
    // is called on the old object before the migration
  }
  
  livelyMigrate(other) {
    // whenever a component is replaced with a newer version during development
    // this method is called on the new object during migration, but before initialization
    this.someJavaScriptProperty = other.someJavaScriptProperty
  }
  
  livelyInspect(contentNode, inspector) {
    // do nothing
  }
  
  livelyPrepareSave() {
    
  }
  
  setData(data) {
    if (data) {
      this.data = data
    }
  }
  
  getData() {
    return this.data
  }
  
  updateViz() {
    this.shadowRoot.querySelector("#table").innerHTML = ""
    var tableElement = this.shadowRoot.querySelector("#table")
    var table = d3.select(tableElement)
    
    var tableData = this.data
    if (!tableData) return
                 
    // header
    var tableHeadColumns = (this.getData() && this.getData().length > 0) ? Object.keys(this.getData()[0]) : []
    table.append('thead')
            .selectAll('th')
            .data(tableHeadColumns)
            .enter()
            .append('th')
            .text(function(item) { return item })
  // body
   var tableRows = table.append('tbody')
            .selectAll("tr") // rows
            .data(this.getData())
            .enter()
            .append("tr")
            .attr("id", function(row) {if (!row.id) {return ""} return row.id})
            .on("click", (row) => this.onNodeClick(row, d3.event));
   
   tableRows.selectAll('td') // cells
            .data(function(row) {return Object.values(row)})
            .enter()
            .append("td")
            .text(function(cellValue) {return cellValue});
  }
  
  async livelyExample() {
    var exampleData = [
      {id: "1", column1: "1.1 value", column2: "1.2 value"},
      {id: "2", column1: "2.1 value", column2: "2.2 value"},
      {id: "3", column1: "3.1 value", column2: "3.2 value"},
    ]
    this.setData(exampleData)
    this.updateViz()
  }
  

}