# ELK Debug Test

Open the browser console (F12) and check for:
- `[lively-markdown] ELK layout registered successfully`
- Any error messages about ELK

## Test 1: Simple Flowchart (Regular)
```mermaid
flowchart LR
  A --> B --> C
```

## Test 2: ELK Flowchart (Should be orthogonal)
```mermaid
flowchart-elk LR
  A --> B --> C
  A --> D --> C
```

## Test 3: Class Hierarchy with ELK
```mermaid
flowchart-elk TB
  Animal["Animal<br/>- name: String<br/>- age: int"]
  Dog["Dog<br/>- breed: String"]
  Cat["Cat<br/>- indoor: bool"]
  
  Animal --> Dog
  Animal --> Cat
```

<script>
// Debug: Check if ELK is available
console.log('Mermaid object:', window.mermaid);
console.log('Checking for ELK support...');

setTimeout(() => {
  const mermaidDivs = document.querySelectorAll('.mermaid-diagram');
  console.log('Found mermaid diagrams:', mermaidDivs.length);
  mermaidDivs.forEach((div, i) => {
    console.log(`Diagram ${i}:`, div.innerHTML.substring(0, 200));
  });
}, 2000);
</script>
