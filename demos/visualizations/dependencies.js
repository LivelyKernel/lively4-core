import {Panning} from "src/client/html.js"
   
export default class ModuleDependencyGraph {

    static query(query) {
      return lively.query(this.ctx, query)
    }

    static async dotSource() {
      var edges = []
      var dotNodes  = []
      for(let node of this.nodes) {
        var color = "gray"
        var fontsize = "12pt"
        if (node.forward ) {
          color = "green";
          fontsize = "16pt"
        }
        if (node.back) {
          color = "blue";
          fontsize = "16pt"
        }
        if (node.forward && node.back) {
          color = "black";
          fontsize = "16pt"
        }

        
        dotNodes.push(node.id + `[`+
        ` label="${node.url.replace(/.*\//,"")}"`+
        ` tooltip="${node.url.replace(lively4url,"")}"`+
           ` fontsize="${fontsize}"` +
          ` fontcolor="${color}"` +        
        `]`)
        if (node.forward) {
          for(let other of node.forward) {
            var edge = "" + node.id + " -> " + other.id  + `[color="gray"]`
            edges.push(edge)
          }          
        }
        if (node.back) {
          for(let other of node.back) {
            var edge = "" + other.id + " -> " + node.id + `[color="gray"]` 
            edges.push(edge)
          }          
        }
        
      }
      
      return `digraph {
        rankdir=LR;
        graph [  
          splines="false"  
          overlap="true"  ];
        node [ style="solid"  shape="plain"  fontname="Arial"  fontsize="14"  fontcolor="black" ];
        edge [  fontname="Arial"  fontsize="8" ];
        ${dotNodes.join(";\n")}
        ${edges.join(";\n")}
      }`
    }
    
    static ensureNode(url) {
      var node = this.nodes.find(ea => ea.url == url)
      if (!node) {
        node = { id: this.counter++, url: url, forward: null, back: null}
        this.nodes.push(node)
      }
      return node
    }
  
    static expandForward(node) {
      if (node.forward != null) return 
      var urls = lively.findDependedModules(node.url, false, [], true)
      node.forward = urls.map(ea => this.ensureNode(ea))
    }
  
    static expandBack(node) {
      if (node.back != null) return 
      var urls = lively.findDependedModules(node.url, false, [])
      node.back = urls.map(ea => this.ensureNode(ea))
    }
   
    
  
    static async update() {
      this.counter = 1
      this.nodes = []
      
      var node = this.ensureNode(this.url)
      this.expandForward(node)
      this.expandBack(node)
      
      this.q
      
      
      this.render()
    }

    static onClick(evt, node, element) {
      evt.preventDefault()
      evt.stopPropagation()
      if (evt.ctrlKey) {
        this.expandForward(node)
      } else if (evt.shiftKey) {
        this.expandBack(node)        
      } else {
        lively.openBrowser(node.url, true)
        return 
      }
      
      this.render()
    }
  
  
    static async render() {
      var source = await this.dotSource()
      this.graphviz.innerHTML = `<` +`script type="graphviz">${source}<` + `/script>}`
      await this.graphviz.updateViz()
  
  
  
      let svgNodes = this.graphviz.shadowRoot.querySelectorAll("g.node")
        
      svgNodes.forEach(ea => {
          ea.addEventListener("click", async (evt) => {
            var key = ea.querySelector('title').textContent
            
            var node = this.nodes.find(ea => ea.id == key)
            
            // // debug
            // if (evt.ctrlKey) {
            //   lively.openInspector({key, node, element: ea})
            //   return
            // }
            
            this.onClick(evt, node, ea)
            
            
          })
        })
    }
  
  
    static async create(ctx) {  
      this.ctx = ctx      
      var markdownComp = this.query("lively-markdown")
      var parameters = markdownComp.parameters
      this.url = lively4url + "/src/client/fileindex.js" // default example
      if (parameters.url) {
        this.url = parameters.url
      }

      var container = this.query("lively-container");
      this.graphviz = await (<graphviz-dot></graphviz-dot>)


      var style = document.createElement("style")
      style.textContent = `
      td.comment {
        max-width: 300px
      }
      div.help {
        padding: 5px;
        color: gray;
        font-size: 8pt;
      }
      div#root {
        position: absolute; 
        top: 0px; left: 0px; 
        overflow-x: auto; 
        overflow-y: scroll; 
        width: calc(100% - 0px); 
        height: calc(100% - 20px);
      }
      `            
      this.graphviz.style.display = "inline-block" // so it takes the width of children and not parent
      this.pane = <div id="root">
        {style}
         <div class="help">
          <div><b>click</b> browse module</div>
          <div><b>ctrl-click</b> show imported modules</div>
          <div><b>shift-click</b> show depended modules, e.g. modules that import that module</div>

         </div>
        {this.graphviz}
      </div>
      this.update()
      
      new Panning(this.pane)
    
    
    
      return this.pane
    }
  }