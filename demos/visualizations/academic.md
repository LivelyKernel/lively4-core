<script>
  var markdownComp = lively.query(this, "lively-markdown")

  import {Panning} from "src/client/html.js"

  var base = lively.query(this, "lively-container").getDir();
  
  class OverviewGraph {

    static query(query) {
      return lively.query(this.ctx, query)
    }

    static async dotSource() {
      var edges = []

      edges.push(1 + " -> " + 2)
      edges.push(1 + " -> " + 3)
      edges.push(2 + " -> " + 3)


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

    static async create(ctx) {
    
      this.ctx = ctx
      // var parameters = markdownComp.parameters
      // if (parameters.url) {
      //   this.url = parameters.url
      // }

      var container = this.query("lively-container");
      var graphviz = await (<graphviz-dot></graphviz-dot>)

      var source = await this.dotSource()
      graphviz.innerHTML = `<` +`script type="graphviz">${source}<` + `/script>}`
      await graphviz.updateViz()

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
      graphviz.style.display = "inline-block" // so it takes the width of children and not parent
      // z-index: -1;
      let pane = <div id="root" style="position: absolute; top: 20px; left: 0px; overflow-x: auto; overflow-y: scroll; width: calc(100% - 0px); height: calc(100% - 20px);">
        {style}
         <div style="height: 20px"></div>
        <h2>Overview</h2>
        {graphviz}
      </div>
      
      new Panning(pane)

      
      return pane
    }
  }
  

  OverviewGraph.create(this)
</script>