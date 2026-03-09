import Morph from 'src/components/widgets/lively-morph.js';
import FileIndex from 'src/client/fileindex.js';
import ContextMenu from 'src/client/contextmenu.js';

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
    this._compositionRelationships = this._compositionRelationships || new Map();
    
    // Read look attribute (default to handDrawn)
    this._look = this.getAttribute('look') || 'handDrawn';
    
    // Always restore from config if available (takes precedence)
    await this.restoreFromConfig();
    
    this.addEventListener('contextmenu', evt => this.onContextMenu(evt), false);
    
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
      const compositionRelationships = config.compositionRelationships || [];
      
      // IMPORTANT: Restore collapsed state BEFORE replaying operations
      // so that classInfoToMermaid() can check it during replay
      this._collapsedClasses = new Set(collapsedClasses);
      this._operations = operations;
      
      // Restore composition relationships
      this._compositionRelationships = new Map(
        compositionRelationships.map(({parent, children}) => [parent, new Set(children)])
      );
      
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
      
      // Load corresponding HTML template and extract component references
      await this.loadComponentReferences(url, classInfo.name);
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
   * Extract custom component references from HTML template
   * @param {string} htmlContent - HTML template content
   * @returns {Set<string>} Set of component tag names (e.g., 'lively-container-navbar')
   */
  extractComponentReferences(htmlContent) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const components = new Set();
    
    // Check if content is wrapped in a <template> tag
    const templateElement = doc.querySelector('template');
    const searchRoot = templateElement ? templateElement.content : doc;
    
    // Find all custom elements (tags with hyphens = web components)
    const allElements = searchRoot.querySelectorAll('*');
    allElements.forEach(el => {
      const tagName = el.tagName.toLowerCase();
      // Web components must have a hyphen in the tag name
      // Exclude the template tag itself
      if (tagName.includes('-') && tagName !== 'template') {
        components.add(tagName);
      }
    });
    
    return components;
  }
  
  /**
   * Convert tag name to class name
   * lively-container-navbar → LivelyContainerNavbar
   */
  tagToClassName(tagName) {
    return tagName
      .split('-')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
  }
  
  /**
   * Convert class name to likely file path
   * LivelyContainerNavbar → src/components/tools/lively-container-navbar.js
   */
  classNameToPath(className) {
    // Convert PascalCase to kebab-case
    const kebab = className
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .toLowerCase();
    
    // Try common component locations in order of likelihood
    const possiblePaths = [
      `src/components/tools/${kebab}.js`,
      `src/components/widgets/${kebab}.js`,
      `src/components/demo/${kebab}.js`,
      `templates/${kebab}.js`
    ];
    
    return possiblePaths;
  }
  
  /**
   * Load HTML template and extract component references
   * @param {string} jsUrl - URL of the JS module
   * @param {string} className - Name of the class
   */
  async loadComponentReferences(jsUrl, className) {
    // Derive HTML path from JS path
    const htmlUrl = jsUrl.replace(/\.js$/, '.html');
    
    try {
      const response = await fetch(htmlUrl);
      if (response.ok) {
        const htmlContent = await response.text();
        const referencedComponents = this.extractComponentReferences(htmlContent);
        
        // Log only if components found
        if (referencedComponents.size > 0) {
          console.log(`[lively-class-diagram] Found ${referencedComponents.size} component references in ${htmlUrl}`);
        }
        
        // For each referenced component, add it collapsed
        for (const componentTag of referencedComponents) {
          await this.addReferencedComponent(componentTag, className);
        }
      }
    } catch (error) {
      // HTML file might not exist - this is okay, don't log unless it's an actual error
      if (error.message && !error.message.includes('404')) {
        console.warn(`[lively-class-diagram] Error loading HTML for ${jsUrl}:`, error.message);
      }
    }
  }
  
  /**
   * Add a referenced component to the diagram in collapsed state
   * @param {string} componentTag - Tag name (e.g., 'lively-container-navbar')
   * @param {string} parentClass - Class that references this component
   */
  async addReferencedComponent(componentTag, parentClass) {
    // Convert tag to class name (lively-container-navbar → LivelyContainerNavbar)
    const componentClassName = this.tagToClassName(componentTag);
    
    // Try to find the component in FileIndex
    const possiblePaths = this.classNameToPath(componentClassName);
    const fileIndex = FileIndex.current();
    
    // Try each possible path
    for (const relativePath of possiblePaths) {
      const componentUrl = lively4url + '/' + relativePath;
      
      // Check if component exists in FileIndex
      const classInfos = [];
      await fileIndex.db.classes.where("url").equals(componentUrl).each(classInfo => {
        classInfos.push(classInfo);
      });
      
      if (classInfos.length > 0) {
        // Found it! Use the ACTUAL class name from FileIndex
        const actualClassName = classInfos[0].name;
        
        // Track composition relationship with actual class name
        if (!this._compositionRelationships.has(parentClass)) {
          this._compositionRelationships.set(parentClass, new Set());
        }
        this._compositionRelationships.get(parentClass).add(actualClassName);
        
        // Check if this is a new component or already in diagram
        const isNewComponent = !this._modules.has(componentUrl);
        
        if (isNewComponent) {
          console.log(`[lively-class-diagram] Adding referenced component ${actualClassName} from ${componentUrl}`);
          
          // Add to modules set to prevent infinite recursion
          this._modules.add(componentUrl);
          
          // New component - add it collapsed by default
          // But ONLY if not during replay (replay preserves saved collapsed state)
          if (!this._replaying) {
            this._collapsedClasses.add(actualClassName);
          }
          
          // Convert class info to Mermaid syntax
          for (const classInfo of classInfos) {
            this._classUrls.set(classInfo.name, componentUrl);
            const mermaidClass = await this.classInfoToMermaid(classInfo);
            this._mermaidSource.push(mermaidClass);
          }
        }
        return; // Found and added, stop searching
      }
    }
    
    // Component not found - track with converted name as fallback
    console.log(`[lively-class-diagram] Component ${componentClassName} not found in FileIndex`);
    
    // Still track the composition relationship even if not found
    if (!this._compositionRelationships.has(parentClass)) {
      this._compositionRelationships.set(parentClass, new Set());
    }
    this._compositionRelationships.get(parentClass).add(componentClassName);
  }
  
  formatParams(params) {
    if (!params || params.length === 0) return '';
    
    // Filter and format parameters - only show simple identifiers
    const formattedParams = params
      .map(p => {
        if (p.type === 'rest') return `...${p.name}`;
        if (p.type === 'destructure') return null; // Skip destructured params
        return p.name;
      })
      .filter(name => {
        if (name === null) return false;
        
        // Only include normally-formed identifiers (no special syntax)
        // Valid JS identifier: starts with letter/underscore/dollar, 
        // followed by letters/digits/underscores/dollars
        const simpleIdentifierPattern = /^\.{0,3}[a-zA-Z_$][a-zA-Z0-9_$]*$/;
        return simpleIdentifierPattern.test(name);
      });
    
    return formattedParams.join(', ');
  }

  /**
   * Extract hashtags from method comments
   * #public-api
   */
  extractHashtags(leadingComments) {
    if (!leadingComments || leadingComments.length === 0) return [];
    
    const hashtags = new Set();
    const hashtagPattern = /#([a-zA-Z][a-zA-Z0-9_-]*)/g;
    
    for (const comment of leadingComments) {
      const commentText = comment.value || '';
      let match;
      while ((match = hashtagPattern.exec(commentText)) !== null) {
        hashtags.add(match[1]);
      }
    }
    
    return Array.from(hashtags);
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
          const propertyHashtags = this.extractHashtags(info.method.leadingComments);
          this._methodData.set(propertyKey, {
            url: classInfo.url,
            class: classInfo.name,
            name: propertyName,
            start: info.method.start,
            end: info.method.end,
            static: info.static,
            kind: 'property',
            leadingComments: info.method.leadingComments || [],
            hashtags: propertyHashtags
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
        mermaid += `    ${prefix}${method.name}(${this.formatParams(method.params)})\n`;
        
        // Store method data for click handlers
        const methodKey = `${classInfo.name}.${method.name}`;
        const methodHashtags = this.extractHashtags(method.leadingComments);
        this._methodData.set(methodKey, {
          url: classInfo.url,
          class: classInfo.name,
          name: method.name,
          start: method.start,
          end: method.end,
          static: method.static,
          kind: method.kind,
          leadingComments: method.leadingComments || [],
          hashtags: methodHashtags
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
   * Get the current look style
   * @returns {string} Current look (e.g., 'handDrawn', 'classic')
   */
  get look() {
    return this._look || 'handDrawn';
  }
  
  /**
   * Set the look style
   * @param {string} value - Look style ('handDrawn', 'classic', etc.)
   */
  set look(value) {
    this._look = value;
    this.setAttribute('look', value);
    this.render();
  }
  
  /**
   * Check if currently using hand-drawn style
   * @returns {boolean} True if hand-drawn, false otherwise
   */
  get isHandDrawn() {
    return this.look === 'handDrawn';
  }
  
  /**
   * Toggle between hand-drawn and classic rendering styles
   * @param {Event} evt - Optional event for icon updates
   * @param {HTMLElement} item - Optional menu item for icon updates
   */
  toggleHandDrawn(evt, item) {
    this.look = this.isHandDrawn ? 'classic' : 'handDrawn';
    
    // Update icon if menu item provided
    if (item) {
      const icon = this.isHandDrawn 
        ? '<i class="fa fa-check-circle-o" aria-hidden="true"></i>'
        : '<i class="fa fa-circle-o" aria-hidden="true"></i>';
      item.querySelector(".icon").innerHTML = icon;
    }
    
    lively.notify(`Diagram style: ${this.look}`);
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
   * Handle context menu on diagram
   */
  onContextMenu(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    
    const chosenIcon = '<i class="fa fa-check-circle-o" aria-hidden="true"></i>';
    const unchosenIcon = '<i class="fa fa-circle-o" aria-hidden="true"></i>';
    const icon = this.isHandDrawn ? chosenIcon : unchosenIcon;
    
    let menuItems = [
      ['Hand-Drawn Style', (evt, item) => this.toggleHandDrawn(evt, item), '', icon]
    ];

    const menu = new ContextMenu(this, menuItems);
    menu.openIn(document.body, evt, this);
  }
  
  /**
   * Rebuild the entire diagram from operations
   */
  async rebuildDiagram() {
    // IMPORTANT: Save the current collapsed state (which may have been modified by toggle)
    // We'll preserve this through the rebuild
    const savedOperations = this._operations;
    const savedCollapsed = new Set(this._collapsedClasses); // Copy the current state
    
    this._mermaidSource = [];
    this._modules = new Set();
    this._classUrls = new Map();
    this._methodData = new Map();
    this._compositionRelationships = new Map();
    
    // Keep the collapsed state - don't clear it!
    // During replay, addReferencedComponent will check _replaying flag
    // and NOT modify collapsed state
    
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
    this._compositionRelationships = new Map(); // Clear composition relationships
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
    
    // Use look attribute or default to handDrawn
    const look = this._look || 'handDrawn';
    
    let source = `---
config:
  layout: elk
  look: ${look}
  theme: neutral
---
classDiagram\n${this._mermaidSource.join('\n')}`;
    
    // Add composition relationships
    if (this._compositionRelationships && this._compositionRelationships.size > 0) {
      for (const [parent, children] of this._compositionRelationships) {
        for (const child of children) {
          // Mermaid composition: Parent *-- Child (filled diamond)
          source += `\n  ${parent} *-- ${child} : uses`;
        }
      }
    }
    
    return source;
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
      
      // Apply hand-drawn font if look is handDrawn
      const look = this._look || 'handDrawn';
      if (look === 'handDrawn') {
        diagram.classList.add('hand-drawn');
        // Expand foreignObject widths to accommodate wider Virgil font
        this.expandForeignObjects(diagram);
      } else {
        diagram.classList.remove('hand-drawn');
      }
      
      // Style comment sections
      this.styleSections(diagram);
      
      // Style methods based on hashtags
      this.styleMethodsByHashtags(diagram);
      
      // Add click handlers to class names
      this.addClickHandlers(diagram);
      
    } catch (error) {
      console.error('Mermaid rendering error:', error);
      diagram.innerHTML = `<pre style="color: red;">Error rendering diagram:\n${error.message}\n\nSource:\n${source}</pre>`;
    }
  }
  
  /**
   * Expand foreignObject elements to accommodate wider Virgil font
   * @param {HTMLElement} diagram - The diagram container element
   */
  expandForeignObjects(diagram) {
    const svgElement = diagram.querySelector('svg');
    if (!svgElement) return;
    
    // Find all foreignObject elements and expand their width by 20%
    const foreignObjects = svgElement.querySelectorAll('foreignObject');
    foreignObjects.forEach(obj => {
      const currentWidth = parseFloat(obj.getAttribute('width'));
      if (currentWidth) {
        // Increase width by 20% to accommodate wider Virgil font
        const newWidth = currentWidth * 1.2;
        obj.setAttribute('width', newWidth + 'px');
      }
    });
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
   * Style methods based on hashtags in their comments
   * @param {HTMLElement} diagram - The diagram container element
   */
  styleMethodsByHashtags(diagram) {
    const svgElement = diagram.querySelector('svg');
    if (!svgElement) return;
    
    const labelElements = svgElement.querySelectorAll('g.label');
    let currentClass = null;
    
    labelElements.forEach(labelGroup => {
      const paragraph = labelGroup.querySelector('.nodeLabel p');
      if (!paragraph) return;
      
      const text = paragraph.textContent.trim();
      
      // Check if this is a class name (has font-weight: bolder in style)
      const isBold = labelGroup.getAttribute('style')?.includes('font-weight: bolder');
      
      if (isBold) {
        // Track current class context
        currentClass = text;
      } else if (!paragraph.classList.contains('comment-section')) {
        // This is a method or property
        const memberMatch = text.match(/^[\$\+]?([a-zA-Z_$][a-zA-Z0-9_$]*)(?:\(.*\))?$/);
        if (memberMatch && currentClass) {
          const memberName = memberMatch[1];
          const memberKey = `${currentClass}.${memberName}`;
          const memberData = this._methodData.get(memberKey);
          
          if (memberData && memberData.hashtags && memberData.hashtags.length > 0) {
            // Apply styles based on hashtags
            this.applyHashtagStyles(paragraph, memberData.hashtags);
          }
        }
      }
    });
  }
  
  /**
   * Apply semantic CSS classes and display hashtag labels
   */
  applyHashtagStyles(element, hashtags) {
    hashtags.forEach(tag => element.classList.add(`hashtag-${tag}`));
    if (hashtags.length > 0) this.addHashtagLabel(element, hashtags);
  }
  
  /**
   * Display hashtags as separate SVG text element positioned to the right of method
   * Inserted outside label group to avoid interfering with click detection
   * #important #public-api
   */
  addHashtagLabel(paragraph, hashtags) {
    if (!hashtags || hashtags.length === 0) return;
    
    const foreignObject = paragraph.closest('foreignObject');
    const labelGroup = foreignObject?.parentElement;
    if (!labelGroup || !foreignObject) return;
    
    const labelParent = labelGroup.parentElement;
    if (!labelParent) return;
    
    const x = parseFloat(foreignObject.getAttribute('x') || '0');
    const y = parseFloat(foreignObject.getAttribute('y') || '0');
    const width = parseFloat(foreignObject.getAttribute('width') || '100');
    const height = parseFloat(foreignObject.getAttribute('height') || '20');
    
    const transform = labelGroup.getAttribute('transform');
    let offsetX = 0, offsetY = 0;
    if (transform) {
      const match = transform.match(/translate\(([^,]+),([^)]+)\)/);
      if (match) {
        offsetX = parseFloat(match[1]) || 0;
        offsetY = parseFloat(match[2]) || 0;
      }
    }
    
    const tagX = offsetX + x + width + 5;
    const tagY = offsetY + y + height / 2 + 4;
    
    const hashtagText = (<text 
      x={tagX} 
      y={tagY} 
      text-anchor="start"
      dominant-baseline="middle"
      class="method-hashtags"
    ></text>);
    
    hashtags.forEach((tag, idx) => {
      const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
      tspan.classList.add(`hashtag-label-${tag}`);
      tspan.textContent = `#${tag}`;
      
      if (idx > 0) {
        const space = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
        space.textContent = ' ';
        hashtagText.appendChild(space);
      }
      
      hashtagText.appendChild(tspan);
    });
    
    labelParent.insertBefore(hashtagText, labelGroup.nextSibling);
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
        // Match: [prefix]name or [prefix]name(...) with optional parameters
        const memberMatch = text.match(/^[\$\+]?([a-zA-Z_$][a-zA-Z0-9_$]*)(?:\(.*\))?$/);
        if (memberMatch && currentClass) {
          const memberName = memberMatch[1];
          const memberKey = `${currentClass}.${memberName}`;
          const memberData = this._methodData.get(memberKey);
          
          if (memberData) {
            this.makeClickable(paragraph, async evt => {
              await this.onMethodSelected(memberData, evt, paragraph);
            });
          }
        }
      }
    });
  }
  
  /**
   * Handle method/property selection - can be overridden to customize behavior
   * @param {Object} methodInfo - Method information from FileIndex
   *   - class: "ClassName"
   *   - name: "methodName"
   *   - start: 4028
   *   - end: 4738
   *   - static: false
   *   - kind: "method" | "property" | "get" | "set"
   *   - url: "http://localhost:9005/lively4-core/src/..."
   * @param {Event} evt - The click event
   * @param {HTMLElement} element - The clicked element (method label)
   */
  async onMethodSelected(methodInfo, evt, element) {
    // Default behavior: open browser at method location
    // Shift+click: inspect the method data
    if (evt.shiftKey) {
      lively.openInspector(methodInfo);
    } else {
      await lively.openBrowser(methodInfo.url, true, {
        start: methodInfo.start,
        end: methodInfo.end
      });
    }
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
      collapsedClasses: Array.from(this._collapsedClasses || []),
      compositionRelationships: Array.from(this._compositionRelationships || []).map(([parent, children]) => ({
        parent,
        children: Array.from(children)
      }))
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
    this._compositionRelationships = other._compositionRelationships || new Map();
    this._look = other._look || 'handDrawn';
    this._mermaid = other._mermaid;
  }
  
  async livelyExample() {
    // Add all classes from a path recursively
    await this.addPath('src/components/literature/');
  }
}
