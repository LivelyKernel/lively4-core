# Mermaid Graph Diagram Examples

## Basic Graph with Custom Node Shapes

```mermaid
graph TD
    A[Square Node A]
    B(Rounded Node B)
    C{Diamond Node C}
    D((Circle Node D))
    E>Asymmetric Node E]
    F[/Parallelogram F/]
    
    A --> B
    A --> C
    B --> D
    C --> D
    C --> E
    D --> F
```

## Styled Graph with Custom Classes

```mermaid
graph LR
    A[Start]:::startClass
    B[Process]:::processClass
    C{Decision}:::decisionClass
    
    A --> B
    B --> C
    C -->|Yes| D[Success]:::successClass
    C -->|No| E[Retry]:::errorClass
    E --> B
    
    classDef startClass fill:#4CAF50,stroke:#2E7D32,stroke-width:3px,color:#fff
    classDef processClass fill:#2196F3,stroke:#1565C0,stroke-width:2px,color:#fff
    classDef decisionClass fill:#FF9800,stroke:#E65100,stroke-width:2px,color:#fff
    classDef successClass fill:#8BC34A,stroke:#558B2F,stroke-width:2px,color:#fff
    classDef errorClass fill:#F44336,stroke:#C62828,stroke-width:2px,color:#fff
```

## Complex Layout Example

```mermaid
graph TB
    subgraph Input Layer
        A1[Node A1]
        A2[Node A2]
        A3[Node A3]
    end
    
    subgraph Processing Layer
        B1((Process B1))
        B2((Process B2))
    end
    
    subgraph Output Layer
        C[Result C]
    end
    
    A1 --> B1
    A2 --> B1
    A2 --> B2
    A3 --> B2
    B1 --> C
    B2 --> C
```

## Different Edge Styles

```mermaid
graph TD
    A[Node A] --> B[Normal Arrow]
    A -.-> C[Dotted Line]
    A ==> D[Thick Line]
    B --> E[Node E]
    C --> E
    D --> E
    E -->|Labeled Edge| F[Node F]
```

## Fixed-Size Boxes

```mermaid
graph TD
    A[A]:::fixedBox
    B[Short]:::fixedBox
    C[Very Long Text Here]:::fixedBox
    D[Medium Length]:::fixedBox
    E[X]:::fixedBox
    
    A --> B
    B --> C
    C --> D
    D --> E
    A --> E
    
    classDef fixedBox width:200px,height:80px,fill:#E3F2FD,stroke:#1976D2,stroke-width:2px,color:#000,text-align:center
```

## Multiple Fixed-Size Classes

```mermaid
graph LR
    A[Small]:::smallBox
    B[Medium Box]:::mediumBox
    C[Large Container]:::largeBox
    D[Tiny]:::smallBox
    E[Another Large One]:::largeBox
    
    A --> B
    B --> C
    A --> D
    D --> E
    C --> E
    
    classDef smallBox width:100px,height:60px,fill:#FFEBEE,stroke:#C62828,stroke-width:2px
    classDef mediumBox width:150px,height:80px,fill:#FFF3E0,stroke:#EF6C00,stroke-width:2px
    classDef largeBox width:200px,height:100px,fill:#E8F5E9,stroke:#2E7D32,stroke-width:2px
```
