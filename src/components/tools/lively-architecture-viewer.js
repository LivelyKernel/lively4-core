import Morph from 'src/components/widgets/lively-morph.js';
import { Panning, Zooming } from 'src/client/html.js';

export default class LivelyArchitectureViewer extends Morph {
  async initialize() {
    this.windowTitle = "Architecture Viewer";
    
    // Get the pane from shadow root
    this._pane = this.get('#pane');
    
    // Create diagram and add it to the pane
    // This way it persists through livelyMigrate automatically
    this._diagram = this._diagram || await this.ensureDiagram();
    
    // Enable panning and zooming using existing classes from html.js
    this.enablePanAndZoom();
    
    // Add context menu infrastructure (placeholder)
    this.setupContextMenu();
  }
  
  /**
   * Ensure the diagram exists in the pane
   * @returns {LivelyClassDiagram} The diagram element
   */
  async ensureDiagram() {
    // Check if diagram already exists in pane
    let diagram = this.querySelector('lively-class-diagram');
    
    if (!diagram) {
      // Create new diagram and add to pane
      diagram = await lively.create('lively-class-diagram');
      this.appendChild(diagram);
    }
    
    return diagram;
  }
  
  /**
   * Enable panning (Ctrl+Drag) and zooming (Ctrl+MouseWheel)
   * Uses Panning and Zooming classes from src/client/html.js
   */
  enablePanAndZoom() {
    if (!this._diagram || !this._pane) return;
    
    // IMPORTANT: For slotted content, we must listen to the HOST element (this)
    // not the pane, because events from light DOM children don't bubble into shadow DOM
    // The pane.scrollTop/scrollLeft will still work because Panning accesses pane through this.pane
    // But we pass 'this' as the element to attach listeners to
    
    // Custom panning that listens to host but scrolls the pane
    this._panning = this.setupPanningForSlottedContent();
    
    // Custom zooming that listens to host but zooms the diagram
    this._zooming = this.setupZoomingForSlottedContent();
    
    this._panAndZoomEnabled = true;
  }
  
  /**
   * Setup panning that works with slotted content
   * The Panning class expects to listen and scroll the same element,
   * but with slots we need to listen on the host and scroll the pane
   */
  setupPanningForSlottedContent() {
    const pane = this._pane;
    const host = this;
    
    // Implement panning logic inline since we need custom behavior
    let lastMove = null;
    
    const onPanningMove = (evt) => {
      const pos = lively.pt(evt.clientX, evt.clientY);
      const delta = pos.subPt(lastMove);
      pane.scrollTop -= delta.y;
      pane.scrollLeft -= delta.x;
      lastMove = pos;
    };
    
    const onPanningDown = (evt) => {
      lastMove = lively.pt(evt.clientX, evt.clientY);
      lively.addEventListener("architectureViewerPanning", document.body.parentElement, "pointermove", 
        evt => onPanningMove(evt));
      lively.addEventListener("architectureViewerPanning", document.body.parentElement, "pointerup", 
        evt => {
          lively.removeEventListener("architectureViewerPanning", document.body.parentElement);
        });
      evt.stopPropagation();
      evt.preventDefault();
    };
    
    // Listen on the host element (this) to catch events from slotted diagram
    lively.addEventListener("architectureViewerPointer", host, "pointerdown", (evt) => {
      if (evt.ctrlKey) {
        onPanningDown(evt);
      }
    }, true);
    
    // Return a mock object for cleanup
    return { pane, host };
  }
  
  /**
   * Setup zooming that works with slotted content
   * The Zooming class expects to listen and zoom the same element,
   * but with slots we need to listen on the host and zoom the diagram
   */
  setupZoomingForSlottedContent() {
    const diagram = this._diagram;
    const host = this;
    
    // Track zoom level
    let zoomLevel = 1.0;
    const minZoom = 0.1;
    const maxZoom = 10.0;
    const zoomStep = 0.3;
    
    const applyZoom = () => {
      diagram.style.transform = `scale(${zoomLevel})`;
      diagram.style.transformOrigin = 'top left';
    };
    
    const onWheel = (evt) => {
      // Only zoom when CTRL key is held down
      if (!evt.ctrlKey) return;
      
      // Prevent default browser zoom behavior
      evt.preventDefault();
      evt.stopPropagation();
      
      // Calculate new zoom level
      const zoomDelta = evt.deltaY > 0 ? -zoomStep : zoomStep;
      const newZoomLevel = Math.max(minZoom, Math.min(maxZoom, zoomLevel + zoomDelta));
      
      if (newZoomLevel !== zoomLevel) {
        zoomLevel = newZoomLevel;
        applyZoom();
      }
    };
    
    // Listen on the host element to catch wheel events from everywhere
    lively.addEventListener("architectureViewerWheel", host, "wheel", onWheel, { passive: false });
    
    // Return object with zoom control methods
    return {
      diagram,
      host,
      getZoom: () => zoomLevel,
      setZoom: (level) => {
        zoomLevel = Math.max(minZoom, Math.min(maxZoom, level));
        applyZoom();
      },
      resetZoom: () => {
        zoomLevel = 1.0;
        applyZoom();
      }
    };
  }
  
  /**
   * Disable panning and zooming (cleanup)
   */
  disablePanAndZoom() {
    if (this._panAndZoomEnabled) {
      // Panning cleanup - remove custom event listeners
      if (this._panning) {
        lively.removeEventListener("architectureViewerPanning", document.body.parentElement);
        lively.removeEventListener("architectureViewerPointer", this);
        this._panning = null;
      }
      
      // Zooming cleanup - remove custom event listeners
      if (this._zooming) {
        lively.removeEventListener("architectureViewerWheel", this);
        this._zooming = null;
      }
      
      this._panAndZoomEnabled = false;
    }
  }
  
  /**
   * Load diagram state from an existing lively-class-diagram
   * Deep clones all internal state for independent manipulation
   * @param {LivelyClassDiagram} sourceDiagram - The diagram to copy from
   */
  async fromDiagram(sourceDiagram) {
    if (!sourceDiagram) {
      console.warn('[lively-architecture-viewer] No source diagram provided');
      return;
    }
    
    const diagram = this._diagram;
    if (!diagram) {
      console.error('[lively-architecture-viewer] Diagram element not found');
      return;
    }
    
    // Deep clone all state from source diagram
    diagram._mermaidSource = [...(sourceDiagram._mermaidSource || [])];
    diagram._modules = new Set(sourceDiagram._modules || []);
    diagram._classUrls = new Map(sourceDiagram._classUrls || []);
    diagram._methodData = new Map(sourceDiagram._methodData || []);
    diagram._operations = [...(sourceDiagram._operations || [])];
    diagram._collapsedClasses = new Set(sourceDiagram._collapsedClasses || []);
    diagram._look = sourceDiagram._look || 'handDrawn';
    
    // Share the mermaid instance to avoid reloading
    if (sourceDiagram._mermaid) {
      diagram._mermaid = sourceDiagram._mermaid;
    }
    
    // Render the cloned diagram
    await diagram.render();
  }
  
  /**
   * Add a JavaScript module to the diagram
   * @param {string} url - The URL of the module to analyze
   */
  async addModule(url) {
    if (!this._diagram) return;
    await this._diagram.addModule(url);
  }
  
  /**
   * Recursively add all classes in a given path
   * @param {string} path - The path to search (e.g., 'src/components/literature/')
   */
  async addPath(path) {
    if (!this._diagram) return;
    await this._diagram.addPath(path);
  }
  
  /**
   * Add a URL prefix to the diagram
   * @param {string} url - The URL prefix to search
   */
  async addURL(url) {
    if (!this._diagram) return;
    await this._diagram.addURL(url);
  }
  
  /**
   * Append custom Mermaid source code to the diagram
   * @param {string} source - Mermaid class diagram syntax
   */
  appendMermaid(source) {
    if (!this._diagram) return;
    this._diagram.appendMermaid(source);
  }
  
  /**
   * Clear the diagram
   */
  clear() {
    if (!this._diagram) return;
    this._diagram.clear();
    this.resetView();
  }
  
  /**
   * Reset the view to default position and zoom
   */
  resetView() {
    // Reset zoom using Zooming class
    if (this._zooming) {
      this._zooming.resetZoom();
    }
    
    // Reset scroll on pane
    if (this._pane) {
      this._pane.scrollLeft = 0;
      this._pane.scrollTop = 0;
    }
  }
  
  /**
   * Get the inner diagram component
   * @returns {LivelyClassDiagram} The diagram component
   */
  get diagram() {
    return this._diagram;
  }
  
  /**
   * Setup context menu infrastructure (placeholder for future selection features)
   */
  setupContextMenu() {
    // Future: Add right-click menu for class/method selection
    // For now, just add a basic structure
    
    lively.addEventListener("ArchitectureViewerContextMenu", this, "contextmenu", (evt) => {
      // Placeholder: In the future, this will show a menu for:
      // - Focusing on specific classes
      // - Hiding/showing classes
      // - Filtering methods
      // - Expanding/collapsing hierarchies
      
      // For now, just prevent default to avoid browser context menu
      // evt.preventDefault();
    });
  }
  
  /**
   * Cleanup on disconnect
   */
  disconnectedCallback() {
    this.disablePanAndZoom();
    lively.removeEventListener("ArchitectureViewerContextMenu", this);
  }
  
  livelyMigrate(other) {
    // Reconnect to pane in shadow root
    this._pane = this.get('#pane');
    
    // The diagram is in the pane, it migrates automatically
    // We just need to reconnect our reference to it
    this._diagram = this.querySelector('lively-class-diagram');
    
    this._panAndZoomEnabled = other._panAndZoomEnabled;
    this._panning = other._panning;
    this._zooming = other._zooming;
  }
  
  async livelyExample() {
    // Load some example classes
    await this.ensureDiagram()
    await this.addPath('src/components/literature/');
  }
}
