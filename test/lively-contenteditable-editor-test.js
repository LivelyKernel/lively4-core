import {expect} from 'src/external/chai.js';
import {createHTML} from 'src/client/html.js';

describe('LivelyContenteditableEditor', () => {
  
  let editor;
  
  beforeEach(async () => {
    editor = await lively.create("lively-contenteditable-editor");
  });
  
  afterEach(() => {
    if (editor) editor.remove();
  });
  
  it('should load component', async () => {
    expect(editor).to.exist;
    expect(editor.tagName.toLowerCase()).to.equal('lively-contenteditable-editor');
  });
  
  it('should have contenteditable element', async () => {
    const editorElement = editor.get("#editor");
    expect(editorElement).to.exist;
    expect(editorElement.getAttribute('contenteditable')).to.equal('true');
  });
  
  it('should convert text to HTML', async () => {
    editor.setText("Hello\nWorld");
    expect(editor.editorElement.innerHTML).to.include("<br>");
    expect(editor.editorElement.innerHTML).to.include("Hello");
    expect(editor.editorElement.innerHTML).to.include("World");
  });
  
  it('should convert HTML back to text', async () => {
    editor.setText("Hello\nWorld");
    const text = editor.getText();
    expect(text).to.equal("Hello\nWorld");
  });
  
  it('should escape HTML entities', async () => {
    editor.setText("<div>&test</div>");
    const html = editor.editorElement.innerHTML;
    expect(html).to.include("&lt;");
    expect(html).to.include("&gt;");
    expect(html).to.include("&amp;");
    
    const text = editor.getText();
    expect(text).to.equal("<div>&test</div>");
  });
  
  it('should track changes', async () => {
    editor.setText("Original");
    expect(editor.textChanged).to.be.false;
    
    editor.editorElement.textContent = "Modified";
    editor.onInput();
    expect(editor.textChanged).to.be.true;
  });
  
  it('should update change indicator on modification', async () => {
    editor.setText("Original");
    expect(editor.changeIndicator.style.backgroundColor).to.equal("rgb(200, 200, 200)");
    
    editor.editorElement.textContent = "Modified";
    editor.updateChangeIndicator();
    expect(editor.changeIndicator.style.backgroundColor).to.equal("rgb(220, 30, 30)");
  });
  
  it('should reset change indicator after setting same text', async () => {
    editor.setText("Test");
    editor.editorElement.textContent = "Modified";
    editor.updateChangeIndicator();
    expect(editor.textChanged).to.be.true;
    
    editor.setText("Test");
    expect(editor.textChanged).to.be.false;
  });
  
  it('should implement editor API', async () => {
    expect(editor.setURL).to.be.a('function');
    expect(editor.getURL).to.be.a('function');
    expect(editor.setText).to.be.a('function');
    expect(editor.getText).to.be.a('function');
    expect(editor.saveFile).to.be.a('function');
    expect(editor.currentEditor).to.be.a('function');
  });
  
  it('should return currentEditor object with getValue', async () => {
    editor.setText("Test content");
    const currentEditor = editor.currentEditor();
    expect(currentEditor).to.exist;
    expect(currentEditor.getValue).to.be.a('function');
    expect(currentEditor.getValue()).to.equal("Test content");
  });
  
  it('should set and get URL', async () => {
    const testUrl = "file:///test.txt";
    editor.setURL(testUrl);
    expect(editor.getURL()).to.equal(testUrl);
  });
  
  it('should normalize line endings', async () => {
    editor.setText("Line1\r\nLine2\r\nLine3");
    const text = editor.getText();
    expect(text).to.equal("Line1\nLine2\nLine3");
    expect(text).to.not.include("\r");
  });
  
  it('should handle empty content', async () => {
    editor.setText("");
    expect(editor.getText()).to.equal("");
  });
  
  it('should handle multiline content', async () => {
    const multiline = "Line 1\nLine 2\nLine 3\nLine 4";
    editor.setText(multiline);
    expect(editor.getText()).to.equal(multiline);
  });
  
  it('should preserve whitespace', async () => {
    const text = "  indented\n    more indented";
    editor.setText(text);
    expect(editor.getText()).to.equal(text);
  });
  
  describe('Container API', () => {
    
    it('should implement getScrollInfo', async () => {
      expect(editor.getScrollInfo).to.be.a('function');
      const scrollInfo = editor.getScrollInfo();
      expect(scrollInfo).to.exist;
      expect(scrollInfo).to.have.property('left');
      expect(scrollInfo).to.have.property('top');
    });
    
    it('should implement setScrollInfo', async () => {
      expect(editor.setScrollInfo).to.be.a('function');
      editor.setScrollInfo({ left: 10, top: 20 });
      const scrollInfo = editor.getScrollInfo();
      expect(scrollInfo.left).to.equal(10);
      expect(scrollInfo.top).to.equal(20);
    });
    
    it('should implement getCursor', async () => {
      expect(editor.getCursor).to.be.a('function');
      editor.setText("Test content");
      // getCursor may return null if no selection
      const cursor = editor.getCursor();
      // Just verify it doesn't throw
    });
  });
  
  describe('Toolbar API', () => {
    
    it('should implement hideToolbar', async () => {
      expect(editor.hideToolbar).to.be.a('function');
      editor.hideToolbar();
      expect(editor.getAttribute("toolbar")).to.equal("hidden");
    });
    
    it('should implement showToolbar', async () => {
      expect(editor.showToolbar).to.be.a('function');
      editor.showToolbar();
      expect(editor.getAttribute("toolbar")).to.equal("visible");
    });
  });
  
  describe('Initialization', () => {
    
    it('should be ready after lively.create', async () => {
      expect(editor.editorElement).to.exist;
      expect(editor.editorElement.getAttribute('contenteditable')).to.equal('true');
    });
    
    it('should display content on first load', async () => {
      // Simulate what container does (lively.create already completed)
      editor.setURL("file:///test.txt");
      editor.setText("Initial content");
      
      expect(editor.getText()).to.equal("Initial content");
      expect(editor.editorElement.textContent).to.include("Initial content");
    });
  });
});
