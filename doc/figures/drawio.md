# Experiments with draw.io

- draw.io can store figures directly in github
- draw.io ships a viewer that can display its files (e.g. served by lively4-server)
- open issues
  - how to get an "png" from the picture...
  - #Workaround, draw.io can save png files besides the original image

 
<script>
  import Rasterize from "src/client/rasterize.js"
  var container = lively.query(this, "lively-container");
  var baseURL = container.getURL().toString().replace(/[^\/]*$/,"");
  <button
    click={async evt => {
      var svgElement = lively.query(this, ".geDiagramContainer svg")
      await Rasterize.elementToURL(svgElement, baseURL + "test.png")
      container.get("lively-container-navbar").update()
    }}>export as png</button>
</script>

<script>
(async () => {
  await lively.loadJavaScriptThroughDOM("drawio", "https://www.draw.io/js/viewer.min.js")
  GraphViewer.createViewerForElement(lively.query(this, ".mxgraph"));
  return ""
})()
</script>

<div class="mxgraph" style="border:1px solid transparent;" data-mxgraph="{&quot;highlight&quot;:&quot;#0000ff&quot;,&quot;target&quot;:&quot;blank&quot;,&quot;lightbox&quot;:false,&quot;nav&quot;:true,&quot;zoom&quot;:2,&quot;resize&quot;:true,&quot;toolbar&quot;:&quot;zoom&quot;,&quot;edit&quot;:&quot;_blank&quot;,&quot;url&quot;:&quot;https://raw.githubusercontent.com/JensLincke/drawio-figures/master/contextjs_promises_01.xml&quot;}"></div>



```javascript

 https://www.draw.io/#HJensLincke%2Fdrawio-figures%2Fmaster%2Fcontextjs_promises_01.xml


lively.loadJavaScriptThroughDOM("drawio", "https://www.draw.io/js/viewer.min.js")

mxStencilRegistry.parseStencilSets([]);
GraphViewer.createViewerForElement(that.querySelector(".mxgraph"))

GraphViewer.createViewerForElement


that.innerHTML  = `<div class="mxgraph" style="max-width:100%;border:1px solid transparent;" data-mxgraph="{&quot;highlight&quot;:&quot;#0000ff&quot;,&quot;nav&quot;:true,&quot;resize&quot;:true,&quot;toolbar&quot;:&quot;zoom layers lightbox&quot;,&quot;edit&quot;:&quot;_blank&quot;,&quot;url&quot;:&quot;https://raw.githubusercontent.com/LivelyKernel/lively4-core/gh-pages/doc/figures/Untitled%20Diagram.xml&quot;}"></div>`

that.innerHTML  = `<div class="mxgraph" style="max-width:100%;border:1px solid transparent;" data-mxgraph="{&quot;highlight&quot;:&quot;#0000ff&quot;,&quot;nav&quot;:true,&quot;resize&quot;:true,&quot;toolbar&quot;:&quot;zoom layers lightbox&quot;,&quot;edit&quot;:&quot;_blank&quot;,&quot;url&quot;:&quot;https://lively-kernel.org/lively4/lively4-jens/doc/figures/Untitled%20Diagram.xml&quot;}"></div>`


<div class="mxgraph" style="max-width:200%;border:1px solid transparent;" data-mxgraph="{&quot;highlight&quot;:&quot;#0000ff&quot;,&quot;nav&quot;:true,&quot;resize&quot;:true,&quot;toolbar&quot;:&quot;zoom layers lightbox&quot;,&quot;edit&quot;:&quot;_blank&quot;,&quot;url&quot;:&quot;https://lively-kernel.org/lively4/lively4-jens/doc/figures/Untitled%20Diagram.xml&quot;}"></div>


```
