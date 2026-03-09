/**
 * Polymetric View renderer for class diagrams
 * Shows classes as rectangles sized by code length, colored by modification time
 * Organized in directory hierarchy
 */
import d3 from "src/external/d3.v5.js";
import moment from "src/external/moment.js";
import FileIndex from "src/client/fileindex.js";
import flextree from "src/external/d3-flextree.js";

export default class PolymetricRenderer {
  constructor(diagram) {
    this.diagram = diagram;
    this.minSize = 150; // Minimum size for nodes without data
  }
  
  /**
   * Build directory tree hierarchy from flat class list
   * Transforms: src/components/tools/lively-container.js → tree structure
   */
  async buildTree() {
    const tree = {
      name: "root",
      children: []
    };
    
    const nodesMap = new Map();
    
    // Helper to ensure a directory node exists
    const ensureNode = (path) => {
      if (path.length === 0) return tree;
      
      const key = path.join("/");
      let node = nodesMap.get(key);
      
      if (!node) {
        const [parentName, ...parentPath] = path;
        node = {
          name: parentName,
          url: lively4url + "/" + path.reverse().join("/"),
          children: []
        };
        nodesMap.set(key, node);
        
        const parent = ensureNode(parentPath);
        parent.children.push(node);
      }
      
      return node;
    };
    
    // Add each class to the tree
    const fileIndex = FileIndex.current();
    const classInfos = [];
    
    // Collect all classes from the diagram's modules
    for (const url of this.diagram._modules) {
      await fileIndex.db.classes.where("url").equals(url).each(classInfo => {
        classInfos.push(classInfo);
      });
    }
    
    // Build tree structure
    for (const classInfo of classInfos) {
      const relativePath = classInfo.url.replace(lively4url + "/", "");
      const pathParts = relativePath.split("/").reverse();
      const parent = ensureNode(pathParts);
      
      parent.children.push({
        name: classInfo.name,
        url: classInfo.url,
        classInfo: classInfo,
        start: classInfo.start,
        end: classInfo.end
      });
    }
    
    // Attach file index data for modification times
    const urlMap = new Map();
    const visit = (node, cb) => {
      cb(node);
      node.children && node.children.forEach(ea => visit(ea, cb));
    };
    
    visit(tree, node => urlMap.set(node.url, node));
    
    await fileIndex.db.files.each(fileData => {
      const node = urlMap.get(fileData.url);
      if (node) {
        node.index = fileData;
      }
    });
    
    return tree;
  }
  
  /**
   * Calculate node width based on code size
   */
  calcSize(node) {
    if (!node.data) return this.minSize;
    
    const data = node.data;
    if (data.start !== undefined && data.end !== undefined) {
      const size = data.end - data.start;
      if (size > 0) return size;
    }
    
    return this.minSize;
  }
  
  /**
   * Calculate node width (square root of size for better visualization)
   */
  dataWidth(node) {
    return Math.sqrt(this.calcSize(node));
  }
  
  /**
   * Calculate node height (square root of size for better visualization)
   */
  dataHeight(node) {
    return Math.sqrt(this.calcSize(node));
  }
  
  /**
   * Calculate node color based on modification time
   */
  dataColor(node) {
    if (!node.data || !node.data.index) return "gray";
    
    const now = moment(Date.now());
    const modified = moment(node.data.index.modified);
    const days = moment.duration(now.diff(modified)).asDays();
    
    // Blue for recent files, gray for old files
    const colorScale = d3.scaleLinear()
      .range(['#aaccff', '#808080'])
      .domain([10, 365])
      .interpolate(d3.interpolateHcl);
    
    return colorScale(days);
  }
  
  /**
   * Render the polymetric view
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
      
      // Get dimensions from parent container (lively-class-diagram or window)
      let bounds = target.getBoundingClientRect();
      
      // If target is too small, try to get parent window or container size
      if (bounds.width < 100 || bounds.height < 100) {
        const parentWindow = lively.findWindow(this.diagram);
        if (parentWindow) {
          const windowBounds = parentWindow.getBoundingClientRect();
          bounds = {
            width: windowBounds.width - 40, // Account for window chrome
            height: windowBounds.height - 80
          };
        } else {
          // Fallback to reasonable defaults
          bounds = { width: 800, height: 600 };
        }
      }
      
      const margin = { top: 10, right: 10, bottom: 10, left: 10 };
      const width = bounds.width;
      const height = bounds.height;
      
      console.log('[PolymetricRenderer] Using dimensions:', { width, height });
      
      const svg = d3.select(target)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .style('background-color', '#f5f5f5');
      
      const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
      
      // Create tree layout
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
      
      // Calculate scaling
      const extents = tree.extents;
      const tw = extents.right - extents.left;
      const availableWidth = width - margin.left - margin.right;
      const availableHeight = height - margin.top - margin.bottom;
      const scale = Math.min(availableWidth / tw, availableHeight / extents.bottom);
      
      console.log('[PolymetricRenderer] Layout:', {
        extents,
        tw,
        availableWidth,
        availableHeight,
        scale,
        nodeCount: tree.descendants().length
      });
      
      const transX = (tw * scale >= availableWidth) 
        ? -extents.left * scale 
        : (availableWidth + scale * (extents.right + extents.left)) / 2;
      
      const drawing = g.append('g')
        .attr('transform', `translate(${transX}, 0) scale(${scale}, ${scale})`);
      
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
      rect.on('click', () => this.onNodeClick(node));
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
   * Handle node click
   */
  onNodeClick(node) {
    if (node.data.classInfo) {
      lively.openBrowser(node.data.url, true);
    } else if (node.data.url) {
      lively.openBrowser(node.data.url, true);
    } else {
      lively.openInspector(node.data);
    }
  }
  
  /**
   * Cleanup when switching renderers
   */
  dispose() {
    // No cleanup needed for now
  }
}
