import Morph from 'src/components/widgets/lively-morph.js';
import FileIndex from 'src/client/fileindex.js';

export default class LivelyClassDiagram extends Morph {
  async initialize() {
    this.windowTitle = "Class Diagram";
    
    // Initialize state (preserve during live updates)
    this._mermaidSource = this._mermaidSource || [];
    this._modules = this._modules || new Set();
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
      const mermaidClass = await this.classInfoToMermaid(classInfo);
      this._mermaidSource.push(mermaidClass);
    }
    
    await this.render();
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
        const prefix = method.static ? '+' : (method.kind === 'get' || method.kind === 'set' ? '~' : '+');
        const kind = method.kind !== 'method' ? ` [${method.kind}]` : '';
        mermaid += `    ${prefix}${method.name}()${kind}\n`;
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
    this.render();
  }
  
  /**
   * Get the current Mermaid source code
   * @returns {string} Complete Mermaid diagram source
   */
  getMermaidSource() {
    if (this._mermaidSource.length === 0) {
      return `classDiagram
  class Empty {
    +info() String
  }`;
    }
    
    return `classDiagram\n${this._mermaidSource.join('\n')}`;
  }
  
  /**
   * Render the diagram using Mermaid
   */
  async render() {
    const diagram = this.get('#diagram');
    if (!diagram) return;
    
    const source = this.getMermaidSource();
    
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
      
    } catch (error) {
      console.error('Mermaid rendering error:', error);
      diagram.innerHTML = `<pre style="color: red;">Error rendering diagram:\n${error.message}\n\nSource:\n${source}</pre>`;
    }
  }
  
  livelyMigrate(other) {
    this._mermaidSource = other._mermaidSource || [];
    this._modules = other._modules || new Set();
    this._mermaid = other._mermaid;
  }
  
  async livelyExample() {
    // Add an example module
    const exampleUrl = lively4url + "/src/components/widgets/lively-morph.js";
    await this.addModule(exampleUrl);
    
    // Add a custom class relationship
    this.appendMermaid(`  class CustomExample {
    +doSomething()
    +getValue() String
  }
  CustomExample <|-- Morph`);
  }
}
