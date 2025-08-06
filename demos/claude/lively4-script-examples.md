# Lively4 Script Examples in Markdown

This document demonstrates how scripts work in Lively4 markdown files, based on the working mermaid example.

## Key Concepts

### 1. Script Context and DOM Access

In Lively4 markdown, scripts execute within the context of the markdown component:

```javascript
// Get the lively-markdown component that contains this script
const markdownComponent = lively.query(this, "lively-markdown")

// Access the shadow root for DOM manipulation
const root = markdownComponent.shadowRoot
```

### 2. ES6 Module Imports

Scripts can use ES6 import syntax to load external libraries:

```javascript
import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10.9.1/dist/mermaid.esm.min.mjs';
```

### 3. DOM Manipulation in Shadow Root

Query and manipulate elements within the component's shadow DOM:

```javascript
// Find elements in the shadow root, not global document
const elements = root.querySelectorAll('code');

// Create and append elements normally
const container = document.createElement('div');
targetElement.parentNode.replaceChild(container, targetElement);
```

## Working Example Pattern

Based on the mermaid integration, here's the pattern that works:

<script>
import exampleLibrary from 'https://cdn.skypack.dev/lodash-es';

// Get markdown component and shadow root
const markdownComponent = lively.query(this, "lively-markdown")
const root = markdownComponent.shadowRoot

console.log('Script executing in markdown component:', markdownComponent);
console.log('Shadow root available:', root);
console.log('Library imported:', typeof exampleLibrary);

// Example: Find and process code blocks
function processCodeBlocks() {
    const codeBlocks = root.querySelectorAll('code');
    console.log(`Found ${codeBlocks.length} code blocks in shadow root`);
    
    codeBlocks.forEach((block, index) => {
        if (block.textContent.includes('example-trigger')) {
            // Transform this code block
            const wrapper = document.createElement('div');
            wrapper.style.cssText = 'border: 2px solid blue; padding: 10px; margin: 10px 0;';
            wrapper.innerHTML = `<strong>Processed Block ${index}:</strong><br>${block.textContent}`;
            
            block.parentElement.replaceChild(wrapper, block);
        }
    });
}

// Execute the processing
processCodeBlocks();
</script>

## Example Code Block to Process

```
This is an example-trigger code block that should be transformed by the script above.
```

## Key Learnings from Mermaid Example

1. **Component Context**: `this` refers to the script element, use `lively.query(this, "lively-markdown")` to get the container
2. **Shadow DOM**: Access via `markdownComponent.shadowRoot` for proper DOM scoping
3. **ES6 Imports**: Work directly in script tags without module bundlers
4. **Timing**: Scripts execute immediately, no need for DOMContentLoaded in this context
5. **DOM Manipulation**: Standard DOM APIs work within the shadow root scope

## Best Practices

- Always get the markdown component and shadow root at the start
- Use shadow root for all DOM queries, not global document
- Handle errors gracefully when processing dynamic content
- Use unique IDs when creating new elements to avoid conflicts
- Libraries can be imported directly from CDNs using ES6 import syntax

This pattern enables powerful interactive markdown documents in Lively4!