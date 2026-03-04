# Test ELK Renderer

This tests if the ELK renderer is working after module reload.

## Simple Orthogonal Test

```mermaid
flowchart-elk LR
  A --> B --> C
  A --> D --> C
```

## Class Diagram Test

```mermaid
flowchart-elk TB
  Animal --> Dog
  Animal --> Cat
  Animal --> Bird
  Animal --> Fish
```

To reload the lively-markdown module, run in workspace:
```javascript
await lively.reloadModule("src/components/widgets/lively-markdown.js")
```
