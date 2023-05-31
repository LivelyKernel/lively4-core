import {Panning} from "src/client/html.js"

/*MD
# Graph

MD*/

export default class Graph {

    query(query) {
      return lively.query(this.ctx, query)
    }

    getNode(id) {
      return this.nodes.find(ea => ea.id == id) // #TODO use maps to make it faster
    }
  
    getLabel(node) {
      if (!node.key) return "no_key"
      return node.key.replace(/.*\//,"")
    }

    getTooltip(node) {
      return node.key.replace(lively4url,"")
    }
  
    getBackwardKeysCount(node) {
       return node.backwardKeys.length
    }
  
    getForwardKeysCount(node) {
       return node.forwardKeys.length
    }
  
    async dotSource() {
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
        if ((node.forward || node.forwardKeys.length == 0) 
            && node.back || (node.backwardKeys.length == 0)) {
          color = "black";
          fontsize = "12pt"
        }

        
        dotNodes.push(node.id + `[`+
        ` shape="Mrecord"`+
        ` label="{<B>  ${this.getBackwardKeysCount(node)} | ${this.getLabel(node)} | <f>  ${this.getForwardKeysCount(node)}}"`+
        ` tooltip="${this.getTooltip(node)}"`+
          ` fontsize="${fontsize}"` +
          ` style="filled"` +

          ` fontcolor="${color}"` +
          ` color="${color}"` +
          ` fillcolor="${node.isRoot ? "#F0F0FC" : "#FCFCFC"}"` +
                      
        `]`)
        if (node.forward) {
          for(let other of node.forward) {
            if (this.getNode(other.id)) { // check if it is still there...
              let dotEdge = "" + node.id + " -> " + other.id  + `[color="gray"]`
              if (!dotEdges.find(ea => ea == dotEdge)) {
                dotEdges.push(dotEdge)
              }              
            }
          }          
        } 
        if (node.back) {
          for(let other of node.back) {
            if (this.getNode(other.id)) { // check if it is still there...
              let dotEdge = "" + other.id + " -> " + node.id + `[color="gray"]` 
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
        node [ style="solid"  shape="plain" fontname="Arial"  fontsize="14"  fontcolor="black" ];
        edge [  fontname="Arial"  fontsize="8" ];
        ${dotNodes.join(";\n")}
        ${dotEdges.join(";\n")}
      }`
    }
  
    removeNode(node) {
       this.nodes = this.nodes.filter(ea => ea !== node)   
    }
  
  
    async getForwardKeys(node) {
       throw new Error("subclass responsibility")
    }
  
    async getBackwardKeys(node) {
      throw new Error("subclass responsibility")
    }
  
    async initializeNode(node) {
      
    }
   
    async ensureNode(key) {
      var node = this.nodes.find(ea => ea.key == key)
      if (!node) {
        node = { id: this.counter++, key: key, forward: null, back: null}
        await this.initializeNode(node)
        node.forwardKeys = await this.getForwardKeys(node)
        node.backwardKeys = await this.getBackwardKeys(node)
        
        this.nodes.push(node)
      }
      return node
    }
  
  async collapse(node, direction="forward") {
    var rest = []
    for(let ea of node[direction]) {
      if (!ea.backExpanded && !ea.forwardExpanded  && !ea.isRoot) {
        this.removeNode(ea)
      } else {
        rest.push(ea)
      }
    }
    node[direction] = rest
    node[direction+"Expanded"] = false
  }

  async expand(node, direction="forward", getMethodName="getForwardKeys") {
      if (node[direction+"Expanded"]) {
        return this.collapse(node, direction)
      }
      node[direction] = []
      var keys = await this[getMethodName](node)
      var progress = await lively.showProgress("expand " + direction + " (" + keys.length + ")" )
      var progressCounter = 0
      for (let ea of keys) {
        progress.value = progressCounter++ / keys.length
        node[direction].push(await this.ensureNode(ea))
      }
      progress.remove()
      node[direction+"Expanded"] = true
    }
  
  
    async expandForward(node) {
      return this.expand(node, "forward", "getForwardKeys") 
    }
  
    async expandBack(node) {
       return this.expand(node, "back", "getBackwardKeys") 
    }
   
  
    ensureRootNode() {
      return this.ensureNode(this.key)
    }
  
  
    // #important
    async update() {
     
      
      var node = await this.ensureRootNode()
      
      // if only one root node, lets exand it
      if (!this.keys) {
        await this.expandForward(node)
        await this.expandBack(node)
      } 
      await this.render()
    }

    onFirstClick(evt, node, element) {
      lively.notify("first click on " + node.key)
      lively.showElement(element)
    } 

  
    onSecondClick(evt, node, element) {
      lively.notify("second click on " + node.key)
      lively.showElement(element)
    } 
  
    async onClick(evt, node, element, mode ) {
      this.details.style.display = "none"
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
        if (this.selection == node) {
          this.onSecondClick(evt, node, element)
        } else {
          this.selection = node
          this.onFirstClick(evt, node, element)
        }
        
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
          let a = edge.animate([
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
        let title = newElement.querySelector("title")
        if (title) {
          var key = title.textContent
          var pos = oldElementsPosition.get(key)
          if (pos) {
            let delta = lively.getClientPosition(newElement).subPt(pos)
            // lively.notify("move " + key + " by " + delta)
            newElement.setAttribute("transform", `translate(${-delta.x},${-delta.y})`)
            let a = newElement.animate([
                {"transform": "translate(0,0)"}
              ],{
              duration: 500,
              iterations: 1,
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
            let a = newElement.animate([
                {"opacity": "1"}
              ],{
              duration: 500,
              iterations: 1,
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

    allSVGNodes() {
      return this.graphviz.shadowRoot.querySelectorAll("g.node text")
    }
  
    // #important
    async render() {
      var source = await this.dotSource()
      this.graphviz.innerHTML = `<` +`script type="graphviz">${source}<` + `/script>}`
      await this.graphviz.updateViz()
  
  
  
      let svgNodes = this.allSVGNodes()
        
      svgNodes.forEach(ea => {
          // ea.parentElement.querySelectorAll("path").forEach(ea => ea.setAttribute("fill", "#FAFAFA"))
         
        var textElm  = ea
        var SVGRect = textElm.getBBox();

        // creating an invisible area to click on, because the text is to small #snippet
        var clickArea = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        var margin = 10
        clickArea.setAttribute("x", SVGRect.x - margin)
        clickArea.setAttribute("y", SVGRect.y - margin)
        clickArea.setAttribute("width", SVGRect.width + (2*margin))
        clickArea.setAttribute("height", SVGRect.height + (2*margin))
        clickArea.setAttribute("fill", "#FFFFFF");
        clickArea.setAttribute("opacity", "0");
        textElm.parentElement.insertBefore(clickArea, textElm.nextSibling);
    
        clickArea.addEventListener("click", async (evt) => {
            evt.preventDefault()
            evt.stopPropagation()

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
            
            // lively.notify("CLICK " + text + " " + mode)
            
            this.onClick(evt, node, ea, mode)
          })
        })
    }

    async initialize(parameters) {
      this.nodes = []
      this.counter = 1
    }
  
  
    async create(ctx) {  
      this.ctx = ctx      
    
      var parameters = {}
    
      var markdownComp =  lively.query(this.ctx, "lively-markdown")
      if (markdownComp && markdownComp.parameters) {
        for (let param in  markdownComp.parameters) {
          parameters[param] = markdownComp.parameters[param]          
        }
      }
      
      var container = lively.query(this.ctx, "lively-container")  
      if (container) {
        var params = new URLSearchParams(container.getURL().search)
          for (let param of params.keys()) {
            parameters[param] = params.get(param)        
          }
      }
      
      this.details = <div class="details" style="position:absolute"></div>
  
      await this.initialize(parameters)
    
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
        }
      `
      
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
  
        div.details {
          background: #FBFBFB;
          padding: 10px;
          border: 1px solid gray;

        }

      `            
      
      this.graphviz.style.display = "inline-block" // so it takes the width of children and not parent
      this.pane = <div id="root">
        {style}
         <div class="help">
         </div>
        {this.graphviz}
         {this.details}
      </div>
       //    <div><b>click</b> browse module</div>
       //    <div><b>ctrl-click</b> show imported modules</div>
       //    <div><b>shift-click</b> show depended modules, e.g. modules that import that module</div>

        
      this.update()
      
      new Panning(this.pane)
      this.pane.graph = this
      return this.pane
    }
  
    static async create(ctx) { 
      var graph = new this()      
      return graph.create(ctx)
    }
  }