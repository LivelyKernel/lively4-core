# Test Board Visibility

This tests that the right panel (with Board tab) is always visible, regardless of debug mode.

## Test 1: Open OpenCode with debug OFF

<script>
const opencode = await lively.openComponentInWindow('lively-opencode');
opencode.showDebug = false; // Explicitly turn off debug mode

// Wait a moment for initialization
await new Promise(resolve => setTimeout(resolve, 500));

const loggingPanel = opencode.get('#loggingPanel');
const boardTab = opencode.get('#boardTab');
const agentBoard = opencode.get('#agentBoard');

const result = {
  showDebug: opencode.showDebug,
  loggingPanelExists: !!loggingPanel,
  loggingPanelVisible: loggingPanel ? window.getComputedStyle(loggingPanel).display !== 'none' : false,
  boardTabExists: !!boardTab,
  agentBoardExists: !!agentBoard,
  hideDebugLogAttr: opencode.getAttribute('hide-debug-log')
};

lively.notify("Debug OFF test: Panel visible = " + result.loggingPanelVisible);
return result;
</script>

Expected result:
- `loggingPanelVisible` should be `true`
- `boardTabExists` should be `true`
- Panel should be visible even with `showDebug = false`

## Test 2: Open OpenCode with debug ON

<script>
const opencode2 = await lively.openComponentInWindow('lively-opencode');
opencode2.showDebug = true; // Debug mode ON

await new Promise(resolve => setTimeout(resolve, 500));

const loggingPanel2 = opencode2.get('#loggingPanel');
const boardTab2 = opencode2.get('#boardTab');

const result2 = {
  showDebug: opencode2.showDebug,
  loggingPanelVisible: loggingPanel2 ? window.getComputedStyle(loggingPanel2).display !== 'none' : false,
  boardTabExists: !!boardTab2
};

lively.notify("Debug ON test: Panel visible = " + result2.loggingPanelVisible);
return result2;
</script>

Expected result:
- `loggingPanelVisible` should be `true`
- Panel should always be visible regardless of debug mode

## Summary

The right panel (containing Debug Logs and Board tabs) should now **always be visible**, providing access to:
- **Debug Logs** tab - for viewing event stream and debugging
- **Board** tab - for viewing session TODOs

This makes the Board feature accessible even when debug mode is off.
