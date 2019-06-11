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



## Draw.io Figures hosted by github

Two figures created in draw.io and stored there into github cloud storage aka a github repository. 

<lively-drawio src="https://raw.githubusercontent.com/JensLincke/drawio-figures/master/contextjs_promises_01.xml"></<lively-drawio>

<lively-drawio src="https://raw.githubusercontent.com/JensLincke/drawio-figures/master/contextjs_promises_02.xml"></<lively-drawio>


## "local" Draw.io content

Local draw.io figures can be displayed, but it is not clear how draw.io should a) edit them and b) store them back. Draw.io does not know that it can do a "put" on the url. Since this file is also stored in a github repository, one needs to know the github account and branch to edit this. Which should be 
<https://raw.githubusercontent.com/LivelyKernel/lively4-core/gh-pages/doc/figures/testdrawio.xml>.

- edit in online throug this URL
[https://www.draw.io/#HLivelyKernel%2Flively4-core%2Fgh-pages%2Fdoc%2Ffigures%2Ftestdrawio.xml](https://www.draw.io/#HLivelyKernel%2Flively4-core%2Fgh-pages%2Fdoc%2Ffigures%2Ftestdrawio.xml)
- #TODO we should be able to generate this URL when we know that we are under lively4 and we do it like the sync tool to figure out on which repo and branch we are, the rest is a peace of cake!
- The only remaining hurdle betwen a nice draw.io for our paper workflow is the question, how we can nicely generate PDFs... or PNGs from it. The process in the draw.io UI is really cumbersome since it does not remember export locations!

<lively-drawio src="https://lively-kernel.org/lively4/lively4-jens/doc/figures/testdrawio.xml"></<lively-drawio>



