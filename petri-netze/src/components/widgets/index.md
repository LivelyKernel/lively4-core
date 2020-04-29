<link rel="stylesheet" type="text/css" href="../index-style.css"  />

# Widgets Web Components

<script>
  import ComponentCreator from "src/client/morphic/component-creator.js"
  var container  = lively.query(this, "lively-container")
  if(!container) throw new Error("Not inside lively container?");
  ComponentCreator.createUI(container)
</script>


- lively-bibtex  {.component}
- lively-bibtex-entry  {.component}
- lively-code-mirror  {.component}
- lively-connector  {.component}
- lively-component-bin-tile  {.component}
- lively-crayoncolors  {.component}
- lively-dialog  {.component}
- lively-drawboard  {.component}
- lively-drawio  {.component}
- lively-error  {.component}
- lively-eval-element  {.component}
- lively-figure  {.component}
- lively-file  {.component}
- lively-iframe  {.component}
- lively-import  {.component}
- lively-key-value-input  {.component}
- lively-key-value-map  {.component}
- lively-link  {.component}
- lively-list  {.component}
- lively-markdown  {.component}
- lively-menu  {.component}
- lively-notification-list  {.component}
- lively-notification  {.component}
- lively-paper  {.component}
- lively-pdf  {.component}
- lively-penchooser  {.component}
- lively-presentation  {.component}
- lively-progress  {.component}
- lively-resizer  {.component}
- lively-script  {.component}
- lively-separator  {.component}
- lively-svg  {.component}
- lively-table  {.component}
- lively-window  {.component}

## Draft

- lively-code-mirror-widget-import #Unfinshed {.component}

## Trash

- lively-essay #TODO #Unfinshed {.component}


## META

<script>
  var context = lively.query(this, "lively-markdown").shadowRoot
  ComponentCreator.updateComponentsUI(container, context)
</script>


