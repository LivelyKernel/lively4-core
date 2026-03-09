# Lively Architecture View 


<script>
  let viewer = await (<lively-architecture-viewer></lively-architecture-viewer>)
  viewer.addModule(lively4url + "/src/architecture-view/components/lively-class-diagram.js");
  viewer.addModule(lively4url + "/src/architecture-view/components/lively-architecture-viewer.js");      
  viewer.addModule(lively4url + "/src/architecture-view/components/renderers/polymetric-renderer.js"); 
  viewer.addModule(lively4url + "/src/architecture-view/components/renderers/mermaid-renderer.js"); 
  var pane = <div style="position: absolute; top: 0px; left:0px; width:100%; height: 100%; background: gray"> {viewer}</div>
  pane
</script>