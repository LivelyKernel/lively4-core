# Halo Web Components

The Halo and it's Halo items are the primary tool for direct object manipulation in Lively Kernel.

![](lively-halo.png)

<script>
    import ComponentCreator from "src/client/morphic/component-creator.js"
  var container  = lively.query(this, "lively-container")
  if(!container) throw new Error("Not inside lively container?");
  ComponentCreator.createUI(container)
</script>
  
<script>
  ComponentCreator.listComponentsUI(container)
</script>
  