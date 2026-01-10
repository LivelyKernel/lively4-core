// Test module to verify unloading behavior
// Tracks execution count to detect double execution

// Global state to track execution (persists across module loads)
if (!window.__unloadTestModuleState) {
  window.__unloadTestModuleState = {
    executionCount: 0,
    unloadCount: 0
  };
}

// Increment execution count each time module is loaded
window.__unloadTestModuleState.executionCount++;

export function __unload__() {
  // Track that unload was called
  window.__unloadTestModuleState.unloadCount++;
}

export function getExecutionCount() {
  return window.__unloadTestModuleState.executionCount;
}

export function getUnloadCount() {
  return window.__unloadTestModuleState.unloadCount;
}

export function resetState() {
  window.__unloadTestModuleState.executionCount = 0;
  window.__unloadTestModuleState.unloadCount = 0;
}
