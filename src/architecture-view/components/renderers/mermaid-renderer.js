/**
 * Mermaid UML class diagram renderer
 * Renders class diagrams using Mermaid.js with ELK layout
 */
export default class MermaidRenderer {
  constructor(diagram) {
    this.diagram = diagram;
    this._mermaid = null;
    this._mermaidLoading = null;
    this._mermaidLoadError = null;
  }
  
  /**
   * Load Mermaid library and ELK layout engine
   */
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
            useMaxWidth: false,
            htmlLabels: true
          },
          classDiagram: {
            useMaxWidth: false
          }
        });
        
        return this._mermaid;
      } catch (error) {
        console.error('[MermaidRenderer] Failed to load mermaid:', error);
        this._mermaidLoadError = error;
        throw error;
      } finally {
        this._mermaidLoading = null;
      }
    })();
    
    return this._mermaidLoading;
  }
  
  /**
   * Get the current Mermaid source code
   */
  getMermaidSource() {
    if (this.diagram._mermaidSource.length === 0) {
      return ``;
    }
    
    const look = this.diagram._look || 'handDrawn';
    
    let source = `---
config:
  layout: elk
  look: ${look}
  theme: neutral
---
classDiagram\n${this.diagram._mermaidSource.join('\n')}`;
    
    // Add composition relationships
    if (this.diagram._compositionRelationships && this.diagram._compositionRelationships.size > 0) {
      for (const [parent, children] of this.diagram._compositionRelationships) {
        for (const child of children) {
          source += `\n  ${parent} *-- ${child} : uses`;
        }
      }
    }
    
    return source;
  }
  
  /**
   * Render the diagram using Mermaid
   */
  async render(target) {
    const source = this.getMermaidSource();
    
    try {
      // Show loading message
      target.innerHTML = '<div style="padding: 20px;">Loading Mermaid...</div>';
      
      const mermaid = await this.loadMermaid();
      
      // Generate unique ID for this diagram
      const id = 'class-diagram-' + Date.now();
      
      // Render with Mermaid
      const {svg} = await mermaid.render(id, source);
      
      // Clear and insert SVG
      target.innerHTML = svg;
      target.classList.add('mermaid');
      
      // Fix sizing: use content-driven dimensions instead of scaling to container
      this.fixSvgSizing(target);
      
      // Apply hand-drawn font if look is handDrawn
      const look = this.diagram._look || 'handDrawn';
      if (look === 'handDrawn') {
        target.classList.add('hand-drawn');
        // Expand foreignObject widths to accommodate wider Virgil font
        this.expandForeignObjects(target);
      } else {
        target.classList.remove('hand-drawn');
      }
      
      // Style comment sections
      this.styleSections(target);
      
      // Style methods based on hashtags
      this.styleMethodsByHashtags(target);
      
      // Add click handlers to class names
      this.addClickHandlers(target);
      
    } catch (error) {
      console.error('[MermaidRenderer] Rendering error:', error);
      target.innerHTML = `<pre style="color: red;">Error rendering diagram:\n${error.message}\n\nSource:\n${source}</pre>`;
    }
  }
  
  /**
   * Fix SVG sizing so the SVG is sized by its content, not the container.
   * Mermaid renders with width="100%" and max-width which causes the content
   * to be scaled down to fit the canvas. Instead we read the viewBox and
   * set explicit pixel dimensions so the container expands to fit the diagram.
   */
  fixSvgSizing(target) {
    const svgEl = target.querySelector('svg');
    if (!svgEl) return;
    
    const viewBox = svgEl.getAttribute('viewBox');
    if (viewBox) {
      const parts = viewBox.split(/[\s,]+/).map(Number);
      if (parts.length === 4) {
        const [, , vbWidth, vbHeight] = parts;
        if (vbWidth > 0 && vbHeight > 0) {
          svgEl.setAttribute('width', vbWidth + 'px');
          svgEl.setAttribute('height', vbHeight + 'px');
          svgEl.style.maxWidth = 'none';
        }
      }
    }
  }
  
  /**
   * Expand foreignObject elements to accommodate wider Virgil font
   */
  expandForeignObjects(target) {
    const svgElement = target.querySelector('svg');
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
   */
  styleSections(target) {
    const svgElement = target.querySelector('svg');
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
   */
  styleMethodsByHashtags(target) {
    const svgElement = target.querySelector('svg');
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
          const memberData = this.diagram._methodData.get(memberKey);
          
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
    
    const hashtagText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    hashtagText.setAttribute('x', tagX);
    hashtagText.setAttribute('y', tagY);
    hashtagText.setAttribute('text-anchor', 'start');
    hashtagText.setAttribute('dominant-baseline', 'middle');
    hashtagText.classList.add('method-hashtags');
    
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
   */
  addClickHandlers(target) {
    const svgElement = target.querySelector('svg');
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
        const classUrl = this.diagram._classUrls.get(text);
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
        const memberMatch = text.match(/^[\$\+]?([a-zA-Z_$][a-zA-Z0-9_$]*)(?:\(.*\))?$/);
        if (memberMatch && currentClass) {
          const memberName = memberMatch[1];
          const memberKey = `${currentClass}.${memberName}`;
          const memberData = this.diagram._methodData.get(memberKey);
          
          if (memberData) {
            this.makeClickable(paragraph, async evt => {
              await this.diagram.onMethodSelected(memberData, evt, paragraph);
            });
          }
        }
      }
    });
  }
  
  /**
   * Add a toggle button to a class header
   */
  addToggleButton(paragraph, className) {
    const isCollapsed = this.diagram._collapsedClasses.has(className);
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
      await this.diagram.toggleCollapsed(className);
    });
    
    // Append the button to the paragraph
    paragraph.appendChild(toggleBtn);
  }
  
  /**
   * Make an element clickable with visual feedback
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
   * Cleanup when switching renderers
   */
  dispose() {
    // Mermaid doesn't need cleanup, but future renderers might
  }
}
