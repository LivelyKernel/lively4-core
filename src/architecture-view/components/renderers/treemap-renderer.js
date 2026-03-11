/**
 * Treemap renderer for class diagrams
 * Shows classes as squarified nested rectangles, sized by code length, colored by modification time.
 * Methods within each class are shown as proportional sub-rectangles colored by method kind.
 * Based on d3.treemap() — see also src/components/d3/d3-treemap.js for the general-purpose component
 */
import d3 from "src/external/d3.v5.js";
import BaseRenderer from "./base-renderer.js";

export default class TreemapRenderer extends BaseRenderer {
  constructor(diagram) {
    super(diagram);
  }

  /**
   * Mutate the tree produced by buildTree() so that each class node gains
   * method children (one leaf per ClassMethod).  Classes with no methods
   * remain leaves themselves so they still take up space proportional to
   * their source length.
   */
  addMethodChildren(node) {
    if (node.classInfo && node.classInfo.methods && node.classInfo.methods.length > 0) {
      node.children = node.classInfo.methods.map(m => ({
        name: m.name,
        methodInfo: { ...m, url: node.url },   // enrich with url for onMethodSelected
        start: m.start,
        end: m.end,
        url: node.url
      }));
    }
    if (node.children) {
      node.children.forEach(child => this.addMethodChildren(child));
    }
  }

  /** Fill color for a d3 hierarchy node. */
  nodeColor(d) {
    if (d.data.methodInfo) return this.methodColor(d.data.methodInfo);
    if (d.data.classInfo)  return this.dataColor(d);
    return '#e8e8e8';   // directory / file container
  }

  /** Color a method rectangle by its kind. */
  methodColor(methodInfo) {
    switch (methodInfo.kind) {
      case 'constructor': return '#7fbfff';   // blue
      case 'get':         return '#ffd080';   // yellow
      case 'set':         return '#ff9080';   // orange
      default:            return '#90d090';   // green – regular method
    }
  }

  /**
   * Render the treemap view.
   * SVG is sized proportionally to the total code area so the diagram
   * scales with the amount of code being visualized.
   */
  async render(target) {
    try {
      target.innerHTML = '<div style="padding: 20px;">Building treemap...</div>';

      const treeData = await this.buildTree();

      if (!treeData.children || treeData.children.length === 0) {
        target.innerHTML = '<div style="padding: 20px;">No classes to display</div>';
        return;
      }

      // Expand class nodes with method sub-nodes
      this.addMethodChildren(treeData);

      target.innerHTML = '';

      const margin = { top: 10, right: 10, bottom: 10, left: 10 };

      // Build d3 hierarchy.
      // Only leaf nodes contribute size: methods (when a class has them) or
      // the class itself (when it has no methods).
      const root = d3.hierarchy(treeData)
        .eachBefore(d => {
          d.data.id = (d.parent ? d.parent.data.id + '.' : '') + d.data.name;
        })
        .sum(d => !d.children ? Math.max((d.end || 0) - (d.start || 0), 10) : 0)
        .sort((a, b) => b.value - a.value);

      const width  = 1200;
      const height = 800;

      // Apply treemap layout — nodes get x0, y0, x1, y1.
      // paddingTop reserves room for the label of every internal node
      // (directories, files, and classes that now contain method children).
      d3.treemap()
        .tile(d3.treemapSquarify)
        .size([width, height])
        .paddingOuter(4)
        .paddingTop(d => d.data.classInfo ? 14 : 18)
        .paddingInner(1)
        .round(true)(root);

      // Create SVG sized to content
      const svg = d3.select(target)
        .append('svg')
        .attr('width',  width  + margin.left + margin.right)
        .attr('height', height + margin.top  + margin.bottom)
        .style('background-color', '#f5f5f5');

      const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      const nodeW = d => Math.max(0, d.x1 - d.x0);
      const nodeH = d => Math.max(0, d.y1 - d.y0);

      // Draw all nodes as positioned groups
      const cell = g.selectAll('g')
        .data(root.descendants())
        .enter().append('g')
        .attr('transform', d => `translate(${d.x0},${d.y0})`);

      // Background rectangle
      cell.append('rect')
        .attr('width',  nodeW)
        .attr('height', nodeH)
        .attr('fill',   d => this.nodeColor(d))
        .attr('stroke', '#fff')
        .attr('stroke-width', d => d.depth <= 1 ? 2 : 0.5)
        .style('cursor', d => (d.data.classInfo || d.data.methodInfo) ? 'pointer' : 'default');

      // Tooltip
      cell.append('title')
        .text(d => {
          const size = `${d.value.toLocaleString()} chars`;
          if (d.data.methodInfo) {
            const kind = d.data.methodInfo.kind !== 'method' ? ` (${d.data.methodInfo.kind})` : '';
            const stat = d.data.methodInfo.static ? ' [static]' : '';
            return `${d.data.name}${kind}${stat}\n${size}`;
          }
          return `${d.data.name}\n${size}`;
        });

      // Label for nodes wide and tall enough to show text
      cell.filter(d => nodeW(d) > 30 && nodeH(d) > 14)
        .append('text')
        .attr('x', 3)
        .attr('y', 11)
        .attr('font-size',   d => d.data.methodInfo ? '8px' : (d.children ? '11px' : '9px'))
        .attr('font-weight', d => (d.children && !d.data.classInfo) ? 'bold' : 'normal')
        .attr('font-style',  d => d.data.classInfo ? 'italic' : 'normal')
        .attr('fill', '#333')
        .attr('pointer-events', 'none')
        .text(d => d.data.name);

      // Click: methods use the diagram hook; class/file nodes fall back to openBrowser
      cell.on('click', async d => {
        const evt = d3.event;
        if (d.data.methodInfo) {
          evt.stopPropagation();
          await this.diagram.onMethodSelected(d.data.methodInfo, evt, d3.event.target);
        } else if (d.data.url) {
          lively.openBrowser(d.data.url, true);
        }
      });

    } catch (error) {
      console.error('[TreemapRenderer] Rendering error:', error);
      target.innerHTML = `<pre style="color: red;">Error rendering treemap:\n${error.message}</pre>`;
    }
  }
}
