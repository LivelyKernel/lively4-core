/**
 * 3D Treemap renderer for class diagrams
 * Interactive WebGL visualization using gloperate treemap
 * Shows classes with methods as sub-blocks
 * Encoding: Volume = LOC (via sqrt encoding), Color = LOC
 */
import BaseRenderer from "./base-renderer.js";

export default class Treemap3DRenderer extends BaseRenderer {
  constructor(diagram) {
    super(diagram);
    this.treemapComponent = null;
    this.container = null;
  }

  /**
   * Convert class data to hierarchical treemap format
   * Maps FileIndex class info to treemap data attributes with methods as children
   * Uses square root encoding: Volume = Area × Height = sqrt(LOC) × sqrt(LOC) = LOC
   */
  async prepareTreemapData() {
    const classData = [];
    
    // Collect all classes from the diagram's modules
    const FileIndex = await System.import('src/client/fileindex.js').then(m => m.default);
    const fileIndex = FileIndex.current();
    
    for (const url of this.diagram._modules) {
      await fileIndex.db.classes.where("url").equals(url).each(classInfo => {
        // Calculate lines of code (LOC) for the whole class
        const classLoc = classInfo.end - classInfo.start;
        
        // Square root encoding for volume = LOC
        const sqrtLoc = Math.sqrt(Math.max(classLoc, 1));
        
        // Count number of methods (NOM)
        const nom = classInfo.methods ? classInfo.methods.length : 0;
        
        // Build method children
        const methodChildren = [];
        if (classInfo.methods && classInfo.methods.length > 0) {
          for (const method of classInfo.methods) {
            const methodLoc = method.end - method.start;
            const methodSqrtLoc = Math.sqrt(Math.max(methodLoc, 1));
            
            methodChildren.push({
              name: method.name,
              loc: methodLoc,
              sqrt_loc: methodSqrtLoc,
              nom: 0,  // Methods don't have sub-methods (height = 0)
              url: url,
              methodInfo: { ...method, url: url }
            });
          }
        }
        
        classData.push({
          name: classInfo.name,
          url: classInfo.url,
          loc: classLoc,
          sqrt_loc: sqrtLoc,
          nom: nom,
          classInfo: classInfo,
          children: methodChildren.length > 0 ? methodChildren : undefined
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
      // Volume = Area × Height = sqrt(LOC) × sqrt(LOC) = LOC
      treemap.setData({
        data: classData,
        weightAttributeName: "sqrt_loc",  // Area by sqrt(LOC)
        heightAttributeName: "sqrt_loc",  // Height by sqrt(LOC) → Volume = LOC
        colorAttributeName: "loc",        // Color by lines of code
        labelAttributeName: "name"        // Label with class name
      });
      
      // Configure appearance
      treemap.setColorScheme("viridis");
      
      // Set up click handler for navigation
      treemap.setNodeSelectFunction(async (node) => {
        if (node && node.data) {
          // Handle method clicks - use diagram's method selection handler
          if (node.data.methodInfo) {
            await this.diagram.onMethodSelected(node.data.methodInfo, new MouseEvent('click'), null);
          } 
          // Handle class clicks - open in browser
          else if (node.data.url) {
            lively.openBrowser(node.data.url, true);
          }
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
