/**
 * 3D Treemap renderer for class diagrams
 * Interactive WebGL visualization using gloperate treemap
 * Shows classes with weight (LOC), height (number of methods), color (LOC), and labels
 */
import BaseRenderer from "./base-renderer.js";

export default class Treemap3DRenderer extends BaseRenderer {
  constructor(diagram) {
    super(diagram);
    this.treemapComponent = null;
    this.container = null;
  }

  /**
   * Convert class data to treemap format
   * Maps FileIndex class info to treemap data attributes
   */
  async prepareTreemapData() {
    const classData = [];
    
    // Collect all classes from the diagram's modules
    const FileIndex = await System.import('src/client/fileindex.js').then(m => m.default);
    const fileIndex = FileIndex.current();
    
    for (const url of this.diagram._modules) {
      await fileIndex.db.classes.where("url").equals(url).each(classInfo => {
        // Calculate lines of code (LOC)
        const loc = classInfo.end - classInfo.start;
        
        // Count number of methods (NOM)
        const nom = classInfo.methods ? classInfo.methods.length : 0;
        
        classData.push({
          name: classInfo.name,
          url: classInfo.url,
          loc: loc,
          nom: nom,
          classInfo: classInfo
        });
      });
    }
    
    return classData;
  }

  /**
   * Render the 3D treemap visualization
   */
  async render(target) {
    try {
      target.innerHTML = '<div style="padding: 20px;">Building 3D treemap...</div>';
      
      const classData = await this.prepareTreemapData();
      
      if (classData.length === 0) {
        target.innerHTML = '<div style="padding: 20px;">No classes to display</div>';
        return;
      }
      
      // Clear target
      target.innerHTML = '';
      
      // Get diagram's current extent FIRST (before creating container)
      // This ensures we match the actual diagram size when switching renderers
      const diagramExtent = lively.getExtent(this.diagram);
      const width = diagramExtent.x > 0 ? diagramExtent.x : 1000;
      const height = diagramExtent.y > 0 ? diagramExtent.y : 600;
      
      // Create container for treemap with explicit size matching diagram
      const container = document.createElement('div');
      container.style.position = 'relative';
      container.style.width = width + 'px';
      container.style.height = height + 'px';
      container.style.background = '#1a1a1a';
      target.appendChild(container);
      
      // Store container reference for resize handling
      this.container = container;
      
      // Wait for container to be laid out
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      
      // Create lively-treemap component using lively.create for proper initialization
      const treemap = await lively.create('lively-treemap');
      treemap.style.position = 'absolute';
      treemap.style.top = '0';
      treemap.style.left = '0';
      container.appendChild(treemap);
      
      // CRITICAL: WebGL canvas needs explicit pixel dimensions, not percentages
      lively.setExtent(treemap, lively.pt(width, height));
      
      // Store reference for cleanup
      this.treemapComponent = treemap;
      
      // Wait for WebGL context to initialize
      await lively.sleep(200);
      
      // Set treemap data with class metrics
      treemap.setData({
        data: classData,
        weightAttributeName: "loc",      // Size by lines of code
        heightAttributeName: "nom",      // Height by number of methods
        colorAttributeName: "loc",       // Color by lines of code
        labelAttributeName: "name"       // Label with class name
      });
      
      // Configure appearance
      treemap.setColorScheme("viridis");
      
      // Set up click handler for navigation
      treemap.setNodeSelectFunction((node) => {
        if (node && node.data && node.data.url) {
          lively.openBrowser(node.data.url, true);
        }
      });
      
      // Forward context menu events to diagram for renderer switching
      // Listen on both the component and the canvas (WebGL canvas captures events)
      const contextMenuHandler = (evt) => {
        evt.preventDefault();
        evt.stopPropagation();
        // Trigger diagram's context menu handler
        this.diagram.onContextMenu(evt);
      };
      
      treemap.addEventListener('contextmenu', contextMenuHandler);
      
      // Also listen on the canvas element inside the treemap
      const canvas = treemap.get('#treemap-canvas');
      if (canvas) {
        canvas.addEventListener('contextmenu', contextMenuHandler);
      }
      
      // Force resize after setup to ensure proper scaling
      // Use requestAnimationFrame to ensure WebGL context is ready
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      
      if (treemap.onExtentChanged) {
        treemap.onExtentChanged();
      }
      
      // Additional resize trigger to ensure the treemap renderer updates
      if (treemap.treemapRenderer && treemap.treemapRenderer.resize) {
        treemap.treemapRenderer.resize();
      }
      
    } catch (error) {
      console.error('[Treemap3DRenderer] Rendering error:', error);
      target.innerHTML = `<pre style="color: red;">Error rendering 3D treemap:\n${error.message}\n${error.stack}</pre>`;
    }
  }

  /**
   * Handle diagram resize - update treemap dimensions
   * Called by lively-class-diagram when extent-changed event fires
   */
  async onResize() {
    if (this.treemapComponent && this.diagram) {
      // Small delay to let browser complete layout before measuring
      await lively.sleep(10);
      
      // Get diagram extent and apply to treemap
      const extent = lively.getExtent(this.diagram);
      
      // CRITICAL: Use lively.setExtent() with explicit pixel dimensions
      // This properly updates the WebGL canvas size
      lively.setExtent(this.treemapComponent, extent);
    }
  }

  /**
   * Clean up WebGL resources when switching renderers
   */
  dispose() {
    // Clean up treemap component
    if (this.treemapComponent) {
      // Clean up WebGL context and resources
      if (this.treemapComponent.dispose) {
        this.treemapComponent.dispose();
      }
      this.treemapComponent.remove();
      this.treemapComponent = null;
    }
    
    // Clear container reference
    this.container = null;
  }
}
