# Parameter Extraction - Usage Guide

## Quick Start

The FileIndex now automatically extracts and stores parameter information for all JavaScript methods and functions.

## Accessing Parameter Data

### Example 1: Query a Specific Class
```javascript
import FileIndex from "src/client/fileindex.js"

const index = FileIndex.current();

// Find a class by name
const classes = await index.db.classes
  .where("name").equals("FileIndex")
  .toArray();

// Show all methods with their parameters
classes[0].methods.forEach(method => {
  const paramNames = method.params.map(p => p.name).join(', ');
  console.log(`${method.name}(${paramNames})`);
});
```

### Example 2: Find Methods by Name Across All Classes
```javascript
// Find all methods named "initialize"
const allClasses = await index.db.classes.toArray();
const initMethods = allClasses.flatMap(cls => 
  cls.methods
    .filter(m => m.name === 'initialize')
    .map(m => ({
      class: cls.name,
      url: cls.url,
      params: m.params
    }))
);

console.log("All initialize() methods:", initMethods);
```

### Example 3: Analyze Function Signatures
```javascript
// Find all functions in a specific file
const functions = await index.db.functions
  .where("url").equals("https://lively-kernel.org/lively4/lively4-core/src/client/strings.js")
  .toArray();

// Show function signatures
functions.forEach(func => {
  const signature = func.params.map(p => {
    if (p.type === 'rest') return `...${p.name}`;
    if (p.type === 'default') return `${p.name} = ${p.defaultValue}`;
    if (p.type === 'destructure' && p.properties) {
      return `{${p.properties.join(', ')}}`;
    }
    return p.name;
  }).join(', ');
  
  console.log(`function ${func.name}(${signature})`);
});
```

### Example 4: Find Methods with Too Many Parameters
```javascript
// Code quality check: find methods with > 4 parameters
const allClasses = await index.db.classes.toArray();
const complexMethods = [];

allClasses.forEach(cls => {
  cls.methods.forEach(method => {
    if (method.params && method.params.length > 4) {
      complexMethods.push({
        class: cls.name,
        method: method.name,
        paramCount: method.params.length,
        url: cls.url
      });
    }
  });
});

console.log("Methods with > 4 parameters:", complexMethods);
```

### Example 5: Generate Method Documentation
```javascript
function generateMethodDoc(cls, method) {
  const params = method.params || [];
  
  const signature = `${cls.name}.${method.name}(${
    params.map(p => {
      switch(p.type) {
        case 'rest': return `...${p.name}`;
        case 'default': return `${p.name}?`;
        case 'destructure': 
          return p.properties ? `{${p.properties.join(', ')}}` : p.name;
        default: return p.name;
      }
    }).join(', ')
  })`;
  
  const paramDocs = params.map(p => {
    const optional = p.type === 'default' ? ' (optional)' : '';
    const rest = p.type === 'rest' ? ' (rest)' : '';
    return `  - ${p.name}${optional}${rest}`;
  }).join('\n');
  
  return `### ${signature}\n\nParameters:\n${paramDocs || '  (none)'}`;
}

// Use it
const cls = await index.db.classes.where("name").equals("FileIndex").first();
cls.methods.slice(0, 3).forEach(method => {
  console.log(generateMethodDoc(cls, method));
  console.log('');
});
```

### Example 6: Code Completion Helper
```javascript
function getMethodSignature(className, methodName) {
  return index.db.classes
    .where("name").equals(className)
    .first()
    .then(cls => {
      const method = cls.methods.find(m => m.name === methodName);
      if (!method) return null;
      
      return {
        class: className,
        method: methodName,
        signature: method.params.map(p => ({
          name: p.name,
          type: p.type,
          required: p.type !== 'default'
        }))
      };
    });
}

// Use for code completion
const sig = await getMethodSignature("FileIndex", "addFile");
console.log("Complete as:", sig);
// Shows: addFile(url, name = "", type, size, modified, slowdown, indexVersions)
```

## Parameter Types

| Type | Description | Example |
|------|-------------|---------|
| `simple` | Regular parameter | `method(x)` → `{name: 'x', type: 'simple'}` |
| `rest` | Rest parameter | `method(...args)` → `{name: 'args', type: 'rest'}` |
| `default` | Default value | `method(x = 5)` → `{name: 'x', type: 'default', defaultValue: '...'}` |
| `destructure` | Object/Array destructure | `method({a, b})` → `{name: '{...}', type: 'destructure', properties: ['a', 'b']}` |
| `unknown` | Unrecognized pattern | Fallback for edge cases |

## Re-indexing Files

To update parameter data for existing files:

```javascript
// Single file
await FileIndex.current().updateFile("https://lively-kernel.org/lively4/lively4-core/src/client/fileindex.js");

// All JavaScript files
await FileIndex.current().updateAllModuleSemantics();

// Specific directory
await FileIndex.current().updateDirectory("https://lively-kernel.org/lively4/lively4-core/src/client/", true);
```

## Testing Your Queries

Use the test script to explore the database:

```javascript
import script from "browse://demos/claude/test-params-in-db.js"
await script.testParamsInDB()
```

This will show examples of parameter data from your actual FileIndex.

## Integration Ideas

- **Code completion**: Suggest parameter names when typing method calls
- **Inline documentation**: Show parameter info on hover
- **Refactoring**: Safely rename parameters across usages
- **API documentation**: Auto-generate API docs from method signatures
- **Code search**: Find methods by parameter patterns
- **Quality metrics**: Track parameter count trends over time
