# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## AI Collaboration Experiment

A significant part of this AI collaboration is an **experiment to teach Claude Code how to develop in Lively4**. By working together on real development tasks, we are:

- Teaching Claude the patterns, conventions, and workflows of the Lively4 system
- Documenting these learnings for both AI and human developers
- Creating examples and best practices through hands-on exploration
- Building up Claude's understanding of the self-supporting development environment

This documentation serves dual purposes: guiding AI development work and creating human-readable documentation of Lively4's development practices. The `demos/claude/` directory contains examples and experiments from this collaborative learning process.

## Essential Commands

**Testing:**
- `npm test` - Run all tests with Karma (single run)
- `npm run test-single <test-file>` - Run single test file with custom test runner (fast, ~8-13s)
- `npm run test-list` - List all available test files
- `npm run test-debug <test-file>` - Run tests with debugging (headless=false, devtools enabled)

**Example:**
```bash
npm run test-single test/client/strings-test.js
# ✅ 6 tests passed, 0 failed in 0.01s
```

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
- `templates/` - Reusable component templates  
- `src/client/` - Core runtime and utilities (lively.js, boot.js, etc.)
- `src/external/` - Third-party libraries
- `test/` - Test files (Karma + Mocha)
- `doc/` - Documentation and project notes

**Component Development Pattern:**
1. Create paired files: `templates/my-component.html` + `templates/my-component.js`
2. Components extend `Morph` and follow this structure:

```javascript
export default class MyComponent extends Morph {
  async initialize() {
    this.windowTitle = "Component Title";
    this.registerButtons(); // auto-registers onButtonName handlers
    lively.html.registerKeys(this); // auto-registers onKeyDown handlers
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

- Always check component template paths and ensure proper .js/.html file pairing
- Use `lively.components.searchTemplateFilename()` to locate templates programmatically
- Components auto-run dependent tests when saving modules
- Use `livelyExample()` method to provide example content for components
- Follow existing patterns in neighboring components for consistency
- Create scratch/test files in `demos/claude/` directory to avoid cluttering main demos

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

## Special Notes

- This is a **self-supporting environment** - the system can modify and extend itself
- Live programming with immediate feedback and runtime modification capabilities
- Real-time collaboration through GitHub integration
- All development happens in-browser with client-side transpilation