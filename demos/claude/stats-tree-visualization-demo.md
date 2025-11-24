# ASCII Tree Visualization for JSONL Statistics

This demo shows the new ASCII tree visualization feature for chat statistics.

## Features

- **Hierarchical tree display** with proper ASCII art (`├──`, `└──`, `│`)
- **Accumulated sizes** - parent nodes show total size including all children (treemap-style)
- **Size percentages** - each node shows its percentage of total data
- **Automatic filtering** - nodes below 1% are hidden by default
- **Sorted by size** - children displayed in descending order by size
- **Node metadata** - shows count, types, and array length info

## Usage in AI Workspace

1. Open any chat component (AI Workspace, OpenAI Realtime Chat, etc.)
2. Right-click to open context menu
3. Choose one of the statistics options:
   - **"Copy Chat Statistics"** - Full statistics in JSON format
   - **"Copy Chat Statistics (Tree View)"** - Full statistics as ASCII tree
   - **"Copy Chat Statistics (shortened)"** - Statistics after removing system prompts (JSON)
   - **"Copy Chat Statistics (shortened, Tree View)"** - Shortened statistics as ASCII tree
4. Paste to see the visualization

## Shortened vs Full Statistics

The "shortened" options remove verbose system prompts and instructions, showing only the actual conversation content. This is useful for understanding the data structure without the noise of large prompts.

**Example comparison:**
- Full event: 8.1 KB (98.5% is system prompts)
- Shortened event: 120 B (65.8% is actual content)
- Size reduction: 97.4%!

## Example Output

```javascript interactive
import { analyzeJSONL, generateStatsTree } from 'src/client/utils/stats.js';

// Simulate AI workspace event data with large system prompts
const events = [
  {
    type: "message.updated",
    timestamp: 1763998640000,
    sessionId: "ses_abc123",
    data: {
      info: {
        id: "msg_001",
        role: "assistant",
        time: { created: 1763998640, completed: 1763998644 },
        system: [
          { type: "text", text: "You are Claude Code, a helpful AI assistant. " + "x".repeat(5000) },
          { type: "text", text: "Additional context about the codebase. " + "y".repeat(3000) }
        ],
        content: [
          { type: "text", text: "Here's my response to your question about the feature." }
        ]
      }
    }
  },
  {
    type: "message.created",
    timestamp: 1763998635000,
    sessionId: "ses_abc123",
    data: {
      info: {
        id: "msg_002",
        role: "user",
        content: "Can you explain this feature?"
      }
    }
  }
];

// Convert to JSONL and analyze
const jsonl = events.map(e => JSON.stringify(e)).join('\n');
const stats = analyzeJSONL(jsonl);

// Generate tree visualization (1% cutoff)
const tree = generateStatsTree(stats, 1);
console.log(tree);

// Also try with different cutoff levels
console.log("\n\n=== With 5% cutoff ===\n");
console.log(generateStatsTree(stats, 5));

console.log("\n\n=== With 0% cutoff (show all) ===\n");
console.log(generateStatsTree(stats, 0));

tree
```

## Example Tree Output

```
Total Size: 8.16 KB
Cutoff: 1% (83 B)

├── data 8.13 KB (99.6%) [n=2 types=object]
│   └── info 8.13 KB (100.0%) [n=2 types=object]
│       ├── system 8.04 KB (98.6%) [n=1 types=array len=2.0]
│       ├── content 120 B (1.5%) [n=2 types=array]
│       └── role 14 B (0.2%) [n=2 types=string]
├── timestamp 26 B (0.3%) [n=2 types=number]
├── sessionId 20 B (0.2%) [n=2 types=string]
└── type 29 B (0.4%) [n=2 types=string]
```

## Benefits

**Before (JSON format):**
- Hard to see data size distribution
- Difficult to identify large fields
- Must manually calculate accumulated sizes
- Verbose output with many small fields

**After (Tree format):**
- Instantly see where the data size is
- Large fields (like system prompts) stand out
- Accumulated sizes show parent contributions
- Clean, filtered view of important nodes

## Implementation Details

- **Size calculation**: Recursively accumulates string lengths and array content sizes
- **Filtering**: Uses percentage threshold (default 1%) to hide noise
- **Sorting**: Displays largest children first for quick scanning
- **Format**: Human-readable byte sizes (B, KB, MB)

See [src/client/utils/stats.js](edit://src/client/utils/stats.js) for implementation.

## Visual Comparison: Full vs Shortened

```javascript interactive
import { analyzeJSONL, generateStatsTree } from 'src/client/utils/stats.js';

const event = {
  type: "message.updated",
  data: {
    info: {
      system: [
        { type: "text", text: "Large system prompt... " + "x".repeat(5000) }
      ],
      content: [
        { type: "text", text: "Actual message content here" }
      ]
    }
  }
};

// Full statistics
const fullTree = generateStatsTree(analyzeJSONL(JSON.stringify(event)), 1);

// Shortened statistics (remove system field)
const shortened = JSON.parse(JSON.stringify(event));
delete shortened.data.info.system;
const shortTree = generateStatsTree(analyzeJSONL(JSON.stringify(shortened)), 1);

console.log("=== FULL ===");
console.log(fullTree);
console.log("\n=== SHORTENED ===");
console.log(shortTree);

"Compare the trees above!"
```
