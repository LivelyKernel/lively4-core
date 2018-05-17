# Experiments with draw.io

- draw.io can store figures directly in github
- draw.io ships a viewer that can display its files (e.g. served by lively4-server)
- open issues
  - how to get an "png" from the picture...
  - #Workaround, draw.io can save png files besides the original image

```javascript

lively.loadJavaScriptThroughDOM("drawio", "https://www.draw.io/js/viewer.min.js")

mxStencilRegistry.parseStencilSets([]);
GraphViewer.createViewerForElement(that.querySelector(".mxgraph"))

GraphViewer.createViewerForElement


that.innerHTML  = `<div class="mxgraph" style="max-width:100%;border:1px solid transparent;" data-mxgraph="{&quot;highlight&quot;:&quot;#0000ff&quot;,&quot;nav&quot;:true,&quot;resize&quot;:true,&quot;toolbar&quot;:&quot;zoom layers lightbox&quot;,&quot;edit&quot;:&quot;_blank&quot;,&quot;url&quot;:&quot;https://raw.githubusercontent.com/LivelyKernel/lively4-core/gh-pages/doc/figures/Untitled%20Diagram.xml&quot;}"></div>`

that.innerHTML  = `<div class="mxgraph" style="max-width:100%;border:1px solid transparent;" data-mxgraph="{&quot;highlight&quot;:&quot;#0000ff&quot;,&quot;nav&quot;:true,&quot;resize&quot;:true,&quot;toolbar&quot;:&quot;zoom layers lightbox&quot;,&quot;edit&quot;:&quot;_blank&quot;,&quot;url&quot;:&quot;https://lively-kernel.org/lively4/lively4-jens/doc/figures/Untitled%20Diagram.xml&quot;}"></div>`

```