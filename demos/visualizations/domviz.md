<div style="position:absolute; top: 20px; left: 30px; z-index: 1">
<h1>HTML DOM Viz (myself)</h1>
limit <input id="limit">
</div>

<script>

  // see https://www.graphviz.org/about/
  const GraphvizEngine = "dot" // "dot" , "neato", "fdp", "osage" 

  import moment from "src/external/moment.js";  
  import Strings from 'src/client/strings.js'  
  import Colors from "src/external/tinycolor.js"
  import d3 from "src/external/d3.v5.js"
  
  import _ from 'src/external/lodash/lodash.js'
  import {GroupMap} from "src/client/collections.js"
  import ScriptApp from "./scriptapp.js"
    
  class GraphVizData {
  
    constructor() {
      this.nodes = new Map()
      this.dataById = new Map()
      this.edges = new Set()
      
      this.outgoing = new GroupMap()
      this.incoming = new GroupMap() 
      
      this.colors =  d3.scaleOrdinal(d3.schemePastel2); // d3.schemeCategory10
       
      this.idMap = new Map()
      this.idCounter = 0
      
      this.maxNodes = 1500
    }
  
    updateData() {
        
    }
    
    
    key(data) {
      var id = this.idMap.get(data)
      if (!id) {
        id = "_"  + this.idCounter++
        this.idMap.set(data, id)
      }
      return id
    }

    dataEdges(data) {
      if (!data.childNodes) return []
      var result = Array.from(data.childNodes)
      if (data.shadowRoot) {
        result.push(data.shadowRoot)
      }
      // return result
      return result.filter(ea => 
        (ea instanceof HTMLElement || ea instanceof ShadowRoot) 
          && !(ea.localName == "graphviz-dot"))
    }

    addEdge(a , b, style="") {
      this.outgoing.add(this.key(a), this.key(b))
      this.incoming.add(this.key(b), this.key(a))
      this.edges.add(this.key(a)  + " -> " +  this.key(b) + style)
    }  


    cleanName(s) {
      return _.trim(s,50).replace(/[^A-Za-z09\-_ ]/g,"")
    }
    
    dataClass(data) {
      return this.cleanName(data.constructor.name)
    }
    
    dataCluster(data) {
      if (data && data.parentElement) {
        return this.key(data.parentElement)
      }
    }
    
    dataClick(data, element) {
      lively.showElement(data)
    }
    
    dataSize(data) {
      var contents = data && data.outerHTML
      if (!contents) return 1
      
      var mySize =  Math.sqrt(contents.length)
      var childrenSize = 0
      this.dataEdges(data).forEach(ea => {
        if (ea.outerHTML) {
          childrenSize += ea.outerHTML.length
        }
      })      
      return (mySize - childrenSize) / 20
    }
    
    dataStyle(data, unfinished) {
      var style = ""
      var nodeId = this.key(data)

      var size = this.dataSize(data)
      var color = this.colors(this.dataClass(data))
      var label = nodeId + " "+ this.dataClass(data)
      
      style = `style="${unfinished ? "" : "filled"}" color="${color}" fixedsize="true" width="${size}" height="${size}"  label="${label}"`  // style="filled" 
      
      return "[" + style + "]"
  }
  
    async addNode(data) {
      var nodeId = this.key(data)
      
      if (this.nodes.get(nodeId)) {
        return nodeId
      }
      
      this.dataById.set(nodeId, data)
      var unfinished = false
      var dataEdges = this.dataEdges(data)
      for(var otherData of dataEdges) {
        var otherDataId = this.nodes.get(this.key(otherData))
        if (otherDataId) {
          this.addEdge(data, otherData, `[color="gray"]`)      
        } else {
          if (this.nodes.size < this.maxNodes) {
            otherDataId = await this.addNode(otherData)
            this.addEdge(data, otherData, `[color="gray"]`)            
          } else {
            unfinished=true
          }
        } 
      }            
      var style = this.dataStyle(data, unfinished)
      this.nodes.set(nodeId, nodeId + style)
    
      return nodeId
    }

    getSource() {
      
      var groupParents = new Map()
      var groups = _.groupBy(Array.from(this.nodes.keys()), key => {
        var data = this.dataById.get(key)
        var clusterNodeId = this.dataCluster(data)
        groupParents.set(key, clusterNodeId)
        return clusterNodeId
      })
      var roots = Object.keys(groups).filter(ea => !groupParents.get(ea))
      
      
      var getCluster = (groupId) => {
        var group = groups[groupId]
        if (!group) return 
        return `subgraph cluster${groupId} { ${ 
          group.map(ea => this.nodes.get(ea)).join(";")
        } ${
          group.map(ea => {
            return getCluster(ea)
          }).filter(ea => ea).join(";\n") 
        } }`
      }
      
      var cluster = roots.map(ea => getCluster(ea))
    
      
    
      var source =  `digraph {
          rankdir=LR;
          edge [ len=4] 
        
          node [ style="filled" color="lightgray" fontsize="8pt" fontname="helvetica"]; 
          
          ${Array.from(cluster).join(";\n\n")}   
          ${Array.from(this.edges).join(";")} 
        }`
        // ${Array.from(this.nodes.values()).join(";")} 
          
        //  ${Array.from(cluster).join(";\n\n")}   
        console.log(source)
        return source
    }
  }  
  
  class GraphApp extends ScriptApp {
    
    static async create(ctx) {    
      await super.create(ctx)
      
      
      this.graph = new GraphVizData()
  
      this.ctx = ctx
      this.data = Array.from(document.body.childNodes)
      
      this.setEngine(GraphvizEngine)
      await this.updateViz()
      
      return this.result
    }
    
    static async updateViz() {

        var start = performance.now()
        for(var ea of this.data) {
          // if (i > limitElement.value) break; 
          await this.graph.addNode(ea)
        }
        console.log("[GraphApp]  " + Math.round(performance.now() - start) + "ms")
        var source = this.graph.getSource()
          
        this.graphviz.innerHTML = `<` +`script type="graphviz">`+source+ `<` + `/script>}`
        
        var start = performance.now()
        await this.graphviz.updateViz()
        console.log("[GraphApp] layouted  in " + Math.round(performance.now() - start) + "ms" )
        
        this.updateSVG()
      } 
  }
  GraphApp.create(this)
</script>