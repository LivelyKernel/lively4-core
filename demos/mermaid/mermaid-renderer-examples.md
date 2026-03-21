# Mermaid Renderer Configuration Guide

This demonstrates the proper way to configure Mermaid diagrams with different renderers.

## Default Renderer (Dagre)

By default, Mermaid uses the **Dagre** layout algorithm with curved edges:

```mermaid
graph TB
    A[Start] --> B[Process 1]
    A --> C[Process 2]
    B --> D[Middle]
    C --> D
    D --> E[End 1]
    D --> F[End 2]
    B --> G[Side Branch]
    G --> F
```

## ELK Renderer (Orthogonal Edges)

To use **ELK** layout with orthogonal (straight) edges, add the init directive:

```mermaid
%%{init: {"flowchart": {"defaultRenderer": "elk"}} }%%
graph TB
    A[Start] --> B[Process 1]
    A --> C[Process 2]
    B --> D[Middle]
    C --> D
    D --> E[End 1]
    D --> F[End 2]
    B --> G[Side Branch]
    G --> F
```

## Comparing Renderers Side-by-Side

### Dagre (Default) - Curved Edges

```mermaid
graph LR
    A[Client] --> B[Load Balancer]
    B --> C[Server 1]
    B --> D[Server 2]
    B --> E[Server 3]
    C --> F[Database]
    D --> F
    E --> F
```

### ELK - Orthogonal Edges

```mermaid
%%{init: {"flowchart": {"defaultRenderer": "elk"}} }%%
graph LR
    A[Client] --> B[Load Balancer]
    B --> C[Server 1]
    B --> D[Server 2]
    B --> E[Server 3]
    C --> F[Database]
    D --> F
    E --> F
```

## Other Diagram Types

Mermaid supports many diagram types. The renderer configuration mainly affects flowcharts and graphs.

### Sequence Diagram (No Renderer Config Needed)

```mermaid
sequenceDiagram
    participant Alice
    participant Bob
    Alice->>Bob: Hello Bob!
    Bob->>Alice: Hello Alice!
```

### Class Diagram (No Renderer Config Needed)

```mermaid
classDiagram
    Animal <|-- Duck
    Animal <|-- Fish
    Animal : +int age
    Animal : +String gender
    Animal: +isMammal()
    class Duck{
        +String beakColor
        +swim()
        +quack()
    }
    class Fish{
        -int sizeInFeet
        -canEat()
    }
```

### State Diagram (No Renderer Config Needed)

```mermaid
stateDiagram-v2
    [*] --> Still
    Still --> [*]
    Still --> Moving
    Moving --> Still
    Moving --> Crash
    Crash --> [*]
```

## Configuration Reference

### Basic Init Directive Syntax

```mermaid
%%{init: {"flowchart": {"defaultRenderer": "elk"}} }%%
graph TB
    A --> B
```

### Multiple Configuration Options

You can combine multiple configuration options:

```mermaid
%%{init: {
  "theme": "dark",
  "flowchart": {
    "defaultRenderer": "elk",
    "curve": "linear"
  }
}}%%
graph TB
    A[Dark Theme] --> B[With ELK]
    B --> C[Linear Curves]
```

### Theme Options

```mermaid
%%{init: {"theme": "forest"}}%%
graph TB
    A[Forest Theme] --> B[Green Colors]
    B --> C[Nature Inspired]
```

## When to Use Each Renderer

### Use Dagre (Default) When:
- You want smooth, curved edges
- Your diagram has organic, flowing relationships
- You prefer the traditional Mermaid look
- Rendering performance is critical (Dagre is faster)

### Use ELK When:
- You need orthogonal (right-angle) edges
- Your diagram represents technical architecture or circuits
- You want a more "technical drawing" appearance
- You have complex routing needs between many nodes

## Common Patterns

### Architecture Diagrams → ELK

```mermaid
%%{init: {"flowchart": {"defaultRenderer": "elk"}} }%%
graph TB
    UI[User Interface] --> API[API Gateway]
    API --> Auth[Auth Service]
    API --> Data[Data Service]
    Auth --> DB1[(User DB)]
    Data --> DB2[(Main DB)]
    Data --> Cache[(Redis Cache)]
```

### Process Flows → Dagre

```mermaid
graph TB
    Start([Start Process]) --> Check{Valid Input?}
    Check -->|Yes| Process[Process Data]
    Check -->|No| Error[Show Error]
    Process --> Save[Save Results]
    Save --> End([Done])
    Error --> End
```

## How It Works

1. **Module Loading**: lively-markdown automatically loads Mermaid and ELK modules
2. **ELK Registration**: The ELK layout engine is registered with Mermaid
3. **Per-Diagram Config**: Each diagram's `%%{init}%%` directive configures that specific diagram
4. **Default Behavior**: Diagrams without init directive use Mermaid's default (Dagre) renderer

## See Also

- [Mermaid Configuration Documentation](https://mermaid.js.org/config/configuration.html)
- [Mermaid Flowchart Documentation](https://mermaid.js.org/syntax/flowchart.html)
- [ELK Algorithm Documentation](https://www.eclipse.org/elk/)
