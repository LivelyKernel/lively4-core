# Draft Web Components

<script>
    import ComponentCreator from "src/client/morphic/component-creator.js"
  var container  = lively.query(this, "lively-container")
  if(!container) throw new Error("Not inside lively container?");
  ComponentCreator.createUI(container)
</script>
  
<script>
  ComponentCreator.listComponentsUI(container)
</script>
  