# Voice File Tools - Architecture Diagram

## System Architecture

```mermaid
graph TB
    User[👤 User Voice Input]
    Vox[🎤 Vox - openai-realtime-chat]
    Scribe[📝 Scribe - lively-opencode]
    
    User -->|voice command| Vox
    
    Vox --> CompositeToolset
    
    subgraph CompositeToolset[Composite Toolset]
        BasicToolset[Basic Toolset<br/>evaluate_code, time, etc.]
        WorkspaceToolset[Workspace Toolset<br/>send_opencode_task]
        VoiceToolset[Voice Toolset NEW<br/>File operations]
    end
    
    WorkspaceToolset -->|delegates complex tasks| Scribe
    
    VoiceToolset --> FileContext[File Context<br/>workingFile, recentFiles]
    VoiceToolset --> LivelyFiles[lively.files API<br/>loadFile, saveFile, etc.]
    
    VoiceToolset --> ReadTools[📖 Reading Tools]
    VoiceToolset --> EditTools[✏️ Editing Tools]
    VoiceToolset --> SearchTools[🔍 Search Tools]
    VoiceToolset --> MgmtTools[📁 Management Tools]
    VoiceToolset --> ContextTools[📍 Context Tools]
    VoiceToolset --> NavTools[🧭 Navigation Tools]
    
    ReadTools -->|renders| ToolRenderers[Tool Renderers<br/>opencode-read-tool, etc.]
    EditTools -->|renders| ToolRenderers
    SearchTools -->|renders| ToolRenderers
    
    ToolRenderers -->|visual feedback| UI[🖥️ UI Display]
    Vox -->|voice response| TTS[🔊 Text-to-Speech]
    
    style Vox fill:#e1f5ff
    style Scribe fill:#fff4e1
    style VoiceToolset fill:#e8f5e9
    style FileContext fill:#f3e5f5
```

## Tool Categories Detail

```mermaid
graph LR
    VoiceToolset[Voice Toolset]
    
    VoiceToolset --> Reading
    VoiceToolset --> Editing
    VoiceToolset --> Searching
    VoiceToolset --> Managing
    VoiceToolset --> Context
    VoiceToolset --> Navigation
    
    subgraph Reading[📖 File Reading]
        R1[read_file_voice]
        R2[peek_file_structure]
        R3[list_recent_files]
    end
    
    subgraph Editing[✏️ File Editing]
        E1[edit_file_voice]
        E2[append_to_file]
        E3[quick_fix]
    end
    
    subgraph Searching[🔍 File Search]
        S1[find_files_voice]
        S2[search_in_files]
    end
    
    subgraph Managing[📁 File Management]
        M1[create_file_voice]
        M2[rename_file_voice]
        M3[delete_file_voice]
    end
    
    subgraph Context[📍 Context Mgmt]
        C1[set_working_file]
        C2[get_file_context]
    end
    
    subgraph Navigation[🧭 Navigation]
        N1[open_file_in_editor]
        N2[show_file_diff]
    end
    
    style Reading fill:#e3f2fd
    style Editing fill:#e8f5e9
    style Searching fill:#fff3e0
    style Managing fill:#fce4ec
    style Context fill:#f3e5f5
    style Navigation fill:#e0f2f1
```

## Data Flow: Voice Command → Execution

```mermaid
sequenceDiagram
    participant User
    participant Vox
    participant VoiceToolset
    participant FileContext
    participant LivelyFiles
    participant ToolRenderer
    participant UI
    
    User->>Vox: "Show me that file"
    
    Vox->>VoiceToolset: execute('read_file_voice', {path: 'that'})
    
    VoiceToolset->>FileContext: resolveFileReference('that')
    FileContext-->>VoiceToolset: 'src/components/openai-realtime-chat.js'
    
    VoiceToolset->>LivelyFiles: loadFile(path)
    LivelyFiles-->>VoiceToolset: file content
    
    VoiceToolset->>FileContext: addToRecent(path, 'read')
    VoiceToolset->>FileContext: setWorkingFile(path)
    
    VoiceToolset-->>Vox: {success: true, content: '...', voiceResponse: 'Here is...'}
    
    Vox->>ToolRenderer: renderToolOutput('read_file_voice', result)
    ToolRenderer-->>UI: Display syntax-highlighted code
    
    Vox-->>User: 🔊 "Here's the openai-realtime-chat component..."
```

## Decision Flow: Voice vs. Scribe

```mermaid
flowchart TD
    Start[User Voice Command]
    Start --> Classify{Classify Operation}
    
    Classify -->|Single file, simple| VoicePath[Voice Tool Path]
    Classify -->|Multi-file, complex| ScribePath[Scribe Delegation Path]
    Classify -->|Requires testing| ScribePath
    Classify -->|Systematic changes| ScribePath
    
    VoicePath --> VoiceTool[Execute Voice Tool]
    VoiceTool --> Immediate[Immediate Feedback]
    Immediate --> VoiceUI[Update UI + TTS Response]
    
    ScribePath --> Delegate[send_opencode_task]
    Delegate --> Wait[Wait for Completion]
    Wait --> Check{Quick response?}
    
    Check -->|Yes < 5s| ImmediateResponse[Return immediately]
    Check -->|No > 5s| LongRunning[Set waiting flag]
    
    LongRunning --> Background[Background processing]
    Background --> Notify[Notify when complete]
    
    ImmediateResponse --> ScribeUI[Display Scribe's result]
    Notify --> ScribeUI
    
    style VoicePath fill:#e8f5e9
    style ScribePath fill:#fff4e1
    style VoiceUI fill:#c8e6c9
    style ScribeUI fill:#ffe0b2
```

## FileContext State Machine

```mermaid
stateDiagram-v2
    [*] --> NoContext: Initialize
    
    NoContext --> HasWorkingFile: read_file_voice
    NoContext --> HasWorkingFile: set_working_file
    
    HasWorkingFile --> HasWorkingFile: edit_file_voice<br/>(updates working file)
    HasWorkingFile --> HasWorkingFile: read_file_voice<br/>(updates working file)
    
    HasWorkingFile --> MultipleRecent: read different file
    MultipleRecent --> MultipleRecent: read/edit operations
    
    state HasWorkingFile {
        [*] --> Current
        Current --> Current: operations on working file
    }
    
    state MultipleRecent {
        [*] --> Track
        Track --> Track: operations on various files
        note right of Track
            Tracks up to 20 recent files
            Enables "that file" references
        end note
    }
    
    note right of NoContext
        No file context yet
        Commands must specify full path
    end note
    
    note right of HasWorkingFile
        Working file set
        "this", "current" resolve to it
    end note
```

## Tool Output Flow

```mermaid
flowchart LR
    Tool[Voice Tool Execution]
    
    Tool --> Output{Generate Output}
    
    Output --> Visual[Visual Data]
    Output --> Voice[Voice Response]
    Output --> Meta[Metadata]
    
    Visual --> Renderer[Tool Renderer]
    Renderer --> UI[UI Display]
    
    Voice --> TTS[Text-to-Speech]
    TTS --> Audio[Audio Output]
    
    Meta --> Context[Update FileContext]
    Context --> History[Conversation History]
    
    UI --> User[👤 User sees result]
    Audio --> User
    
    style Visual fill:#e3f2fd
    style Voice fill:#f3e5f5
    style Meta fill:#fff3e0
```

## Safety Confirmation Flow

```mermaid
flowchart TD
    Start[Destructive Operation]
    Start --> Check{Safety Check}
    
    Check -->|Safe operation| Execute[Execute directly]
    Check -->|Needs confirmation| Confirm[Ask for confirmation]
    Check -->|Recently modified| DoubleConfirm[Double confirmation]
    
    Confirm --> Question[Show question dialog]
    DoubleConfirm --> Warning[Show warning + question]
    
    Question --> UserChoice{User chooses}
    Warning --> UserChoice
    
    UserChoice -->|Confirm| Execute
    UserChoice -->|Alternative| Alternative[Execute alternative<br/>e.g., move to trash]
    UserChoice -->|Cancel| Cancel[Cancel operation]
    
    Execute --> Success[Operation successful]
    Alternative --> Success
    Cancel --> Abort[Operation aborted]
    
    Success --> Feedback[Visual + voice feedback]
    Abort --> Feedback
    
    style Check fill:#fff3e0
    style Confirm fill:#ffe0b2
    style DoubleConfirm fill:#ffccbc
    style Cancel fill:#ffcdd2
    style Success fill:#c8e6c9
```

## Implementation Phases

```mermaid
gantt
    title Voice File Tools Implementation Roadmap
    dateFormat  YYYY-MM-DD
    section Phase 1
    Core Reading Tools           :p1, 2026-03-17, 7d
    read_file_voice             :2026-03-17, 3d
    find_files_voice            :2026-03-20, 2d
    list_recent_files           :2026-03-22, 2d
    
    section Phase 2
    Simple Editing Tools        :p2, 2026-03-24, 7d
    append_to_file              :2026-03-24, 2d
    edit_file_voice             :2026-03-26, 3d
    quick_fix                   :2026-03-29, 2d
    
    section Phase 3
    File Management Tools       :p3, 2026-03-31, 7d
    create_file_voice           :2026-03-31, 2d
    rename_file_voice           :2026-04-02, 2d
    delete_file_voice           :2026-04-04, 3d
    
    section Phase 4
    Advanced Features           :p4, 2026-04-07, 7d
    peek_file_structure         :2026-04-07, 3d
    show_file_diff              :2026-04-10, 2d
    open_file_in_editor         :2026-04-12, 2d
    
    section Phase 5
    Integration & Polish        :p5, 2026-04-14, 7d
    Intelligent delegation      :2026-04-14, 3d
    Documentation               :2026-04-17, 2d
    User testing                :2026-04-19, 2d
```

---

## Key Design Principles

### 1. Voice-First Design
- Natural language command understanding
- Fuzzy matching for dictation errors
- Conversational file references ("that file", "this one")
- Voice-friendly confirmation flows

### 2. Immediate Feedback
- Quick operations execute directly (no delegation)
- Visual feedback while speaking response
- Progress indicators for longer operations
- Clear success/error messages

### 3. Safety First
- Confirmations for destructive operations
- Extra checks for recently modified files
- Diff preview before applying edits
- Undo via conversation history

### 4. Context Awareness
- Track working file and recent files
- Resolve conversational references
- Maintain operation history
- Enable natural follow-up commands

### 5. Intelligent Delegation
- Simple operations → Voice Tools
- Complex operations → Scribe
- Clear handoff with explanation
- Seamless return of results

---

## Technology Stack

- **Voice Input**: OpenAI Realtime API (WebRTC)
- **File Operations**: `lively.files.*` API
- **Tool Framework**: Toolset pattern (Basic, Workspace, Voice)
- **Rendering**: OpenCode tool renderers + custom voice renderers
- **State Management**: FileContext class
- **Diff Visualization**: diff-match-patch library
- **UI Framework**: Lively4 web components
- **Testing**: Mocha + Karma

---

**See full details:**
- [Complete Plan](vox-file-tools-plan.md)
- [Quick Reference](vox-file-tools-outline.md)
