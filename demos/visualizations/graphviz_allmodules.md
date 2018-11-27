# D3 GraphiViz ALL System Modules


<script>
  import {loadedModulesData} from "demos/visualizations/filedata.js" 
  // #TODO make relative path... work here?
  (async () => {
    var url = lively4url + "/"; // /src/client/
    var data = await loadedModulesData(url, 
      (d) => {
        // node filter
        return true
      }, 
      (source, target) => {
        // edge filter 
        if (target.name == "graphics.js") return false
        if (target.name == "utils.js") return false
        if (target.name == "preferences.js") return false
        if (target.name == "lively-morph.js") return false
        return true
      }, 
      )
    var vis = await (<d3-graphviz style="width:100px, height: 100px"></d3-graphviz>)
    vis.config({
      width(d) {
        return Math.sqrt(d.size / 0.5 )
      },
      
      height(d) {
        return Math.sqrt(d.size / 0.5)
      },

      fontsize(d) {
        return Math.sqrt(d.size / 0.5) / 10
      },


      onclick(data, evt, element) {
        lively.openInspector({
          data: data,
          event: evt,
          element: element,
          d: vis.nodes.get(parseInt(data.key))
        })
      }
    })
    vis.setData(data)
    return vis
  })()
</script>