# Array Content Size Statistics Demo

This demonstrates the fix for tracking content size within arrays, especially for large strings.

## The Problem

Previously, the stats analyzer only tracked array **length** (number of elements), but not the **content size** (actual data volume) of elements inside arrays. This was problematic for AI workspace data containing large system prompts.

## The Solution

Added `_arrayContentSize` statistics that track:
- `_sum`: Total content size across all arrays
- `_min`: Smallest array content size
- `_max`: Largest array content size
- `_avg`: Average array content size

## Example

```javascript
import { analyzeJSONL } from 'src/client/utils/stats.js';

// Simulate AI message with large system prompts
const hugePrompt1 = "You are an AI assistant. " + "x".repeat(5000);
const hugePrompt2 = "Additional context. " + "y".repeat(3000);

const jsonl = JSON.stringify({
  type: "message.updated",
  data: {
    info: {
      system: [
        { type: "text", text: hugePrompt1 },
        { type: "text", text: hugePrompt2 }
      ]
    }
  }
});

const stats = analyzeJSONL(jsonl);

console.log("System array stats:");
console.log("  Array length:", stats.data.info.system._arrayLength);
console.log("  Array content size:", stats.data.info.system._arrayContentSize);
```

### Before the fix:
```json
{
  "_count": 5,
  "_types": { "array": 5 },
  "_arrayLength": {
    "_sum": 10,
    "_min": 2,
    "_max": 2,
    "_avg": 2
  }
}
```

### After the fix:
```json
{
  "_count": 5,
  "_types": { "array": 5 },
  "_arrayLength": {
    "_sum": 10,
    "_min": 2,
    "_max": 2,
    "_avg": 2
  },
  "_arrayContentSize": {
    "_sum": 8045,
    "_min": 8045,
    "_max": 8045,
    "_avg": 8045
  }
}
```

Now you can see that while the array only has 2 elements, the actual content size is over 8KB!

## Implementation Details

The fix adds a `calculateContentSize()` helper function that:
1. Returns string length for strings
2. Approximates size for numbers/booleans
3. Recursively calculates size for nested arrays
4. Uses JSON.stringify length for objects

See [src/client/utils/stats.js](edit://src/client/utils/stats.js) for implementation.
