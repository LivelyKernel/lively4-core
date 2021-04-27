<script>
  import {Panning} from "src/client/html.js"
   
  class MyGraph {

    static query(query) {
      return lively.query(this.ctx, query)
    }

    static async dotSource() {
      var edges = []
    
      var size = this.size()
      var nodesSize = this.nodesSize()
      for(let count=1; count < size; count++) {
        var edge = "" + ((count % nodesSize) + 1) + " -> " + Math.round(Math.random(nodesSize) * nodesSize)
        edges.push(edge)
      }
      
      return `digraph {
        rankdir=LR;
        graph [  
          splines="false"  
          overlap="true"  ];
        node [ style="solid"  shape="plain"  fontname="Arial"  fontsize="14"  fontcolor="black" ];
        edge [  fontname="Arial"  fontsize="8" ];


        ${edges.join(";\n")}
      }`
    }
    
    static size() {
      return this.pane.querySelector("input#size").value 
    }

    static nodesSize() {
      return this.pane.querySelector("input#nodes").value 
    }

    static async update() {
      this.pane.querySelector("#nodeslabel").innerHTML = this.nodesSize()
      this.pane.querySelector("#sizelabel").innerHTML = this.size()
      var source = await this.dotSource()
      this.graphviz.innerHTML = `<` +`script type="graphviz">${source}<` + `/script>}`
      await this.graphviz.updateViz()
    }


    static async create(ctx) {  
      this.ctx = ctx

      var markdownComp = lively.query(ctx, "lively-markdown")
      this.graphviz = await (<graphviz-dot></graphviz-dot>)


      var style = document.createElement("style")
      style.textContent = `
      td.comment {
        max-width: 300px
      }
      div#root {
        position: relative; 
        top: 20px; left: 0px; 
        overflow-x: auto; 
        overflow-y: scroll; 
        width: calc(100% - 0px); 
        height: calc(100% - 20px);
      }
      `
      var parameters = markdownComp.parameters
      this.graphviz.style.display = "inline-block" // so it takes the width of children and not parent
      this.pane = <div id="root">
        {style}
         <h2>Random Graph</h2>
         <div>Nodes: 
          <span id="nodeslabel"></span>  <br /> 
          <input input={evt => this.update() } type="range" min="1" max="300" value={parameters.edges || 50} class="slider" id="nodes"></input>
         </div>
         <div>Egdes: <span id="sizelabel"></span>  <br />
          <input input={evt => this.update() } type="range" min="1" max="300" value={parameters.nodes || 50} class="slider" id="size"></input>
        </div>
         <div style="height: 20px"></div>
        {this.graphviz}
      </div>
      this.update()
      
      new Panning(this.pane)
      return this.pane
    }
  }
  MyGraph.create(this)
</script>

