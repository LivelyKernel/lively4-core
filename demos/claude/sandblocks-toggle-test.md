# Sandblocks Toggle Test

This demonstrates the new sandblocks toggle functionality.

## Features Implemented

1. **`disableSandblocks()` method** - Properly cleans up vitrail instance and CodeMirror markers
2. **`toggleSandblocks()` method** - Toggles sandblocks on/off
3. **Keyboard shortcut** - ALT+SHIFT+S to toggle sandblocks

## Test Instructions

1. Open a code editor with sandblocks enabled
2. Press **ALT+SHIFT+S** to toggle sandblocks off
3. Press **ALT+SHIFT+S** again to toggle sandblocks back on
4. Or control via attribute:
   - `editor.setAttribute("sandblocks", "true")` - Enable
   - `editor.setAttribute("sandblocks", "false")` - Disable (default)
5. Or call methods directly:
   - `editor.enableSandblocks()`
   - `editor.disableSandblocks()`
   - `editor.toggleSandblocks()`

## Example Code to Test With

```javascript
let x = 5;
const y = 10;

// Color string test
const color = "rgba(255, 0, 0, 1)";

// Table test
const table = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9]
];
```

## Implementation Details

### Changes in `sandblocks-text.js`:

1. **Updated `enableSandblocksText()`** (line ~281):
   - Now returns the vitrail instance instead of the editor
   - This allows proper cleanup later

2. **New `disableSandblocksText()` function** (line ~312):
   - Centralized cleanup logic
   - Unregisters all vitrail panes (calls `unmount()` on each)
   - Clears CodeMirror markers/widgets
   - Can be used independently or via CodeMirror methods

### Changes in `lively-code-mirror.js`:

1. **Keyboard handler updated** (line ~208):
   - Added ALT+SHIFT+S detection in `onKeyDown()`

2. **Attribute observer updated** (line ~773):
   - Handles `sandblocks="true"` to enable
   - Handles `sandblocks="false"` or `null` to disable
   - Uses string comparison for explicit state checking

3. **Enable method improved** (line ~1904):
   - Stores vitrail instance in `_vitrailInstance`
   - Uses `setAttribute("sandblocks", "true")` to enable
   - Checks `getAttribute("sandblocks") === "true"` to prevent duplicate enables
   - Added error handling with await

4. **Simplified disable method** (line ~1923):
   - Now calls `disableSandblocksText()` from sandblocks-text.js
   - Uses `setAttribute("sandblocks", "false")` to disable
   - Checks `getAttribute("sandblocks") === "false"` to prevent duplicate disables
   - Manages user notifications

5. **New toggle method** (line ~1944):
   - Checks `getAttribute("sandblocks") === "true"` to determine state
   - Toggles between "true" and "false" values

## Technical Notes

### State Management
- State is tracked via the `sandblocks` attribute with string values `"true"` or `"false"`
- Default value: `"false"` (sandblocks disabled)
- Benefits:
  - State is visible in the DOM inspector
  - Can be set declaratively in HTML: `<lively-code-mirror sandblocks="true">`
  - Attribute observer automatically triggers enable/disable
  - No instance variable synchronization issues
  - Explicit true/false values are clearer than presence/absence

### Cleanup Process
1. Unregister all panes from vitrail (calls `unmount()` on each)
2. Clear CodeMirror text markers with replaced widgets
3. Refresh editor display
4. Clear instance references
5. Set the `sandblocks` attribute to `"false"`

This ensures complete cleanup and prevents the death loop issues during debugging.

### Attribute Values
- `sandblocks="true"` - Sandblocks enabled
- `sandblocks="false"` - Sandblocks disabled (default)
- Missing attribute - Treated as disabled (defaults to false when toggled)
