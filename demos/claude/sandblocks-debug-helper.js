/**
 * Debugging helper for Sandblocks/Vitrail integration issues
 *
 * This module provides utilities to trace and debug infinite loops
 * in the sandblocks text integration.
 */

export class CallTracker {
  constructor(name, maxDepth = 10) {
    this.name = name;
    this.maxDepth = maxDepth;
    this.depth = 0;
    this.callCount = 0;
    this.stack = [];
  }

  enter(info = '') {
    this.depth++;
    this.callCount++;
    this.stack.push({ info, timestamp: performance.now() });

    if (this.depth > this.maxDepth) {
      console.error(`⚠️ ${this.name} RECURSION LIMIT EXCEEDED!`, {
        depth: this.depth,
        callCount: this.callCount,
        stack: this.stack.slice(-20) // last 20 calls
      });
      debugger; // Break into debugger on infinite loop
      throw new Error(`Infinite loop detected in ${this.name}`);
    }

    console.log(`${'  '.repeat(this.depth - 1)}→ ${this.name}(${info}) [depth: ${this.depth}]`);
  }

  exit() {
    this.stack.pop();
    console.log(`${'  '.repeat(this.depth - 1)}← ${this.name} [depth: ${this.depth}]`);
    this.depth--;
  }

  wrap(fn) {
    return (...args) => {
      try {
        this.enter(args.length > 0 ? JSON.stringify(args[0]).slice(0, 50) : '');
        return fn(...args);
      } finally {
        this.exit();
      }
    };
  }

  wrapAsync(fn) {
    return async (...args) => {
      try {
        this.enter(args.length > 0 ? JSON.stringify(args[0]).slice(0, 50) : '');
        return await fn(...args);
      } finally {
        this.exit();
      }
    };
  }

  reset() {
    this.depth = 0;
    this.callCount = 0;
    this.stack = [];
  }
}

/**
 * Creates a monitored version of the vitrail integration that logs all calls
 */
export function createDebugVitrail(originalAddVitrailToLivelyEditor) {
  const changeTracker = new CallTracker('change', 5);
  const syncTracker = new CallTracker('syncReplacements', 5);
  const applyChangesTracker = new CallTracker('applyChanges', 5);
  const focusTracker = new CallTracker('focusRange', 5);

  return async function debugAddVitrailToLivelyEditor(livelyCodeMirror, augmentations) {
    console.log('🔍 Starting DEBUG vitrail integration');

    // Call original with tracking wrappers
    const result = await originalAddVitrailToLivelyEditor(livelyCodeMirror, augmentations);

    // Wrap critical methods for tracking
    const cm = livelyCodeMirror.editor;

    // Track all change events
    const originalOn = cm.on.bind(cm);
    cm.on = function(event, handler) {
      if (event === 'change') {
        console.log('📝 Registering change handler');
        return originalOn(event, changeTracker.wrap(handler));
      } else if (event === 'beforeChange') {
        console.log('📝 Registering beforeChange handler');
        return originalOn(event, handler);
      }
      return originalOn(event, handler);
    };

    console.log('✅ DEBUG vitrail integration complete');
    return result;
  };
}

/**
 * Enable debug mode for sandblocks
 */
export async function enableDebugMode(editor) {
  console.log('🐛 Enabling Sandblocks DEBUG mode');

  const sandblocksText = await System.import("src/client/sandblocks-text.js");
  const originalAdd = sandblocksText.addVitrailToLivelyEditor;

  // Replace with debug version
  const debugAdd = createDebugVitrail(originalAdd);

  // Enable with debug wrapper
  return await sandblocksText.enableSandblocksText(editor, null, {
    baseURL: lively4url + "/../sandblocks-text-artifact/"
  });
}

/**
 * Instrument an existing CodeMirror instance to log all operations
 */
export function instrumentCodeMirror(cm) {
  const ops = ['setValue', 'getValue', 'replaceRange', 'replaceSelection',
               'setSelection', 'getCursor', 'focus', 'hasFocus'];

  const instrumented = {};

  for (const op of ops) {
    if (typeof cm[op] === 'function') {
      const original = cm[op].bind(cm);
      instrumented[op] = original;

      cm[op] = function(...args) {
        console.log(`📘 cm.${op}(${args.length > 0 ? JSON.stringify(args[0]).slice(0, 30) : ''})`);
        return original(...args);
      };
    }
  }

  return instrumented; // Return originals so you can restore later
}

/**
 * Test helper: Simulates cut/paste to reproduce the hang
 */
export async function testCutPaste(editor) {
  console.log('✂️ Testing cut/paste scenario...');

  const cm = editor.editor;
  if (!cm) {
    console.error('No CodeMirror instance found');
    return;
  }

  // Select some text
  cm.setSelection({line: 0, ch: 0}, {line: 0, ch: 10});
  console.log('Selected text:', cm.getSelection());

  // Simulate cut (this is where it might hang)
  const text = cm.getSelection();
  console.log('Cutting:', text);

  cm.replaceSelection('', 'cut');
  console.log('Cut complete');

  await lively.sleep(100);

  // Simulate paste
  console.log('Pasting:', text);
  cm.replaceSelection(text, 'paste');
  console.log('Paste complete');
}
