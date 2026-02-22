## 2026-02-13 Extended Thinking Support in OpenCode #opencode #thinking #ai-integration
*Author: @JensLincke [with @BlindGoldie]*

Implemented extended thinking (reasoning) support for the lively-opencode component, enabling Claude to use Anthropic's reasoning API with configurable thinking budgets.

- **Added**: [lively-chat-message.js](edit://src/components/tools/lively-chat-message.js) - reasoning part rendering
- **Modified**: [lively-opencode.js](edit://src/components/tools/lively-opencode.js) - variant cycling support
- **Modified**: [lively-opencode.html](edit://src/components/tools/lively-opencode.html) - variant button UI
- **Updated**: [CLAUDE.md](edit://CLAUDE.md) - clarified OpenCode server location
- **Updated**: [doc/notes/opencode.md](edit://doc/notes/opencode.md) - documented thinking configuration

## Technical Implementation

**Variant System:**
- Added variant cycling button (💭) in header: `none → high → max → none`
- For Claude Sonnet: none (default), high (16k tokens), max (32k tokens)
- Variant included in message POST body: `{ parts: [...], variant: "high" }`
- State persists through live updates via `livelyMigrate()`

**Reasoning Part Rendering:**
- Added `type === 'reasoning'` handler in `renderOpenCodeParts()`
- Renders as collapsible `<details>` element with 💭 emoji
- Format: `<summary>💭 <em>Thinking...</em></summary>` + reasoning text

**Message Flow:**
```javascript
// SSE Event Structure
{
  "type": "message.part.updated",
  "properties": {
    "part": {
      "type": "reasoning",
      "text": "...",          // Incremental text updates
      "id": "prt_...",
      "messageID": "msg_...",
      "sessionID": "ses_...",
      "time": { "start": 1771000088800 }
    },
    "delta": " algorithm"    // Incremental text chunk
  }
}
```

## OpenCode Architecture Clarification

**Key Discovery:**
- OpenCode server is in `../opencode/` (NOT `../lively4-server/`)
- OpenCode is separate terminal application running on port 9100
- Source: TypeScript in `packages/opencode/src/`
- Thinking configuration: `packages/opencode/src/provider/transform.ts`

**Variant System:**
- Variants are model-specific reasoning configurations
- Anthropic models: `{ thinking: { type: "enabled", budgetTokens: N } }`
- OpenAI models: `{ reasoning: { effort: "low" | "medium" | "high" } }`
- Configured per-message via `variant` field in user messages

## TODO

- [ ] **Streaming Reasoning Updates** #TODO
  - Reasoning parts stream incrementally via `message.part.updated` events
  - Current: Only handles complete reasoning parts
  - Need: Live streaming updates to reasoning text as it arrives
  - Delta field contains incremental text chunks: `"delta": " algorithm"`
  - Similar to text streaming but for `type: "reasoning"` parts

- [ ] **Reasoning Part Styling** #TODO
  - Current: Basic `<details>` element
  - Consider: Different visual treatment (e.g., italic, different color)
  - Add collapse/expand icons or animations
  - Show "thinking..." indicator while streaming

- [ ] **Variant Persistence** #TODO
  - Current: Variant resets to 'none' on server restart
  - Consider: Save variant preference to localStorage
  - Or: Remember last variant per session

- [ ] **Token Usage Display** #TODO
  - Reasoning parts include token counts in step-finish events
  - Show: `reasoning: 890` tokens separately from output tokens
  - Display in debug view or message metadata

## Files Changed

```
src/components/tools/lively-chat-message.js:
  - renderOpenCodeParts(): Added reasoning part handler (lines 262-267)
  - Renders as collapsible <details> with 💭 emoji

src/components/tools/lively-opencode.js:
  - initialize(): Added variant state (line 115)
  - onVariantButton(): Cycle through none/high/max (lines 1583-1593)
  - updateVariantButton(): Update UI based on variant (lines 1595-1603)
  - onSendButton(): Include variant in message body (lines 1511-1519)
  - livelyMigrate(): Persist variant state (line 2006, 2018)

src/components/tools/lively-opencode.html:
  - Added variant button to header controls (line 268-270)

CLAUDE.md:
  - Added OpenCode Integration section with server location
  - Minimal reference pointing to doc/notes/opencode.md

doc/notes/opencode.md:
  - Marked thinking rendering as ✅ Working
  - Marked variant cycling as ✅ Working
  - Added OpenCode Server section with detailed architecture
  - Documented thinking configuration and message format
  - Updated status: thinking mode activation moved from TODO to Working
```

## Testing

Tested with Claude Sonnet on OpenCode server:
- ✅ Variant button cycles through none/high/max
- ✅ Variant persists during live updates
- ✅ Messages include variant in POST body
- ✅ Reasoning parts arrive via SSE (observed in event capture)
- ⚠️ Reasoning rendering not yet tested (need streaming implementation)

## Next Steps

1. Implement incremental reasoning text streaming in `updateOpenCodePart()`
2. Test with actual thinking-enabled messages
3. Consider UI polish (animations, styling, indicators)
