## 2025-11-12 Dynamic MCP Tool Discovery #mcp #tools #architecture
*Author: @JensLincke [with @BlindGoldi]*

Implemented dynamic tool discovery system for MCP (Model Context Protocol) to move tool definitions from server to browser client.

- **Added**: [mcp-tools.js](edit://src/client/mcp-tools.js) - Added metadata property to tools with description and inputSchema
- **Added**: [mcp-tools.js](edit://src/client/mcp-tools.js) - `getToolDefinitions()` helper function exports tool metadata
- **Modified**: [lively-mcp.js](edit://src/components/tools/lively-mcp.js) - Added `discover-tools` message handler and `handleToolDiscovery()` method
- **Modified**: [mcp-session.js](edit://../lively4-server/src/services/mcp-session.js) - Added `discoverSessionTools()` method and session lifecycle callbacks
- **Modified**: [mcp-server.js](edit://../lively4-server/src/services/mcp-server.js) - Added dynamic tool registry with `getAllTools()`, `discoverAndRegisterSessionTools()`, session tracking
- **Modified**: [tools.json](edit://../lively4-server/tools.json) - Removed browser tools (evaluate_code, run_tests), kept only server meta tools (list_sessions, ping_sessions)
- **Added**: [mcp-tools.js](edit://src/client/mcp-tools.js) - `run-tests` MCP tool with persistent test runner, grep filtering, errors-only mode
- **Modified**: [mcp-tools-test.js](edit://test/client/mcp-tools-test.js) - Fixed Chai API usage (expect.fail → assert.fail)
- **Modified**: [mcp-tools.js](edit://src/client/mcp-tools.js) - Added detection for Babel transpilation errors in console output

**Technical details:**
- Tool definitions now live alongside implementations in browser
- Server automatically discovers tools when sessions connect via `discover-tools` WebSocket message
- Dynamic tools registered in `sessionTools` Map (sessionId → Set of tool names)
- Server capabilities updated to include `tools.listChanged: true`
- Tools removed automatically when sessions disconnect
- Session lifecycle callbacks: `onSessionRegistered`, `onSessionDisconnected`

**Architecture benefits:**
- Single source of truth: tool metadata + implementation in same file
- No server changes needed when adding new browser tools
- Clean separation: server has meta tools, browser has execution tools

**TODO:**
- [ ] #TODO Fix [boundEval](edit://src/client/bound-eval.js) to properly propagate Babel transpilation errors as `isError: true` instead of silently returning undefined - Currently transpilation errors (e.g., invalid syntax) are logged to console but boundEval returns `{ value: undefined }` instead of `{ value: error, isError: true }`. Workaround added in mcp-tools.js to detect console error messages, but boundEval should handle this correctly at the source. See lines 47-60 in bound-eval.js where System.import catch block should detect transpilation failures.
