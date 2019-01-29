"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js'
import FileIndex from 'src/client/fileindex-analysis.js'

export default class LivelyAnalysis extends Morph {

  async initialize() {
    this.windowTitle = "Lively Semantic Code Analysis";
    this.registerButtons()
    lively.html.registerKeys(this); // automatically installs handler for some methods   
    
    // div container
    this.polymetricContainter = this.shadowRoot.querySelector("#lively-analysis-polymetric-container")
    this.brokenLinksContainer = this.shadowRoot.querySelector('#lively-analysis-table-container')
    this.heatMapContainer = this.shadowRoot.querySelector('#lively-analysis-heatmap-container')
    
    // update listener
    this.get("#updateDirectory").addEventListener("update-directory", () => this.onUpdateDirectory)
    this.get("#updatePolymetric").addEventListener("update-polymetric", () => this.updatePolymetric)
    this.get("#updateVersions").addEventListener("update-versions", () => this.updateVersions)
    this.get("#updateBrokenLinks").addEventListener("update-broken-links", () => this.updateTableBrokenLinks)
    
    this.viewWidth = 400
    this.viewHeight = 150
    
    this.updatePolymetricView()
  }
  
  setViewWidth(width, unit) {
    this.viewWidth = width
  }
  
  setViewHeight(height, unit) {
    this.viewHeight = height
  }
  
  async setClassData() {
    this.classes = {
      name: "classes",
      children: []
    }
    await FileIndex.current().db.classes.each(clazz => {
      /*let methods = []
      clazz.methods.forEach((method) => {
        methods.push({
          name: method.name,
          size: method.loc,  
          url: clazz.url,
        })
      })*/
      let superClass = clazz.superClass
      
      this.classes.children.push({
        name: clazz.name,
        loc: clazz.loc,
        superClass: clazz.superClass,
        url: clazz.url,
        children: [],
        nom:  clazz.nom
      })
    })
  }
  
  async setVersionData() {
    this.versions = {}
    this.versions = {
      name : 'versions',
      modifications: await FileIndex.current().db.versions.count(),
      children: []
    }
    await FileIndex.current().db.transaction('!r', FileIndex.current().db.classes, FileIndex.current().db.versions, () => {
      FileIndex.current().db.classes.each((clazz) => {
        var methodVersions = new Array()
        var versionsEntries = FileIndex.current().db.versions.where({'class': clazz.name, 'url': clazz.url})
        versionsEntries.each((entry) => {
          //if (entry.method != '+null+') {
            let method = methodVersions.find(method => method.method == entry.method)
            if (method) {
              method.modifications++
            } else {
              methodVersions.push({
                name: entry.method,
                modifications: 1,
                url: entry.url,
              })
            }
          //}
        })
        versionsEntries.count().then(count => {
          if (count > 0) {
            this.versions.children.push({
              name: clazz.name,
              url: clazz.url,
              modifications: count,
              children: methodVersions
           })
          }
        })
     })
    })
 /*   await FileIndex.current().db.transaction('!r', FileIndex.current().db.classes, FileIndex.current().db.versions, () => {
      FileIndex.current().db.classes.each((clazz) => {
        var methodVersions = new Array()
        var versionsEntries = FileIndex.current().db.versions.where({'class': clazz.name})
        versionsEntries.each((entry) => {
          //if (entry.method != '+null+') {
            let method = methodVersions.find(method => method.method == entry.method)
            if (method) {
              method.modifications++
            } else {
              methodVersions.push({
                name: entry.method,
                modifications: 1,
              })
            }
          //}
        })
        versionsEntries.count().then(count => {
          if (count > 0) {
            this.versions.children.push({
              name: clazz.name,
              url: clazz.url,
              modifications: count,
              children: methodVersions
           })
          }
        })
     })
    })*/
    console.log(this.versions.children)
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
    // if (this.classes) {
      var start = Date.now()
      await this.setClassData()
      console.log("setClassData in " + (Date.now() - start) + "ms")
    // }
    start = Date.now()
    await this.updatePolymetricView()
    console.log("updatePolymetricView in " + (Date.now() - start) + "ms")
  }

  async onUpdateVersions() {
    //await FileIndex.current().updateAllVersions()
    /*await this.setVersionData()
    await this.updateVersionHeatMap()*/
    this.setVersionData().then(() => {
      this.updateVersionHeatMap()
    });
  }
  
  async onUpdateBrokenLinks() {
  //  await FileIndex.current().updateAllLinks()
    await this.setLinkData()
    await this.updateTableBrokenLinks()
  }
  
  async updatePolymetricView() {
    this.polymetricContainter.innerHTML = ''
    this.polymetricContainter.style.position = "relative"
    this.polymetricContainter.style.width = this.viewWidth + 'px'
    this.polymetricContainter.style.height = this.viewHeight + 'px'
  
    var polymetric = await lively.create("d3-polymetricview")
    polymetric.style.width = "100%"
    polymetric.style.height = "100%"
    this.polymetricContainter.appendChild(polymetric)
    lively.setPosition(polymetric, lively.pt(0,0))
  
    polymetric.style.backgroundColor = "lightgray"
    
    if (!this.classes) {
      console.warn("analysis without classes")
      return
    }
    
    polymetric.setData(this.classes)
  
    console.log('polymetric:' , this.classes)
    
    /*
    e.g Width metric = number of attributes (noa)???, height metric = number of methods (nom), color metric = number of lines of code.
    */
    polymetric.config({
      color(node) {
        if (!node) return ""
        return `hsl(10, 0%,  ${node.data.loc ? (node.data.loc * 50) : 10 }%)`
      },
      width(node) {
       if (node.data.nom) {
          return Math.sqrt(parseInt(node.data.nom))
        }
        return 10
      },
      height(node) {
        if (node.data.nom) {
          return parseInt(node.data.nom)
        }
        return 10
      },
      onclick(node) {
        lively.openInspector(node.data)
      },
    }) 
    polymetric.updateViz()
    console.log('polymetric->', this.classes)
    
  }

  async updateVersionHeatMap() {
    var heatmap = await lively.create("lively-analysis-heatmap")
    heatmap.setWidth(this.viewWidth,'px')
    heatmap.setHeight(this.viewHeight,'px')
    heatmap.setData(this.versions)
    heatmap.updateViz()
    
    this.heatMapContainer.innerHTML = ''
    this.heatMapContainer.appendChild(heatmap)
  }

 async updateTableBrokenLinks() {
    var table = await lively.create("lively-analysis-table")
    table.setWidth(this.viewWidth,'px')
    table.setHeight(this.viewHeight,'px') 
    table.setData(this.links)
    table.updateViz()
   
    this.brokenLinksContainer.innerHTML = ''
    this.brokenLinksContainer.appendChild(table)
  }


  /* Lively-specific API */

  livelyPreMigrate() {
    // is called on the old object before the migration
  }

  livelyMigrate(other) {
    // whenever a component is replaced with a newer version during development
    // this method is called on the new object during migration, but before initialization
    this.someJavaScriptProperty = other.someJavaScriptProperty

    // this.classes = other.classes
  }

  livelyInspect(contentNode, inspector) {
    // do nothing
  }

  livelyPrepareSave() {

  }

  async livelyExample() {
    this.viewWidth = 600
    this.viewHeight = 150
    this.versions = {
      name: "root",
      modifications: 150,
      children: [
        {name: "class A", modifications: 50, children: [{name: "method A1", modifications: 36}, {name: "method A2", modifications: 14}]},
        {name: "class B", modifications: 25, children: [{name: "method B1", modifications: 24}]},
        {name: "class C", modifications: 15, children: [{name: "method C1", modifications: 14}]}
      ]}
    await this.updateVersionHeatMap()
    
    this.links = [
      { id: "", no: "1", status: "dead", column: "1.2 value" },
      { id: "", no: "2", status: "dead",  column: "2.2 value" },
      { id: "", no: "3", status: "alive", column: "3.2 value" },
    ]
    await this.updateTableBrokenLinks()
    
    this.classes = {
      name: "classes",
      children: [
        {name: 'superClass A', loc: 40, nom:  17, noa: 5, children: [
          {name: "class A", loc: 5, nom: 1, noa: 7, children: []},
          {name: "class B", loc: 20, nom: 9, noa: 13, children: []},
          {name: "class C", loc: 35, nom: 13, noa: 4, children: []}
        ]},
       {name: 'superClass B', loc: 20, noa: 7, children: [
          {name: "class D", loc: 10,  nom: 3, noa: 6, children: []},
          {name: "class E", loc: 30,  nom: 7, noa: 8, children: []},
          {name: "class F", loc: 50, nom: 17, noa: 2, children: []},
        ]}
      ]
    }
   await this.updatePolymetricView()
  }

}
