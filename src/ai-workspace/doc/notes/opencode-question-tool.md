# OpenCode Question Tool

## Overview

The `question` tool allows the LLM to pause mid-execution and ask the user structured questions, waiting for answers before continuing. It is a full async round-trip that integrates tool calls, a server-side pending-request store, HTTP APIs, and UI components.

The tool is only registered when `OPENCODE_CLIENT` is `"app"`, `"cli"`, or `"desktop"` — not for headless/API-only clients.

## Verified Protocol Flow (live-tested)

```
LLM emits tool call { name: "question", input: { questions: [...] } }
  ↓
Server creates a QuestionRequest (id: "que_...")
  → Stores a pending Promise in memory
  → Blocks the session until resolved
  ↓
SSE emits message.part.updated with:
  { type: "tool", tool: "question", callID: "toolu_...",
    state: { status: "running", input: { questions: [...] } } }
  ↓
Client detects tool part with tool:"question" + status:"running"
  → Calls GET /question to find the QuestionRequest matching callID
  → Renders interactive UI from QuestionRequest.questions
  ↓
User answers → client calls:
  POST /question/{que_id}/reply  { answers: string[][] }
  or
  POST /question/{que_id}/reject  (dismiss — stops session)
  ↓
Server resolves the Promise → tool returns result → LLM continues
  SSE emits message.part.updated with status:"completed" and output text
```

**Important:** There is **no separate `question.asked` SSE event**. The question arrives as a normal `message.part.updated` event with `type:"tool"` and `state.status:"running"`. The `question.asked` / `question.replied` / `question.rejected` Bus events exist internally in the opencode server but are not forwarded to the `/event` SSE stream.

## API Endpoints (verified)

| Method | Path                           | Purpose                                                      |
| ------ | ------------------------------ | ------------------------------------------------------------ |
| `GET`  | `/question`                    | List all pending `QuestionRequest` objects                   |
| `POST` | `/question/{requestID}/reply`  | Body: `{ answers: string[][] }` — submit answers             |
| `POST` | `/question/{requestID}/reject` | Dismiss question — **stops the session**                     |

Both reply and reject return `true` (HTTP 200) even for nonexistent IDs — no error is raised.

## Data Types

```typescript
// A single answer choice
type QuestionOption = { label: string; description: string };

// A single question definition
type QuestionInfo = {
    question: string;   // full question text
    header: string;     // short label, max 30 chars
    options: QuestionOption[];
    multiple?: boolean; // allow multi-select (default false)
    custom?: boolean;   // allow free-text answer (default true)
};

// A pending question request (from GET /question)
type QuestionRequest = {
    id: string;         // "que_..." prefix — use this for reply/reject endpoints
    sessionID: string;  // "ses_..." prefix
    questions: QuestionInfo[];
    tool?: {
        messageID: string; // assistant message that triggered the tool
        callID: string;    // matches the SSE part's callID ("toolu_...")
    };
};

// Body for POST /question/{id}/reply
type QuestionReply = {
    answers: string[][]; // one string[] per question; each = selected option labels
};
```

`answers` is a **2D array**: one entry per question, each entry is an array of selected option labels. For a single-select question answered with "Blue": `{ answers: [["Blue"]] }`.

## Linking SSE callID to QuestionRequest ID

The SSE part only carries `callID` ("toolu_..."), not the `que_...` ID needed for the reply endpoint. The mapping is:

```
SSE part.callID  →  GET /question  →  find entry where tool.callID matches  →  use entry.id
```

## Completed State

After a successful reply, SSE emits another `message.part.updated` with `status:"completed"`:

```json
{
  "state": {
    "status": "completed",
    "output": "User has answered your questions: \"What is your favorite color?\"=\"Blue\". ...",
    "metadata": { "answers": [["Blue"]], "truncated": false },
    "time": { "start": 1771421943734, "end": 1771422043803 }
  }
}
```

## Rejection Behavior

If the user rejects a question (`POST /question/{id}/reject`), the session stops entirely — no further LLM generation for that session.

## Implementation in lively-opencode

The interactive question UI is implemented in the existing tool renderer pipeline, requiring **no changes** to `lively-opencode.js` or `lively-chat-message.js`.

### Files changed

| File | Change |
| ---- | ------ |
| `src/ai-workspace/components/tool-renderers/opencode-question-tool.js` | Override `renderToolStreaming` to detect `status:"running"` and render interactive UI |
| `src/ai-workspace/components/lively-chat-message.html` | CSS for `.question-tool-interactive` and related classes |

### Flow in lively-opencode

```
SSE message.part.updated
  { type:"tool", tool:"question", state.status:"running", state.input.questions:[...] }
  ↓
lively-opencode.js: updateOpenCodePart()
  → updates part in message store
  → calls updateOpenCodeMessage(messageId, msg)
  ↓
lively-chat-message.js: setOpenCodeMessage() → renderOpenCodeParts()
  → for each part with type:"tool":
      dispatchToolRender(part, "renderToolStreaming")
  ↓
OpenCodeQuestionTool.renderToolStreaming(part, component)
  if status === "running" && questions.length > 0:
    → renderInteractiveQuestion(part, questions)
    → returns <div class="question-tool-interactive"> with:
        • question header + text
        • option buttons (single/multi-select)
        • optional free-text input (custom: true by default)
        • Submit + Dismiss buttons
  if status === "completed":
    → render(part, null, showDebug, true) — shows answered summary
  else (pending / empty):
    → returns null — nothing shown
  ↓
On Submit click:
  GET /question → find entry where tool.callID === part.callID → get que_id
  POST /question/{que_id}/reply { answers: string[][] }
  → container replaced with "Answer submitted, waiting for agent..."
  ↓
SSE message.part.updated arrives with status:"completed"
  → message re-renders → interactive UI replaced by compact answered summary
```

### Key source files

| File | Purpose |
| ---- | ------- |
| `src/ai-workspace/components/tool-renderers/opencode-question-tool.js` | Renderer: interactive UI + reply/reject logic |
| `src/ai-workspace/components/lively-chat-message.html` | CSS for question UI |
| `src/ai-workspace/components/lively-chat-message.js` | `dispatchToolRender` → `renderToolStreaming` call site |
| `src/ai-workspace/components/tool-renderers/opencode-base-tool.js` | Base class — `renderToolStreaming` default (completed-only) |
