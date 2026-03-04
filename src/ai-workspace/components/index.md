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
classDiagram
    
    %% Main Chat Component Hierarchy
    class LivelyChat {
        canWriteToDatabase()
        enableReplay()
        disableReplay()
        captureEvent()
        renderChatMessage()
        log()
    }
    
    class LivelyAiWorkspace {
        createWorkspaceSession()
        switchWorkspaceSession()
        createOpenCodeMessage()
        updateOpenCodeMessage()
        createRealtimeMessage()
        updateRealtimeMessage()
        sendMessageToOpenCode()
    }
    
    class LivelyOpencode {
        connectToServer()
        loadSessions()
        selectSession()
        abortCurrentSession()
        handleEvent()
    }
    
    class OpenaiRealtimeChat {
        connectRealtimeWebRTC()
        disconnectRealtimeWebRTC()
        handleRealtimeMessage()
        createMessage()
        updateMessage()
    }
    
    %% Supporting Components
    class LivelyAgentBoard {
        updateTodos()
        updateFromMessage()
        updateFromOpenCode()
        render()
    }
    
    class LivelyChatMessage {
        setMessage()
        setOpenCodeMessage()
        renderOpenCodeParts()
    }
    
    class LivelyChatSessions {
        render()
        selectSession()
        deleteSelectedSessions()
    }
    
    %% Tool Infrastructure
    class OpenCodeBaseTool {
        <<abstract>>
        matches()
        renderToolUse()
        renderToolResult()
        renderToolStreaming()
        createMarkdownEl()
        buildDetails()
    }
    
    class OpenCodeGenericTool {
        matches()
        renderToolUse()
        renderToolResult()
    }
    
    class OpenCodeReadTool {
        matches()
        renderCompact()
    }
    
    class BasicToolset {
        <<utility>>
        getDefinitions()
        execute()
    }
    
    class WorkspaceToolset {
        <<utility>>
        getDefinitions()
        execute()
    }
    
    class CompositeToolset {
        getDefinitions()
        execute()
    }
    
    class ChatToolHelpers {
        <<utility module>>
    }
    
    %% Inheritance Relationships
    LivelyChat <|-- LivelyAiWorkspace
    LivelyChat <|-- LivelyOpencode
    LivelyChat <|-- OpenaiRealtimeChat
    OpenCodeBaseTool <|-- OpenCodeGenericTool
    OpenCodeBaseTool <|-- OpenCodeReadTool
    
    %% Composition Relationships
    LivelyAiWorkspace *-- OpenaiRealtimeChat
    LivelyAiWorkspace *-- LivelyOpencode
    LivelyAiWorkspace *-- LivelyAgentBoard
    LivelyOpencode *-- LivelyAgentBoard
    LivelyChat *-- LivelyChatMessage
    
    %% Aggregation/Usage
    LivelyChat ..> LivelyChatSessions : uses
    LivelyChatMessage ..> OpenCodeBaseTool : renders with
    OpenaiRealtimeChat ..> CompositeToolset : uses
    CompositeToolset o-- BasicToolset : aggregates
    CompositeToolset o-- WorkspaceToolset : aggregates
    OpenCodeBaseTool ..> ChatToolHelpers : uses
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