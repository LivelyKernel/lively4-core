# Lively4 Coding Agent Instructions

Lively4 is a self-supporting, browser-based development environment that uses web technologies to create a live programming experience. This guide helps AI agents understand the essential patterns and architecture.

> **For general project overview and documentation index, see [llms.txt](../llms.txt)**

## Core Architecture

**Component System**: Lively4 uses custom web components with a specific pattern:
- All components extend `Morph` (from `src/components/widgets/lively-morph.js`)
- Components have paired `.html` (template) and `.js` (logic) files
- Components use Shadow DOM and follow the pattern: `export default class ComponentName extends Morph`
- Key lifecycle methods: `initialize()`, `connectedCallback()`, `livelyExample()`, `livelyMigrate()`

**Module Loading & Transpilation**:
- Uses SystemJS with Babel7 for runtime transpilation via `src/plugin-babel.js`
- Different babel transformation levels: `liveES7`, `moduleOptionsNon`, `aexprViaDirective`, `workspace`
- Configuration in `src/systemjs-config.js` defines transpilation rules per file pattern
- Hot module reloading: `lively.reloadModule(path)` updates both JS and templates at runtime

**The Lively Object**: Central API in `src/client/lively.js` - kitchen sink module with utilities:
- `lively.create(tagName)` - creates web components
- `lively.openComponentInWindow(name)` - opens components in windows
- `lively.components.loadByName(name)` - loads component definitions
- File operations: `lively.files.loadFile()`, `lively.files.saveFile()`

## Development Workflows

**Component Development**:
1. Create paired files: `templates/my-component.html` + `templates/my-component.js`
2. Use `F7` to switch between `.js` and `.html` files of a web component
3. Save triggers auto-reload if live evaluation is enabled
4. Use `livelyExample()` method to provide example content

**Testing**: 
- Run: `npm test` (Karma + Mocha)
- Test files in `test/` directory
- Container auto-runs dependent tests when saving modules

**Key Shortcuts**:
- `Ctrl+Click`: Open halo (object inspector/editor)
- `Ctrl+Drag`: Navigate the lively world
- `Ctrl+Shift+H`: Open devdocs
- `F7`: Switch between component's JS/HTML files

## Essential Patterns

**Component Structure**:
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

**Template Pattern** (HTML file):
```html
<template id="my-component">
  <style data-src="/templates/livelystyle.css"></style>
  <style>/* component-specific styles */</style>
  <div id="content">
    <button id="myButton">Click Me</button>
  </div>
</template>
```

**File Operations**:
```javascript
// Load/save files through lively4-server
await lively.files.loadFile(url)
await lively.files.saveFile(url, content)
await lively.files.statFile(url) // directory listing
```

**Component Access Patterns**:
```javascript
this.get("#selector") // querySelector in component and shadowRoot
this.getSubmorph("#id") // deprecated, use get()
await lively.openComponentInWindow("component-name")
```

## Key Integration Points

**Container System**: `lively-container` is the main file browser/editor
- Handles file editing, module loading, template updates
- Edit/view modes, navigation history, content rendering
- Lives at `src/components/tools/lively-container.js`

**Component Loader**: `src/client/morphic/component-loader.js`
- Discovers and loads unresolved custom elements
- Handles template application and registration
- Template search paths defined in `getTemplatePaths()`

**Event System**: Use `lively.addEventListener()` for proper cleanup:
```javascript
lively.addEventListener("myId", this, "click", evt => this.onClick(evt))
// Automatically cleaned up with lively.removeEventListener("myId", this)
```

## File Organization

- `src/components/`: Web components (tools/, widgets/, demo/, halo/)
- `templates/`: Reusable component templates
- `src/client/`: Core runtime and utilities
- `src/external/`: Third-party libraries
- `doc/`: Documentation and project notes

Always check component template paths and ensure proper file pairing. Use `lively.components.searchTemplateFilename()` to locate templates programmatically.
