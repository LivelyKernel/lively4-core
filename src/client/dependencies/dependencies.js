import {Panning} from "src/client/html.js"
   
export default class ModuleDependencyGraph {

    static query(query) {
      return lively.query(this.ctx, query)
    }

    static getNode(id) {
      return this.nodes.find(ea => ea.id == id) // #TODO use maps to make it faster
    }
  
  
    static async dotSource() {
      var dotEdges = []
      var dotNodes  = []
      for(let node of this.nodes) {
        var color = "gray"
        var fontsize = "12pt"
        // if (node.forward ) {
        //   color = "green";
        //   fontsize = "16pt"
        // }
        // if (node.back) {
        //   color = "blue";
        //   fontsize = "16pt"
        // }
        if ((node.forward || node.forwardURLs.length == 0) 
            && node.back || (node.backwardURLs.length == 0)) {
          color = "black";
          fontsize = "12pt"
        }

        
        dotNodes.push(node.id + `[`+
        ` shape="Mrecord"`+
        ` label="{<b>  ${node.backwardURLs.length}| ${node.url.replace(/.*\//,"")} | <f>  ${node.forwardURLs.length}}"`+
        ` tooltip="${node.url.replace(lively4url,"")}"`+
           ` fontsize="${fontsize}"` +
          ` fontcolor="${color}"` +
          ` color="${color}"` +
                      
        `]`)
        if (node.forward) {
          for(let other of node.forward) {
            if (this.getNode(other.id)) { // check if it is still there...
              var dotEdge = "" + node.id + " -> " + other.id  + `[color="gray"]`
              if (!dotEdges.find(ea => ea == dotEdge)) {
                dotEdges.push(dotEdge)
              }              
            }
          }          
        } 
        if (node.back) {
          for(let other of node.back) {
            if (this.getNode(other.id)) { // check if it is still there...
              var dotEdge = "" + other.id + " -> " + node.id + `[color="gray"]` 
              if (!dotEdges.find(ea => ea == dotEdge)) {
                dotEdges.push(dotEdge)
              }
            }
          }          
        }
        
      }
      
      return `digraph {
        rankdir=LR;
        graph [  
          splines="true"  
          overlap="false"  ];
        node [ style="solid"  shape="plain"  fontname="Arial"  fontsize="14"  fontcolor="black" ];
        edge [  fontname="Arial"  fontsize="8" ];
        ${dotNodes.join(";\n")}
        ${dotEdges.join(";\n")}
      }`
    }
  
    static removeNode(node) {
       this.nodes = this.nodes.filter(ea => ea !== node)   
    }
  
  
    static async ensureNode(url) {
      var node = this.nodes.find(ea => ea.url == url)
      if (!node) {
        node = { id: this.counter++, url: url, forward: null, back: null}
        node.forwardURLs = await lively.findDependedModules(node.url, false, true)
        node.backwardURLs =  await lively.findDependedModules(node.url, false, false)
        
        this.nodes.push(node)
      }
      return node
    }
  
    static async expandForward(node) {
      if (node.forwardExpanded) {
        var rest = []
        for(let ea of node.forward) {
          if (!ea.backExpanded && !ea.forwardExpanded) {
            this.removeNode(ea)
          } else {
            rest.push(ea)
          }
        }
        node.forward = rest
        node.forwardExpanded = false
        return 
      }
      var urls = await lively.findDependedModules(node.url, false, true)
      node.forward = []
      for (let ea of urls) {
        node.forward.push(await this.ensureNode(ea))
      }
      node.forwardExpanded = true
    }
  
    static async expandBack(node) {
      if (node.backExpanded) {
        var rest = []
        for(let ea of node.back) {
          if (!ea.backExpanded && !ea.forwardExpanded) {
            this.removeNode(ea)
          } else {
            rest.push(ea)
          }
        }
        node.back = rest
        node.backExpanded = false
        return 
      } 
      var urls = await lively.findDependedModules(node.url, false, false)
      node.back = []
      for (let ea of urls) {
        node.back.push(await this.ensureNode(ea))
      }
      node.backExpanded = true
    }
   
    
  
    static async update() {
      this.counter = 1
      this.nodes = []
      
      var node = await this.ensureNode(this.url)
      await this.expandForward(node)
      await this.expandBack(node)
      
      
      await this.render()
    }

    static async onClick(evt, node, element, mode ) {
      evt.preventDefault()
      evt.stopPropagation()
      
      var oldPos = lively.getClientPosition(element)
      
      if (evt.ctrlKey && evt.shiftKey) {
        lively.openInspector({evt, node, element})
        return 
      }
      
      if (evt.ctrlKey || mode == "f"  ) {
        await this.expandForward(node)
      } else if (evt.shiftKey || mode == "b" ) {
        await this.expandBack(node)        
      } else {
        
        
        lively.openBrowser(node.url, true)
        return 
      }
      
      
      // remember old element positions for animations
      var oldElementsPosition = new Map()
      for(let oldElement of this.graphviz.shadowRoot.querySelectorAll("g.node")) {
        var title = oldElement.querySelector("title")
        if (title) {
          oldElementsPosition.set(title.textContent, lively.getClientPosition(oldElement))
        }
      }
      
      await this.render()
      
      // HERE COME CRAZY ANIMATIONS
      
      // try to keep the current element at the same position
        var newElement =  this.graphviz.shadowRoot.querySelectorAll("g.node").find(ea => {
        var title = ea.querySelector("title")
        return title && title.textContent == node.id
      })
      if (newElement) {
        var newPos = lively.getClientPosition(newElement)
        var delta = oldPos.subPt(newPos)
        
        this.pane.scrollTop -= delta.y
        this.pane.scrollLeft -= delta.x
        
        // lively.showElement(newElement).textContent = ""
        
        
        var pathElement = newElement.querySelector("path")
        pathElement.setAttribute("fill", "white")
        var a = pathElement.animate([
            {"fill": "white"},
            {"fill": "green"},
            {"fill": "white"}
          ],{
          duration: 1000,
          iterations: 1,
          fill: 'none',
          direction: 'normal',
          easing: 'steps(60)',
          playbackRate : 1
        })
        a.finished.then( () => {
          pathElement.setAttribute("fill", "white")
        })
      }
      
      // make edges appear again slowly
      for(let edge of this.graphviz.shadowRoot.querySelectorAll("g.edge")) {
          edge.setAttribute("opacity", "0")
          var a = edge.animate([
              {"opacity": "0"},
              {"opacity": "0"},

              {"opacity": "1"}
            ],{
            duration: 1000,
            iterations: 1,
            fill: 'none',
            direction: 'normal',
            easing: 'steps(60)',
            playbackRate : 1
          })
          a.finished.then( () => {
            edge.setAttribute("opacity", "1")
          })
        }
        

      for(let newElement of this.graphviz.shadowRoot.querySelectorAll("g.node")) {
        var title = newElement.querySelector("title")
        if (title) {
          var key = title.textContent
          var pos = oldElementsPosition.get(key)
          if (pos) {
            var delta = lively.getClientPosition(newElement).subPt(pos)
            // lively.notify("move " + key + " by " + delta)
            newElement.setAttribute("transform", `translate(${-delta.x},${-delta.y})`)
            var a = newElement.animate([
                {"transform": "translate(0,0)"}
              ],{
              duration: 500,
              iterations: 1,
              fill: 'none',
              direction: 'normal',
              easing: 'steps(60)',
              playbackRate : 1
            })
            a.finished.then( () => {
              newElement.setAttribute("transform", "translate(0,0)")
            })
          }  else {
            // this is a new element
            newElement.setAttribute("opacity", "0")
            var a = newElement.animate([
                {"opacity": "1"}
              ],{
              duration: 500,
              iterations: 1,
              fill: 'none',
              direction: 'normal',
              easing: 'steps(60)',
              playbackRate : 1
            })
            a.finished.then( () => {
              newElement.setAttribute("opacity", "1")
            })
          }
        }
      }
      
      
      
      
    
      
      
      
      
      
      
    }
  
    
    static allSVGNodes() {
      return this.graphviz.shadowRoot.querySelectorAll("g.node text")
    }
  
    static async render() {
      var source = await this.dotSource()
      this.graphviz.innerHTML = `<` +`script type="graphviz">${source}<` + `/script>}`
      await this.graphviz.updateViz()
  
  
  
      let svgNodes = this.allSVGNodes()
        
      svgNodes.forEach(ea => {
    
    
          ea.addEventListener("click", async (evt) => {
            var svgNode = lively.allParents(ea).find(parent => parent.classList.contains("node"))
            
            // lively.openInspector({element: ea, svgNode})
            
            // now it gets hacky....
            var allSVGTexts = Array.from(svgNode.querySelectorAll("text"))
            var index = allSVGTexts.indexOf(ea)
            var mode = ["b", null, "f"][index]

           
            var text = svgNode.querySelector('title').textContent
            var key = text.replace(/^[a-z]*/,"")
            
            
            
            var node = this.nodes.find(ea => ea.id == key)
            
            // // debug
            // if (evt.ctrlKey) {
            //   lively.openInspector({key, node, element: ea})
            //   return
            // }
            
            this.onClick(evt, node, ea, mode)
            
            
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

      this.graphviz.shadowRoot.querySelector("style").textContent = `
 :host {
      min-width: 50px;
      min-height: 50px;
      background: none;
    }
    
    #container {
      position: relative; /* positioning hack.... we make our coordinate system much easier by this */
      border: none;
      overflow: hidden
    }`
    
    
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
        user-select: none; 
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