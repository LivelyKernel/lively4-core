# SqueakCalls


<script>
  // import {loadedModulesData} from "demos/visualizations/filedata.js" 
  // #TODO make relative path... work here?
  (async () => {
    var url = lively4url + "/src/client/";
    var vis = await (<d3-graphviz style="width:1200px, height: 800px"></d3-graphviz>)
    vis.config({
      onclick(data, evt, element) {
        lively.openInspector({
          data: data,
          event: evt,
          element: element
        })
      }
    })
    var raw = await fetch(lively4url + "/demos/visualizations/squeakcalls.dat").then(r => r.text())
    var nodes = raw.split("\n")
    var relations = []
    
    var nameToId = s => s.replace(/[^A-Za-z01]/g,"_")
    
    for(var i=0; i < nodes.length - 1; i++) {
      if (nodes[i] !== nodes[i + 1]) {
        relations.push(nameToId(nodes[i]) + " -> " + nameToId(nodes[i+1]))
      }
    }
    
    var dot = `digraph { ${relations.join("\n")}}`
    // return dot
    vis.setDotData(dot)
    return vis
  })()
</script> 