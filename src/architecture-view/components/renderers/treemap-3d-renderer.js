/*MD
# 3D Treemap renderer for class diagrams

Interactive WebGL visualization using gloperate treemap.
Classes and methods shown as 3D blocks with volume = LOC, color = LOC.

![](treemap-3d-renderer.png)

MD*/
import BaseRenderer from "./base-renderer.js";

export default class Treemap3DRenderer extends BaseRenderer {
  constructor(diagram) {
    super(diagram);
    this.treemapComponent = null;
    this.container = null;
    this.nodeDataMap = new Map();
  }

  async prepareTreemapData() {
    const classData = [];
    this.nodeDataMap.clear();
    
    const FileIndex = await System.import('src/client/fileindex.js').then(m => m.default);
    const fileIndex = FileIndex.current();
    
    for (const url of this.diagram._modules) {
      await fileIndex.db.classes.where("url").equals(url).each(classInfo => {
        const classLoc = classInfo.end - classInfo.start;
        const sqrtLoc = Math.sqrt(Math.max(classLoc, 1));
        const nom = classInfo.methods ? classInfo.methods.length : 0;
        
        const methodChildren = [];
        if (classInfo.methods && classInfo.methods.length > 0) {
          for (const method of classInfo.methods) {
            const methodLoc = method.end - method.start;
            const methodSqrtLoc = Math.sqrt(Math.max(methodLoc, 1));
            
            const methodData = {
              name: method.name,
              loc: methodLoc,
              sqrt_loc: methodSqrtLoc,
              nom: 0,
              url: url,
              methodInfo: { ...method, url: url, class: classInfo.name }
            };
            
            methodChildren.push(methodData);
            this.nodeDataMap.set(`${classInfo.name}.${method.name}`, methodData);
          }
        }
        
        const classData_ = {
          name: classInfo.name,
          url: classInfo.url,
          loc: classLoc,
          sqrt_loc: sqrtLoc,
          nom: nom,
          classInfo: classInfo,
          children: methodChildren.length > 0 ? methodChildren : undefined
        };
        
        classData.push(classData_);
        this.nodeDataMap.set(classInfo.name, classData_);
      });
    }
    
    return classData;
  }

  async render(target) {
    try {
      target.innerHTML = '<div style="padding: 20px;">Building 3D treemap...</div>';
      
      const classData = await this.prepareTreemapData();
      
      if (classData.length === 0) {
        target.innerHTML = '<div style="padding: 20px;">No classes to display</div>';
        return;
      }
      
      target.innerHTML = '';
      
      const diagramExtent = lively.getExtent(this.diagram);
      const width = diagramExtent.x > 0 ? diagramExtent.x : 1000;
      const height = diagramExtent.y > 0 ? diagramExtent.y : 600;
      
      const container = document.createElement('div');
      container.style.position = 'relative';
      container.style.width = width + 'px';
      container.style.height = height + 'px';
      container.style.background = '#1a1a1a';
      target.appendChild(container);
      
      this.container = container;
      
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      
      const treemap = await lively.create('lively-treemap');
      treemap.style.position = 'absolute';
      treemap.style.top = '0';
      treemap.style.left = '0';
      container.appendChild(treemap);
      
      lively.setExtent(treemap, lively.pt(width, height));
      this.treemapComponent = treemap;
      
      await lively.sleep(200);
      
      treemap.setData({
        data: classData,
        weightAttributeName: "sqrt_loc",
        heightAttributeName: "sqrt_loc",
        colorAttributeName: "loc",
        labelAttributeName: "name"
      });
      
      treemap.setColorScheme("viridis");
      
      treemap.setNodeSelectFunction(async (event) => {
        if (!event || event.node === undefined) return;
        
        const nodeId = event.node;
        const nodeLabel = treemap.getLabel(nodeId);
        if (!nodeLabel) return;
        
        // Construct full qualified name for method nodes (ClassName.methodName)
        let lookupKey = nodeLabel;
        const parentId = treemap.getParentID(nodeId);
        if (parentId !== undefined) {
          const parentLabel = treemap.getLabel(parentId);
          if (parentLabel) {
            lookupKey = `${parentLabel}.${nodeLabel}`;
          }
        }
        
        const nodeData = this.nodeDataMap.get(lookupKey);
        if (!nodeData) return;
        
        if (nodeData.methodInfo) {
          // Convert canvas-relative coordinates to global viewport coordinates
          let clientX = 0, clientY = 0;
          if (event.point) {
            const canvas = treemap.get('#treemap-canvas');
            if (canvas) {
              const canvasGlobalPos = lively.getClientPosition(canvas);
              clientX = canvasGlobalPos.x + event.point[0];
              clientY = canvasGlobalPos.y + event.point[1];
            }
          }
          
          const syntheticEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: clientX,
            clientY: clientY
          });
          await this.diagram.onMethodSelected(nodeData.methodInfo, syntheticEvent, null);
        } else if (nodeData.url) {
          lively.openBrowser(nodeData.url, true);
        }
      });
      
      const contextMenuHandler = (evt) => {
        evt.preventDefault();
        evt.stopPropagation();
        this.diagram.onContextMenu(evt);
      };
      
      treemap.addEventListener('contextmenu', contextMenuHandler);
      
      const canvas = treemap.get('#treemap-canvas');
      if (canvas) {
        canvas.addEventListener('contextmenu', contextMenuHandler);
      }
      
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      
      if (treemap.onExtentChanged) {
        treemap.onExtentChanged();
      }
      
      if (treemap.treemapRenderer && treemap.treemapRenderer.resize) {
        treemap.treemapRenderer.resize();
      }
      
    } catch (error) {
      console.error('[Treemap3DRenderer] Rendering error:', error);
      target.innerHTML = `<pre style="color: red;">Error rendering 3D treemap:\n${error.message}\n${error.stack}</pre>`;
    }
  }

  async onResize() {
    if (this.treemapComponent && this.diagram) {
      await lively.sleep(10);
      const extent = lively.getExtent(this.diagram);
      lively.setExtent(this.treemapComponent, extent);
    }
  }

  dispose() {
    if (this.treemapComponent) {
      if (this.treemapComponent.dispose) {
        this.treemapComponent.dispose();
      }
      this.treemapComponent.remove();
      this.treemapComponent = null;
    }
    this.container = null;
  }
}
