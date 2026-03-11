# Architecture View

<lively-import src="_navigation.html"></lively-import>

Interactive visualization tools for exploring software architecture and code structure in Lively4.


## Components

### Viewer Components

- **[lively-architecture-viewer](components/lively-architecture-viewer.js)** - Main architecture visualization component
  - Pan and zoom navigation
  - Method detail pane with syntax highlighting
  - Integrates diagram rendering with interactive exploration
  - Based on lively-class-diagram with added UX features

- **[lively-class-diagram](components/lively-class-diagram.js)** - Core diagram rendering component
  - Multiple rendering strategies (Mermaid UML, polymetric view, tree view)
  - FileIndex integration for automatic class discovery
  - Persistent configuration with operation replay
  - Clickable methods with source navigation
  - Collapsible classes for managing complexity
  - Composition relationship detection from HTML templates

## Renderers

The diagram component uses a **strategy pattern** for different visualization approaches:

- **[MermaidRenderer](components/renderers/mermaid-renderer.js)** - UML class diagrams
  - Shows inheritance hierarchies
  - Displays methods and properties
  - Supports hand-drawn and classic styles
  - ELK layout for automatic positioning

- **[PolymetricRenderer](components/renderers/polymetric-renderer.js)** - Metrics visualization
  - Rectangle packing by code size
  - Color coding by modification time
  - Directory hierarchy visualization
  - Based on d3-polymetricview component

- **[TreeRenderer](components/renderers/tree-renderer.js)** - Hierarchical tree view
  - Package/directory structure
  - Radial or vertical layouts
  - Class organization overview

## Features

### Data Sources

- **FileIndex integration** - Automatic discovery of classes from indexed files
- **Module loading** - Add individual modules by URL
- **Path scanning** - Recursively add all classes in a directory
- **Custom Mermaid** - Append custom diagram syntax for manual additions

### Interaction

- **Click handlers** - Navigate to class/method definitions
- **Collapse/expand** - Manage diagram complexity
- **Pan and zoom** - Navigate large diagrams
- **Context menu** - Toggle rendering styles
- **Method details** - View source code and comments inline

### Persistence

- **Operation replay** - Diagrams save as operation sequences
- **Collapsed state** - Remembers which classes are collapsed
- **Look preference** - Saves rendering style choice

## Documentation

- **[Renderer API](doc/renderers.md)** - How to create new renderers
- **[Component Guide](components/lively-class-diagram.md)** - Using the class diagram

## Development

See [CLAUDE.md](../../CLAUDE.md) for overall development guidelines.

The architecture view follows object-oriented patterns with strategy-based rendering for extensibility.
