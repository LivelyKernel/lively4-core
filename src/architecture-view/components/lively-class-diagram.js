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
    
    // Initialize renderer (default to Mermaid)
    this._rendererType = this.getAttribute('renderer') || 'mermaid';
    await this.setRenderer(this._rendererType);
    
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
  
  /**
   * Set the rendering strategy
   */
  async setRenderer(type) {
    if (this._renderer) {
      this._renderer.dispose();
    }
    
    const baseUrl = lively4url + '/src/architecture-view/components/renderers/';
    
    switch (type) {
      case 'mermaid':
        const MermaidRenderer = await System.import(baseUrl + 'mermaid-renderer.js');
        this._renderer = new MermaidRenderer.default(this);
        break;
      case 'polymetric':
        const PolymetricRenderer = await System.import(baseUrl + 'polymetric-renderer.js');
        this._renderer = new PolymetricRenderer.default(this);
        break;
      case 'tree':
        const TreeRenderer = await System.import(baseUrl + 'tree-renderer.js');
        this._renderer = new TreeRenderer.default(this);
        break;
      default:
        throw new Error(`Unknown renderer type: ${type}`);
    }
    
    this._rendererType = type;
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
    const handDrawnIcon = this.isHandDrawn ? chosenIcon : unchosenIcon;
    
    let menuItems = [
      ['Hand-Drawn Style', (evt, item) => this.toggleHandDrawn(evt, item), '', handDrawnIcon],
      ['', null], // Separator
      ['Renderer', [
        ['Mermaid UML', () => this.setRenderer('mermaid').then(() => this.render()), '', 
         this._rendererType === 'mermaid' ? chosenIcon : unchosenIcon],
        ['Polymetric View', () => this.setRenderer('polymetric').then(() => this.render()), '', 
         this._rendererType === 'polymetric' ? chosenIcon : unchosenIcon],
        // Future renderers will go here:
        // ['Tree View', () => this.setRenderer('tree').then(() => this.render()), '', 
        //  this._rendererType === 'tree' ? chosenIcon : unchosenIcon],
      ]]
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
   * Render the diagram using the current renderer
   */
  async render() {
    const diagram = this.get('#diagram');
    if (!diagram || !this._renderer) return;
    
    await this._renderer.render(diagram);
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
    this._renderer = other._renderer;
    this._rendererType = other._rendererType;
  }
  
  async livelyExample() {
    // Add all classes from a path recursively
    await this.addPath('src/components/literature/');
  }
}
