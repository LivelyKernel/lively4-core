# Mermaid Diagram Examples

This document showcases all types of mermaid diagrams working natively in Lively4 markdown.

## Flow Charts

### Basic Flow Chart
```mermaid
graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Process A]
    B -->|No| D[Process B]
    C --> E[End]
    D --> E
```

### Left-to-Right Flow Chart
```mermaid
graph LR
    A[Client] --> B[Load Balancer]
    B --> C[Web Server 1]
    B --> D[Web Server 2]
    C --> E[Database]
    D --> E
```

### Complex Flow Chart with Styling
```mermaid
graph TB
    A[User Input] --> B{Valid?}
    B -->|Yes| C[Process Data]
    B -->|No| D[Show Error]
    C --> E[Save to DB]
    E --> F[Send Notification]
    F --> G[Update UI]
    D --> H[Request New Input]
    H --> A
    
    classDef errorClass fill:#f96,stroke:#333,stroke-width:2px
    classDef processClass fill:#9f6,stroke:#333,stroke-width:2px
    classDef startClass fill:#bbf,stroke:#333,stroke-width:4px
    
    class D errorClass
    class C,E,F,G processClass
    class A startClass
```

## Sequence Diagrams

### Basic Sequence Diagram
```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant Server
    participant Database
    
    User->>Browser: Enter URL
    Browser->>Server: HTTP Request
    Server->>Database: Query Data
    Database-->>Server: Return Data
    Server-->>Browser: HTTP Response
    Browser-->>User: Display Page
```

### Advanced Sequence with Loops and Conditions
```mermaid
sequenceDiagram
    participant C as Client
    participant A as API Gateway
    participant S as Service
    participant D as Database
    
    C->>A: Login Request
    A->>S: Validate Credentials
    S->>D: Check User
    
    alt User Exists
        D-->>S: User Data
        S-->>A: Success + Token
        A-->>C: 200 OK + JWT
    else User Not Found
        D-->>S: User Not Found
        S-->>A: Error
        A-->>C: 401 Unauthorized
    end
    
    loop Every Request
        C->>A: API Call + JWT
        A->>A: Validate Token
        alt Token Valid
            A->>S: Forward Request
            S-->>A: Response
            A-->>C: Response
        else Token Invalid
            A-->>C: 401 Unauthorized
        end
    end
```

## Class Diagrams

### Basic Class Diagram
```mermaid
classDiagram
    class Animal {
        +String name
        +int age
        +makeSound()
    }
    
    class Dog {
        +String breed
        +bark()
    }
    
    class Cat {
        +Boolean indoor
        +meow()
    }
    
    Animal <|-- Dog
    Animal <|-- Cat
```

### Complex Class Diagram with Relationships
```mermaid
classDiagram
    class User {
        -String id
        -String email
        -String password
        +login()
        +logout()
        +updateProfile()
    }
    
    class Order {
        -String orderId
        -Date orderDate
        -OrderStatus status
        +calculateTotal()
        +cancel()
    }
    
    class Product {
        -String productId
        -String name
        -Double price
        -Integer stock
        +updateStock()
        +getDetails()
    }
    
    class OrderItem {
        -Integer quantity
        -Double unitPrice
        +getSubtotal()
    }
    
    class OrderStatus {
        <<enumeration>>
        PENDING
        PROCESSING
        SHIPPED
        DELIVERED
        CANCELLED
    }
    
    User "1" --o "many" Order : places
    Order "1" --o "many" OrderItem : contains
    Product "1" --o "many" OrderItem : ordered_as
    Order --> OrderStatus
```

## State Diagrams

### Simple State Machine
```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Processing : start
    Processing --> Completed : finish
    Processing --> Error : fail
    Completed --> [*]
    Error --> Idle : retry
    Error --> [*] : abort
```

### Complex State Machine
```mermaid
stateDiagram-v2
    [*] --> LoginScreen
    
    LoginScreen --> Dashboard : valid credentials
    LoginScreen --> LoginScreen : invalid credentials
    
    Dashboard --> Profile : view profile
    Dashboard --> Settings : open settings
    Dashboard --> Logout : logout
    
    Profile --> Dashboard : back
    Settings --> Dashboard : back
    Settings --> ChangePassword : change password
    
    ChangePassword --> Settings : password changed
    ChangePassword --> Settings : cancel
    
    Logout --> LoginScreen
    Logout --> [*] : exit app
    
    state LoginScreen {
        [*] --> EnterCredentials
        EnterCredentials --> Validating : submit
        Validating --> EnterCredentials : invalid
        Validating --> [*] : valid
    }
```

## Entity Relationship Diagrams

```mermaid
erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    CUSTOMER }|..|{ DELIVERY-ADDRESS : uses
    PRODUCT ||--o{ LINE-ITEM : "ordered in"
    
    CUSTOMER {
        string customer_id PK
        string first_name
        string last_name
        string email UK
        date created_at
    }
    
    ORDER {
        string order_id PK
        string customer_id FK
        date order_date
        decimal total_amount
        string status
    }
    
    LINE-ITEM {
        string order_id FK
        string product_id FK
        int quantity
        decimal unit_price
    }
    
    PRODUCT {
        string product_id PK
        string name
        string description
        decimal price
        int stock_quantity
    }
    
    DELIVERY-ADDRESS {
        string address_id PK
        string customer_id FK
        string street_address
        string city
        string postal_code
        string country
    }
```

## User Journey

```mermaid
journey
    title My Working Day
    section Go to work
      Make tea: 5: Me
      Go upstairs: 3: Me
      Do work: 1: Me, Cat
    section Go home
      Go downstairs: 5: Me
      Sit down: 5: Me
```

## Git Graph

```mermaid
gitGraph
    commit id: "Initial"
    commit id: "Setup"
    branch develop
    checkout develop
    commit id: "Feature work"
    commit id: "More work"
    checkout main
    merge develop
    commit id: "Release prep"
    branch feature
    checkout feature
    commit id: "New feature"
    commit id: "Feature complete"
    checkout main
    merge feature
    commit id: "Deploy"
```

## Pie Chart

```mermaid
pie title Development Time Distribution
    "Coding" : 45
    "Testing" : 20
    "Debugging" : 15
    "Meetings" : 10
    "Documentation" : 10
```

## Gantt Chart

```mermaid
gantt
    title Web Application Development
    dateFormat  YYYY-MM-DD
    section Planning
    Requirements Analysis    :done,    req, 2024-01-01, 2024-01-15
    System Design          :done,    design, after req, 10d
    section Development
    Frontend Development    :active,  frontend, 2024-01-20, 30d
    Backend Development     :backend, 2024-01-25, 25d
    Database Setup         :db, 2024-01-22, 10d
    section Testing
    Unit Testing           :testing, after frontend, 10d
    Integration Testing    :integration, after backend, 5d
    section Deployment
    Production Setup       :prod, after integration, 3d
    Go Live               :milestone, after prod, 0d
```

---

## Mindmap

⚠️ **Known Issue**: The `mindmap` diagram type has a compatibility issue with Lively4's environment (E.id is not a function). Mindmaps work in standalone HTML but fail within Lively4's SystemJS/Shadow DOM context.

```mermaid
mindmap
  root((Lively4))
    Components
      Widgets
        LivelyMarkdown
        LivelyContainer
        LivelyEditor
      Tools
        Inspector
        Workspace
        FileBrowser
    Architecture
      SystemJS
      BabelTranspilation
      ShadowDOM
      WebComponents
    Features
      LiveProgramming
      SelfSupporting
      RealtimeCollaboration
      MermaidIntegration
```

**Alternative using Flowchart:**

```mermaid
graph TD
    Lively4 --> Components
    Lively4 --> Architecture
    Lively4 --> Features
    
    Components --> Widgets
    Components --> Tools
    
    Widgets --> LivelyMarkdown
    Widgets --> LivelyContainer
    Widgets --> LivelyEditor
    
    Tools --> Inspector
    Tools --> Workspace
    Tools --> FileBrowser
    
    Architecture --> SystemJS
    Architecture --> BabelTranspilation
    Architecture --> ShadowDOM
    Architecture --> WebComponents
    
    Features --> LiveProgramming
    Features --> SelfSupporting
    Features --> RealtimeCollaboration
    Features --> MermaidIntegration
```

## Timeline

```mermaid
timeline
    title History of Lively4 Development
    2016 : Initial Concept
         : First Prototypes
    2017 : SystemJS Integration
         : Web Components Adoption
    2018 : Shadow DOM Implementation
         : Live Programming Features
    2019 : Container System
         : File Management
    2020 : Collaboration Features
         : GitHub Integration
    2021 : Plugin Architecture
         : Performance Improvements
    2024 : AI Integration
         : Mermaid Support
```

## Quadrant Chart

```mermaid
quadrantChart
    title Reach and influence
    x-axis Low Reach --> High Reach
    y-axis Low Influence --> High Influence
    quadrant-1 We should expand
    quadrant-2 Need to promote
    quadrant-3 Re-evaluate
    quadrant-4 May be improved
    Campaign A: [0.3, 0.6]
    Campaign B: [0.45, 0.23]
    Campaign C: [0.57, 0.69]
    Campaign D: [0.78, 0.34]
    Campaign E: [0.40, 0.34]
```

## Supported Diagram Types

The following diagram types are confirmed to work with mermaid 11.4.0 in Lively4:

- ✅ **Flow Charts** (`graph`, `flowchart`)
- ✅ **Sequence Diagrams** (`sequenceDiagram`)
- ✅ **Class Diagrams** (`classDiagram`)
- ✅ **State Diagrams** (`stateDiagram-v2`)
- ✅ **Entity Relationship** (`erDiagram`)
- ✅ **User Journey** (`journey`)
- ✅ **Git Graph** (`gitgraph`)
- ✅ **Pie Charts** (`pie`)
- ✅ **Gantt Charts** (`gantt`)
- ❌ **Mindmaps** (`mindmap`) - Lively4 environment compatibility issue
- ✅ **Timeline** (`timeline`)
- ✅ **Quadrant Chart** (`quadrantChart`)

## Tips for Using Mermaid in Lively4

1. **Syntax**: Use ````mermaid` code blocks
2. **Styling**: Add CSS classes and styling directly in diagrams
3. **Interactive**: Diagrams are fully interactive (clickable, zoomable)
4. **Responsive**: Diagrams automatically resize with the container
5. **Themes**: Mermaid respects the overall page theme
6. **Debugging**: Check browser console for mermaid syntax errors

All supported diagrams render automatically in any Lively4 markdown file! 🎉