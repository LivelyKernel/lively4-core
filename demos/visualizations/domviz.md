<div style="position:absolute; top: 20px; left: 30px; z-index: 1">
<h1>HTML DOM Viz</h1>

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
  
  class DomVizGraph {
  
    constructor(data) {
      this.data = data
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
      
      var mySize =  contents.length
      var childrenSize = 0
      this.dataEdges(data).forEach(ea => {
        if (ea.outerHTML) {
          childrenSize += ea.outerHTML.length
        }
      })      
      return Math.sqrt(mySize - childrenSize) / 20
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
  
 
  class GraphVizApp  {
    constructor(ctx, graph) {
      this.ctx = ctx
      this.container = this.get("lively-container");
      this.containerContent = this.container.get("#container-content")
      this.graph = graph
    }
    
    get data() {
      return this.graph.data
    }
    
    get(query) {
      return lively.query(this.ctx, query)
    } 
    
    async setup() {
      var div = document.createElement("div")
      div.id = "root"
      this.result = div
      this.graphviz = await (<graphviz-dot engine={this.getEngine()} server="true" ></graphviz-dot>) // 

      this.updateExtent()

      lively.removeEventListener("graphvizContent", this.container)
      lively.addEventListener("graphvizContent", this.container, "extent-changed", () => {
        this.updateExtent()
      });

      var style = document.createElement("style")
      style.textContent = `
        td.comment {
          max-width: 300px
        }
        div#root {
          overflow: visible;
        }

        #graphviz {
          position: absolute;
          top: 0px
          left: 0px;

        }`
        
      div.appendChild(style)
      div.appendChild(<div>
        <button click={() => this.updateViz()}>update</button>
      </div>)
      div.appendChild(this.graphviz)

      this.setEngine(GraphvizEngine)
    }
    
    
    getEngine() {
      return this.engine || "dot"
    }

    setEngine(engine) {
      this.engine = engine
      if (this.graphviz) {
        this.graphviz.setAttribute("engine", engine);
      }
      return engine
    }


    
    updateSVG() {
      var svg = this.graphviz.get("svg")
      if (!svg) {
        lively.warn("no svg found") // should we wait?
        return
      }

      var zoomElement = document.createElementNS("http://www.w3.org/2000/svg", "g")  
      var zoomG = d3.select(zoomElement)

      var svgOuter = d3.select(svg)
      var svgGraph = d3.select(this.graphviz.get("#graph0"))

      svgOuter
        .style("pointer-events", "all")        
        .call(d3.zoom()
            .scaleExtent([1 / 30, 30])
            .on("zoom", () => {
              var trans = d3.event.transform
              zoomG.attr("transform", trans);
            }));        
      svg.appendChild(zoomElement)
      zoomElement.appendChild(this.graphviz.get("#graph0"))


      this.graphviz.shadowRoot.querySelectorAll("g.node").forEach(ea => {
        d3.select(ea).style("pointer-events", "all")
        ea.addEventListener("click", async (evt) => {
          // lively.showElement(ea)
          var key = ea.querySelector('title').textContent
          var data = this.graph.dataById.get(key)

          if (evt.shiftKey) {
            lively.openInspector({
              element: ea,
              key: key,
              data: data
            })
            return
          }
          var data = this.graph.dataById.get(key)
          if (data) {
            this.graph.dataClick(data, ea)
          }

          this.lastSelectedNode = this.selectedNode
          this.selectedNode = ea
        })
      })
    }

    updateExtent() {
      var extent = lively.getExtent(this.containerContent)
      this.graphviz.width = extent.x - 40
      this.graphviz.height = extent.y - 40
    }
        
    async updateViz() {
      var start = performance.now()
      for(var ea of this.data) {
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
      
    static async create(ctx, graph) {
      var app = new GraphVizApp(ctx, graph)
      await app.setup()    
      await app.updateViz()
      return app.result
    }
  }
  GraphVizApp.create(this, new DomVizGraph(Array.from([that || document.bodies])))
</script>