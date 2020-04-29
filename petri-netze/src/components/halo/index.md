<link rel="stylesheet" type="text/css" href="../index-style.css"  />

<style>
li.component {
  height: 50px;
}
</style>

# Halo Web Components


The Halo and it's Halo items are the primary tool for direct object manipulation in Lively Kernel.


![](../../../doc/figures/halo.drawio)

<script>
    import ComponentCreator from "src/client/morphic/component-creator.js"
  var container  = lively.query(this, "lively-container")
  if(!container) throw new Error("Not inside lively container?");
  ComponentCreator.createUI(container)
</script>
  


 - lively-halo-control-point-item  {.component}
 - lively-halo-copy-item  {.component}
 - lively-halo-drag-item  {.component}
 - lively-halo-edit-item  {.component}
 - lively-halo-export-item  {.component}
 - lively-halo-grab-item  {.component}
 - lively-halo-handle-item  {.component}
 - lively-halo-inspect-item  {.component}
 - lively-halo-menu-item  {.component}
 - lively-halo-name-item  {.component}
 - lively-halo-remove-item  {.component}
 - lively-halo-resize-item  {.component}
 - lively-halo-style-item  {.component}
 - lively-halo-vivide-add-outport-item  {.component}
 - lively-halo-vivide-combine-item  {.component}
 - lively-halo-vivide-inport-connection-item  {.component}
 - lively-halo-vivide-inport-item  {.component}
 - lively-halo-vivide-open-script-editor-item  {.component}
 - lively-halo-vivide-outport-connection-item  {.component}
 - lively-halo-vivide-outport-item  {.component}
 - lively-halo  {.component}
 - lively-hand  {.component}
 - lively-selection  {.component}
  
<script>
  var context = lively.query(this, "lively-markdown").shadowRoot
  ComponentCreator.updateComponentsUI(container, context)
</script>