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

- lively-snapshot  {.component}
- px19-comp  {.component}

## Lively Petri Net (EUD2020)

- lively-petrinet  {.component}
- lively-petrinet-code-editor  {.component}
- lively-petrinet-code-transition  {.component}
- lively-petrinet-edge  {.component}
- lively-petrinet-editor  {.component}
- lively-petrinet-place  {.component}
- lively-petrinet-prob-transition  {.component}
- lively-petrinet-token  {.component}
- lively-petrinet-toolbar  {.component}
- lively-petrinet-transition  {.component}


## Lively Simulation (EUD2020)

- lively-simulation  {.component}
- lively-simulation-cell  {.component}
- lively-simulation-chart-view  {.component}
- lively-simulation-code-view  {.component}
- lively-simulation-code  {.component}
- lively-simulation-controller  {.component}
- lively-simulation-log-view  {.component}
- lively-simulation-state  {.component}
- lively-simulation-titlebar  {.component}

## *META*

<script>
  var context = lively.query(this, "lively-markdown").shadowRoot
  ComponentCreator.updateComponentsUI(container, context)
</script>