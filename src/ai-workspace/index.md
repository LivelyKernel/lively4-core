# AI Workspace

[tasks](tasks.md) | [doc](doc/) | [components](components/)

Integrated AI coding assistance for Lively4, providing multiple AI agents that work together through a coordinator component.




## Components

### Core Components

- **[lively-ai-workspace](components/lively-ai-workspace.js)** - Coordinator component that orchestrates multiple AI agents
  - Manages shared conversation history and context
  - Coordinates between voice/text agents and code agents
  - Provides unified interface for AI interactions

- **[lively-opencode](components/lively-opencode.js)** - OpenCode terminal-based AI coding agent
  - Connects to OpenCode server on `http://localhost:9100`
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

- **[openai-realtime-chat-tools](components/openai-realtime-chat-tools.js)** - Tool integration for OpenAI Realtime API
  - BasicToolset - Standalone tools for openai-realtime-chat
  - WorkspaceToolset - Coordinated tools for lively-ai-workspace

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
└── lively-opencode (eventSource: 'opencode')
    ├── Terminal-based coding agent
    └── Full OpenCode server integration
```

All components use event capture system to maintain conversation history and enable replay functionality.

## Documentation

- [Architecture Overview](doc/architecture/ai-workspace.md) - Main architecture documentation
- [Task Management](doc/architecture/ai-workspace-tasks.md) - Task handling and coordination
- [Modes](doc/architecture/ai-workspace-modes.md) - Different operational modes
- [OpenCode Details](doc/architecture/opencode.md) - OpenCode integration specifics
- [Diagrams](doc/diagrams/) - Architecture diagrams and flow charts

## Testing

Tests are located in `test/` directory:
- `lively-ai-workspace-test.js` - Integration tests for coordinator
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

- **OpenCode Server**: Runs separately on `http://localhost:9100`
  - Source code in `../opencode/` directory (not part of lively4-server)
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
