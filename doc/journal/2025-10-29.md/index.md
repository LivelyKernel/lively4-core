## 2025-10-29 OpenCode Model Chooser Attempt
*Author: @JensLincke [with @BlindGoldi]*

Attempted to add dynamic model selection to lively-opencode component using OpenCode API.

**Failed Approach:**
- Added UI dropdown in header to display available models from `/config/providers` endpoint
- Implemented `updateServerModel()` to call `PATCH /config` with `{model: "provider/model"}` format
- Model selector properly loaded providers (OpenCode Zen, Anthropic) and grouped models

**Technical Implementation:**
- Modified [lively-opencode.html](edit://src/components/tools/lively-opencode.html) - Added model selector UI with styling
- Modified [lively-opencode.js](edit://src/components/tools/lively-opencode.js) - Added `loadProviders()`, `updateModelSelector()`, `updateServerModel()` methods
- Used format `anthropic/claude-sonnet-4-5-20250929` per API schema specification

**Issue:**
OpenCode server crashed when PATCH /config was called from the component, despite manual testing working:
```javascript
fetch("http://localhost:9100/config", {
  method: 'PATCH',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({ model: 'opencode/grok-code' })
})
```

```
8468 |     options
8469 |   }) {
8470 |     return new Promise((resolve2, reject) => {
8471 |       if (this.isClosed) {
8472 |         return reject(
8473 |           new MCPClientError({
                 ^
MCPClientError: Attempted to send a request from a closed client
      cause: undefined,
 vercel.ai.error: true,
 vercel.ai.error.AI_MCPClientError: true,

      at <anonymous> (../../node_modules/.bun/ai@5.0.8+d6123d32214422cb/node_modules/ai/dist/index.mjs:8473:11)
      at new Promise (1:11)
      at request (../../node_modules/.bun/ai@5.0.8+d6123d32214422cb/node_modules/ai/dist/index.mjs:8470:12)
      at request (../../node_modules/.bun/ai@5.0.8+d6123d32214422cb/node_modules/ai/dist/index.mjs:8465:16)
      at listTools (../../node_modules/.bun/ai@5.0.8+d6123d32214422cb/node_modules/ai/dist/index.mjs:8524:19)
      at listTools (../../node_modules/.bun/ai@5.0.8+d6123d32214422cb/node_modules/ai/dist/index.mjs:8519:18)
      at tools (../../node_modules/.bun/ai@5.0.8+d6123d32214422cb/node_modules/ai/dist/index.mjs:8567:42)
      at tools (../../node_modules/.bun/ai@5.0.8+d6123d32214422cb/node_modules/ai/dist/index.mjs:8561:14)
      at tools (src/mcp/index.ts:200:49)
```

Error indicated MCP client connection problems after config update. Likely an OpenCode server bug when handling config changes while MCP connections are active.

**Resolution:**
- Reverted all changes
- Model selection remains server-side configuration only
- Model chooser UI deemed not feasible until OpenCode API stability improves

**Lessons:**
- OpenCode `/config` PATCH endpoint exists and schema supports model changes
- Integration issues suggest config changes may require server restart or have race conditions with MCP
- Consider read-only model display instead of active switching
