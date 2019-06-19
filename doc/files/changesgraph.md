# Changes Graph

<lively-import src="_navigation.html"></lively-import>

<div>
limit <input id="limit" value="100">
</div>

<script>
  import Paths from "src/client/paths.js"
  import moment from "src/external/moment.js";  
  import diff from 'src/external/diff-match-patch.js';
  
  var dmp = new diff.diff_match_patch();
  
  
  var url = lively4url + "/"
  var limitElement = lively.query(this, "input#limit")
  
  
  var container = lively.query(this, "lively-container");
  (async () => {
    var graphviz = await (<graphviz-dot></graphviz-dot>)
    
    
    var limit = Number(limitElement.value)
    limitElement.addEventListener("change", function(evt) {
        lively.notify("update x:" + this.value)
        limit = Number(this.value)
        updateTable() // on Enter
      //}
    });

    var data   

    var updateTable = async () => {
      
      // get data
      data = (await lively.files.loadVersions(url, true).then(r => r.json())).versions
      data = data.filter(ea => ea && ea.version) // cleanup
      
      lively.notify("limit " + limit)
      data = data.slice(0, limit)
      
      var edges = []
      var nodes = []
      data.forEach(ea => {
        nodes.push("_"+ea.version + `[shape=box fontsize="8" fontname="helvetica" label="${
          ea.version + " " + ea.author + "\n" + 
          moment(ea.date).format("YYYY-MM-DD hh:mm:ss") + "\n" + 
          ea.comment.slice(0,200)
        }"]`)
        ea.parents.split(" ").forEach(eaParent => {
          if(eaParent.length > 4) {
            edges.push("_"+ea.version + " -> " + "_"+ eaParent)
          }
        })
      })
      
      graphviz.innerHTML = `<` +`script type="graphviz">digraph {
        ${edges.join(";")} 
        ${nodes.join(";")} 
      }<` + `/script>}`
      graphviz.updateViz()
    }
    
    updateTable()
    
    var style = document.createElement("style")
    style.textContent = `
    div.details {
      font-family: monospace;
      white-space: pre;
    }
    td.comment {
      max-width: 300px
    }
    div#root {
      overflow: visible;
      width: 5000px;
      height: 800px;
    }
    `
    var div = document.createElement("div")
    div.id = "root"
    div.appendChild(style)
    div.appendChild(graphviz)
    return div
  })()
</script>