# Sandblocks Debug Testing

This workspace helps you debug the sandblocks integration issues systematically.

## Setup

```javascript
import {
  CallTracker,
  instrumentCodeMirror,
  testCutPaste
} from './sandblocks-debug-helper.js';

// Get your editor
const editor = lively.query(document.body, "lively-code-mirror");
if (!editor) {
  lively.notify("Please open a code editor first");
}
```

## Step 1: Instrument the Editor (Before Enabling Sandblocks)

```javascript
// This logs all CodeMirror operations
const originals = instrumentCodeMirror(editor.editor);

// You can restore later with:
// Object.assign(editor.editor, originals);
```

## Step 2: Enable Sandblocks (If Not Already)

```javascript
// Enable sandblocks on the editor
await editor.enableSandblocks();
```

## Step 3: Test Cut/Paste

```javascript
// This will attempt the cut/paste operation that hangs
// Watch the console for where it loops
await testCutPaste(editor);
```

## Step 4: Monitor Change Events

```javascript
// Create a tracker for change events
const changeTracker = new CallTracker('change', 5);

// Wrap the change handler
const cm = editor.editor;
const events = cm._handlers?.change || [];
console.log('Found', events.length, 'change handlers');

// You can inspect what handlers are registered:
events.forEach((handler, i) => {
  console.log(`Handler ${i}:`, handler.toString().slice(0, 100));
});
```

## Step 5: Simple Manual Test

Instead of using the automated test, try this manually:

1. Type some text: `let x = 1`
2. Select "let" with your mouse
3. Press Ctrl+X (cut)
4. **Watch the console** - does it loop?
5. If it hangs, press Ctrl+Shift+J to open DevTools and pause execution

## Step 6: Identify the Loop Source

Look for patterns in the console like:
```
→ change(...) [depth: 1]
  → syncReplacements(...) [depth: 1]
    → change(...) [depth: 2]
      → syncReplacements(...) [depth: 2]
        → change(...) [depth: 3]  ⚠️ LOOP!
```

## Common Loop Patterns to Check

### Pattern 1: Change → Apply → Change

```javascript
// Check if v.applyChanges is triggering new changes
const vitrail = editor._vitrailInstance;
if (vitrail) {
  const originalApply = vitrail.applyChanges.bind(vitrail);
  vitrail.applyChanges = function(changes) {
    console.log('📤 applyChanges called with', changes.length, 'changes');
    console.trace(); // See the call stack
    return originalApply(changes);
  };
}
```

### Pattern 2: Marker Clear → Change

```javascript
// Check if marker.clear() is triggering changes
const cm = editor.editor;
const originalMarkText = cm.doc.markText.bind(cm.doc);
cm.doc.markText = function(from, to, options) {
  const marker = originalMarkText(from, to, options);

  const originalClear = marker.clear.bind(marker);
  marker.clear = function() {
    console.log('🧹 Clearing marker', from, to);
    return originalClear();
  };

  return marker;
};
```

## Expected Debugging Output

When you run these tests, you should see:

**Normal (no loop):**
```
📘 cm.replaceSelection("")
→ change(...) [depth: 1]
  → syncReplacements(...) [depth: 1]
  ← syncReplacements [depth: 1]
← change [depth: 1]
📘 cm.replaceSelection("text")
→ change(...) [depth: 1]
← change [depth: 1]
```

**Infinite loop (problem):**
```
📘 cm.replaceSelection("")
→ change(...) [depth: 1]
  → syncReplacements(...) [depth: 1]
    📘 cm.replaceRange(...)
    → change(...) [depth: 2]
      → syncReplacements(...) [depth: 2]
        📘 cm.replaceRange(...)
        → change(...) [depth: 3]
⚠️ RECURSION LIMIT EXCEEDED!
```

## Next Steps After Identifying Loop

Once you identify which pattern causes the loop, you can:

1. **Add origin guards**: Ensure vitrail-originated changes are marked and ignored
2. **Defer synchronization**: Use `queueMicrotask()` or `setTimeout()` to break the loop
3. **Add change suppression**: Temporarily disable handlers during sync operations

Example fix pattern:
```javascript
let suppressChanges = false;

cm.on('change', (cm, e) => {
  if (suppressChanges || e.origin === 'vitrail') return;

  suppressChanges = true;
  try {
    // Do your sync work here
  } finally {
    suppressChanges = false;
  }
});
```
