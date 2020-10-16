<script>
  var markdownComp = lively.query(this, "lively-markdown")

  import {Panning} from "src/client/html.js"

  import Literature from "src/client/literature.js"

  import {Paper, Author} from "src/client/protocols/academic.js"

  const default_query="Jens Lincke"
  const default_count = 3
  const default_min_cc_in = 2
  const default_min_refs_out = 6

  class PaperGraph {
    static maxPapers() {
      return this.pane.querySelector("input#count").value
    }

    static minRefs() {
      return this.pane.querySelector("input#min_refs_out").value
    }

    static minCitationsIn() {
      return this.pane.querySelector("input#min_cc_in").value
    }

    static query(query) {
      return lively.query(this.ctx, query)
    }
    
    static addPaper(paper, type) {
      if (!lively.isInBody(this.pane)) throw "StoppedAddingPapers"
    
      var node = this.nodesById[paper.microsoftid]
      if (node) return true
      
      this.pane.querySelector("#progress").textContent += type[0]
      
      // console.log("add paper " + paper.microsoftid)
    
      this.papersById[paper.microsoftid] =  paper
      
      node = {id: paper.microsoftid, type: type, paper: paper}
      this.nodes.push(node) // and another layer of indirection....
      this.nodesById[paper.microsoftid] =  node
      
      
      if (type == "citation") {
        node.selfreference = false
        node.paper.authorNames.forEach(author => {
          if(this.authorNames.has(author)) {
            node.selfreference = true
          }
        })       
      }
      
      return true
    }

    static renderEdge(edge) {
      var fromNode = this.nodesById[edge.from]
      var toNode = this.nodesById[edge.to]
      var color = "gray"
      var width = 1
      var tooltip = "no citation context"
      if (fromNode && toNode) {
        if (fromNode.type == "root" && toNode.type == "root") {
          color = "black"
        } else if (toNode.type == "root") {
          color = "palegreen"
        } else if (fromNode.selfreference || toNode.selfreference) {
          color = "lightblue"
        }
        var CitationContext = fromNode.paper.value.CitCon
        debugger
        if (CitationContext && CitationContext[edge.to]) {
          width = CitationContext[edge.to].length + 1
          tooltip = this.cleanString("" + CitationContext[edge.to].map(ea => "- '" + ea + "'").join("\n"))
        }
      } else {
        color = "red"
      }


      return edge.to + " -> " + edge.from + `[penwidth=${width} tooltip="${tooltip}" color="${color}"]`
    }
    
    static refCount(node) {
      return this.edges.filter(ea => ea.to == node.id).length
    }
    
    static cleanString(s) {
      return s.replace(/["]/g,"")
    }
    
    static renderNode(node) {
      var refsto = node.paper.value.CC || 0
      
      var color = ""
      var tooltip = ""
      
      if(node.type == "root") {
        color = "blue" 
      } else if (node.selfreference) {
        color = "lightblue"
      } else if (node.type == "citation") {
        color = "palegreen"
      } else {
        color = "darkgray"
      }
      
      tooltip = this.cleanString(
           node.paper.authorNames.join(", ") + ". "+node.paper.year + ".\n" 
           + node.paper.title + ".\n"
           + node.paper.booktitle 
           );
      
      
      return node.id + `[`+
        ` label="${node.paper.key}"`+
        ` tooltip="${tooltip}"`+
        ` fontsize="${node.type == "root" ? 20 : Math.sqrt(refsto) + 5}"` +
        ` fontcolor="${color}"` +
        
        `]`
    }
    
    static printEdge(edge) {
      var fromPaper =  this.papersById[edge.from]
      var toPaper =  this.papersById[edge.to]
      return `Edge(${fromPaper ? fromPaper.key : edge.from}, ${toPaper ? toPaper.key : edge.to} )`
  }
    
    static addEdge(edge) {
      let existing = this.edges.find(ea => (ea.from == edge.from) && (ea.to == edge.to))
      if (existing) {
        return
      }
      let back = this.edges.find(ea => (ea.to === edge.from) && (ea.from === edge.to))
      if (back) {
        return
      }
      // lively.notify("addEdge" + this.printEdge(edge))
      this.edges.push(edge)
    }
    
    static async dotSource() {
      this.nodes = []
      this.edges = []

      this.queryString = this.pane.querySelector("#query").value
      


      // var entries  = (await Literature.papers()).filter(ea => ea.authors && ea.authors.includes(this.queryString))
      // entries = entries.slice(0,10)
    
      var jsonEntries = await lively.files.loadJSON(`academic://${this.queryString}?count=${this.maxPapers()}`)
    
      this.papersById = {}
      this.nodesById = {}

      this.authorNames = new Set()

      try {
        var rootPapers = []
        for(var json of jsonEntries)  {
          var paper = new Paper(json)
          await paper.resolveReferences()
          await paper.findReferencedBy()
          if (!this.addPaper(paper, "root")) break;
          rootPapers.push(paper)
          
          
          paper.authorNames.forEach(author => this.authorNames.add(author))
        };
        for(paper of rootPapers) {
          for(var ref of paper.referencedBy) {
            if(!this.addPaper(ref, "citation")) break;
            this.addEdge({from: ref.microsoftid , to: paper.microsoftid})
          }
        }        
        for(paper of rootPapers) {
          for(var ref of paper.references) {          
            if(!this.addPaper(ref, "reference")) break;
            this.addEdge({from: paper.microsoftid , to: ref.microsoftid})
          }
        }        
      } catch(e) {
        if (e == "MaxPapers") {
          // do nothing
        } else if (e == "StoppedAddingPapers") {
          lively.warn("stopped paper visualization")
          return
        } else {
          throw e
        }
      } 
      this.pane.querySelector("#progress").textContent = ""

      var minrefs = this.minRefs()
      var minCitationsIn = this.minCitationsIn()
      this.nodes = this.nodes.filter(ea => ea.type == "root" || 
        (ea.type == "reference" && (this.refCount(ea) >= minrefs)) ||
        (ea.type == "citation" && (ea.paper.value.CC >= minCitationsIn))) // filter some nodes
      
      this.edges = this.edges.filter(edge => this.nodes.find(ea => ea.id ==  edge.from) && this.nodes.find(ea => ea.id == edge.to)) // remove obsolete edges 

      return `digraph "" {
        rankdir=LR;
        graph [  
          splines="true"  
          overlap="false"  ];
        node [ style="solid"  shape="plain"  fontname="Arial"  fontsize="14"  fontcolor="black" ];
        edge [  fontname="Arial"  arrowhead="none" color="gray" fontsize="8" ];
        ${this.edges.map(ea => this.renderEdge(ea)).join(";\n")}
        ${this.nodes.map(ea => this.renderNode(ea)).join(";\n")}
      }`
    }
    
    static async update() {
      var start = Date.now()
      this.graphviz.get("#graph").innerHTML = ""
      var source = await this.dotSource()
      this.graphviz.innerHTML = `<` +`script type="graphviz">${source}<` + `/script>}`
      await this.graphviz.updateViz()    
      lively.notify("updated in " + (Date.now() - start) + "ms")

    }
    
    static async create(ctx) {
      this.ctx = ctx
      

      this.container = this.query("lively-container");
      this.graphviz = await (<graphviz-dot></graphviz-dot>)


      var style = document.createElement("style")
      style.textContent = `
      td.comment {
        max-width: 300px
      }
      input#author {
        width: 400px;
      }
      
      div#root {
        overflow: visible;
        width: 5000px;
        height: 800px;
        user-select: none
      }
      `            
      this.graphviz.style.display = "inline-block" // so it takes the width of children and not parent
      // z-index: -1;
      this.pane = <div id="root" title=" " style="position: absolute; top: 0px; left: 0px; overflow-x: auto; overflow-y: scroll; width: calc(100% ); height: calc(100%);">
        {style}
        <div><h2>Paper Query: </h2> 
            <input input={(() => this.update()).debounce(500) } id="query" value={default_query}></input>
            <span>Max: <input input={(() => this.update()).debounce(500) } id="count" value={default_count}></input></span>

          <button click={() => lively.openBrowser("academic://" + this.queryString + "?count=" + this.maxPapers()) }>browse</button></div>
        <div>
          <span>Min References (out): <input input={(() => this.update()).debounce(500) } id="min_refs_out" value={default_min_refs_out}></input></span>
          <span>Min Citations (In): <input input={(() => this.update()).debounce(500) } id="min_cc_in" value={default_min_cc_in}></input></span>
        </div>
        <div id="progress" style="width:600px; word-break: break-all;"></div>
        {this.graphviz}
      </div>
      
      var parameters = markdownComp.parameters
      for(let name of Object.keys(parameters)) {
         var element = this.pane.querySelector("#" +name)
         if (element) element.value = parameters[name]
         else {
          lively.warn("parameter " + name + " not found")
         }
      }
      
      
      this.update() // async...
      
      new Panning(this.pane)

      this.pane.addEventListener("click", evt => {
        var g = evt.composedPath().find(ea => ea.localName == "g" && ea.classList.contains("node"))
        var id = g && g.querySelector("title").textContent
        if (!id) {
          if(evt.shiftKey) {
            lively.openInspector(this)
          }
          return;
        }
        var paper = this.papersById[id] // because we left our object realm... we have to jump through hoops 
        if (paper) {
          if (evt.shiftKey) {
            lively.openInspector(paper)
          } else {
            lively.openBrowser("academic://expr:Id=" + id)
          }
        } else {
          lively.notify("no paper found for " + JSON.stringify(id) )
        }
        
        
      })
      
      return this.pane
    }
  }
  
  // import Tracing from "src/client/tracing.js"
  // Tracing.traceObject(PaperGraph)


  PaperGraph.create(this)
</script>