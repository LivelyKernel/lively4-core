<script>
  var markdownComp = lively.query(this, "lively-markdown")

  import {Panning} from "src/client/html.js"

  var base = lively.query(this, "lively-container").getDir();

  import Literature from "src/client/literature.js"

  import {Paper, Author} from "src/client/protocols/academic.js"

  class PaperGraph {
    static maxPapers() {
      return this.pane.querySelector("input#maxpapers").value
    }

    static minRefs() {
      return this.pane.querySelector("input#minrefs").value
    }

    static query(query) {
      return lively.query(this.ctx, query)
    }
    
    static addPaper(paper, type) {
      if (!lively.isInBody(this.pane)) throw "StoppedAddingPapers"
    
      this.pane.querySelector("#progress").textContent += type[0]
      
      if (this.nodes.length > this.maxPapers()) {
        return false
      }
      
      // console.log("add paper " + paper.microsoftid)
    
      this.papersById[paper.microsoftid] =  paper
      this.nodes.push({id: paper.microsoftid, type: type, paper: paper}) // and another layer of indirection....
      return paper
    }

    static renderEdge(edge) {
      var fromPaper = this.papersById[edge.from]
      var toPaper = this.papersById[edge.to]
      var color = "gray"

      if (fromPaper && toPaper) {
        if (toPaper.authorNames.includes(this.authorName)) {
          color = "green"
        }

        if (fromPaper.authorNames.includes(this.authorName) && toPaper.authorNames.includes(this.authorName)) {
          color = "black"
        }      
      }

      
      return edge.from + " -> " + edge.to + `[ color="${color}"]`
    }
    
    static refCount(node) {
      return this.edges.filter(ea => ea.to == node.id).length
    }
    
    static renderNode(node) {
      var refsto = node.paper.value.CC || 0
      return node.id + `[label="${node.paper.key}" fontsize="${
          node.paper.authorNames.includes(this.authorName) ? 20 : Math.sqrt(refsto) + 5}"]`
    }
    
    static async dotSource() {
      this.nodes = []
      this.edges = []

      this.authorName = this.pane.querySelector("#author").value
      


      var entries  = (await Literature.papers()).filter(ea => ea.authors && ea.authors.includes(this.authorName))
      // entries = entries.slice(0,10)
    
      this.papersById = {}

      try {
        for(var entry of entries)  {
          var paper = new Paper(entry.value)
          await paper.resolveReferences()
          await paper.findReferencedBy()
          if (!this.addPaper(paper, "root")) break;
          for(var ref of paper.references) {
            this.edges.push({from: paper.microsoftid , to: ref.microsoftid})
            if(!this.addPaper(ref, "reference")) break;
          }
          for(var ref of paper.referencedBy) {
            this.edges.push({from: ref.microsoftid , to: paper.microsoftid})
            if(!this.addPaper(ref, "citation")) break;
          }

        };
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
      this.nodes = this.nodes.filter(ea => ea.type == "root" || ea.type == "citation" || this.refCount(ea) >= minrefs) // filter some nodes
      this.edges = this.edges.filter(edge => this.nodes.find(ea => ea.id ==  edge.from) && this.nodes.find(ea => ea.id == edge.to)) // remove obsolete edges 

      return `digraph {
        rankdir=LR;
        graph [  
          splines="false"  
          overlap="true"  ];
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
      // var parameters = markdownComp.parameters
      // if (parameters.url) {
      //   this.url = parameters.url
      // }

      this.container = this.query("lively-container");
      this.graphviz = await (<graphviz-dot></graphviz-dot>)


      var style = document.createElement("style")
      style.textContent = `
      td.comment {
        max-width: 300px
      }
      div#root {
        overflow: visible;
        width: 5000px;
        height: 800px;
      }
      `            
      this.graphviz.style.display = "inline-block" // so it takes the width of children and not parent
      // z-index: -1;
      this.pane = <div id="root" style="position: absolute; top: 0px; left: 0px; overflow-x: auto; overflow-y: scroll; width: calc(100% ); height: calc(100%);">
        {style}
         <div style="height: 20px"></div>
        <h2>Papers</h2>
        <div>Author: 
          <input input={(() => this.update()).debounce(500) } id="author" value="Jens Lincke"></input>
          <button click={() => lively.openBrowser("academic://" + this.authorName + "?count=1000") }>browse</button></div>
        <div>Max: <input input={(() => this.update()).debounce(500) } id="maxpapers" value="10"></input></div>
        <div>Minrefs (out): <input input={(() => this.update()).debounce(500) } id="minrefs" value="0"></input></div>

        <div id="progress" style="width:300px; word-break: break-all;"></div>
        {this.graphviz}
      </div>
      
      this.update() // async...
      
      new Panning(this.pane)

      this.pane.addEventListener("click", evt => {
        var g = evt.composedPath().find(ea => ea.localName == "g" && ea.classList.contains("node"))
        var id = g && g.querySelector("title").textContent
        if (!id) return;
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