# Pen-based Editor Web Components

AstNodeBooleanLiteral

CompoundNodeLiveScriptFunctionShorthand

<script>
  import ComponentCreator from "src/client/morphic/component-creator.js"
  var container  = lively.query(this, "lively-container")
  if(!container) throw new Error("Not inside lively container?");
  ComponentCreator.createUI(container, lively4url + "/src/client/pen-editor/components/template")
</script>
  
<script>
  ComponentCreator.listComponentsUI(container)
</script>
  