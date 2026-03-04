import Morph from 'src/components/widgets/lively-morph.js';
import FileIndex from 'src/client/fileindex.js';

export default class LivelyClassDiagram extends Morph {
  async initialize() {
    this.windowTitle = "Class Diagram";
    
    // Initialize state (preserve during live updates)
    this._mermaidSource = this._mermaidSource || [];
    this._modules = this._modules || new Set();
    this._classUrls = this._classUrls || new Map(); // Map class names to URLs
    this._methodData = this._methodData || new Map(); // Map "ClassName.methodName" to method data
    this.render()
  }
  
  async loadMermaid() {
    if (this._mermaid) return this._mermaid;
    if (this._mermaidLoadError) {
      throw new Error('Mermaid failed to load previously');
    }
    if (this._mermaidLoading) {
      return this._mermaidLoading;
    }
    
    this._mermaidLoading = (async () => {
      try {
        // Load mermaid and ELK modules through DOM (bypasses Babel transpilation issues)
        const mermaidModule = await lively.loadJavaScriptModuleThroughDOM(
          'mermaid',
          'https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.esm.min.mjs'
        );
        const elkModule = await lively.loadJavaScriptModuleThroughDOM(
          'mermaid-elk',
          'https://cdn.jsdelivr.net/npm/@mermaid-js/layout-elk@0.2.0/dist/mermaid-layout-elk.esm.min.mjs'
        );
        
        this._mermaid = mermaidModule.default;
        // Register ELK layout
        if (!this._mermaid._elkRegistered) {
          await this._mermaid.registerLayoutLoaders(elkModule.default);
          this._mermaid._elkRegistered = true;
        }
        
        // Initialize Mermaid
        this._mermaid.initialize({
          startOnLoad: false,
          theme: 'default',
          logLevel: 'error',
          securityLevel: 'loose',
          flowchart: {
            defaultRenderer: 'elk',
            useMaxWidth: true,
            htmlLabels: true
          }
        });
        
        return this._mermaid;
      } catch (error) {
        console.error('[lively-class-diagram] Failed to load mermaid:', error);
        this._mermaidLoadError = error;
        throw error;
      } finally {
        this._mermaidLoading = null;
      }
    })();
    
    return this._mermaidLoading;
  }
  
  /**
   * Add a JavaScript module to the diagram by extracting class information from FileIndex
   * @param {string} url - The URL of the module to analyze
   */
  async addModule(url) {
    // Normalize URL
    url = url.replace(/^\//, lively4url + '/');
    
    if (this._modules.has(url)) {
      return;
    }
    
    this._modules.add(url);
    
    const fileIndex = FileIndex.current();
    const classInfos = [];
    
    // Query FileIndex for classes in this module
    await fileIndex.db.classes.where("url").equals(url).each(classInfo => {
      classInfos.push(classInfo);
    });
    
    if (classInfos.length === 0) {
      console.warn(`[lively-class-diagram] No classes found in ${url}`);
      return;
    }
    
    // Convert class info to Mermaid syntax
    for (const classInfo of classInfos) {
      this._classUrls.set(classInfo.name, url); // Store class -> URL mapping
      const mermaidClass = await this.classInfoToMermaid(classInfo);
      this._mermaidSource.push(mermaidClass);
    }
    
    await this.render();
  }
  
  /**
   * Recursively add all classes in a given path by querying FileIndex
   * @param {string} path - The path to search (e.g., 'src/components/literature/')
   */
  async addPath(path) {
    // Normalize path
    path = path.replace(/^\//, '');
    if (!path.endsWith('/')) {
      path += '/';
    }
    
    const fullPath = lively4url + '/' + path;
    
    try {
      const fileIndex = FileIndex.current();
      const classInfos = [];
      
      // Query FileIndex for all classes whose URL starts with this path
      await fileIndex.db.classes
        .where('url')
        .startsWith(fullPath)
        .each(classInfo => {
          classInfos.push(classInfo);
        });
      
      console.log(`[lively-class-diagram] Found ${classInfos.length} classes in ${path}`);
      
      if (classInfos.length === 0) {
        console.warn(`[lively-class-diagram] No classes found in path ${path}`);
        return;
      }
      
      // Convert each class to Mermaid syntax
      for (const classInfo of classInfos) {
        // Skip if already added
        if (this._modules.has(classInfo.url)) {
          continue;
        }
        
        this._modules.add(classInfo.url);
        this._classUrls.set(classInfo.name, classInfo.url); // Store class -> URL mapping
        
        const mermaidClass = await this.classInfoToMermaid(classInfo);
        this._mermaidSource.push(mermaidClass);
      }
      
      await this.render();
      
    } catch (error) {
      console.error(`[lively-class-diagram] Error adding path ${path}:`, error);
      throw error;
    }
  }
  
  /**
   * Convert FileIndex class info to Mermaid class diagram syntax
   * @param {Object} classInfo - Class information from FileIndex
   * @returns {string} Mermaid class definition
   */
  async classInfoToMermaid(classInfo) {
    let mermaid = `  class ${classInfo.name} {\n`;
    
    // Add methods
    if (classInfo.methods && classInfo.methods.length > 0) {
      for (const method of classInfo.methods) {
        // No prefix for normal methods (everything is public in JavaScript)
        // Use $ for static methods
        const prefix = method.static ? '$' : '';
        const kind = method.kind !== 'method' ? ` [${method.kind}]` : '';
        mermaid += `    ${prefix}${method.name}()${kind}\n`;
        
        // Store method data for click handlers
        const methodKey = `${classInfo.name}.${method.name}`;
        this._methodData.set(methodKey, {
          url: classInfo.url,
          class: classInfo.name,
          name: method.name,
          start: method.start,
          end: method.end,
          static: method.static,
          kind: method.kind
        });
      }
    }
    
    mermaid += '  }\n';
    
    // Add inheritance relationship
    if (classInfo.superClassName && classInfo.superClassName !== 'Object') {
      mermaid += `  ${classInfo.superClassName} <|-- ${classInfo.name}\n`;
    }
    
    return mermaid;
  }
  
  /**
   * Append custom Mermaid source code to the diagram
   * @param {string} source - Mermaid class diagram syntax
   */
  appendMermaid(source) {
    this._mermaidSource.push(source);
    this.render();
  }
  
  /**
   * Clear all diagram content
   */
  clear() {
    this._mermaidSource = [];
    this._modules = new Set();
    this._classUrls = new Map();
    this._methodData = new Map();
    this.render();
  }
  
  /**
   * Get the current Mermaid source code
   * @returns {string} Complete Mermaid diagram source
   */
  getMermaidSource() {
    if (this._mermaidSource.length === 0) {
      return ``;
    }
    
    return `---
config:
  layout: elk
  look: handDrawn
  theme: neutral
---
classDiagram\n${this._mermaidSource.join('\n')}`;
  }
  
  /**
   * Render the diagram using Mermaid
   */
  async render() {
    const diagram = this.get('#diagram');
    if (!diagram) return;
    
    const source = this.getMermaidSource() ;
    
    try {
      // Show loading message
      diagram.innerHTML = '<div style="padding: 20px;">Loading Mermaid...</div>';
      
      const mermaid = await this.loadMermaid();
      
      // Generate unique ID for this diagram
      const id = 'class-diagram-' + Date.now();
      
      // Render with Mermaid
      const {svg} = await mermaid.render(id, source);
      
      // Clear and insert SVG
      diagram.innerHTML = svg;
      diagram.classList.add('mermaid');
      
      // Add click handlers to class names
      this.addClickHandlers(diagram);
      
    } catch (error) {
      console.error('Mermaid rendering error:', error);
      diagram.innerHTML = `<pre style="color: red;">Error rendering diagram:\n${error.message}\n\nSource:\n${source}</pre>`;
    }
  }
  
  /**
   * Add click handlers to class names and methods in the rendered diagram
   * @param {HTMLElement} diagram - The diagram container element
   */
  addClickHandlers(diagram) {
    // Find all text elements in the SVG
    // Mermaid uses foreignObject with <p> tags for class names and methods
    const svgElement = diagram.querySelector('svg');
    if (!svgElement) return;
    
    // Find all label elements
    const labelElements = svgElement.querySelectorAll('g.label');
    
    let currentClass = null;
    
    labelElements.forEach(labelGroup => {
      const paragraph = labelGroup.querySelector('.nodeLabel p');
      if (!paragraph) return;
      
      const text = paragraph.textContent.trim();
      
      // Check if this is a class name (has font-weight: bolder in style)
      const isBold = labelGroup.getAttribute('style')?.includes('font-weight: bolder');
      
      if (isBold) {
        // This is a class name
        const classUrl = this._classUrls.get(text);
        if (classUrl) {
          currentClass = text;
          this.makeClickable(paragraph, async () => {
            await lively.openBrowser(classUrl, true);
          });
        }
      } else {
        // This is a method
        const methodMatch = text.match(/^\$?([a-zA-Z_$][a-zA-Z0-9_$]*)\(\)/);
        if (methodMatch && currentClass) {
          const methodName = methodMatch[1];
          const methodKey = `${currentClass}.${methodName}`;
          const methodData = this._methodData.get(methodKey);
          
          if (methodData) {
            this.makeClickable(paragraph, async evt => {
              // Open file and navigate to method position
              if (evt.shiftKey) {
                lively.openInspector(methodData)
              } else {                
                await lively.openBrowser(methodData.url, true, {
                  start: methodData.start,
                  end: methodData.end
                });
              }
            });
          }
        }
      }
    });
  }
  
  /**
   * Make an element clickable with visual feedback
   * @param {HTMLElement} element - The element to make clickable
   * @param {Function} onClick - Click handler function
   */
  makeClickable(element, onClick) {
    element.style.cursor = 'pointer';
  
    
    element.addEventListener('click', async (evt) => {
      evt.preventDefault();
      evt.stopPropagation();
      await onClick(evt);
    });
    
  }
  
  livelyMigrate(other) {
    this._mermaidSource = other._mermaidSource || [];
    this._modules = other._modules || new Set();
    this._classUrls = other._classUrls || new Map();
    this._methodData = other._methodData || new Map();
    this._mermaid = other._mermaid;
  }
  
  async livelyExample() {
    // Add all classes from a path recursively
    await this.addPath('src/components/literature/');
  }
}
