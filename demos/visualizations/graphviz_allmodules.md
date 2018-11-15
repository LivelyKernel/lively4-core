# D3 GraphiViz ALL System Modules


<script>
  import {loadedModulesData} from "demos/visualizations/filedata.js" 
  // #TODO make relative path... work here?
  (async () => {
    var url = lively4url + "/";
    var vis = await (<d3-graphviz style="width:3000px, height: 3000px"></d3-graphviz>)
    vis.config({
      onclick(data, evt, element) {
        lively.openInspector({
          data: data,
          event: evt,
          element: element
        })
      }
    })
    vis.setData(await loadedModulesData(url))
    return vis
  })()
</script>