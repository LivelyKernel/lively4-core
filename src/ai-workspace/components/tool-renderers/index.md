# Tool Renderers — Architecture Overview

Each renderer is a plain ES6 class (no web component). Instances are created once and stored
in a registry; the host component iterates the registry calling `matches()` to dispatch.

---

## Class Hierarchy

```
OpenCodeBaseTool                          base-tool.js
  ├─ OpenCodeSearchTool                   search-tool.js  (intermediate base)
  │    ├─ OpenCodeGrepTool                opencode-grep-tool.js
  │    ├─ OpenCodeGlobTool                opencode-glob-tool.js
  │    ├─ OpenCodeBashTool                opencode-bash-tool.js
  │    └─ OpenCodeLsTool                  opencode-ls-tool.js
  ├─ OpenCodeReadTool                     opencode-read-tool.js
  ├─ OpenCodeWriteTool                    opencode-write-tool.js
  ├─ OpenCodeEditTool                     opencode-edit-tool.js
  ├─ OpenCodeMultiEditTool                opencode-multiedit-tool.js
  ├─ OpenCodeApplyPatchTool               opencode-apply-patch-tool.js
  ├─ OpenCodeTaskTool                     opencode-task-tool.js
  ├─ OpenCodeTodoWriteTool                opencode-todowrite-tool.js
  ├─ OpenCodeTodoReadTool                 opencode-todoread-tool.js
  ├─ OpenCodeEvaluateCodeTool             opencode-evaluate-code-tool.js
  ├─ OpenCodeRunTestsTool                 opencode-run-tests-tool.js
  ├─ OpenCodeInspectTestsTool             opencode-inspect-tests-tool.js
  ├─ OpenCodeWebFetchTool                 opencode-webfetch-tool.js
  ├─ OpenCodeWebSearchTool                opencode-websearch-tool.js
  ├─ OpenCodeLspTool                      opencode-lsp-tool.js
  ├─ OpenCodeBatchTool                    opencode-batch-tool.js
  ├─ OpenCodeCodeSearchTool               opencode-codesearch-tool.js
  ├─ OpenCodePlanTool                     opencode-plan-tool.js
  ├─ OpenCodeSkillTool                    opencode-skill-tool.js
  ├─ OpenCodeQuestionTool                 opencode-question-tool.js
  ├─ OpenCodeInvalidTool                  opencode-invalid-tool.js
  └─ OpenCodeGenericTool                  opencode-generic-tool.js  (always matches, register last)
```

---

## Public Protocol — `OpenCodeBaseTool`

Called by the host component renderer. Override only for exceptional cases (see `GenericTool`).

| Method | Signature | Default behaviour |
|--------|-----------|-------------------|
| `matches` | `(part) → boolean` | `false` |
| `renderToolUse` | `(part, component) → Promise<HTMLElement\|null>` | delegates to `renderCompact(part, result, showDebug)` |
| `renderToolResult` | `(part, component) → null` | always `null` — result already folded into `renderToolUse` |
| `renderToolStreaming` | `(part, component) → Promise<HTMLElement\|null>` | delegates to `renderCompactStreaming` when `state.status === 'completed'`; else `null` |

`component` exposes: `component.toolResultById` (map), `component.showDebug` (boolean).

---

## Protected Template API — subclasses implement

Implemented by every concrete tool (except `GenericTool` which overrides the public protocol directly).

| Method | Signature | Notes |
|--------|-----------|-------|
| `renderCompact` | `(part, result, showDebug) → Promise<HTMLElement\|null>` | `result` is the raw `tool_result` part |
| `renderCompactStreaming` | `(part, showDebug) → Promise<HTMLElement\|null>` | `part.state` holds `{input, output, status}` |

---

## SearchTool Template Layer — `OpenCodeSearchTool`

Adds a third, narrower contract for tools that render as a single `<details>` block.
`renderCompact` and `renderCompactStreaming` are both implemented here via the shared
private dispatcher `_renderCompactDetails`.

Subclasses implement:

| Method | Signature | Notes |
|--------|-----------|-------|
| `getIcon` | `() → string` | emoji prefix; default `'🔍'` |
| `getSummary` | `(input, output) → string` | text for `<summary>` line |
| `renderBody` | `(input, output, showDebug) → Promise<HTMLElement[]>` | elements appended inside `<details>` |

Private:

| Method | Notes |
|--------|-------|
| `_renderCompactDetails(part, result, showDebug, isStreaming)` | unified path for both `renderCompact` and `renderCompactStreaming`; not meant to be overridden |

---

## Shared Helpers — `OpenCodeBaseTool`

Available to all subclasses via inheritance.

| Method | Signature | Notes |
|--------|-----------|-------|
| `createMarkdownEl` | `(markdownText) → Promise<lively-markdown>` | async; uses `lively.create` |
| `makeCodeBlock` | `(text) → HTMLElement` | returns `<pre><code>` with `textContent` (safe from HTML injection); preferred over fenced code in markdown |
| `buildDetails` | `(toolId, summaryText, input, showDebug, debugLabel?) → Promise<HTMLElement>` | builds `<details class="compact-tool-call" data-tool-id="…">` with optional raw-JSON debug block |

---

## Concrete Tools — Tool Name Aliases & Notes

| Class | File | Tool aliases (`part.name\|part.tool`) | Base | Notes |
|-------|----------|---------------------------------------|------|-------|
| `OpenCodeGrepTool` | opencode-grep-tool.js | `mcp_grep`, `grep` | SearchTool | private: `parseGrepOutput(raw) → {summary, matches[]}` |
| `OpenCodeGlobTool` | opencode-glob-tool.js | `mcp_glob`, `glob` | SearchTool | — |
| `OpenCodeBashTool` | opencode-bash-tool.js | `mcp_bash`, `bash` | SearchTool | summary from `input.description` or `input.command` |
| `OpenCodeLsTool` | opencode-ls-tool.js | `list`, `ls` | SearchTool | parses indented directory tree output |
| `OpenCodeReadTool` | opencode-read-tool.js | `mcp_read`, `read_file`, `read` | BaseTool | uses `ToolHelpers.parseReadToolContent`, `detectLanguage`, `generateRangeInfo` |
| `OpenCodeWriteTool` | opencode-write-tool.js | `mcp_write`, `write_file`, `write` | BaseTool | shows content preview with syntax highlight |
| `OpenCodeEditTool` | opencode-edit-tool.js | `mcp_edit`, `edit_file`, `edit` | BaseTool | imports `diff-match-patch`; renders diff view |
| `OpenCodeMultiEditTool` | opencode-multiedit-tool.js | `multiedit` | BaseTool | imports `diff-match-patch`; multiple edits per call |
| `OpenCodeApplyPatchTool` | opencode-apply-patch-tool.js | `apply_patch` | BaseTool | parses structured patch format; per-file summaries |
| `OpenCodeTaskTool` | opencode-task-tool.js | `mcp_task`, `task` | BaseTool | shows status, input description, output |
| `OpenCodeTodoWriteTool` | opencode-todowrite-tool.js | `mcp_todowrite`, `todowrite` | BaseTool | renders todo list with status icons + priority badges |
| `OpenCodeTodoReadTool` | opencode-todoread-tool.js | `todoread` | BaseTool | read-only todo view; no input shown |
| `OpenCodeEvaluateCodeTool` | opencode-evaluate-code-tool.js | `mcp_lively4_evaluate-code`, `lively4_evaluate-code`, `lively4_evaluate_code` | BaseTool | uses `ToolHelpers.parseLively4EvaluateOutput` |
| `OpenCodeRunTestsTool` | opencode-run-tests-tool.js | `mcp_lively4_run-tests`, `lively4_run-tests` | BaseTool | pass/fail status display |
| `OpenCodeInspectTestsTool` | opencode-inspect-tests-tool.js | `mcp_lively4_inspect-test-results`, `lively4_inspect-test-results` | BaseTool | hierarchical test results |
| `OpenCodeWebFetchTool` | opencode-webfetch-tool.js | `webfetch` | BaseTool | URL + content preview |
| `OpenCodeWebSearchTool` | opencode-websearch-tool.js | `websearch` | BaseTool | plain-text results (titles, URLs, snippets) |
| `OpenCodeLspTool` | opencode-lsp-tool.js | `lsp` | BaseTool | ops: goToDefinition, findReferences, hover, documentSymbol; experimental flag required |
| `OpenCodeBatchTool` | opencode-batch-tool.js | `batch` | BaseTool | up to 25 concurrent tool calls; experimental |
| `OpenCodeCodeSearchTool` | opencode-codesearch-tool.js | `codesearch` | BaseTool | Exa Code API; code examples + docs snippets |
| `OpenCodePlanTool` | opencode-plan-tool.js | `plan_enter`, `plan_exit` | BaseTool | mode-switch prompts; yes/no question to user |
| `OpenCodeSkillTool` | opencode-skill-tool.js | `skill` | BaseTool | shows skill name + preview of injected skill content |
| `OpenCodeQuestionTool` | opencode-question-tool.js | `question`, `mcp_question` | BaseTool | overrides `renderToolUse` directly (renders before result arrives); hardcoded `SERVER_URL = 'http://localhost:9100'` |
| `OpenCodeInvalidTool` | opencode-invalid-tool.js | `invalid` | BaseTool | shown when AI sends malformed JSON arguments |
| `OpenCodeGenericTool` | opencode-generic-tool.js | *(always true)* | BaseTool | overrides full public protocol (`renderToolUse`, `renderToolResult`, `renderToolStreaming`) — not the template pattern; register last |

---

## External Imports

| Import | Used by |
|--------|---------|
| `../chat-tool-helpers.js` (`* as ToolHelpers`) | all tools |
| `src/external/diff-match-patch.js` | `EditTool`, `MultiEditTool` |

Key helpers from `chat-tool-helpers.js` used across tools:
`getFileName`, `generateRangeInfo`, `detectLanguage`, `extractResultContent`,
`parseReadToolContent`, `parseLively4EvaluateOutput`.

---

## Refactoring Notes

- `ReadTool` and `WriteTool` bypass `SearchTool` and duplicate `renderCompact`/`renderCompactStreaming` structure — candidate for a `FileTool` intermediate base.
- `EditTool` and `MultiEditTool` both import `diff-match-patch` and likely share diff-rendering logic — candidate for extraction into `ToolHelpers` or a shared mixin.
- `QuestionTool` has a hardcoded `SERVER_URL` — should come from config or the component context.
- `GenericTool` entirely opts out of the template pattern — intentional fallback, but its `lively4_evaluate_code` special-case duplicates logic already in `EvaluateCodeTool`.
- `part.name` (finished messages) vs `part.tool` (streaming) inconsistency handled per-tool in `matches()` — could be normalised in base.
