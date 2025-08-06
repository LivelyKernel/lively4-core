# Mermaid Markdown Test

This demonstrates Mermaid diagram rendering in Lively4 markdown files.

The code blocks are not marked to not trigger the mermaid support markdown .

## Test Diagram 1: Simple Flow

``` 
graph TD
    A[CLI npm run test-single] --> B[Puppeteer]
    B --> C[Headless Chrome]
    C --> D[Lively4 Environment]
    D --> E[SystemJS + Babel]
    E --> F[Test Module Loading]
    F --> G[Mocha Execution]
    G --> H[Results Back to CLI]
```

## Test Diagram 2: Decision Tree

```
graph LR
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E
```

## Test Diagram 3: Sequence Diagram

``` 
sequenceDiagram
    participant User
    participant Browser
    participant Lively4
    participant Server

    User->>Browser: Open markdown file
    Browser->>Lively4: Load container
    Lively4->>Server: Fetch markdown
    Server-->>Lively4: Return content
    Lively4->>Browser: Render markdown
    Browser-->>User: Display content
```

## Test Diagram 3: Sequence Diagram

``` 
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

<script>
import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10.9.1/dist/mermaid.esm.min.mjs';

const markdownComponent = lively.query(this, "lively-markdown")
const root = markdownComponent.shadowRoot


function processMermaidBlocks() {
    console.log('Processing mermaid blocks...');

    // Find all code blocks with language-mermaid class in shadow root
    const mermaidBlocks = root.querySelectorAll('code');
    console.log('Found', mermaidBlocks.length, 'mermaid blocks');

    mermaidBlocks.forEach((block, index) => {
        // Skip if already processed
        if (block.dataset.processed) return;
        block.dataset.processed = 'true';

        const content = block.textContent.trim();
        const id = 'mermaid-diagram-' + index;

        console.log('Processing block', index, 'with content:', content.substring(0, 50));

        // Create container
        const container = document.createElement('div');
        container.id = id;
        container.className = 'mermaid-diagram';
        container.style.cssText = 'margin: 1em 0; text-align: center;';

        // Replace the code block (or its parent pre)
        const targetElement = block.parentElement.tagName === 'PRE' ? block.parentElement : block;
        targetElement.parentNode.replaceChild(container, targetElement);

             
        // Initialize and render mermaid
        try {
            mermaid.initialize({
                startOnLoad: false,
                theme: 'default',
                securityLevel: 'loose',
            });

            mermaid.render(id + '-svg', content).then(({svg}) => {
                container.innerHTML = svg;
                console.log('Successfully rendered mermaid diagram', index);
            }).catch(err => {
                console.error('Mermaid render error for block', index, ':', err);
                container.innerHTML = 'Mermaid render failed: ' + err.message;
            });
        } catch (err) {
            console.error('Mermaid initialization error:', err);
            container.innerHTML = 'Mermaid initialization failed: ' + err.message;
        }
    });
}

processMermaidBlocks()
</script>