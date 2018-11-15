# D3 GraphiViz System Modules

<script>
  import {loadedModulesData} from "demos/visualizations/filedata.js" 
  // #TODO make relative path... work here?
  (async () => {
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
    vis.setData(await loadedModulesData())
    return vis
  })()
</script>