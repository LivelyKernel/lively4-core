import Morph from 'src/components/widgets/lively-morph.js';
import FileIndex from 'src/client/fileindex.js';

export default class LivelyClassDiagram extends Morph {
  async initialize() {
    this.windowTitle = "Class Diagram";
    
    // Initialize state (preserve during live updates)
    this._mermaidSource = this._mermaidSource || [];
    this._modules = this._modules || new Set();
    this._classUrls = this._classUrls || new Map();
    this._methodData = this._methodData || new Map();
    this._operations = this._operations || [];
    this._collapsedClasses = this._collapsedClasses || new Set();
    
    // Always restore from config if available (takes precedence)
    await this.restoreFromConfig();
    
    this.render()
  }
  
  /**
   * Restore diagram from saved configuration
   */
  async restoreFromConfig() {
    const configAttr = this.getAttribute("diagram-config");
    if (!configAttr) return;
    
    try {
      const config = JSON.parse(configAttr);
      
      if (config.version !== "1.0") {
        console.warn('[lively-class-diagram] Unknown config version:', config.version);
        return;
      }
      
      const operations = config.operations || [];
      const collapsedClasses = config.collapsedClasses || [];
      
      // IMPORTANT: Restore collapsed state BEFORE replaying operations
      // so that classInfoToMermaid() can check it during replay
      this._collapsedClasses = new Set(collapsedClasses);
      this._operations = operations;
      
      // Only replay if we don't already have state (e.g., from livelyMigrate)
      if (this._modules.size === 0 && this._mermaidSource.length === 0) {
        // Replay operations to rebuild diagram
        for (const op of operations) {
          await this.replayOperation(op);
        }
      }
    } catch (error) {
      console.error('[lively-class-diagram] Failed to restore config:', error);
    }
  }
  
  /**
   * Replay a saved operation
   * @param {Object} op - Operation to replay
   */
  async replayOperation(op) {
    // Don't track operations during replay (avoid duplicates)
    const wasReplaying = this._replaying;
    this._replaying = true;
    
    try {
      switch (op.type) {
        case 'addModule':
          await this.addModule(op.url);
          break;
        case 'addURL':
          await this.addURL(op.url);
          break;
        case 'addPath':
          await this.addPath(op.path);
          break;
        case 'appendMermaid':
          this.appendMermaid(op.source);
          break;
        default:
          console.warn('[lively-class-diagram] Unknown operation type:', op.type);
      }
    } finally {
      this._replaying = wasReplaying;
    }
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
    
    // Track operation for save/restore (unless we're replaying)
    if (!this._replaying) {
      this._operations.push({type: 'addModule', url});
    }
    
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
   * Recursively add all classes in a given URL prefix by querying FileIndex
   * @param {string} url - The full URL prefix to search (e.g., 'http://localhost:9005/lively4-core/src/components/literature/')
   * @param {boolean} trackOperation - Whether to track this operation for save/restore (default: true)
   */
  async addURL(url, trackOperation = true) {
    // Track operation for save/restore (unless we're replaying or caller requested no tracking)
    if (trackOperation && !this._replaying) {
      this._operations.push({type: 'addURL', url});
    }
    
    try {
      const fileIndex = FileIndex.current();
      const classInfos = [];
      
      // Query FileIndex for all classes whose URL starts with this prefix
      await fileIndex.db.classes
        .where('url')
        .startsWith(url)
        .each(classInfo => {
          classInfos.push(classInfo);
        });
      
      console.log(`[lively-class-diagram] Found ${classInfos.length} classes in ${url}`);
      
      if (classInfos.length === 0) {
        console.warn(`[lively-class-diagram] No classes found in URL ${url}`);
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
      console.error(`[lively-class-diagram] Error adding URL ${url}:`, error);
      throw error;
    }
  }
  
  /**
   * Recursively add all classes in a given path by querying FileIndex
   * @param {string} path - The path to search (e.g., 'src/components/literature/')
   */
  async addPath(path) {
    // Normalize path
    const originalPath = path; // Store for operation tracking
    path = path.replace(/^\//, '');
    if (!path.endsWith('/')) {
      path += '/';
    }
    
    const fullPath = lively4url + '/' + path;
    
    // Track operation for save/restore (unless we're replaying)
    if (!this._replaying) {
      this._operations.push({type: 'addPath', path: originalPath});
    }
    
    // Don't track in addURL since we already tracked at addPath level
    await this.addURL(fullPath, false);
  }
  
  /**
   * Convert FileIndex class info to Mermaid class diagram syntax
   * @param {Object} classInfo - Class information from FileIndex
   * @returns {string} Mermaid class definition
   */
  async classInfoToMermaid(classInfo) {
    const isCollapsed = this._collapsedClasses.has(classInfo.name);
    
    let mermaid = `  class ${classInfo.name} {\n`;
    
    // Add properties and methods (only if not collapsed)
    if (!isCollapsed && classInfo.methods && classInfo.methods.length > 0) {
      // Separate properties (from getters/setters) and methods
      const properties = new Map(); // propertyName -> {static: boolean, method: methodObj}
      const regularMethods = [];
      
      for (const method of classInfo.methods) {
        if (method.kind === 'get' || method.kind === 'set') {
          // This is a getter or setter - treat as property
          const propertyName = method.name;
          if (!properties.has(propertyName)) {
            // Prefer getter if available (has more useful code usually)
            properties.set(propertyName, {
              static: method.static,
              method: method
            });
          } else if (method.kind === 'get') {
            // If we already have a setter, replace with getter
            properties.get(propertyName).method = method;
          }
        } else {
          // Regular method (including constructors)
          regularMethods.push(method);
        }
      }
      
      // Output properties section (UML standard: properties before methods)
      if (properties.size > 0) {
        for (const [propertyName, info] of properties) {
          const prefix = info.static ? '$' : '+';
          mermaid += `    ${prefix}${propertyName}\n`;
          
          // Store property data for click handlers (use getter/setter location)
          const propertyKey = `${classInfo.name}.${propertyName}`;
          this._methodData.set(propertyKey, {
            url: classInfo.url,
            class: classInfo.name,
            name: propertyName,
            start: info.method.start,
            end: info.method.end,
            static: info.static,
            kind: 'property'
          });
        }
      }
      
      // Output methods section
      for (const method of regularMethods) {
        // Add comment sections before this method (if any)
        if (method.leadingComments && method.leadingComments.length > 0) {
          for (const comment of method.leadingComments) {
            // Check for MD markdown section tags
            const mdMatch = comment.value.match(/^MD((.|\n)*)MD$/m);
            if (mdMatch) {
              // Extract the section name (remove markdown syntax)
              const sectionName = mdMatch[1]
                .replace(/^#+\s*/, '') // Remove leading # symbols
                .trim();
              
              // Add as a COMMENT: prefixed method
              if (sectionName) {
                mermaid += `    COMMENT: ${sectionName}()\n`;
              }
            }
          }
        }
        
        // No prefix for normal methods (everything is public in JavaScript)
        // Use $ for static methods
        const prefix = method.static ? '$' : '';
        mermaid += `    ${prefix}${method.name}()\n`;
        
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
    
    mermaid += `  }\n`;
    
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
    
    // Track operation for save/restore (unless we're replaying)
    if (!this._replaying) {
      this._operations.push({type: 'appendMermaid', source});
    }
    
    this.render();
  }
  
  /**
   * Toggle collapsed state for a class
   * @param {string} className - The name of the class to toggle
   */
  async toggleCollapsed(className) {
    if (this._collapsedClasses.has(className)) {
      this._collapsedClasses.delete(className);
    } else {
      this._collapsedClasses.add(className);
    }
    
    // Rebuild diagram from scratch
    await this.rebuildDiagram();
    
    // Persist the new collapsed state
    this.livelyPrepareSave();
  }
  
  /**
   * Rebuild the entire diagram from operations
   */
  async rebuildDiagram() {
    // Clear current state (but keep operations and collapsed state)
    const savedOperations = this._operations;
    const savedCollapsed = this._collapsedClasses;
    
    this._mermaidSource = [];
    this._modules = new Set();
    this._classUrls = new Map();
    this._methodData = new Map();
    
    // Replay operations
    this._replaying = true;
    for (const op of savedOperations) {
      await this.replayOperation(op);
    }
    this._replaying = false;
    
    // Restore state
    this._operations = savedOperations;
    this._collapsedClasses = savedCollapsed;
    
    await this.render();
  }
  
  /**
   * Clear all diagram content
   */
  clear() {
    this._mermaidSource = [];
    this._modules = new Set();
    this._classUrls = new Map();
    this._methodData = new Map();
    this._operations = []; // Clear operation history
    this._collapsedClasses = new Set(); // Clear collapsed state
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
      
      // Style comment sections
      this.styleSections(diagram);
      
      // Add click handlers to class names
      this.addClickHandlers(diagram);
      
    } catch (error) {
      console.error('Mermaid rendering error:', error);
      diagram.innerHTML = `<pre style="color: red;">Error rendering diagram:\n${error.message}\n\nSource:\n${source}</pre>`;
    }
  }
  
  /**
   * Style comment sections based on markdown hierarchy
   * @param {HTMLElement} diagram - The diagram container element
   */
  styleSections(diagram) {
    const svgElement = diagram.querySelector('svg');
    if (!svgElement) return;
    
    const labelElements = svgElement.querySelectorAll('g.label');
    
    labelElements.forEach(labelGroup => {
      const paragraph = labelGroup.querySelector('.nodeLabel p');
      if (!paragraph) return;
      
      const text = paragraph.textContent.trim();
      
      // Check if this is a comment section
      const commentMatch = text.match(/^COMMENT:\s*(.+?)\(\)$/);
      if (commentMatch) {
        const sectionText = commentMatch[1];
        
        // Detect markdown hierarchy level
        const levelMatch = sectionText.match(/^(#+)\s*(.*)$/);
        const level = levelMatch ? levelMatch[1].length : 1;
        const sectionName = levelMatch ? levelMatch[2] : sectionText;
        
        // Remove "COMMENT: " prefix and "()"
        paragraph.textContent = sectionName;
        
        // Style based on hierarchy level
        const fontSize = level === 1 ? '14px' : '12px';
        const fontWeight = level === 1 ? 'bold' : 'normal';
        const marginTop = level === 1 ? '8px' : '4px';
        
        paragraph.style.cssText = `
          font-weight: ${fontWeight};
          color: #1e90ff;
          font-style: italic;
          text-align: left;
          margin-top: ${marginTop};
          font-size: ${fontSize};
        `;
        
        // Add CSS classes for hierarchy
        paragraph.classList.add('comment-section');
        paragraph.classList.add(`comment-level-${level}`);
        labelGroup.classList.add('comment-section-group');
      }
    });
  }
  
  /**
   * Add click handlers to class names and methods in the rendered diagram
   * Also adds toggle buttons to class headers
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
          
          // Add toggle button to the class header
          this.addToggleButton(paragraph, text);
          
          this.makeClickable(paragraph, async () => {
            await lively.openBrowser(classUrl, true);
          });
        }
      } else if (!paragraph.classList.contains('comment-section')) {
        // This is a method or property (skip if it's a comment section)
        // Match: [prefix]name or [prefix]name() where prefix can be $, +, or both
        const memberMatch = text.match(/^[\$\+]?([a-zA-Z_$][a-zA-Z0-9_$]*)\(\)?$/);
        if (memberMatch && currentClass) {
          const memberName = memberMatch[1];
          const memberKey = `${currentClass}.${memberName}`;
          const memberData = this._methodData.get(memberKey);
          
          if (memberData) {
            this.makeClickable(paragraph, async evt => {
              // Open file and navigate to method/property position
              if (evt.shiftKey) {
                lively.openInspector(memberData)
              } else {                
                await lively.openBrowser(memberData.url, true, {
                  start: memberData.start,
                  end: memberData.end
                });
              }
            });
          }
        }
      }
    });
  }
  
  /**
   * Add a toggle button to a class header
   * @param {HTMLElement} paragraph - The paragraph element containing the class name
   * @param {string} className - The name of the class
   */
  addToggleButton(paragraph, className) {
    const isCollapsed = this._collapsedClasses.has(className);
    const indicator = isCollapsed ? '[+]' : '[-]';
    
    // Find the foreignObject ancestor and expand its width
    let foreignObj = paragraph.closest('foreignObject');
    if (foreignObj) {
      const currentWidth = parseFloat(foreignObj.getAttribute('width'));
      // Add 40px for the toggle button
      foreignObj.setAttribute('width', (currentWidth + 40) + 'px');
    }
    
    // Create a span for the toggle button
    const toggleBtn = document.createElement('span');
    toggleBtn.textContent = ' ' + indicator;
    toggleBtn.style.cssText = `
      cursor: pointer;
      margin-left: 4px;
      color: #666;
      user-select: none;
    `;
    
    // Add click handler that stops propagation (so class name click doesn't fire)
    toggleBtn.addEventListener('click', async (evt) => {
      evt.preventDefault();
      evt.stopPropagation();
      await this.toggleCollapsed(className);
    });
    
    // Append the button to the paragraph
    paragraph.appendChild(toggleBtn);
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
  
  /**
   * Prepare component for saving by storing minimal configuration
   */
  livelyPrepareSave() {
    const config = {
      version: "1.0",
      operations: this._operations || [],
      collapsedClasses: Array.from(this._collapsedClasses || [])
    };
    
    this.setAttribute("diagram-config", JSON.stringify(config));
  }
  
  livelyMigrate(other) {
    this._mermaidSource = other._mermaidSource || [];
    this._modules = other._modules || new Set();
    this._classUrls = other._classUrls || new Map();
    this._methodData = other._methodData || new Map();
    this._operations = other._operations || [];
    this._collapsedClasses = other._collapsedClasses || new Set();
    this._mermaid = other._mermaid;
  }
  
  async livelyExample() {
    // Add all classes from a path recursively
    await this.addPath('src/components/literature/');
  }
}
