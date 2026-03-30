import Morph from 'src/components/widgets/lively-morph.js';

export default class LivelyContenteditableEditor extends Morph {
  
  async initialize() {
    this.windowTitle = "Contenteditable Editor";

    this.changeIndicator = this.get("#changeIndicator");
    
    // Ensure Grammarly-compatible attributes
    this.editorElement.setAttribute('tabindex', '0');
   
    // Setup event listeners
    lively.addEventListener("editor-input", this.editorElement, "input", () => this.onInput());
    lively.addEventListener("editor-paste", this.editorElement, "paste", (evt) => this.onPaste(evt));
    
    // Keyboard shortcuts
    lively.html.registerKeys(this);
    
    // Load initial URL if provided
    var url = this.getAttribute("src");
    if (url) {
      this.setURL(url);
    }
  }

  connectedCallback()  {
    this.ensureEditor()
  }
  
  ensureEditor() {
    if (this.editorElement) return this.editorElement;
    const editor = document.createElement('div');
      editor.textContent = this.lastText
      editor.id = 'editor';
      editor.contentEditable = 'true';
      editor.setAttribute('tabindex', '0'); 
    
    editor.style.cssText = `
        outline: none;
        white-space: pre-wrap;
        font-family: monospace;
        font-size: 14px;
        line-height: 1.5;
      `;
      
    // lively.setClientPosition(editor, lively.getClientPosition(this))
    this.appendChild(editor);
    lively.setClientPosition(editor, lively.getClientPosition(this))
    lively.setExtent(editor, lively.pt(800,1000))
    this.editorElement  = editor
  }
  
  disconnectedCallback()  {
    if(this.editorElement) this.editorElement.remove()
  }
  
  // get editorElement() {
  //   return this.querySelector('#editor');
  // }
  
  // === Core Editor API ===
  
  setURL(url) {
    this._url = url;
  }
  
  getURL() {
    return this._url;
  }
  
  setText(text, preserveView) {
    lively.notify("set text" , text)
    
    text = text.replace(/\r\n/g, "\n"); // normalize line endings
    this.lastText = text;
    
    // Save cursor position if preserving view
    let selection = null;
    if (preserveView && document.activeElement === this.editorElement) {
      selection = this.saveSelection();
    }
    
    // Convert plain text to HTML (escape special chars, preserve whitespace)
    const htmlContent = this.textToHtml(text);
    this.editorElement.innerHTML = htmlContent;
    
    // Restore cursor position if preserving view
    if (selection) {
      this.restoreSelection(selection);
    }
    
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
  
  // Toolbar API compatibility (this editor has no toolbar)
  hideToolbar() {
    // No-op: this editor doesn't have a toolbar
    this.setAttribute("toolbar", "hidden");
  }
  
  showToolbar() {
    // No-op: this editor doesn't have a toolbar
    this.setAttribute("toolbar", "visible");
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
  
  // === Selection Management ===
  
  saveSelection() {
    const sel = window.getSelection();
    if (sel.rangeCount === 0) return null;
    
    const range = sel.getRangeAt(0);
    return {
      startContainer: range.startContainer,
      startOffset: range.startOffset,
      endContainer: range.endContainer,
      endOffset: range.endOffset
    };
  }
  
  restoreSelection(selection) {
    if (!selection) return;
    
    try {
      const range = document.createRange();
      range.setStart(selection.startContainer, selection.startOffset);
      range.setEnd(selection.endContainer, selection.endOffset);
      
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    } catch (e) {
      // Selection restoration failed (content changed too much)
      console.warn("Could not restore selection:", e);
    }
  }
  
  // === Container API (scroll and cursor) ===
  
  getScrollInfo() {
    const container = this.get("#editor-container");
    if (!container) return { left: 0, top: 0 };
    return {
      left: container.scrollLeft,
      top: container.scrollTop
    };
  }
  
  setScrollInfo(info) {
    const container = this.get("#editor-container");
    if (!container || !info) return;
    container.scrollLeft = info.left || 0;
    container.scrollTop = info.top || 0;
  }
  
  getCursor() {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    
    const range = sel.getRangeAt(0);
    // Return a simple cursor-like object
    return {
      line: 0, // contenteditable doesn't have line numbers
      ch: range.startOffset,
      selection: this.saveSelection()
    };
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
    
    // Preserve editor content from old instance
    const oldEditor = other.querySelector('#editor');
    if (oldEditor && this.editorElement) {
      this.editorElement.innerHTML = oldEditor.innerHTML;
    }
  }
  
  async livelyExample() {
    this.setText("Hello from contenteditable editor!\n\nThis editor supports:\n- Grammarly\n- Other browser extensions\n- Plain text editing\n\nTry editing this text!");
  }
}
