import Morph from "src/components/widgets/lively-morph.js"
import D3Component from "./d3-component.js"
import d3v5 from "src/external/d3.v5.js"
import { debounce } from "utils";
import "src/external/d3-selection-multi.v1.js"

/*
 *
 */
export default class D3GraphViz extends D3Component {

  async initialize() {
    this.options = {}
    this.loaded = new Promise(async (resolve) => {

      if (!self.d3 || !self.d3.select().graphviz) {
        self.d3 = d3v5 // because we go global here...? and it will be replaced...
      }
      if (!window.Viz) {
        await lively.loadJavaScriptThroughDOM("GraphViz", lively4url + "/src/external/viz.js", true)
      }
      //  "javascript/worker"

      if (!d3.select().graphviz) {
        await lively.loadJavaScriptThroughDOM("D3GraphViz", lively4url + "/src/external/d3-graphviz.js", true)
      }
      this.updateViz()
      this.addEventListener('extent-changed', ((evt) => {
        this.onExtentChanged(evt);
      })::debounce(500));

      this.d3 = d3

      resolve()
    })
  }

  
  getDotData() {
    return this.dotData
  }

  async setDotData(data) {
    this.dotData = data;
    await this.updateViz()
  }
  
  dataEdgeColor(source, target) {
    return "#aaaaaa"
  }
  
  
  objToAttributes(obj) {
    return Object.keys(obj).map(key => {
      return `${key}="${obj[key]}"`
    }).join(" ")
  }
  
  pxToInch(number) {
    return number * 0.75 / 72 // px to pt to inch
  }
  
  ifValueDo(value, func) {
    if (value !== undefined) {
      func(value)
    }
  }
  
  async setData(data) {
    this.data = data
    if (!data) return // do data... no cockies! ;-)
    if (data.nodes && data.relations) {
      var nodes = new Map()
      this.nodes = nodes
      
      var nodesSource = ""
      // Bundleview like data...
      this.walkTreeData(data.nodes, d =>  {
        if (!d.hidden) {
          nodes.set(d.id, d)
          var attributes = {
            shape: "rectangle", 
            fontname: "Arial",
            label: d.name
          }
          this.ifValueDo(this.dataWidth(d), width => attributes.width = this.pxToInch(width))
          this.ifValueDo(this.dataHeight(d), height => attributes.height = this.pxToInch(height))
          this.ifValueDo(this.dataFontsize(d), fontsize => attributes.fontsize = fontsize)
          
          nodesSource += `${d.id} [${this.objToAttributes(attributes)}];`
        }
      })

      var relationsSource = data.relations.map(ea => {
        let source = nodes.get(ea.source) // objects vs. explicit references through IDs that have first to be resolved...
        let target = nodes.get(ea.target)
        return `${ea.source} -> ${ea.target} [color="${this.dataEdgeColor(source, target)}"]`
      }).join(";")
      var source = `digraph { ${relationsSource} ${nodesSource}}` // edges before nodes helps the layouter...

      try {
       await this.setDotData(source)
        
      } catch(e) {
        throw new Error("D3 GraphViz, could not render: " + source, e)
      }
    }
  }
  

  async updateViz() {
    var svgContainer = this.get("#container")
    svgContainer.style.width = this.style.width // hard to find out how to do this in CSS, ... with "relative"
    svgContainer.style.height = this.style.height
    
    var bounds = this.getBoundingClientRect()
    var div = this.get("#graph")
    div.innerHTML = ""

    var data = this.getDotData()
    if (!data) {
      div.innerHTML = "no data"
      return
    }
    
    var graph = d3.select(div)
    this.graph = graph
    if (!graph.graphviz) {
      debugger
      console.warn("d3-graphviz: graph.graphviz undefined")
      return
    }
    
    
    var graphviz = graph.graphviz(false) // default is work, "false" -> no worker
      .fade(false)
      .zoom(true)
      .engine(this.engine || "dot")
  
    if (this.transition) {
      graphviz = graphviz.transition(() => {
        // #Important, the transition must select the root in the shadow...
        return d3.select(div).transition("main") 
            .ease(d3.easeLinear)
            .delay(0)
            .duration(1000);
      })
      .on("end",  () => {
        this.setupEvents();        
      });
    } else {
      setTimeout(() => this.setupEvents(), 100);          
    }
    
    
    this.graphviz = graphviz
    
    graphviz.renderDot(data);
    
    // this.setupEvents()
  }
  
  setupEvents() {
    var vis = this;
    this.graph.selectAll("g.node")
      // .attr("stroke", "red")
      .on("click", function(d) {
        vis.onNodeClick(d, d3.event, this)
      })
  }
  

  async update(data) {
    if (!this.graphviz) {
      await this.updateViz()
    }
    this.graphviz.renderDot(data);
    // this.setupEvents()
  }
  
  config(config) {
    Object.keys(config).forEach(key => {
      this.options[key] = config[key] // we could check them here...      
    })
  }

  livelyInspect(contentNode, inspector) {
    if (this.dotData) {
      contentNode.appendChild(inspector.display(this.dotData, false, "#dot-data", this));
    }
  }

  onExtentChanged() {
    // this.updateViz()
  }

  async livelyExample() {
    await this.loaded
    this.setDotData('digraph  {a -> b; b -> c; c -> a}')
  }

  livelyMigrate(other) {
    this.dotData = other.dotData
    this.options = other.options
  }

}
