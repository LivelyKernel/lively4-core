# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## IMPORTANT: Object-Oriented Architecture

**This is NOT a typical functional JavaScript project!**

Lively4 follows **object-oriented principles** with class hierarchies and inheritance:

- **Use inheritance properly**: If functionality needs to be shared, put it in the base class
- **Single source of truth**: Don't duplicate methods across subclasses - use the parent class
- **Polymorphism**: Subclasses inherit and can override parent methods when needed
- **Class hierarchy matters**: `LivelyChat` → `OpenaiRealtimeChat`, `LivelyOpencode`, `LivelyAiWorkspace`

**Example: Database Write Guards**
- ❌ WRONG: Add `canWriteToDatabase()` to each component separately
- ✅ RIGHT: Add `canWriteToDatabase()` to `LivelyChat` base class, all subclasses inherit it

**Example: Composition Pattern - Propagating State**

When a parent component contains child components, state changes must be explicitly propagated:

```javascript
// ❌ WRONG: Only set state on parent
enableReplay() {
  this._replayMode = true;  // Only affects parent, children still write to DB!
}

// ✅ RIGHT: Propagate state to composed children
enableReplay() {
  this._replayMode = true;

  // CRITICAL: Propagate to child components
  this.realtimeComponent._replayMode = true;
  this.opencodeComponent._replayMode = true;
}

disableReplay() {
  this._replayMode = false;

  // CRITICAL: Clear from child components
  if (this.realtimeComponent) this.realtimeComponent._replayMode = false;
  if (this.opencodeComponent) this.opencodeComponent._replayMode = false;
}
```

**Key principle**: Child components don't automatically inherit instance variables from their container. State must be explicitly synchronized in composition relationships.

When you find yourself duplicating code across components that share a base class, **STOP** and move it to the parent class instead.

## AI Collaboration Experiment

A significant part of this AI collaboration is an **experiment to teach Claude Code how to develop in Lively4**. By working together on real development tasks, we are:

- Teaching Claude the patterns, conventions, and workflows of the Lively4 system
- Documenting these learnings for both AI and human developers
- Creating examples and best practices through hands-on exploration
- Building up Claude's understanding of the self-supporting development environment

This documentation serves dual purposes: guiding AI development work and creating human-readable documentation of Lively4's development practices. The `demos/claude/` directory contains examples and experiments from this collaborative learning process.

## CRITICAL: Git Safety Guidelines

**How to safely work with git and preserve all user work!**

**Guiding Principles:**
- ✅ **ALWAYS** wait for explicit user request before running any git commands
- ✅ **ALWAYS** check `git status` and `git diff` first to see the current state
- ✅ **ALWAYS** ask user for confirmation before making destructive changes
- ✅ **ALWAYS** verify what other uncommitted work exists before any operation

**Example of WRONG approach:**
```javascript
// User: "Let's scrap this feature"
// ❌ WRONG - immediately destroying work:
bash("git checkout -- src/file.js")

// What if user had OTHER uncommitted changes?
// What if the file had important work-in-progress?
// DISASTER!
```

**Example of CORRECT approach:**
```javascript
// User: "Let's scrap this feature"

// Step 1: Check current state
bash("git status")
// Shows: "modified: src/file.js, modified: src/other-important-file.js"

// Step 2: Check what will be lost
bash("git diff src/file.js")
// Shows the actual changes

// Step 3: Ask user for confirmation
"I see you have changes in src/file.js. You also have uncommitted changes in 
src/other-important-file.js. Should I discard the changes in src/file.js, 
or do you want to keep working on it?"

// Step 4: Only proceed if user explicitly confirms
// Then run the git command they requested
```

**Why this approach is safe:**
- Users may have hours of uncommitted work
- Git operations can permanently destroy uncommitted changes
- User gets to review what will be lost before deciding
- Verifies no other important work will be affected

## Essential Commands

**Testing:**

Use the MCP testing tools for in-browser test execution with minimal token usage:

**Phase 1: Run Tests**
```javascript
// Run a single test file
mcp__lively4__run-tests(testPath: "test/client/strings-test.js")

// Run ALL tests (minimal output)
mcp__lively4__run-tests(runAll: true)
// Returns: "✅ All green! 456 tests passed across 77 files"
// or: "❌ 18 tests failed (438 passed) across 5 files: ..."

// Filter tests with grep pattern
mcp__lively4__run-tests(testPath: "test/client/strings-test.js", grep: "toUpperCaseFirst")

// Errors-only mode for single files
mcp__lively4__run-tests(testPath: "test/client/strings-test.js", errorsOnly: true)
```

**Phase 2: Inspect Results (Hierarchical Navigation)**

Supports 3 levels of detail - navigate like a directory tree:

```javascript
// Level 1: Summary view (like `ls`) - shows file-level counts only
mcp__lively4__inspect-test-results()
// → "77 files, 456 passed, 18 failed"
// → Lists files with pass/fail counts

// Level 2: Suite view (like `cd` then `ls`) - shows suite hierarchy in a file
mcp__lively4__inspect-test-results(file: "test/client/claude-sessions-test.js")
// → "Suites:"
// → "  ✅ Claude Sessions Message Classes (38 tests)"
// → "    ✅ ClaudeMessage (12 tests)"
// → "    ❌ ClaudeAgentMessage (18 tests, 3 failed)"

// Level 3: Detail view (like `ls -R`) - shows individual tests in a suite
mcp__lively4__inspect-test-results(
  file: "test/client/claude-sessions-test.js",
  suite: "ClaudeAgentMessage"
)
// → Shows individual test names with error details

// Add includeStacks for full error traces (only in Level 3)
mcp__lively4__inspect-test-results(
  file: "test/client/claude-sessions-test.js",
  suite: "ClaudeAgentMessage",
  includeStacks: true
)
```

**Two-Phase Workflow:**
1. **Run all tests** with `runAll: true` → minimal summary (~50 tokens)
2. **Navigate failures hierarchically** → drill down only where needed
3. This saves ~15,000 tokens compared to dumping all test details at once

**Features:**
- ✅ Auto-selects available browser session (no sessionId needed)
- ✅ Fast execution in live environment (~100ms per file)
- ✅ Persistent result storage for inspection
- ✅ Grep filtering across all tests
- ✅ Minimal output mode to save tokens
- ✅ Distinguishes between test failures and hook failures (beforeEach/afterEach timeouts)

**Hook Failure Handling:**
When `beforeEach` or `afterEach` hooks fail (e.g., timeout, async errors), they prevent tests from running. The MCP test runner clearly reports:
- Hook failures separately from test failures
- Which tests ran before the hook failed
- Guidance to fix hook failures to run all tests
- Example: `⚠️ 1 hook failure prevented tests from running` instead of incorrectly showing `0 passed, 1 failed`

**Prerequisites:**
- `lively-mcp` component must be running in browser
- Open via: `lively.openComponentInWindow('lively-mcp')` or Right-click → Tools → MCP
- See MCP Integration section below for details

**IMPORTANT - Testing Best Practices:**
- **ALWAYS export functions that need testing** - Never re-implement functions in test files
- If a function needs to be tested, add `export` to it in the source file and import it in tests
- This ensures tests validate the actual implementation, not a copy that may diverge

**Debugging SystemJS-Level Code:**
When fixing bugs in core system code (like `lively.js`, `bound-eval.js`, or SystemJS integration), use `npm test` with `describe.only` for rapid iteration. The MCP test tools run in a live browser session where SystemJS behavior may differ from Karma's test environment. Some bugs (like module re-execution during unload) only manifest in the Karma test runner with workspace modules. Add `describe.only("TestSuiteName", ...)` to your test file to run just that suite, then `npm test` to execute in the full test environment. Remove `describe.only` when done.

**Test-Driven Development (TDD) - Red-Green Workflow:**
Before claiming a fix works, ALWAYS verify the test fails WITHOUT your fix and passes WITH it. Steps: (1) Write test for the bug, (2) Run test - confirm it FAILS (red), (3) Implement fix, (4) Run test - confirm it PASSES (green). Never trust a test that you haven't seen fail first - it might be testing the wrong thing or not actually exercising your code path. This is especially critical for subtle bugs where tests may pass due to caching or environment differences.

**Development:**
- `npm run explore-lively4` - Explore the Lively4 codebase programmatically
- `npm run explore-lively4:debug` - Same as above with debug output enabled

**In-Browser Development:**
- F7 - Switch between component's .js and .html files
- Ctrl+Click - Open halo (object inspector/editor)
- Ctrl+Drag - Navigate the lively world
- Ctrl+Shift+H - Open devdocs
- Save triggers auto-reload if live evaluation is enabled

## Core Architecture

**Lively4 System:** Self-supporting browser-based development environment using:
- Custom web components extending `Morph` (from `src/components/widgets/lively-morph.js`)
- SystemJS with Babel7 runtime transpilation via `src/plugin-babel.js`
- Shadow DOM and live module reloading capabilities
- Component lifecycle: `initialize()`, `connectedCallback()`, `livelyExample()`, `livelyMigrate()`

**Module System:**
- Configuration in `src/systemjs-config.js` defines transpilation rules per file pattern
- Different babel levels: `liveES7`, `moduleOptionsNon`, `aexprViaDirective`, `workspace`
- Hot reloading: `lively.reloadModule(path)` updates JS and templates at runtime
- Component discovery via `src/client/morphic/component-loader.js`

**Central API (`src/client/lively.js`):**
- `lively.create(tagName)` - creates web components
- `lively.openComponentInWindow(name)` - opens components in windows
- `lively.components.loadByName(name)` - loads component definitions
- `lively.files.loadFile()`, `lively.files.saveFile()` - file operations through lively4-server

**Special URL Schemes (via fetch() with eval):**
- `fetch("open://component-name")` - opens component in window
- `fetch("edit://path/to/file")` - opens file in editor
- `fetch("browse://path/to/file")` - opens file in browser/container
- Get object reference: `.then(r => r.object())` - returns the actual component/container object
- These work through Lively4's custom protocol handlers in the browser environment

**Server Integration:**
- Lively4-server located in `../lively4-server` (parallel directory)
- Provides MCP (Model Context Protocol) integration for Claude Code
- WebSocket endpoints for live browser-server communication

## File Organization & Patterns

**Directory Structure:**
- `src/components/` - Web components (tools/, widgets/, demo/, halo/)
  - Modern components are created in `src/components/tools/` with both `.html` and `.js` files
- `src/ai-workspace/` - AI coding assistance subproject (see [AI Workspace docs](browse://src/ai-workspace/))
- `src/architecture-view/` - Software architecture visualization subproject
  - `components/` - Viewer and diagram components
  - `components/renderers/` - Strategy-based rendering implementations
  - See [Architecture View docs](browse://src/architecture-view/)
- `templates/` - **DEPRECATED** - Old component templates (do not create new components here)
- `src/client/` - Core runtime and utilities (lively.js, boot.js, etc.)
- `src/external/` - Third-party libraries
- `test/` - Test files (Karma + Mocha)
- `doc/` - Documentation and project notes

**Component Development Pattern:**
1. Create paired files in `src/components/tools/`: `my-component.html` + `my-component.js`
2. Components extend `Morph` and follow this structure:

```javascript
export default class MyComponent extends Morph {
  async initialize() {
    this.windowTitle = "Component Title";
    this.registerButtons(); // auto-registers onButtonName handlers
    lively.html.registerKeys(this); // auto-registers onKeyDown handlers
    
    // IMPORTANT: Preserve existing state during live updates
    // Use || operator to keep existing data during livelyMigrate
    this._cachedData = this._cachedData || [];
    this._processedResults = this._processedResults || new Map();
    // Always reset volatile state:
    this._currentOperation = null;
    
    // IMPORTANT: Don't block in initialize() with async operations
    // Use non-blocking calls for data loading:
    this.loadData(); // NOT: await this.loadData()
  }
  
  async loadData() {
    // Heavy async operations should be separate from initialize()
    // This allows the component to render immediately
  }
  
  livelyExample() {
    // Customize instance with example content
  }
  
  livelyMigrate(other) {
    // Handle live updates during development
    this.someProperty = other.someProperty;
  }
}
```

**Template Pattern (HTML):**
```html
<template id="my-component">
  <style data-src="/templates/livelystyle.css"></style>
  <style>/* component-specific styles */</style>
  <div id="content">
    <button id="myButton">Click Me</button>
  </div>
</template>
```

## Key Integration Points

**Container System:** `lively-container` (`src/components/tools/lively-container.js`)
- Main file browser/editor handling file editing, module loading, template updates
- Edit/view modes, navigation history, content rendering

**Event System:** Use `lively.addEventListener()` for proper cleanup:
```javascript
lively.addEventListener("myId", this, "click", evt => this.onClick(evt))
// Automatically cleaned up with lively.removeEventListener("myId", this)
```

**Component Access:**
```javascript
this.get("#selector") // querySelector in component and shadowRoot
await lively.openComponentInWindow("component-name")
```

## Development Guidelines

**Avoid Needless Documentation:**
- Don't document what can be queried from the live system (search event names, grep patterns, runtime inspection)
- Let method names and parameters speak for themselves - think Smalltalk, not JavaDoc. No verbose JSDoc.

**Module Reloading:**
- **Automatic Reloading**: When `lively-change-watcher` is active, modules are automatically reloaded on file changes
  - **DO NOT** manually call `lively.reloadModule()` when the change watcher is running
  - The watcher detects file modifications and triggers reloads automatically
  - Just edit files and let the system handle the reload
- `lively.reloadModule(path)` works for updating existing methods and properties in the module itself (manual use only when watcher is not active)
- **CRITICAL**: Modifying dependencies requires a **full page reload** (F5/Ctrl+R)
  - Example: Editing `lively-chat-message.js` and observing changes in `openai-realtime-chat` 
  - The dependent component has already created instances with the old code
  - Reloading just the dependency isn't enough - need full reload to get fresh instances
- **DON'T** repeatedly try `lively.reloadModule()` when changes don't appear - **ASK THE USER** to do a full reload
- After full reload, all components will use the updated code

**Verifying Live Updates:**

Use `lively.changes.verifyFileUpdate(pathFragment, sinceMs=60000, waitMs=1000)` to confirm edits were detected:

```javascript
// Waits 1 second, checks last minute of changes
await lively.changes.verifyFileUpdate('my-component.js');
// Output: ✓ my-component.js reloaded in 45ms (module reload)
// Output: ✓ my-component.js updated in container (1 container) (container update)
// Output: ⚠ No changes detected (not found)

// Check what was detected
let recent = await lively.changes.since(60000);
console.log(recent.map(c => c.relativePath));
```

Changes are tracked with `containerUpdated` (file updated in open editor) or `reloadDuration` (module reloaded). If verification fails, check if lively-change-watcher is running or if a full page reload is needed.

**Development Best Practices:**
- Always check component template paths and ensure proper .js/.html file pairing
- Use `lively.components.searchTemplateFilename()` to locate templates programmatically
- Components auto-run dependent tests when saving modules
- Use `livelyExample()` method to provide example content for components
- Follow existing patterns in neighboring components for consistency
- Create scratch/test files in `demos/claude/` directory to avoid cluttering main demos

**Naming Conventions:**
- **Button handlers**: Always use `onButtonName()` (e.g., `onRefreshButton()`, `onSaveButton()`)
  - Required for `this.registerButtons()` auto-registration
  - NEVER use `Btn` suffix - always full `Button`
- **Event parameters**: Always use `evt` as parameter name (e.g., `onClick(evt)`, `onKeyDown(evt)`)
- **Element IDs**: Use camelCase matching method names (e.g., `id="refreshButton"` → `onRefreshButton()`)
- **CSS classes**: Use kebab-case (e.g., `class="refresh-button"`)

**Event Handler Registration:**
```javascript
// Automatic button registration
this.registerButtons(); // Finds buttons by ID and registers on[ButtonName] handlers

// Manual event registration with cleanup
lively.addEventListener("myId", this, "click", evt => this.onClick(evt))
```

## Interactive Markdown Development

**Script Integration in Markdown Files:**
- See [demos/claude/lively4-script-examples.md](demos/claude/lively4-script-examples.md) for comprehensive examples
- Scripts can use ES6 imports: `import lib from 'https://cdn.example.com/lib.js'`
- Access markdown component: `lively.query(this, "lively-markdown")`
- Shadow DOM access: `markdownComponent.shadowRoot` for proper DOM scoping
- Example integrations: Mermaid diagrams, interactive widgets, dynamic content processing

## Development Journal

- Daily development entries are in `doc/journal/` as directories named `YYYY-MM-DD.md/` containing `index.md`
- Contains project progress, decisions, and technical notes
- Check latest entries to understand recent development context and active work
- Use `- [ ]` and `- [x]` for task lists (renders as checkboxes)
- Link files with `[filename](edit://path/to/file)` syntax for direct editing (not in code blocks)
- **Use journal entries to persist drafts, todos, and work-in-progress notes** - they serve as a persistent workspace
- **IMPORTANT**: Use `bash date +"%Y-%m-%d"` to get correct dates, not environment context
- **AVOID**: Colorful emoji icons in journal entries - use plain text for better readability and compatibility
- **DON'T**: Write about updating the journal itself in journal entries - keep entries focused on technical work
- **ALWAYS**: Read CLAUDE.md journal format section before writing journal entries to follow established guidelines

**Journal Entry Format:**
```markdown
## YYYY-MM-DD General Day Title #hashtags #topics #keywords
*Author: @JensLincke [with @BlindGoldie]*

Brief technical description of what was implemented/changed.

- **Added**: [file.js](edit://path/to/file.js), [file.html](edit://path/to/file.html)
- **Modified**: [existing-file.js](edit://path/to/file.js) - description of changes
- **Feature**: Technical details with method names and implementation specifics
- **UI**: Interface changes and user-facing features

**Technical details:**
- Specific implementation notes
- Method signatures or key code patterns
- Integration points

**TODO**: 
- [ ] #TODO Future improvements needed
```

## MCP Integration

**Model Context Protocol (MCP)** enables Claude Code to interact directly with live Lively4 environments:

**Architecture:**
- Browser component: `lively-mcp` establishes WebSocket connection to server
- Server integration: `../lively4-server/src/services/mcp-server.js` implements MCP protocol
- Tool configuration: `../lively4-server/tools.json` defines available MCP tools

**Available Tools:**
- `evaluate_code` - Execute JavaScript in live browser sessions
- `list_sessions` - List active browser sessions  
- `ping_sessions` - Check session connectivity

**Adding New Tools:**
1. Define tool in `../lively4-server/tools.json` with description, inputSchema, and endpoint
2. Implement handler method in `mcp-server.js` following existing patterns
3. Tools automatically registered on server startup

**Usage:**
```javascript
// Open MCP component in browser
lively.openComponentInWindow('lively-mcp')

// Claude Code can then execute code in the live environment
```

**TODO:**
- [ ] #TODO Add MCP tools for special URL schemes (`open://`, `edit://`, `browse://`) to support direct file/component operations without eval

## AI Workspace Integration

**AI Workspace** provides integrated AI coding assistance through multiple agents:
- `lively-ai-workspace` - Coordinator component that orchestrates multiple AI agents
- `lively-opencode` - OpenCode terminal-based AI coding agent (server on `http://localhost:9100`)
- `openai-realtime-chat` - OpenAI Realtime API voice/text agent
- All components located in `src/ai-workspace/components/`
- Source code in `../opencode/` directory (for documentation/reference only - NOT lively4-server)
- See [AI Workspace docs](browse://src/ai-workspace/doc/) for full architecture and current status

## Special Notes

- This is a **self-supporting environment** - the system can modify and extend itself
- Live programming with immediate feedback and runtime modification capabilities
- Real-time collaboration through GitHub integration
- All development happens in-browser with client-side transpilation