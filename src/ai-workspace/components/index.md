# Components


<link rel="stylesheet" type="text/css" href="../../components/index-style.css"  />
<lively-import src="../_navigation.html"></lively-import>

## Component Architecture

```mermaid
---
config:
  layout: elk
  look: handDrawn
  theme: neutral
---
flowchart TD
    %% Base Classes
    Morph["<b>Morph</b><br/>«Lively4 Base»<br/>─────────<br/>initialize()<br/>connectedCallback()<br/>livelyExample()<br/>livelyMigrate()"]
    
    %% Main Chat Component Hierarchy
    LivelyChat["<b>LivelyChat</b><br/>─────────<br/>_replayMode<br/>_conversationId<br/>_messages<br/>─────────<br/>canWriteToDatabase()<br/>captureEvent()<br/>sendMessage()<br/>clearConversation()"]
    
    LivelyAiWorkspace["<b>LivelyAiWorkspace</b><br/>«Coordinator»<br/>─────────<br/>realtimeComponent<br/>opencodeComponent<br/>agentBoard<br/>─────────<br/>coordinateAgents()<br/>handleRealtimeEvent()<br/>handleOpencodeEvent()"]
    
    LivelyOpencode["<b>LivelyOpencode</b><br/>«Claude Code»<br/>─────────<br/>_socket<br/>_terminalHistory<br/>─────────<br/>connectToServer()<br/>sendCommand()<br/>renderToolUse()<br/>replayEvents()"]
    
    OpenaiRealtimeChat["<b>OpenaiRealtimeChat</b><br/>«Voice/Text Agent»<br/>─────────<br/>_peerConnection<br/>_dataChannel<br/>_audioElement<br/>─────────<br/>connect()<br/>sendAudio()<br/>sendText()<br/>handleToolCall()"]
    
    %% Supporting Components
    LivelyAgentBoard["<b>LivelyAgentBoard</b><br/>─────────<br/>displayTodos()<br/>displayToolUsage()<br/>displaySessionLinks()<br/>updateFromEvents()"]
    
    LivelyChatMessage["<b>LivelyChatMessage</b><br/>─────────<br/>role<br/>content<br/>timestamp<br/>─────────<br/>renderMarkdown()<br/>renderCode()"]
    
    LivelyChatSessions["<b>LivelyChatSessions</b><br/>─────────<br/>sessions<br/>activeSession<br/>─────────<br/>loadSessions()<br/>selectSession()<br/>deleteSession()"]
    
    %% Tool Infrastructure
    OpenCodeBaseTool["<b>OpenCodeBaseTool</b><br/>«abstract»<br/>─────────<br/>matches(part)<br/>renderCompact()<br/>renderCompactStreaming()<br/>buildDetails()<br/>createMarkdownEl()"]
    
    OpenCodeGenericTool["<b>OpenCodeGenericTool</b><br/>─────────<br/>matches(part)<br/>renderCompact()"]
    
    OpenCodeReadTool["<b>OpenCodeReadTool</b><br/>─────────<br/>matches(part)<br/>renderCompact()<br/>renderFileContent()"]
    
    BasicToolset["<b>BasicToolset</b><br/>«utility»<br/>─────────<br/>getCurrentTime()<br/>lively4EvaluateCode()<br/>notifyUser()<br/>openComponent()"]
    
    WorkspaceToolset["<b>WorkspaceToolset</b><br/>«utility»<br/>─────────<br/>executeOpencodeTask()<br/>getProjectFocus()<br/>getAgentContext()"]
    
    CompositeToolset["<b>CompositeToolset</b><br/>─────────<br/>toolsets<br/>─────────<br/>addToolset()<br/>getTools()<br/>handleToolCall()"]
    
    ChatToolHelpers["<b>ChatToolHelpers</b><br/>«utility»<br/>─────────<br/>createCodeBlock()<br/>createCollapsible()<br/>formatTimestamp()"]
    
    %% Inheritance Relationships (solid lines with triangular arrow)
    Morph -.->|inherits| LivelyChat
    Morph -.->|inherits| LivelyAgentBoard
    Morph -.->|inherits| LivelyChatMessage
    Morph -.->|inherits| LivelyChatSessions
    LivelyChat -.->|inherits| LivelyAiWorkspace
    LivelyChat -.->|inherits| LivelyOpencode
    LivelyChat -.->|inherits| OpenaiRealtimeChat
    OpenCodeBaseTool -.->|inherits| OpenCodeGenericTool
    OpenCodeBaseTool -.->|inherits| OpenCodeReadTool
    
    %% Composition Relationships (filled diamond)
    LivelyAiWorkspace ==>|contains| OpenaiRealtimeChat
    LivelyAiWorkspace ==>|contains| LivelyOpencode
    LivelyAiWorkspace ==>|contains| LivelyAgentBoard
    LivelyChat ==>|displays| LivelyChatMessage
    
    %% Aggregation/Usage (dashed lines)
    LivelyChat -.->|uses| LivelyChatSessions
    LivelyOpencode -.->|renders with| OpenCodeBaseTool
    OpenaiRealtimeChat -.->|uses| CompositeToolset
    CompositeToolset ==>|aggregates| BasicToolset
    CompositeToolset ==>|aggregates| WorkspaceToolset
    OpenCodeBaseTool -.->|uses| ChatToolHelpers
```




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