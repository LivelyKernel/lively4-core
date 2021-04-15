<link rel="stylesheet" type="text/css" href="../index-style.css"  />

# Draft Web Components

<script>
    import ComponentCreator from "src/client/morphic/component-creator.js"
  var container  = lively.query(this, "lively-container")
  if(!container) throw new Error("Not inside lively container?");
  ComponentCreator.createUI(container)
</script>
  
- draft-comp  {.component}
- draft-example-component  {.component}
- flower-script  {.component}
- flower-values  {.component}
- lively-application-bar  {.component}
- lively-code-mirror-simple  {.component}
- lively-grail  {.component}
- lively-handwriting  {.component}
- lively-movie-list  {.component}
- lively-movie  {.component}
- lively-network  {.component}
- lively-object-editor  {.component}
- lively-tab-view  {.component}
- lively-terminal  {.component}
- lively-treeview  {.component}
- lively-xterm  {.component}

- bp2019-workspace  {.component}
- d3-zoomable-chart  {.component}
- gmail-message  {.component}
- gmail-messages  {.component}

## Misc

<script>
  var context = lively.query(this, "lively-markdown").shadowRoot
  ComponentCreator.updateComponentsUI(container, context)
</script>