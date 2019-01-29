import d3 from "src/external/d3.v5.js"
import ContextMenu from 'src/client/contextmenu.js';
//import D3Component from "src/components/d3/d3-component.js"
import Morph from 'src/components/widgets/lively-morph.js';

//export default class LivelyAnalysisTable extends D3Component {
export default class LivelyAnalysisTable extends Morph {

  async initialize() {
    this.windowTitle = "Lively Semantic Code Analysis - Table"; 
    this.registerButtons()
    lively.html.registerKeys(this); // automatically installs handler for some methods
   
    this.tableElement = this.shadowRoot.querySelector("#lively-analysis-table")
    this.selectElement = this.shadowRoot.querySelector('#lively-analysis-table-selection')
    this.selectedOption = this.selectElement
    
    this.selectElement.addEventListener("change", () => this.onSelectionChanged())
    
    this.setWidth(400, 'px')
    this.setHeight(150, 'px')
  }
  
  setWidth(width, unit) {
    this.tableWidth = width
    this.tableElement.style.width = width + unit
  }
  
  setHeight(height, unit) {
    this.tableHeight = height
    this.tableElement.style.height = height + unit
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
    this.tableElement.innerHTML = ''
    var table = d3.select(this.tableElement) 
             
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
            .attr("id", function(row) { return !row.id ?  "" : row.id} )
            .attr("class", function(row) { return (row.status == "alive") ? row.type + " aliveLink" : row.type + " brokenLink"})
            .on('contextmenu', function(row) {
               if (!d3.event.shiftKey) {
                d3.event.stopPropagation();
                d3.event.preventDefault();
                var menu = new ContextMenu(this, [
                      ["Open file", () => lively.openBrowser(row.id, true)],
                    ]);
                menu.openIn(document.body, d3.event, this);
                return true;
               }
            });
           
   tableRows.selectAll('td') // cells
      .data(function(row) {return Object.values(row)})
            .enter()
            .append("td")
            .text(function(cellValue) {return cellValue});
    
  }
  
  onSelectionChanged() {
    let selection = d3.select(this.selectElement)
    let table = d3.select(this.tableElement)
    this.selectedOption = selection.node().value
    
    if (this.selectedOption == 'view-broken-links') {
      table.selectAll('.aliveLink')
        .style('display', 'none')
      table.selectAll('.brokenLink')
        .style('display', 'table-row')
    } else if (this.selectedOption == 'view-all-links') {
      table.selectAll('tbody tr')
        .style('display', 'table-row')
    }
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
  
  async livelyExample() {
    var exampleData = [
      {id: "", no: "1", status: "broken", column: "1.2 value"},
      {id: "", no: "2", status: "broken", column: "2.2 value"},
      {id: "", no: "3", status: "alive",column: "3.2 value"},
    ]
    this.setData(exampleData)
    this.updateViz()
  }
  

}