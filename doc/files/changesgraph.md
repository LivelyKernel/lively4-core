# Changes Graph

<lively-import src="_navigation.html"></lively-import>

<div>
url <input style="width:500px" id="url" value=""><br>
limit <input id="limit">
</div>

<script>
  import Paths from "src/client/paths.js"
  import moment from "src/external/moment.js";  
  import diff from 'src/external/diff-match-patch.js';
  import AnsiColorFilter from "src/external/ansi-to-html.js"
  
  
  
  class ChangesGraph {

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
      var dmp = new diff.diff_match_patch();
      var baseUrl = lively4url + "/"
      var url = "https://lively-kernel.org/lively4/lively4-jens/src/client/auth-dropbox.js"

      this.query("input#url").value = url
      var limitElement = this.query("input#limit")
      
      limitElement.value = 200
      
      var urlElement = this.query("input#url")
      var container = this.query("lively-container");
      var graphviz = await (<graphviz-dot></graphviz-dot>)
      var livelySync = await (<lively-sync></lively-sync>)
      livelySync.setRepository(lively4url.replace(/.*\//,""))


      var limit = Number(limitElement.value)
      limitElement.addEventListener("change", function(evt) {
          limit = Number(this.value)
          updateTable() // on Enter
        //}
      });

      urlElement.addEventListener("change", function(evt) {
          url = this.value
          updateTable() // on Enter
        //}
      });

      var data   
      var baseData 
      var baseDataMap
      var baseDataChildrenMap

      var changes

      var updateTable = async () => {

        details.innerHTML = ""

        // we need the whole graph to get the topology straight...
        baseData = (await lively.files.loadVersions(baseUrl).then(r => r.json())).versions

        baseDataMap = new Map()
        baseDataChildrenMap = new Map()
        baseData.forEach(ea => {
          if (ea) {
            baseDataMap.set(ea.version, ea)      

            if (ea.parents) {
              ea.parents.split(" ").forEach(eaParent => {
                var children = baseDataChildrenMap.get(eaParent) || []
                children.push(ea.version)
                baseDataChildrenMap.set(eaParent, children)
              })
            }
          }
        })

        // get data
        data = (await lively.files.loadVersions(url).then(r => r.json())).versions
        data = data.filter(ea => ea && ea.version) // cleanup

        data = data.slice(0, limit)
        changes = new Map()


        var fullNodes = new Set()
        var parents = new Set()

        var DashedEdgeStyle = `[color="gray" style="dashed" arrowhead="open" arrowsize=.7]`


        var edges = new Set()
        var nodes = []
        var selectedChange 
        var selectedNode 

        function key(id) {
          return "_" + id.replace(/[^a-z0-9A-Z_]/g,"")
        }

        function addEdge(a , b, style="") {
          edges.add(key(a)  + " -> " +  key(b) + style)
        }

        data.forEach(ea => {
          var version = ea.version
          changes.set(key(version), ea)
          nodes.push(key(version) + `[shape=box fontsize="8" fontname="helvetica" label="${
            ea.version + " " + ea.author + "\n" + 
            moment(ea.date).format("YYYY-MM-DD hh:mm:ss") + "\n" + 
            ea.comment.slice(0,200)
          }"]`)
          fullNodes.add(version)
        })

        data.forEach(ea => {
          var version = ea.version
          if (ea.parents) {        
            ea.parents.split(" ").forEach(eaParent => {
              var style = `[color="gray50" arrowhead="open" arrowsize=.7]`
              if (!fullNodes.has(eaParent)) {
                style = DashedEdgeStyle
              }
              addEdge(version, eaParent, style)  
              parents.add(eaParent)
            })
          }
        })


        var tanglingParents = [...parents].filter(ea => !fullNodes.has(ea))
        tanglingParents.forEach(ea => {
          nodes.push(key(ea) + `[shape=rectangle style="dashed" fontsize="8" fontcolor="gray" color="gray" fontname="helvetica" label="${ea}" ]`)
        })


        tanglingParents.forEach(ea => {
          var path = findConnectingPath(ea)
          if (path) {
            console.log("FOUND " + path)
            addShortPath(path)
          } else {
            console.log("nothing found for" + ea)
          }
        })

        function findConnectingPath(version, path, depth=0, visited=new Set()) {
          if (!version) throw new Error("version missing")
          if (visited.has(version))  return
          visited.add(version)
          if (depth > 10000) {
            // addEdges(path)
            // console.log("stop search at depth " + depth + " path: ", path)
            return null
          }
          if (!path) path = [version]
          // console.log("findConnectionPath ", version, path)
          var change = baseDataMap.get(version)
          if (!change) {
            debugger
            return // nothing found? should this happen
          }
          var parents = change.parents.split(" ")
          for(var eaParentVersion of parents) {
            if (fullNodes.has(eaParentVersion) ) {
              return path.concat([eaParentVersion]) // found something!
            } else {
              // depth first search
              var found = eaParentVersion && findConnectingPath(eaParentVersion, path.concat([eaParentVersion]), depth + 1, visited)
              if (found) {
                // console.log("found ... " + found)
                return found 
              }
            }
          }
          return null
        }

        function addEdges(path) {
          var lastVersion
          path.forEach(ea => {
            if (ea && lastVersion) {
              addEdge(lastVersion, ea)
            }
            lastVersion = ea
          })
        }

        function addShortPath(path) {
          addEdge(path.first, path.last,  DashedEdgeStyle)
          // var shortCut = ""+path.first + "_TO_" + path.last
          // addEdge(path.first, shortCut)
          // addEdge(shortCut, path.last)
        }


        graphviz.innerHTML = `<` +`script type="graphviz">digraph {
          ${Array.from(edges).join(";")} 
          ${nodes.join(";")} 
        }<` + `/script>}`
        await graphviz.updateViz()

        graphviz.shadowRoot.querySelectorAll("g.node").forEach(ea => {
          ea.addEventListener("click", async (evt) => {
            var key = ea.querySelector('title').textContent
            var change = changes.get(key)
            if (!change) return

            if (evt.shiftKey) {
              lively.openInspector({baseDataMap, baseDataChildrenMap, change})
              return
            }

            if (selectedNode) {
              selectedNode.querySelector("polygon").setAttribute("fill", "none")
            }
            selectedNode = ea
            selectedNode.querySelector("polygon").setAttribute("fill", "lightgray")
            selectedChange = change
            details.innerHTML = await livelySync.gitControl("show", undefined, {
              gitcommit: change.version,
              gitusecolor: "true",
            }).then(text => {
              return livelySync.linkifyFiles(new AnsiColorFilter().toHtml(text.replace(/</g, "&lt;")))
            })

            // JSON.stringify(change, undefined, 2)
            lively.setGlobalPosition(details, lively.getGlobalBounds(selectedNode).topRight().addPt(lively.pt(10,0)))
          })
        })
      }

      var details = <div id="details"></div>
      updateTable()

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
      div#details {
        position: absolute;
        font-family: monospace;
        white-space: pre;
        font-size: 8pt;
        background-color: lightgray;
        border: 1px solid gray;
        padding: 5px;
      }
      `

      var div = document.createElement("div")
      div.id = "root"
      div.appendChild(style)
      div.appendChild(graphviz)
      div.appendChild(details)
      return div
    }
  }
  ChangesGraph.create(this)
</script>