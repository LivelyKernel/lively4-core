"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import d3 from "src/external/d3.v5.js"
import ContextMenu from 'src/client/contextmenu.js';
import FileIndex from "src/client/fileindex-analysis.js"


export default class LivelyAnalysis extends Morph {

  async initialize() {
    this.windowTitle = "Lively Semantic Code Analysis";
    this.registerButtons()
    lively.html.registerKeys(this); // automatically installs handler for some methods   
    this.setClassData()
    this.setVersionData()
    this.setLinkData()
    // table
    this.brokenLinksTable = this.shadowRoot.querySelector("#lively-analysis-table")
    this.get("#tab-broken-links").appendChild(this.brokenLinksTable)
    this.treeMapSvg = this.shadowRoot.querySelector("#lively-analysis-heatmap") 
    //
    this.get("#updateDirectory").addEventListener("update-directory", () => this.onUpdateDirectory)
    this.get("#updatePolymetric").addEventListener("update-polymetric", () => this.updatePolymetric)
    this.get("#updateVersions").addEventListener("update-versions", () => this.updateVersions)
    this.get("#updateBrokenLinks").addEventListener("update-broken-links", () => this.updateTableBrokenLinks)
  }
  async setClassData() {
    this.classes = await FileIndex.current().db.classes
  }
  
  async setVersionData() {
    this.versions = {
      name : 'root',
      modifications: await FileIndex.current().db.versions.count(),
      children: []
    }
    var classNames =  await FileIndex.current().db.versions.orderBy('class').uniqueKeys()
    await classNames.forEach((className) => {
      let parent = {
        name: className,
        children: []
      }
      var versionEntries = FileIndex.current().db.versions.where({class: className})
      versionEntries.count().then((count) => {
        parent.modifications = count
      })
      versionEntries.each((entry) => {
        if (entry.method != '+null+') {
          let child = {
            name: entry.method
          }
          FileIndex.current().db.versions.where({method: entry.method, class:entry.class}).count().then((count) => {
            child.modifications = count
          })
          parent.children.push(child)
        }
      })
      this.versions.children.push(parent)
    })
  }
  
  async setLinkData() {
    this.links = []
    let rowNumber = 1;
    await FileIndex.current().db.links.orderBy('location').reverse().each((link) => {
      this.links.push({
        id: link.url,
        no: rowNumber++,
        status: link.status,
        link: link.link,
        location: link.location,
        file: link.url
      })
    })
  }

  // this method is autmatically registered through the ``registerKeys`` method
  onKeyDown(evt) {
    lively.notify("Key Down!" + evt.charCode)
  }

  // this method is automatically registered as handler through ``registerButtons``
  onUpdateDirectory() {
    FileIndex.current().updateDirectory(lively4url + "/", true)
  }

  async onUpdatePolymetric() {
    await this.setClassData()
    this.updatePolymetricView()
  }

  async onUpdateVersions() {
    await this.setVersionData()
    console.log(this.versions)
    this.updateVersionHeatMap()
  }
  
  async onUpdateBrokenLinks() {
    await this.setLinkData()
    this.updateTableBrokenLinks()
  }
  
  updatePolymetricView() {
  }
  
  updateVersionHeatMap() {
    this.shadowRoot.querySelector("#lively-analysis-table").innerHTML = ""
    var treeMap = d3.select(this.treeMapSvg)
  }

  updateTableBrokenLinks() {
    this.shadowRoot.querySelector("#lively-analysis-table").innerHTML = ""
    var table = d3.select(this.brokenLinksTable)
    if (!this.links) return
    // header
    var tableHeadColumns = (this.links && this.links.length > 0) ? Object.keys(this.links[0]) : []
    table.append('thead')
      .selectAll('th')
      .data(tableHeadColumns)
      .enter()
      .append('th')
      .text(function(item) { return item })
    // body
    var tableRows = table.append('tbody')
      .selectAll("tr") // rows
      .data(this.links)
      .enter()
      .append("tr")
      .attr("id", function(row) { if (!row.id) { return "" } return row.id })
      .attr("class", function(row) { if (row.status == "dead") { return "deadLink" } return "aliveLink" })
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
      .data(function(row) { return Object.values(row) })
      .enter()
      .append("td")
      .text(function(cellValue) { return cellValue });
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
    this.updateVersionHeatMap()
    this.links = [
      { id: "", no: "1", status: "dead", column: "1.2 value" },
      { id: "", no: "2", status: "dead", column: "2.2 value" },
      { id: "", no: "3", staus: "alive", column: "3.2 value" },
    ]
    this.updateTableBrokenLinks()
  }


}
