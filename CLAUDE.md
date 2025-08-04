# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

**Testing:**
- `npm test` - Run all tests with Karma (single run)
- `npm run test-single` - Run single test file with custom test runner
- `npm run test-list` - List all available test files
- `npm run test-debug` - Run tests with debugging (headless=false, devtools enabled)

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

## Special Notes

- This is a **self-supporting environment** - the system can modify and extend itself
- Live programming with immediate feedback and runtime modification capabilities
- Real-time collaboration through GitHub integration
- All development happens in-browser with client-side transpilation