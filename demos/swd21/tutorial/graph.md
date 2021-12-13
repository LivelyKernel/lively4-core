<!-- markdown-config presentation=true -->


<style data-src="../../../src/client/presentation.css"></style>

<script>
import Presentation from "src/components/widgets/lively-presentation.js"
Presentation.config(this, {
    pageNumbers: true,
    logo: "https://lively-kernel.org/lively4/lively4-jens/media/lively4_logo_smooth_100.png"
})
</script>

<div class="title">
  A Tutorial
</div>

<div class="authors">
  Jens Lincke
</div>

<div class="credentials">
  2021<br>
  <br>
  HPI SWA
</div>

---

# Active Content in Markdown (Graphviz Example)


## (A) Write your Viz inline in Markdown


Code in a `<script>` tag can contain `imports` and the last expression will be rendered (String or HTML element). The code even make use of code structuring... functions, classes etc. The benefits are that the code stays local and can be directly customized and does not have to be externally maintained. The downside is, that it cannot be shared in two places easily.

```
<script>
  import {Panning} from "src/client/html.js"
   
  class MyGraph {
  // ...
  
  }
  MyGraph.create(this)
</script>
```


<script>
  import {Panning} from "src/client/html.js"

  

  class MyGraph {

    static query(query) {
      return lively.query(this.ctx, query)
    }

    static async dotSource() {
      var edges = []
    
      var size = this.size()
      var nodesSize = this.nodesSize()
      for(let count=1; count < size; count++) {
        var edge = "" + ((count % nodesSize) + 1) + " -> " + Math.round(Math.random(nodesSize) * nodesSize)
        edges.push(edge)
      }
      
      return `digraph {
        rankdir=LR;
        graph [  
          splines="false"  
          overlap="true"  ];
        node [ style="solid"  shape="plain"  fontname="Arial"  fontsize="14"  fontcolor="black" ];
        edge [  fontname="Arial"  fontsize="8" ];


        ${edges.join(";\n")}
      }`
    }
    
    static size() {
      return this.pane.querySelector("input#size").value 
    }

    static nodesSize() {
      return this.pane.querySelector("input#nodes").value 
    }

    static async update() {
      this.pane.querySelector("#nodeslabel").innerHTML = this.nodesSize()
      this.pane.querySelector("#sizelabel").innerHTML = this.size()
      var source = await this.dotSource()
      this.graphviz.innerHTML = `<` +`script type="graphviz">${source}<` + `/script>}`
      await this.graphviz.updateViz()
    }


    static async create(ctx) {  
      this.ctx = ctx


    

      var container = this.query("lively-container");
      this.graphviz = await (<graphviz-dot></graphviz-dot>)


      var style = document.createElement("style")
      style.textContent = `
      td.comment {
        max-width: 300px
      }
      div#root {
        position: relative; 
        top: 20px; left: 0px; 
        overflow-x: auto; 
        overflow-y: scroll; 
        width: calc(100% - 0px); 
        height: calc(100% - 20px);
      }
      `            
      
      this.graphviz.style.display = "inline-block" // so it takes the width of children and not parent
      this.pane = <div id="root">
        {style}
         <h2>Random Graph</h2>
         <div>Nodes: 
          <span id="nodeslabel"></span>  <br /> 
          <input input={evt => this.update() } type="range" min="1" max="300" value="50" class="slider" id="nodes"></input>
         </div>
         <div>Egdes: <span id="sizelabel"></span>  <br />
          <input input={evt => this.update() } type="range" min="1" max="300" value="50" class="slider" id="size"></input>
        </div>
         <div style="height: 20px"></div>
        {this.graphviz}
      </div>
      this.update()
      
      
      
      new Panning(this.pane)
      return this.pane
    }
  }
  MyGraph.create(this)
</script>

---

## (B) Give your Application/Demo its own Markdown file


That way one can use a [whole markdown page](graph-app.md) as tool, e.g. #ChangeGraph. And the page can hast more control over layouting etc. E.g. make use of absolute positioning. 

<edit://demos/swd21/tutorial/graph-app.md>

And the app/tool can be called with parameters.

```javascript
  // ..
  var markdownComp = lively.query(ctx, "lively-markdown")
  var parameters = markdownComp.parameters

  // ..
    <input input={evt => this.update() } type="range" min="1" max="300" value={parameters.edges || 50} class="slider" id="nodes">
  // ..
```

```javascript
    lively.openMarkdown(lively4url + "/demos/swd21/tutorial/graph-app.md", 
      "Graph Examp  le", {nodes: 20, edges: 30})   
```

And open it in it's own window
<script>
  <button click={() => {
    lively.openMarkdown(lively4url + "/demos/swd21/tutorial/graph-app.md", 
      "Graph Example", {nodes: 20, edges: 30})
  
  }}>open graph example</button>
</script>

---
## (C) Embed Markdown in Markdown

But we can also embed it directly

<script>
  
(async () => {
  var url = lively4url + "/demos/swd21/tutorial/graph-app.md"
  var parameters =  {nodes: 20, edges: 30}
  var markdown = await (<lively-markdown></lively-markdown>);
  markdown.setAttribute("url", url) // does not fetch itself (yet)...
  markdown.parameters = parameters;
  var source = await fetch(url).then(r => r.text()); // but we can do it!
  markdown.setContent(source);
  return markdown
})()
</script>



---
## (D) Put "Application/Tool" in own JavaScript file

```javascript
<script>
  import MyGraph from "./graph-app.js"
  MyGraph.create(this)
</script>
```

<script>
  import MyGraph from "./graph-app.js"
  MyGraph.create(this)
</script>


---
## (E) Create Web Component / Custom HTML Tag for Application / Tool



<graphdensity-viz></graphdensity-viz>


---
## (X) Use iFrames to embed external content in Sandbox

As a last resort one can always fall back on iFrames.... 

Benefits: real embedding...
  
Downside: integration/comunication with host is limited/not possible

```javascript
<iframe width="500px" height="200px" src={lively4url + "/demos/swd21/tutorial/frame.html"}></iframe>
```

<edit://demos/swd21/tutorial/frame.html>

<script>
  var iframe = <iframe width="500px" height="200px" src={lively4url + "/demos/swd21/tutorial/frame.html"}></iframe>
  iframe
</script>

--- 
## And some graphics

![](example-figure.drawio)


