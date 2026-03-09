# Architecture View - Tasks

## In Progress

- [ ] Extract Mermaid rendering logic into MermaidRenderer strategy class
- [ ] Implement base DiagramRenderer interface
- [ ] Create PolymetricRenderer using d3-polymetricview

## Planned

### Rendering Strategy Pattern

- [ ] Define renderer interface with render(), addClickHandlers(), supportsFeature()
- [ ] Extract Mermaid-specific logic from lively-class-diagram
- [ ] Implement TreeRenderer for hierarchical views
- [ ] Add renderer switching UI in lively-architecture-viewer
- [ ] Support renderer-specific features (collapse for UML, metrics for polymetric)

### Enhancements

- [ ] Add metrics overlay to Mermaid renderer (color by age, size by LOC)
- [ ] Support multiple diagram types in same viewer (tabs?)
- [ ] Export diagrams as SVG/PNG
- [ ] Add filtering by package/namespace
- [ ] Search/highlight in diagram

## Completed

- [x] Move components to src/architecture-view/
- [x] Register new template directory in component-loader.js
- [x] Create documentation structure (index.md, _navigation.html)
