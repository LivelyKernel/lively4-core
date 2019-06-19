# Changes Graph

<lively-import src="_navigation.html"></lively-import>

<div>
limit <input id="limit" value="100">
</div>

<script>
  import Paths from "src/client/paths.js"
  import moment from "src/external/moment.js";  
  import diff from 'src/external/diff-match-patch.js';
  import AnsiColorFilter from "src/external/ansi-to-html.js"
  
  var dmp = new diff.diff_match_patch();
  
  
  var url = lively4url + "/"
  var limitElement = lively.query(this, "input#limit")
  
  
  var container = lively.query(this, "lively-container");
  (async () => {
    var graphviz = await (<graphviz-dot></graphviz-dot>)
    var livelySync = await (<lively-sync></lively-sync>)
    
    livelySync.setRepository(lively4url.replace(/.*\//,""))
    
    
    var limit = Number(limitElement.value)
    limitElement.addEventListener("change", function(evt) {
        limit = Number(this.value)
        updateTable() // on Enter
      //}
    });

    var data   
    var changes

    var updateTable = async () => {
      
      // get data
      data = (await lively.files.loadVersions(url, true).then(r => r.json())).versions
      data = data.filter(ea => ea && ea.version) // cleanup
      
      data = data.slice(0, limit)
      
      changes = new Map()
      
      var edges = []
      var nodes = []
      var selectedChange 
      var selectedNode 
      
      data.forEach(ea => {
        var key = "_"+ea.version
        changes.set(key, ea)
        nodes.push(key + `[shape=box fontsize="8" fontname="helvetica" label="${
          ea.version + " " + ea.author + "\n" + 
          moment(ea.date).format("YYYY-MM-DD hh:mm:ss") + "\n" + 
          ea.comment.slice(0,200)
        }"]`)
        ea.parents.split(" ").forEach(eaParent => {
          if(eaParent.length > 4) {
            edges.push(key + " -> " + "_"+ eaParent)
          }
        })
      })
      
      graphviz.innerHTML = `<` +`script type="graphviz">digraph {
        ${edges.join(";")} 
        ${nodes.join(";")} 
      }<` + `/script>}`
      await graphviz.updateViz()
      
      graphviz.shadowRoot.querySelectorAll("g.node").forEach(ea => {
        ea.addEventListener("click", async (evt) => {
          var key = ea.querySelector('title').textContent
          var change = changes.get(key)
          if (!change) return
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
    var details = <div id="details"></div>
    var div = document.createElement("div")
    div.id = "root"
    div.appendChild(style)
    div.appendChild(graphviz)
    div.appendChild(details)
    return div
  })()
</script>