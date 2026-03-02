# AI Workspace


<lively-import src="../_navigation.html"></lively-import>


- [Paper Outline](content.md)
  - [introduction](introduction.md)
  - [approach](approach.md)
  - [implementation](implementation.md)



## Components

- [opencode](opencode.md)
- [ai-workspace](ai-workspace.md)
- [agent-board](agent-board.md)



## Misc

- [ideas](ideas.md)    
- [architecture](architecture.md)
- [refactoring](refactoring.md)
  
## [Notes](notes/)
  - [ai-workspace-modes](notes/ai-workspace-modes.md)
  - [ai-workspace-overview](notes/ai-workspace-overview.md)
  - [ai-workspace-tasks](notes/ai-workspace-tasks.md)
  - [message-ordering-bug](notes/message-ordering-bug.md)
  - [openai-realtime-duplicate-messages](notes/openai-realtime-duplicate-messages.md)
  - [opencode-question-tool](notes/opencode-question-tool.md)


### *META*
<script>
import Files from "src/client/files.js"
var md = lively.query(this, "lively-markdown");
Files.generateMarkdownFileListing(md.shadowRoot)
</script>