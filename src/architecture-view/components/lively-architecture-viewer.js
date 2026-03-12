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
    
    // Override diagram's method selection to show details pane instead of default browser navigation.
    this._diagram.onMethodSelected = (methodInfo, evt, element) =>
      this.onMethodSelected(methodInfo, evt, element);
    
    this.enablePanAndZoom();
    
    // Initial sizing - ensure diagram fills viewer (after layout completes)
    this.deferredSizing();
    
    this.addEventListener('contextmenu',  evt => this.onContextMenu(evt), false);
    this.addEventListener('extent-changed', evt => this.onExtentChanged(evt));
  }
  
  async deferredSizing() {
    // Wait for component to be laid out in DOM
    await lively.sleep(50);
    this.sizeDiagramToViewer();
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
  
  sizeDiagramToViewer() {
    if (this._diagram) {
      // Resize diagram to fill viewer's content area
      const extent = lively.getExtent(this);
      lively.setExtent(this._diagram, extent);
    }
  }
  
  onExtentChanged(evt) {
    this.sizeDiagramToViewer();
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
      return;
    }
    
    // Fetch source code
    const sourceCode = await this.fetchMethodSource(methodInfo);
    
    // Format comments section
    const commentSection = this.formatComments(methodInfo.leadingComments || []);
    
    // Update details pane content
    details.innerHTML = `
      <div class="details-header">
        <span class="details-title">${methodInfo.class}.${methodInfo.name}${methodInfo.static ? ' (static)' : ''}</span>
        <button class="browse edit" id="browse" title="open new browser for url">
          <i class="fa fa-external-link" aria-hidden="true"></i>
        </button>
      </div>
      ${commentSection}
      <div class="details-source">${this.formatSourceCode(sourceCode)}</div>
    `;
    
    // IMPORTANT: Show details FIRST (must be in DOM before positioning)
    details.classList.add('visible');
    
    // Force layout/reflow so element is actually rendered
    details.offsetHeight; // Force reflow
    
    // Add click handler to browse button
    const browseBtn = details.querySelector('#browse');
    if (browseBtn) {
      browseBtn.addEventListener('click', async (evt) => {
        evt.preventDefault();
        evt.stopPropagation();
        await lively.openBrowser(methodInfo.url, true, {
          start: methodInfo.start,
          end: methodInfo.end
        });
      });
    }
    
    // Position it next to clicked element (now relative to pane, not global)
    if (clickedElement) {
      const clickedRect = clickedElement.getBoundingClientRect();
      const paneRect = this._pane.getBoundingClientRect();
      
      // Calculate position relative to pane
      const relativeX = clickedRect.left - paneRect.left + this._pane.scrollLeft;
      const relativeY = clickedRect.top - paneRect.top + this._pane.scrollTop;
      
      // Position details to the right of the clicked element
      details.style.left = (relativeX + clickedRect.width + 10) + 'px';
      details.style.top = relativeY + 'px';
    } else if (evt && evt.clientX !== undefined && evt.clientY !== undefined && evt.clientX > 0) {
      // No clicked element, but we have event coordinates (e.g., from WebGL renderer)
      const paneRect = this._pane.getBoundingClientRect();
      
      // Convert viewport coordinates to pane-relative coordinates
      const relativeX = evt.clientX - paneRect.left + this._pane.scrollLeft;
      const relativeY = evt.clientY - paneRect.top + this._pane.scrollTop;
      
      // Position details to the right of the click position
      details.style.left = (relativeX + 10) + 'px';
      details.style.top = relativeY + 'px';
    } else {
      // No clicked element or coordinates - show at top-left
      details.style.left = '10px';
      details.style.top = '10px';
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
  
  /**
   * Format leading comments for display
   * @param {Array} comments - Array of comment objects from AST
   * @returns {string} HTML with formatted comments
   */
  formatComments(comments) {
    if (!comments || comments.length === 0) {
      return '';
    }
    
    // Extract and format comment text
    const commentTexts = comments.map(comment => {
      if (!comment.value) return '';
      
      // Remove leading * and whitespace from block comments
      const lines = comment.value.split('\n')
        .map(line => line.replace(/^\s*\*\s?/, '').trim())
        .filter(line => line.length > 0);
      
      return lines.join('\n');
    }).filter(text => text.length > 0);
    
    if (commentTexts.length === 0) {
      return '';
    }
    
    const escaped = commentTexts.join('\n\n')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    return `<div class="details-comments"><pre>${escaped}</pre></div>`;
  }
  
  onContextMenu(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    
    const chosenIcon = '<i class="fa fa-check-circle-o" aria-hidden="true"></i>';
    const unchosenIcon = '<i class="fa fa-circle-o" aria-hidden="true"></i>';
    const icon = this._diagram?.isHandDrawn ? chosenIcon : unchosenIcon;
    
    let menuItems = [
      ['Hand-Drawn Style', (evt, item) => this._diagram?.toggleHandDrawn(evt, item), '', icon]
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
    
    // CRITICAL: Re-establish the hook override after diagram reload
    // When lively-class-diagram is reloaded during development, its onMethodSelected
    // gets reset to the default implementation. We need to override it again.
    if (this._diagram) {
      this._diagram.onMethodSelected = (methodInfo, evt, element) =>
        this.onMethodSelected(methodInfo, evt, element);
    }
  }
  
  async livelyExample() {
    await this.ensureDiagram();
    await this.addPath('src/components/literature/');
  }
}
