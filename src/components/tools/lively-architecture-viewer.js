import Morph from 'src/components/widgets/lively-morph.js';
import { Panning, Zooming } from 'src/client/html.js';
import ContextMenu from 'src/client/contextmenu.js'

export default class LivelyArchitectureViewer extends Morph {
  async initialize() {
    this.windowTitle = "Architecture Viewer";
    this._pane = this.get('#pane');
    this._diagram = this._diagram || await this.ensureDiagram();
    
    // Load highlight.js for syntax highlighting (preserve during live updates)
    this._hljs = this._hljs || await this.loadHighlightJS();
    
    // Override diagram's method selection behavior to show details pane
    this._diagram.onMethodSelected = (methodInfo, evt, element) => 
      this.onMethodSelected(methodInfo, evt, element);
    
    this.enablePanAndZoom();
    
    this.addEventListener('contextmenu',  evt => this.onContextMenu(evt), false);
  }
  
  async ensureDiagram() {
    let diagram = this.querySelector('lively-class-diagram');
    if (!diagram) {
      diagram = await lively.create('lively-class-diagram');
      this.appendChild(diagram);
    }
    return diagram;
  }
  
  async loadHighlightJS() {
    if (this._hljs) return this._hljs;
    
    try {
      // Load highlight.js using System.import
      const hljsModule = await System.import(lively4url + '/src/external/highlight.js');
      return hljsModule.default || hljsModule;
    } catch (error) {
      console.error('[lively-architecture-viewer] Failed to load highlight.js:', error);
      return null;
    }
  }
  
  enablePanAndZoom() {
    if (!this._diagram || !this._pane) return;
    
    this._panning = new Panning(this._pane);
    this._zooming = new Zooming(this._diagram, {
      listenOn: this,
      minZoom: 0.1,
      maxZoom: 10.0,
      zoomStep: 0.4
    });
  }
  
  async fromDiagram(sourceDiagram) {
    if (!sourceDiagram || !this._diagram) return;
    
    this._diagram._mermaidSource = [...(sourceDiagram._mermaidSource || [])];
    this._diagram._modules = new Set(sourceDiagram._modules || []);
    this._diagram._classUrls = new Map(sourceDiagram._classUrls || []);
    this._diagram._methodData = new Map(sourceDiagram._methodData || []);
    this._diagram._operations = [...(sourceDiagram._operations || [])];
    this._diagram._collapsedClasses = new Set(sourceDiagram._collapsedClasses || []);
    this._diagram._look = sourceDiagram._look || 'handDrawn';
    
    if (sourceDiagram._mermaid) {
      this._diagram._mermaid = sourceDiagram._mermaid;
    }
    
    await this._diagram.render();
  }
  
  async addModule(url) {
    if (this._diagram) await this._diagram.addModule(url);
  }
  
  async addPath(path) {
    if (this._diagram) await this._diagram.addPath(path);
  }
  
  async addURL(url) {
    if (this._diagram) await this._diagram.addURL(url);
  }
  
  appendMermaid(source) {
    if (this._diagram) this._diagram.appendMermaid(source);
  }
  
  clear() {
    if (this._diagram) this._diagram.clear();
    this.resetView();
  }
  
  resetView() {
    if (this._zooming) this._zooming.resetZoom();
    if (this._pane) {
      this._pane.scrollLeft = 0;
      this._pane.scrollTop = 0;
    }
  }
  
  get diagram() {
    return this._diagram;
  }
  
  /**
   * Handle method/property selection - show source code in details pane
   * @param {Object} methodInfo - Method information from FileIndex
   * @param {Event} evt - The click event
   * @param {HTMLElement} clickedElement - The clicked element (method label)
   */
  async onMethodSelected(methodInfo, evt, clickedElement) {
    const details = this.get('#details');
    
    // Shift+click: keep inspector behavior
    if (evt.shiftKey) {
      lively.openInspector(methodInfo);
      return;
    }
    
    // Clear previous selection highlight
    if (this._selectedMethod?.element) {
      this._selectedMethod.element.style.backgroundColor = '';
    }
    
    // Toggle: if clicking same method, hide details
    if (this._selectedMethod?.info === methodInfo) {
      this._selectedMethod = null;
      details.classList.remove('visible');
      lively.setClientPosition(details, lively.pt(0, 0)); // Move out of the way
      return;
    }
    
    // Fetch source code
    const sourceCode = await this.fetchMethodSource(methodInfo);
    
    // Update details pane content
    details.innerHTML = `
      <div class="details-header">
        ${methodInfo.class}.${methodInfo.name}${methodInfo.static ? ' (static)' : ''}
      </div>
      <div class="details-source">${this.formatSourceCode(sourceCode)}</div>
    `;
    
    // IMPORTANT: Show details FIRST (must be in DOM before setClientPosition)
    details.classList.add('visible');
    
    // Force layout/reflow so element is actually rendered
    details.offsetHeight; // Force reflow
    
    // Position it next to clicked element
    if (clickedElement) {
      const methodPos = lively.getClientPosition(clickedElement);
      const methodExtent = lively.getExtent(clickedElement);
      lively.setClientPosition(details, methodPos.addPt(lively.pt(methodExtent.x + 10, 0)));
    }
    
    // Track selection
    this._selectedMethod = { info: methodInfo, element: clickedElement };
    
    // Highlight selected method
    if (clickedElement) {
      clickedElement.style.backgroundColor = 'lightblue';
    }
  }
  
  /**
   * Fetch the source code for a method
   * @param {Object} methodInfo - Method information from FileIndex
   * @returns {string} Source code of the method
   */
  async fetchMethodSource(methodInfo) {
    try {
      // Read the entire file
      const response = await fetch(methodInfo.url);
      const fullSource = await response.text();
      
      // Extract method substring using start/end positions
      return fullSource.substring(methodInfo.start, methodInfo.end);
    } catch (error) {
      console.error('Failed to fetch method source:', error);
      return `// Error loading source: ${error.message}`;
    }
  }
  
  /**
   * Format source code for display with syntax highlighting
   * @param {string} code - Raw source code
   * @returns {string} HTML with syntax highlighting
   */
  formatSourceCode(code) {
    // Use highlight.js if available, otherwise fall back to plain HTML escaping
    if (this._hljs) {
      try {
        const result = this._hljs.highlight('javascript', code);
        return `<pre><code class="hljs javascript">${result.value}</code></pre>`;
      } catch (error) {
        console.warn('[lively-architecture-viewer] Syntax highlighting failed:', error);
      }
    }
    
    // Fallback: escape HTML
    const escaped = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    return `<pre>${escaped}</pre>`;
  }
  
  onContextMenu(evt) {
    let menuItems = [
      ["Do nothing", () => lively.notify("nothing")]
    ];

    const menu = new ContextMenu(this, menuItems);
    menu.openIn(document.body, evt, this);
  }
  
  disconnectedCallback() {
    if (this._panning?.destroy) this._panning.destroy();
    if (this._zooming?.destroy) this._zooming.destroy();
    lively.removeEventListener("ArchitectureViewerContextMenu", this);
  }
  
  livelyMigrate(other) {
    this._pane = this.get('#pane');
    this._diagram = this.querySelector('lively-class-diagram');
    this._panning = other._panning;
    this._zooming = other._zooming;
    this._selectedMethod = other._selectedMethod;
    this._hljs = other._hljs;
  }
  
  async livelyExample() {
    await this.ensureDiagram();
    await this.addPath('src/components/literature/');
  }
}
