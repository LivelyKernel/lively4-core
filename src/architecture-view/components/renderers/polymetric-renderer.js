/**
 * Polymetric View renderer for class diagrams
 * Shows classes as rectangles sized by code length, colored by modification time
 * Organized in directory hierarchy
 */
import d3 from "src/external/d3.v5.js";
import flextree from "src/external/d3-flextree.js";
import BaseRenderer from "./base-renderer.js";

export default class PolymetricRenderer extends BaseRenderer {
  constructor(diagram) {
    super(diagram);
    this.minSize = 150; // Minimum size for nodes without data
  }
  
  /**
   * Calculate packed dimensions for methods in a class
   * Simulates the row-packing algorithm to get actual required space
   * Optimizes for a reasonable aspect ratio (roughly square)
   */
  calculatePackedMethodDimensions(className) {
    const methods = [];
    let totalArea = 0;
    
    for (const [key, methodData] of this.diagram._methodData) {
      if (methodData.class === className) {
        const size = methodData.end - methodData.start;
        const methodSize = size > 0 ? size : 10;
        methods.push({
          size: methodSize,
          width: Math.sqrt(methodSize),
          height: Math.sqrt(methodSize)
        });
        totalArea += methodSize;
      }
    }
    
    if (methods.length === 0) {
      return { width: this.minSize, height: this.minSize };
    }
    
    // Sort by size for better packing
    methods.sort((a, b) => b.size - a.size);
    
    // Target width: aim for roughly square aspect ratio
    // Use sqrt of total area as initial guess, then simulate packing
    const targetWidth = Math.sqrt(totalArea) * 1.5; // 1.5x for padding and wrapping
    
    // Simulate row packing with target width
    const padding = 2;
    const innerPadding = 5;
    let currentX = innerPadding;
    let currentY = innerPadding;
    let rowHeight = 0;
    let maxRowWidth = 0;
    
    for (const method of methods) {
      // Check if we need to wrap
      if (currentX + method.width > targetWidth - innerPadding && currentX > innerPadding) {
        maxRowWidth = Math.max(maxRowWidth, currentX - padding);
        currentX = innerPadding;
        currentY += rowHeight + padding;
        rowHeight = 0;
      }
      
      currentX += method.width + padding;
      rowHeight = Math.max(rowHeight, method.height);
    }
    
    // Final row
    maxRowWidth = Math.max(maxRowWidth, currentX - padding + innerPadding);
    const totalHeight = currentY + rowHeight + innerPadding;
    
    return { 
      width: Math.max(maxRowWidth, this.minSize), 
      height: Math.max(totalHeight, this.minSize) 
    };
  }
  
  /**
   * Calculate node size
   * For classes: calculate actual packed method dimensions
   * For directories: use default size
   */
  calcSize(node) {
    if (!node.data) return this.minSize;
    
    const data = node.data;
    
    // For class nodes, calculate size from packed methods
    if (data.classInfo) {
      const className = data.classInfo.name;
      const dims = this.calculatePackedMethodDimensions(className);
      // Return area for consistency with minSize
      return dims.width * dims.height;
    }
    
    // For directory nodes, use default size
    return this.minSize;
  }
  
  /**
   * Calculate node width based on packed method dimensions
   */
  dataWidth(node) {
    if (!node.data) return Math.sqrt(this.minSize);
    
    const data = node.data;
    
    if (data.classInfo) {
      const className = data.classInfo.name;
      const dims = this.calculatePackedMethodDimensions(className);
      return dims.width;
    }
    
    return Math.sqrt(this.minSize);
  }
  
  /**
   * Calculate node height based on packed method dimensions
   */
  dataHeight(node) {
    if (!node.data) return Math.sqrt(this.minSize);
    
    const data = node.data;
    
    if (data.classInfo) {
      const className = data.classInfo.name;
      const dims = this.calculatePackedMethodDimensions(className);
      return dims.height;
    }
    
    return Math.sqrt(this.minSize);
  }
  
  /**
   * Render the polymetric view
   * SVG is sized to fit the content (not scaled to fit the container)
   */
  async render(target) {
    try {
      target.innerHTML = '<div style="padding: 20px;">Building polymetric view...</div>';
      
      const treeData = await this.buildTree();
      
      if (!treeData.children || treeData.children.length === 0) {
        target.innerHTML = '<div style="padding: 20px;">No classes to display</div>';
        return;
      }
      
      // Clear target and create SVG
      target.innerHTML = '';
      
      const margin = { top: 10, right: 10, bottom: 10, left: 10 };
      const hackSizeX = 10;
      const hackSizeY = 10;
      
      // First pass: create hierarchy to calculate minimum dimensions
      const tempTree = d3.hierarchy(treeData);
      const minWidth = tempTree.descendants().reduce(
        (min, n) => Math.min(min, this.dataWidth(n)), 
        Infinity
      );
      
      const treeLayout = flextree({
        nodeSize: node => [this.dataWidth(node), this.dataHeight(node) + hackSizeX],
        spacing: (a, b) => 0.2 * minWidth * a.path(b).length + hackSizeY
      });
      
      const tree = treeLayout.hierarchy(treeData);
      tree.eachBefore(d => {
        d.data.id = (d.parent ? d.parent.data.id + "." : "") + d.data.name;
      });
      
      treeLayout(tree);
      
      // Calculate content bounds and size SVG to fit content exactly
      const extents = tree.extents;
      const contentWidth = extents.right - extents.left;
      const contentHeight = extents.bottom - extents.top;
      
      const svgWidth = contentWidth + margin.left + margin.right;
      const svgHeight = contentHeight + margin.top + margin.bottom;
      
      console.log('[PolymetricRenderer] Content bounds:', {
        extents,
        contentWidth,
        contentHeight,
        svgWidth,
        svgHeight,
        nodeCount: tree.descendants().length
      });
      
      const svg = d3.select(target)
        .append('svg')
        .attr('width', svgWidth)
        .attr('height', svgHeight)
        .style('background-color', '#f5f5f5');
      
      const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
      
      // Translate so left edge of content aligns with the margin
      const transX = -extents.left;
      const transY = extents.top < 0 ? -extents.top : 0;
      
      const drawing = g.append('g')
        .attr('transform', `translate(${transX}, ${transY})`);
      
      // Calculate min height for padding (minWidth already calculated above)
      const minHeight = tree.descendants().reduce(
        (min, n) => Math.min(min, this.dataHeight(n)), 
        Infinity
      );
      
      // Render tree
      this.drawSubtree(tree, drawing, minWidth, minHeight, hackSizeX);
      
    } catch (error) {
      console.error('[PolymetricRenderer] Rendering error:', error);
      target.innerHTML = `<pre style="color: red;">Error rendering polymetric view:\n${error.message}</pre>`;
    }
  }
  
  /**
   * Recursively draw subtree nodes
   * 
   * TODO: Render methods as small boxes inside class boxes
   * - Use this.diagram._methodData to get method information
   * - Calculate method sizes based on method.end - method.start
   * - Pack methods inside the class rectangle using a packing algorithm
   * - Color methods by different metrics (complexity, age, hashtags)
   */
  drawSubtree(node, drawing, minWidth, minHeight, hackSizeX) {
    const [width, height] = node.size;
    const { x, y } = node;
    
    const paddingSide = minWidth * 0.1;
    const paddingBottom = minHeight * 0.2 + hackSizeX;
    
    const rectX = x - width / 2 + paddingSide;
    const rectY = y;
    const rectWidth = width - 2 * paddingSide;
    const rectHeight = height - paddingBottom;
    const fillColor = this.dataColor(node);
    
    // Debug: log first few rectangles
    if (node.depth <= 2) {
      console.log('[PolymetricRenderer] Drawing rect:', {
        name: node.data.name,
        x: rectX,
        y: rectY,
        width: rectWidth,
        height: rectHeight,
        fill: fillColor
      });
    }
    
    // Draw the node rectangle
    const rect = drawing.append('rect')
      .attr('x', rectX)
      .attr('y', rectY)
      .attr('width', rectWidth)
      .attr('height', rectHeight)
      .attr('stroke', 'black')
      .attr('stroke-width', '2px')
      .attr('fill', fillColor)
      .style('cursor', node.data.classInfo ? 'pointer' : 'default');
    
    rect.append('title').text(node.data.name);
    
    // Add click handler for class nodes
    if (node.data.classInfo) {
      rect.on('click', () => lively.openBrowser(node.data.url, true));
      
      // Draw methods inside the class rectangle
      this.drawMethods(node, drawing, rectX, rectY, rectWidth, rectHeight);
    }
    
    // Draw links to parent
    if (node.parent) {
      drawing.append('path')
        .attr('class', 'link')
        .attr('fill', 'none')
        .attr('stroke', '#ccc')
        .attr('stroke-width', '1px')
        .attr('d', d3.linkVertical()({
          source: [node.parent.x, node.parent.y + node.parent.size[1] - paddingBottom],
          target: [node.x, node.y]
        }));
    }
    
    // Recursively draw children
    for (const child of (node.children || [])) {
      this.drawSubtree(child, drawing, minWidth, minHeight, hackSizeX);
    }
  }
  
  /**
   * Draw methods as small rectangles inside a class box
   * Methods are drawn at their natural size (sqrt of code length)
   * The class box is already sized to contain all methods
   */
  drawMethods(node, drawing, classX, classY, classWidth, classHeight) {
    const className = node.data.classInfo.name;
    
    // Collect all methods for this class
    const methods = [];
    for (const [key, methodData] of this.diagram._methodData) {
      if (methodData.class === className) {
        const size = methodData.end - methodData.start;
        methods.push({
          ...methodData,
          size: size > 0 ? size : 10 // Minimum size for methods without data
        });
      }
    }
    
    if (methods.length === 0) return;
    
    // Sort methods by size (largest first) for better packing
    methods.sort((a, b) => b.size - a.size);
    
    // Pack methods in rows at their natural size
    const padding = 2;
    const innerPadding = 5; // Fixed padding in pixels
    let currentX = classX + innerPadding;
    let currentY = classY + innerPadding;
    let rowHeight = 0;
    
    for (const method of methods) {
      // Calculate method rectangle dimensions at natural size
      const methodWidth = Math.sqrt(method.size);
      const methodHeight = Math.sqrt(method.size);
      
      // Check if we need to wrap to next row
      if (currentX + methodWidth > classX + classWidth - innerPadding && currentX > classX + innerPadding) {
        currentX = classX + innerPadding;
        currentY += rowHeight + padding;
        rowHeight = 0;
      }
      
      // Choose color based on method properties
      const methodColor = this.getMethodColor(method);
      
      // Draw method rectangle
      const methodRect = drawing.append('rect')
        .attr('x', currentX)
        .attr('y', currentY)
        .attr('width', methodWidth)
        .attr('height', methodHeight)
        .attr('stroke', '#333')
        .attr('stroke-width', '0.5px')
        .attr('fill', methodColor)
        .style('cursor', 'pointer');
      
      // Add tooltip
      methodRect.append('title')
        .text(`${method.name} (${method.size} chars)`);
      
      // Add click handler - use diagram's hook for proper integration
      methodRect.on('click', async () => {
        const evt = d3.event;
        evt.stopPropagation(); // Prevent class click
        await this.diagram.onMethodSelected(method, evt, methodRect.node());
      });
      
      // Update position for next method
      currentX += methodWidth + padding;
      rowHeight = Math.max(rowHeight, methodHeight);
    }
  }
  
  /**
   * Get color for a method based on its properties
   */
  getMethodColor(method) {
    // Color by hashtags if available
    if (method.hashtags && method.hashtags.length > 0) {
      const tag = method.hashtags[0];
      switch (tag) {
        case 'important':
        case 'api':
        case 'public-api':
          return '#4fc3f7'; // Light blue
        case 'deprecated':
          return '#bdbdbd'; // Gray
        case 'TODO':
          return '#fff176'; // Yellow
        case 'private':
          return '#e0e0e0'; // Light gray
        default:
          return '#80deea'; // Cyan
      }
    }
    
    // Color by method kind
    switch (method.kind) {
      case 'constructor':
        return '#a5d6a7'; // Green
      case 'get':
      case 'set':
      case 'property':
        return '#ce93d8'; // Purple
      default:
        return '#90caf9'; // Blue
    }
  }
  
  
}

