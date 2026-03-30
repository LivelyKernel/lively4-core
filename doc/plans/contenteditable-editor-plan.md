# Contenteditable Editor Implementation Guide

**Goal:** Create a simple text editor using native `contenteditable` that integrates with lively-container and allows browser extensions like Grammarly to work.

**Component Name:** `lively-contenteditable-editor`

**Location:** 
- `src/components/tools/lively-contenteditable-editor.js`
- `src/components/tools/lively-contenteditable-editor.html`

---

## 1. Editor Interface Requirements

Based on analysis of existing editors (`lively-editor`, `lively-image-editor`), the editor implements these methods for container integration:

### Required Methods

```javascript
class LivelyContenteditableEditor extends Morph {
  
  // Core Editor API (called by lively-container)
  setURL(url)              // Set the file URL
  getURL()                 // Get current file URL
  saveFile()               // Save content to file
  currentEditor()          // Return object with getValue() method
  
  // Content Management
  setText(text, preserveView)  // Set editor content (optional preserveView for cursor/scroll)
  getText()                // Get current text content
  
  // Lifecycle
  awaitEditor()            // Wait for editor to be ready
  
  // Change Tracking (for container integration)
  updateChangeIndicator()  // Update visual indicator of unsaved changes
  get textChanged()        // Boolean: has content changed?
  
  // Migration (for live development)
  livelyMigrate(other)     // Preserve state during component reload
}
```

### Key Properties

```javascript
this.lastText           // Last saved text (for change detection)
this._url               // Current file URL
this.textChanged        // Boolean flag for unsaved changes
```

---

## 2. Container Integration Points

### 2.1 Editor Detection

**File:** `src/components/tools/lively-container.js:615`

Update `currentLivelyEditor()` to include the new editor:

```javascript
static currentLivelyEditor(container) {
  return container.querySelector(
    "lively-image-editor, lively-editor, babylonian-programming-editor, " +
    "lively-shadama-editor, lively-contenteditable-editor"
  );
}
```

### 2.2 File Extension Mapping

**File:** `src/components/tools/lively-container.js:2211-2235`

Add file extension rules in `editFile()` method:

```javascript
// Start with .txt files
if (urlString.match(/\.txt$/i)) {
  editorType = "lively-contenteditable-editor"
}

// Optional: Preference-based override for more file types
if (lively.preferences.get("UseContenteditableEditor")) {
  if (urlString.match(/\.(txt|md|markdown)$/i)) {
    editorType = "lively-contenteditable-editor"
  }
}
```

### 2.3 Content Setting

**File:** `src/components/tools/lively-container.js:2295`

Container calls `setText()` after loading content:

```javascript
livelyEditor.setText(this.sourceContent);
```

The editor handles plain text content.

---

## 3. Implementation

### 3.1 HTML Template

Create `src/components/tools/lively-contenteditable-editor.html`:

```html
<template id="lively-contenteditable-editor">
  <style data-src="/templates/livelystyle.css"></style>
  <style>
    #editor-container {
      width: 100%;
      height: 100%;
      overflow: auto;
      padding: 10px;
      box-sizing: border-box;
    }
    
    #editor {
      min-height: 100%;
      outline: none;
      white-space: pre-wrap;
      font-family: monospace;
      font-size: 14px;
      line-height: 1.5;
    }
    
    #changeIndicator {
      width: 10px;
      height: 10px;
      border-radius: 5px;
      background-color: rgb(200,200,200);
      position: absolute;
      top: 5px;
      right: 5px;
    }
  </style>
  
  <div id="editor-container">
    <div id="editor" contenteditable="true"></div>
    <div id="changeIndicator"></div>
  </div>
</template>
```

### 3.2 JavaScript Implementation

Create `src/components/tools/lively-contenteditable-editor.js`:

```javascript
import Morph from 'src/components/widgets/lively-morph.js';

export default class LivelyContenteditableEditor extends Morph {
  
  async initialize() {
    this.windowTitle = "Contenteditable Editor";
    
    this.editorElement = this.get("#editor");
    this.changeIndicator = this.get("#changeIndicator");
    
    // Setup event listeners
    this.editorElement.addEventListener("input", () => this.onInput());
    this.editorElement.addEventListener("paste", (evt) => this.onPaste(evt));
    
    // Keyboard shortcuts
    lively.html.registerKeys(this);
    
    // Load initial URL if provided
    var url = this.getAttribute("src");
    if (url) {
      this.setURL(url);
    }
  }
  
  // === Core Editor API ===
  
  setURL(url) {
    this._url = url;
  }
  
  getURL() {
    return this._url;
  }
  
  setText(text, preserveView) {
    text = text.replace(/\r\n/g, "\n"); // normalize line endings
    this.lastText = text;
    
    // Convert plain text to HTML (escape special chars, preserve whitespace)
    const htmlContent = this.textToHtml(text);
    this.editorElement.innerHTML = htmlContent;
    
    this.updateChangeIndicator();
  }
  
  getText() {
    return this.htmlToText(this.editorElement.innerHTML);
  }
  
  currentEditor() {
    // Return object matching container's expectations
    return {
      getValue: () => this.getText()
    };
  }
  
  async saveFile() {
    const url = this.getURL();
    const text = this.getText();
    
    await lively.files.saveFile(url, text);
    
    this.lastText = text;
    this.updateChangeIndicator();
    
    return text;
  }
  
  async awaitEditor() {
    // Already ready after initialize()
    return this;
  }
  
  // === Content Conversion ===
  
  textToHtml(text) {
    // Escape HTML entities
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');
  }
  
  htmlToText(html) {
    // Create temporary element for parsing
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    // Convert <br> to newlines
    const brs = temp.querySelectorAll('br');
    brs.forEach(br => br.replaceWith('\n'));
    
    // Get text content (automatically unescapes entities)
    return temp.textContent || '';
  }
  
  // === Event Handlers ===
  
  onInput() {
    this.updateChangeIndicator();
  }
  
  onPaste(evt) {
    // Prevent rich text paste - only allow plain text
    evt.preventDefault();
    
    const text = evt.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  }
  
  onKeyDown(evt) {
    // Ctrl+S to save
    if (evt.ctrlKey && evt.key === 's') {
      evt.preventDefault();
      this.saveFile().then(() => {
        lively.notify("Saved " + this.getURL());
      });
    }
  }
  
  // === Change Tracking ===
  
  updateChangeIndicator() {
    if (!this.lastText) return;
    
    const currentText = this.getText();
    if (currentText !== this.lastText) {
      this.changeIndicator.style.backgroundColor = "rgb(220,30,30)";
      this.textChanged = true;
    } else {
      this.changeIndicator.style.backgroundColor = "rgb(200,200,200)";
      this.textChanged = false;
    }
  }
  
  // === Live Development ===
  
  livelyMigrate(other) {
    this._url = other._url;
    this.lastText = other.lastText;
    this.editorElement.innerHTML = other.editorElement.innerHTML;
  }
  
  async livelyExample() {
    this.setText("Hello from contenteditable editor!\n\nThis editor supports:\n- Grammarly\n- Other browser extensions\n- Plain text editing");
  }
}
```

---

## 4. Testing

### Unit Tests

Create `test/lively-contenteditable-editor-test.js`:

```javascript
describe('LivelyContenteditableEditor', () => {
  
  it('should convert text to HTML', async () => {
    const editor = await lively.create("lively-contenteditable-editor");
    editor.setText("Hello\nWorld");
    expect(editor.editorElement.innerHTML).to.include("<br>");
  });
  
  it('should convert HTML back to text', async () => {
    const editor = await lively.create("lively-contenteditable-editor");
    editor.setText("Hello\nWorld");
    expect(editor.getText()).to.equal("Hello\nWorld");
  });
  
  it('should track changes', async () => {
    const editor = await lively.create("lively-contenteditable-editor");
    editor.setText("Original");
    expect(editor.textChanged).to.be.false;
    
    editor.editorElement.textContent = "Modified";
    editor.onInput();
    expect(editor.textChanged).to.be.true;
  });
  
  it('should implement editor API', async () => {
    const editor = await lively.create("lively-contenteditable-editor");
    expect(editor.setURL).to.be.a('function');
    expect(editor.getURL).to.be.a('function');
    expect(editor.setText).to.be.a('function');
    expect(editor.getText).to.be.a('function');
    expect(editor.saveFile).to.be.a('function');
    expect(editor.currentEditor).to.be.a('function');
  });
});
```

### Integration Testing

Test these workflows:
- Open `.txt` file in container → editor loads correctly
- Edit content → change indicator turns red
- Save file (Ctrl+S) → file saved and indicator turns gray
- Reload file → content preserved
- Live development → `livelyMigrate()` preserves state
- Grammarly extension → suggestions appear and work

---

## 5. Implementation Checklist

**Core Implementation:**
- Create `lively-contenteditable-editor.html`
- Create `lively-contenteditable-editor.js`
- Implement all required editor API methods
- Test standalone: `lively.openComponentInWindow("lively-contenteditable-editor")`
- Verify Grammarly works in contenteditable element

**Container Integration:**
- Update `lively-container.js:615` - add to `currentLivelyEditor()`
- Update `lively-container.js:2211` - add file extension mapping for `.txt`
- Test opening `.txt` files in container
- Verify save/load cycle works correctly
- Test change indicator updates properly

**Polish:**
- Implement cursor/selection preservation in `setText(text, preserveView)` when `preserveView` is true
- Implement scroll position preservation
- Test `livelyMigrate()` during live component reloading
- Verify keyboard shortcuts work (Ctrl+S)
- Test with actual Grammarly browser extension

**Extended Features (Optional):**
- Add preference setting: `lively.preferences.get("UseContenteditableEditor")`
- Support markdown files (`.md`)
- Add context menu integration
- Add find/replace functionality
- Add line numbers display
- Add character/word count display

---

## 6. Known Limitations

**Current Design Constraints:**
1. **No syntax highlighting** - Plain text only (by design for Grammarly compatibility)
2. **Basic undo/redo** - Uses browser's native contenteditable undo stack
3. **No code completion** - Not applicable for plain text editing
4. **Limited formatting** - Plain text editing only

**Potential Enhancements:**
1. **Markdown preview** - Split view with rendered markdown
2. **Custom styling** - User-configurable fonts/colors/themes
3. **Collaborative editing** - Using operational transforms
4. **Spell check toggle** - Programmatic control of browser spell checker
5. **Word count** - Display character/word/line counts

---

## 7. Alternative Approaches

### Option A: Hybrid Approach
Use contenteditable only when Grammarly is detected:
- **Pros:** Combines CodeMirror features with Grammarly support
- **Cons:** Complex detection logic, mode switching complexity

### Option B: CodeMirror Plugin
Modify CodeMirror to work with Grammarly:
- **Pros:** Keeps existing editor features
- **Cons:** Likely impossible - Grammarly doesn't support custom editors

### Option C: Plain Textarea
Use `<textarea>` instead of contenteditable:
- **Pros:** Simpler implementation
- **Cons:** Grammarly support uncertain, limited features

**Selected Approach:** Use contenteditable for maximum browser extension compatibility.

---

## 8. Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Contenteditable bugs across browsers | Test in Chrome, Firefox, Safari; document browser-specific issues |
| Data loss during text↔HTML conversion | Comprehensive tests for edge cases (special chars, newlines, empty content) |
| Performance with large files | Add file size warnings; consider virtualization for very large files |
| Breaking existing editors | Keep all existing editors unchanged; add new one alongside |
| Grammarly doesn't work as expected | Test early with actual extension; document known limitations |

---

## 9. Technical Notes

### Text-to-HTML Conversion

The `textToHtml()` method handles:
- HTML entity escaping (`&`, `<`, `>`)
- Newline conversion (`\n` → `<br>`)
- Preserves whitespace via CSS `white-space: pre-wrap`

### HTML-to-Text Conversion

The `htmlToText()` method handles:
- `<br>` conversion back to `\n`
- Automatic HTML entity unescaping via `textContent`
- Handles contenteditable's dynamic DOM structure

### Change Detection

Change tracking uses simple string comparison:
- `lastText` stores the last saved state
- `getText()` retrieves current state
- Compare to determine if changes exist
- Update indicator color accordingly

### Browser Extension Compatibility

Contenteditable enables browser extensions because:
- Extensions detect editable regions via `contenteditable` attribute
- Text nodes are directly editable in DOM (unlike CodeMirror's virtualized text)
- Extensions can inject inline suggestions and decorations
- Native editing events fire normally

---

## 10. References

### Existing Editor Code
- `src/components/tools/lively-editor.js:283` - `currentEditor()` implementation
- `src/components/tools/lively-editor.js:313` - `setText()` implementation
- `src/components/tools/lively-editor.js:466` - `saveFile()` implementation
- `src/components/tools/lively-image-editor.js:89` - Simple editor example
- `src/components/tools/lively-container.js:619` - `getEditor()` method
- `src/components/tools/lively-container.js:2211` - Editor type selection logic

### Key Patterns
- **Change tracking:** `updateChangeIndicator()` + `textChanged` property
- **Save/Load:** `saveFile()` + `setText()`
- **Container API:** `currentEditor().getValue()` pattern
- **Migration:** `livelyMigrate(other)` for live development
- **Initialization:** `awaitEditor()` for async readiness

### Documentation
- [Container Documentation](browse://doc/tools/container.md)
- [Editor Documentation](browse://doc/tools/editor.md)
- [Component Development Guidelines](browse://../../CLAUDE.md)
