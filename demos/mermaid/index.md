# Mermaid Diagrams with ELK Layout

Lively4 supports Mermaid diagrams with both **Dagre** (curved edges) and **ELK** (orthogonal edges) renderers.

## Quick Start

### Default (Dagre - Curved Edges)

````markdown
```mermaid
graph TB
    A --> B --> C
```
````

### ELK (Orthogonal Edges)

````markdown
```mermaid
%%{init: {"flowchart": {"defaultRenderer": "elk"}} }%%
graph TB
    A --> B --> C
```
````

## Learn More

- **[mermaid-renderer-examples.md](browse://mermaid-renderer-examples.md)** - ⭐ Comprehensive guide with all examples
- **[VERIFY.md](browse://VERIFY.md)** - Quick visual test
- **[README.md](browse://README.md)** - Full documentation and implementation details

## Live Demo

```mermaid
graph LR
    A[Lively4] --> B[Markdown]
    B --> C[Mermaid]
    C --> D{Renderer?}
    D -->|Default| E[Dagre<br/>Curved Edges]
    D -->|%%init%%| F[ELK<br/>Orthogonal Edges]
```

Above: Default Dagre renderer with curved edges.

```mermaid
%%{init: {"flowchart": {"defaultRenderer": "elk"}} }%%
graph LR
    A[Lively4] --> B[Markdown]
    B --> C[Mermaid]
    C --> D{Renderer?}
    D -->|Default| E[Dagre<br/>Curved Edges]
    D -->|%%init%%| F[ELK<br/>Orthogonal Edges]
```

Above: ELK renderer with orthogonal edges.
