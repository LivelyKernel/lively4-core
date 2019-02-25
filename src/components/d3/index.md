
<link rel="stylesheet" type="text/css" href="../index-style.css"  />

# D3 Components
<script>
  import ComponentCreator from "src/client/morphic/component-creator.js"
  var container  = lively.query(this, "lively-container")
</script>

- d3-barchart-gh  {.component}
- d3-barchart  {.component}
- d3-boxplot  {.component}
- d3-bubblechart  {.component}
- d3-bundleview  {.component}
- d3-graphviz  {.component}
- d3-plaintree  {.component}
- d3-polymetricview  {.component}
- d3-radialtree  {.component}
- d3-treemap  {.component}
- graphviz-dot  {.component}
 
## Helper
 
  - [d3-component.js](d3-component.js) [html](d3-component.html)
  - [d3-tree.js](d3-tree.js) [html](d3-tree.html)
  - [d3-box.js](d3-box.js)
<!-- 
<script>
import Files from "src/client/files.js"
var md = lively.query(this, "lively-markdown");
Files.generateMarkdownFileListing(md.shadowRoot)
</script>
-->

## *META*

<script>
  var context = lively.query(this, "lively-markdown").shadowRoot
  ComponentCreator.updateComponentsUI(container, context)
</script>