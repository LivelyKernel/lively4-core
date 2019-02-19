<link rel="stylesheet" type="text/css" href="../index-style.css"  />

# Demo Components
  
<script>
    import ComponentCreator from "src/client/morphic/component-creator.js"
  var container  = lively.query(this, "lively-container")
  if(!container) throw new Error("Not inside lively container?");
  ComponentCreator.createUI(container)
</script>
  
- lively-ball  {.component}
- lively-bouncing-ball  {.component}
- lively-continuous-editor  {.component}
- lively-digital-clock  {.component}
- lively-math  {.component}
- lively-module-graph  {.component}
- lively-soapbubble  {.component}
- lively-whyline  {.component}
- proweb18-jsx-intro-complex  {.component}
- proweb18-jsx-intro  {.component}

## *META*

<script>
  var context = lively.query(this, "lively-markdown").shadowRoot
  ComponentCreator.updateComponentsUI(container, context)
</script>