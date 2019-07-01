# Home Object Soups...


<lively-import src="_navigation.html"></lively-import>

<div>
url <input style="width:500px" id="url" value=""><br>
limit <input id="limit">
</div>

<script>
  const MAX_ELEMENTS = 400


  import moment from "src/external/moment.js";  
  import Strings from 'src/client/strings.js'  
  import Colors from "src/external/tinycolor.js"
  import d3 from "src/external/d3.v5.js"
  import beautify from "src/client/js-beautify/beautify.js"



  function transformSTONToJS(source) {
    var source  =  source
      // .replace(/\n/g, "")
      .replace(/\{-\}/g, " - ")
      .replace(/(^|[^\\A-Za-z0-9_])([A-Za-z0-9_\-]+)\{/g, "$1{_class: '$2', ")
      .replace(/([,{\[] ?)#([A-Za-z0-9_\-]+)([:,\]])/g, "$1'$2'$3") 
      .replace(/([,{\[] ?)#([A-Za-z0-9_\-]+)([:,\]])/g, "$1'$2'$3")  // OH NO... use lookahead?
      .replace(/([: ])\@([0-9]+)/g, "$1'@$2'") 
      .replace(/OrderedCollection\[/g, "[") 
      .replace(/Set\[/g, "[")
      .replace(/\\\\/g, "\\")
      // `\\\\'`
    return "(" +source + ")"
  }
    
  
  function parseSTON(source) {
    if (!source) return {}
    var nil = undefined
    var DateAndTime = new Proxy({}, {
      get(target, key, receiver) {
        return moment(key)
      }
    })
    var Date = new Proxy({}, {
      get(target, key, receiver) {
        return moment(key)
      }
    })
    var UUID = new Proxy({}, {
      get(target, key, receiver) {
        return `${key}` 
      }
    })
    return eval(transformSTONToJS(source))
  }
  
  
  class ObjectGraph {

    static connectInput(element, initValue, update) {
      element.value = initValue
      element.addEventListener("change", function(evt) {
          update(this.value)
      })
    }
    
    static query(query) {
      return lively.query(this.ctx, query)
    }
    
    static async create(ctx) {
      this.ctx = ctx
  
      var url = "http://localhost:9005/Desktop/object-storage.zip"

      this.query("input#url").value = url
      var limitElement = this.query("input#limit")

      limitElement.value = MAX_ELEMENTS
      
      var urlElement = this.query("input#url")
      var container = this.query("lively-container");
      var graphviz = await (<graphviz-dot engine="neato" server="true"></graphviz-dot>)
      
      
      var width = 1800
      var height = 1200
      
      
      graphviz.style.width = width + "px"
      graphviz.style.height = height +"px"


      var limit = Number(limitElement.value)
      limitElement.addEventListener("change", function(evt) {
          limit = Number(this.value)
          updateTable() // on Enter
      });
      
      urlElement.addEventListener("change", function(evt) {
        url = this.value
        updateTable() // on Enter
      });

      window.SmalltalkHomeObjectsCache = window.SmalltalkHomeObjectsCache || new Map()
      var fileCache = window.SmalltalkHomeObjectsCache 
      
      
      window.SmalltalkHomeObjectsMap = window.SmalltalkHomeObjectsMap || new Map()
      var objectMap = window.SmalltalkHomeObjectsMap 
      
      function reset() {
        window.SmalltalkHomeObjectsCache = new Map()
        window.SmalltalkHomeObjectsMap = new Map()
      }
      
      
      // reset()
      
      var objects
      var edges
      var nodes
      
      
      var selectedChange 
      var selectedNode 
      var lastSelectedNode

      var linkToFilenameMap

      function linkToFilename(link) {
        return linkToFilenameMap.get(link)
      }

      function key(id) {
        if (!id) throw ("id missing")
        return "_" + id.replace(/.*\//,"").replace(/[^a-z0-9A-Z_]/g,"")
      }


      function addEdge(a , b, style="") {
        edges.add(key(a)  + " -> " +  key(b) + style)
      }
      
      var classColors = new Map()
   

      var updateTable = async () => {

        objects = new Map()
        edges = new Set()
        nodes = []




        if (!zip) {
          var zip = window.SmalltalkHomeObjects
          var blob = await fetch(url).then(r => r.blob())
          zip = await JSZip.loadAsync(blob)
          window.SmalltalkHomeObjects = zip
        }
        var data  =  Object.keys(zip.files)
        
        linkToFilenameMap = new Map()
        data.forEach(ea => {
          var link = ea.replace(/.*\//,"").replace(/[^0-9A-Za-z]/g,"")
          linkToFilenameMap.set(link, ea)
        })

        data = data.reverse()

        var it = new Map()
        
        
        var progress = await lively.showProgress("update");
        var total = data.length;
        var i=0
        var start = performance.now()
        
        var addObject = async (eaName) => {
          console.log("addObject ")
          if (i > 100) {
            debugger
          }
          if (objects.get(key(eaName))) {
            console.log("stop " + eaName)
            return key(eaName) // we have it already
          }

          var unfinished=false
          var ea = objectMap.get(eaName)
          if(!ea) {
            ea = {name: eaName, file: zip.files[eaName]}
            objectMap.set(eaName, ea)

            var contents = fileCache.get(eaName)
            if (!contents) {
              contents = await ea.file.async("string")
              fileCache.set(eaName, contents)            
            }

            ea.links = Strings.matchAll(/DomainObjectLink\{\#uuid\:UUID\['([A-Za-z0-9\-]+)'\]/g, contents).map(ea => ea[1])
            try {
              ea.object  = parseSTON(contents)
            } catch(e) {
              ea.error = e
              ea.transformed = transformSTONToJS(contents || "")
            }
            ea.contents = contents
          }
          if (ea.object && ea.object._class == "CreativeWork") {
            return 
          }


          // #Dev show only errors
          // if (!ea.error) {
          //   return 
          // }


          objects.set(key(eaName), ea)

          if (ea.links) { 
            for(var link of ea.links) {
              if (!objects.get(key(link))) {
                if (i < limitElement.value) {
                  var filename = linkToFilename(link)
                  if (filename) {
                    if (await addObject(filename)) {
                      addEdge(eaName, link, `[color="gray"]`)            
                    }
                  } else {
                    console.log("could not find file for:" + link)
                    debugger
                  }
                } else {
                  unfinished=true
                  // nodes.push(key(link) + `[color="lightgray" label="..."]`)
                  // addEdge(eaName, link, `[color="gray"]`)            
                }
              }
            }            
          }

          var style
          var size = ea.contents ? Math.sqrt(ea.contents.length) / 20 : 0
          if (ea.object) {
            var color = classColors.get(ea.object._class)
            if (!color) {
              color = Colors.random().desaturate().toHexString()
              classColors.set(ea.object._class, color)
            }
            style = `[style="${unfinished ? "" : "filled"}" color="${color}"  label="${i} ${ea.object._class}"]`  // style="filled" 
          } else {
            style = `[fontcolor="red" label="ERROR" width="${size}" height="${size}"]`
          }
          console.log("NODE " + key(eaName))
          console.log("add " + i + " " + eaName)
          progress.value = i++ / total

          nodes.push(key(eaName) + style)
          return key(eaName)
        }
        
        
        try {
          for(var eaName of data) {
            if (i > limitElement.value) break; 
            await addObject(eaName)
          }
        } finally {
          progress.remove()
        
        }
        lively.notify("loaded in " + Math.round(performance.now() - start) + "ms")
        
// 
// overlap=scale;
        var source = `digraph {
          rankdir=LR;
          edge [ len=4] 
        
          node [ style="filled" color="lightgray" fontsize="8pt" fontname="helvetica"]; 
          ${Array.from(edges).join(";")} 
          ${nodes.join(";")} 
        }`
          
          
        graphviz.innerHTML = `<` +`script type="graphviz">`+source+ `<` + `/script>}`
        var start = performance.now()
        await graphviz.updateViz()
        lively.notify("layouted  in " + Math.round(performance.now() - start) + "ms" )
        
        var svg = graphviz.get("svg")
        var zoomElement = document.createElementNS("http://www.w3.org/2000/svg", "g")
        
        var zoomG = d3.select(zoomElement)
        
        
        // TODO does not work D3 kommt durcheinander...
//         if (window.lively4LastD3ZoomTransform) {
//           zoomG.attr("transform", window.lively4LastD3ZoomTransform); // preserve context through development...
//         }
        
        var svgOuter = d3.select(svg)
        var svgGraph = d3.select(graphviz.get("#graph0"))
        
        svgOuter
          .style("pointer-events", "all")        
          .call(d3.zoom()
              .scaleExtent([1 / 30, 30])
              .on("zoom", () => {
                details.hidden = true
                var trans = d3.event.transform
                // window.lively4LastD3ZoomTransform = trans
                zoomG.attr("transform", trans);
              }));
        
        svg.appendChild(zoomElement)
        zoomElement.appendChild(graphviz.get("#graph0"))
        
        
        
        graphviz.shadowRoot.querySelectorAll("g.node").forEach(ea => {
          d3.select(ea).style("pointer-events", "all")
          ea.addEventListener("click", async (evt) => {
            // lively.showElement(ea)
            var key = ea.querySelector('title').textContent
            var object = objects.get(key)
                        
            if (evt.shiftKey) {
              lively.openInspector({
                element: ea,
                key: key,
                objects: objects,
                data: object
              })
              return
            }
            selectedNode = ea
            selectedChange = object
            
            
            if(object) {
              if (lastSelectedNode == selectedNode) {
                details.hidden = true
                selectedNode = undefined
              } else {
                // if (selectedNode) {
                //   selectedNode.querySelector("polygon,ellipse").setAttribute("fill", "none")
                // }
                // selectedNode.querySelector("polygon,ellipse").setAttribute("fill", "lightgray")
                details.hidden = false
                if (object.object) {
                  details.value = "(" +JSON.stringify(object.object, undefined, 2) +")"
                } else if (object.error) {
                  details.value = `// ERROR: ${object.error} \n` +global.js_beautify(object.transformed);

                  // details.innerHTML = object.contents + "<br>" + object.error
                } else {

                  details.value = object.contents
                }

                // JSON.stringify(change, undefined, 2)
                lively.setGlobalPosition(details, lively.getGlobalBounds(selectedNode).topRight().addPt(lively.pt(10,0)))            
              }
            }
            
            
            lastSelectedNode = selectedNode
          })
        })
        
      }

      updateTable()

      var details = await (<div id="details"><lively-code-mirror ></lively-code-mirror></div>)
      
      Object.defineProperty(details, 'value', {
        get() { 
          return details.querySelector("lively-code-mirror").value
        },
        set(newValue) { 
          details.querySelector("lively-code-mirror").value = newValue || ""
        },
        enumerable: true,
        configurable: true
      });
      
      var style = document.createElement("style")
      style.textContent = `
      td.comment {
        max-width: 300px
      }
      div#root {
        overflow: visible;
      }
      
      div#details lively-code-mirror {
        width: 100%;
        height: 100%;
      }
      
      div#details {
        position: absolute;
        width: 800px;
        height: 400px;
        background-color: lightgray;
        border: 1px solid gray;
      }
      `
      graphviz


      var div = document.createElement("div")
      div.id = "root"
      
      div.appendChild(style)
      div.appendChild(<div>
        <button click={evt => {
          lively.notify("reset")
          reset();
          updateTable()
        }}>reset</button>
        <button click={evt => updateTable()}>update</button>
      </div>)
      div.appendChild(graphviz)
      div.appendChild(details)
      
      return div
    }
  }
  ObjectGraph.create(this)
</script>