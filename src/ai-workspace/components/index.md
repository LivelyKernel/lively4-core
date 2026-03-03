# Components


<lively-import src="../_navigation.html"></lively-import>





- lively-opencode {.component}
- lively-agent-board  {.component}
- lively-ai-workspace  {.component}
- lively-chat-message  {.component}
- lively-chat-sessions  {.component}
- openai-realtime-chat  {.component}




<script>
  import ComponentCreator from "src/client/morphic/component-creator.js"
  var context = lively.query(this, "lively-markdown").shadowRoot
  var container  = lively.query(this, "lively-container")
  if(!container) throw new Error("Not inside lively container?");
  ComponentCreator.updateComponentsUI(container, context)
</script>