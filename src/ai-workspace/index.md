# AI Workspace

<lively-import src="_navigation.html"></lively-import>

Integrated AI coding assistance for Lively4, providing multiple AI agents that work together through a coordinator component.




## Components

### Core Components

- **[lively-ai-workspace](components/lively-ai-workspace.js)** - Coordinator component that orchestrates multiple AI agents
  - Manages shared conversation history and context
  - Coordinates between voice/text agents and code agents
  - Provides unified interface for AI interactions

- **[lively-opencode](components/lively-opencode.js)** - Claude Code terminal-based AI coding agent
  - Connects to Claude Code server on `http://localhost:9100`
  - Full terminal capabilities for coding tasks
  - Event capture and replay for history

- **[openai-realtime-chat](components/openai-realtime-chat.js)** - OpenAI Realtime API voice/text agent
  - WebRTC-based real-time voice interaction
  - Text chat with streaming responses
  - Tool integration for live coding assistance

### Supporting Components

- **[lively-chat](components/lively-chat.js)** - Base class for all AI chat components
  - Common functionality for message handling
  - Event capture system for replay
  - Database integration for conversation persistence

- **[lively-chat-message](components/lively-chat-message.js)** - Message display component
  - Renders individual chat messages
  - Supports markdown, code blocks, and rich content

- **[lively-chat-sessions](components/lively-chat-sessions.js)** - Session management component
  - Multi-select session support
  - Context menu for session operations
  - Active session tracking

- **[lively-agent-board](components/lively-agent-board.js)** - Display board for agent information
  - TODOs grouped by status with priority-based color coding
  - Tool usage statistics and file operation summary
  - Session links (project focus, files read/written)
  - Reusable across AI components

- **Realtime Chat Toolsets** - Tool integration for OpenAI Realtime API
  - [BasicToolset](components/realtime-chat-tools/basic-toolset.js) - Standalone tools (code evaluation, helpers)
  - [WorkspaceToolset](components/realtime-chat-tools/workspace-toolset.js) - Workspace integration (OpenCode tasks)
  - [CompositeToolset](components/realtime-chat-tools/composite-toolset.js) - Tool composition

- **[chat-tool-helpers](components/chat-tool-helpers.js)** - Helper utilities for tool rendering
  - Common functions for tool display and interaction
  - Used by tool renderers

- **Tool Renderers** - Specialized renderers for different tool types
  - [opencode-read-tool](components/tool-renderers/opencode-read-tool.js) - Displays file reads with syntax highlighting
  - [opencode-generic-tool](components/tool-renderers/opencode-generic-tool.js) - Fallback renderer for all tools

## Architecture

```
lively-ai-workspace (coordinator/blackboard)
├── openai-realtime-chat (eventSource: 'realtime')
│   ├── Voice/text interaction with OpenAI
│   └── Tool execution capabilities
├── lively-opencode (eventSource: 'opencode')
│   ├── Terminal-based coding agent
│   └── Full Claude Code server integration
└── lively-agent-board
    ├── TODOs and task tracking
    ├── Tool usage statistics
    └── Session links and file operations
```

All components use event capture system to maintain conversation history and enable replay functionality.

## Documentation

- [Introduction](doc/introduction.md) - **Motivation and document overview**
- [Approach](doc/approach.md) - **Design rationale and exploration goals**
- [Implementation](doc/implementation.md) - **Technical implementation details**
- [Architecture Overview](doc/ai-workspace.md) - Detailed component APIs and class hierarchy
- [Refactoring Guide](doc/refactoring.md) - Current refactoring tasks and improvements
- [AI Workspace Overview](doc/ai-workspace-overview.md) - High-level overview and concepts
- [Task Management](doc/ai-workspace-tasks.md) - Task handling and coordination
- [Modes](doc/ai-workspace-modes.md) - Different operational modes
- [Claude Code Details](doc/opencode.md) - Claude Code integration specifics
- [Question Tool](doc/opencode-question-tool.md) - Question tool implementation details
- [Duplicate Messages](doc/openai-realtime-duplicate-messages.md) - OpenAI Realtime API message handling
- [Ideas](doc/ideas.md) - Future ideas and explorations

## Testing

Tests are located in `test/` directory:
- `lively-ai-workspace-test.js` - Integration tests for coordinator
- `lively-agent-board-test.js` - Agent board component tests
- `lively-opencode-test.js` - Event replay and message handling tests
- `openai-realtime-chat-test.js` - Realtime API integration tests
- `openai-realtime-chat-tools-test.js` - Tool functionality tests
- `ai-workspace-transcript-test.js` - Transcript generation tests

Run tests:
```javascript
// Run all AI workspace tests
mcp__lively4__run-tests(testPath: "src/ai-workspace/test/lively-ai-workspace-test.js")

// Or run specific test file
mcp__lively4__run-tests(testPath: "src/ai-workspace/test/openai-realtime-chat-test.js")
```

## Usage

Open AI Workspace via:
- Context menu: Right-click → AI Tools → AI Workspace
- Direct: `lively.openComponentInWindow('lively-ai-workspace')`
- Browse to: `open://lively-ai-workspace`

Individual components can also be opened directly:
- `lively.openComponentInWindow('lively-opencode')`
- `lively.openComponentInWindow('openai-realtime-chat')`

## External Dependencies

- **Claude Code Server**: Runs separately on `http://localhost:9100`
  - Source code in `../Claude/` directory (for documentation/reference only - NOT lively4-server)
  - Terminal-based AI coding agent
  
- **OpenAI Realtime API**: Requires OpenAI API key
  - WebRTC-based real-time voice interaction
  - Configured via environment or component settings

## Database

Components use Dexie.js for conversation persistence:
- `lively-ai-workspace-history` - Workspace conversation history
- `openai-realtime-conversations` - Realtime chat conversations

## Development

Components follow Lively4's standard component patterns:
- Extend `Morph` base class (lively-chat extends Morph)
- Use `initialize()` for setup
- Implement `livelyExample()` for demo content
- Use `livelyMigrate()` for live updates during development

See [main CLAUDE.md](../../CLAUDE.md) for general Lively4 development guidelines.
