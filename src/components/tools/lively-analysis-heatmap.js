"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js'
import ContextMenu from 'src/client/contextmenu.js'
import d3v5 from "src/external/d3.v5.js"

export default class LivelyAnalysisHeatmap extends Morph {
  async initialize() {
    this.windowTitle = "LivelyAnalysisHeatmap";
    this.registerButtons()
    lively.html.registerKeys(this); // automatically installs handler for some methods
    this.svgElement = this.shadowRoot.querySelector("#lively-analysis-heatmap-svg")
    this.tooltipElement = this.shadowRoot.querySelector("#lively-analysis-heatmap-tooltip")
    this.infoboxElement = this.shadowRoot.querySelector("#lively-analysis-heatmap-infobox")
    this.selectedNode = undefined
    this.root = {}
    this.svgWidth = 300
    this.svgHeight = 400
  }
  
  setData(data) {
    if (data) {
      this.data = data
    }
  }
  
  getData() {
    return this.data
  }
  
  setWidth(width, unit) {
    this.svgWidth = width
    this.svgElement.style.width = width + unit
  }
  
  setHeight(height, unit) {
    this.svgHeight = height
    this.svgElement.style.height = height + unit
  }
  
/*  async updateViz() {
    this.svgElement.innerHTML = ''
    this.root = d3v5.hierarchy(this.data)
    this.selectedNode = this.root
    this.root.sum((function(cell) { if (cell != this.data) { return cell.relativeSize } }).bind(this));
    var treemapLayout = d3v5.treemap().size([this.svgWidth, this.svgHeight])
    treemapLayout.tile(d3v5.treemapSquarify.ratio(1))
    treemapLayout(this.root)
    
    var children = this.root.leaves()
    var parents = [] 
    this.root.descendants().forEach((node) => { if (node.children && node != this.root) parents.push(node) })
   
    var maxValue = Math.max.apply(Math, this.root.descendants().map(function(node){return (!node.parent) ? 0 : node.data.modifications}));
    var color = d3v5.scaleLinear()
      .range(['#ffffe6', '#ffd6b8', '#ffad8a', '#ff855c', '#ff5c2e', '#ff3300'])
      .domain([0, 2*(maxValue/10), 4*(maxValue/10), 6*(maxValue/10), 8*(maxValue/10), maxValue])
      .interpolate(d3v5.interpolateHcl);
    
    var svg = d3v5.select(this.svgElement)  
    svg.append('g').attr('transform', 'translate(.5,.5)')  
    // methods
    var childCells = svg.selectAll('g.cell.child') 
      .data(children)
      .enter()
      .append('g')
      .attr('class' , 'cell child')
      .attr('width', function(cell) { return cell.x1 - cell.x0; })
      .attr('height', function(cell) { return cell.y1 - cell.y0; })
      .attr('transform', function(cell) { return 'translate(' + cell.x0 + ',' + cell.y0 + ')'});

    childCells.append('rect')
      .attr('width', function(cell) { return cell.x1 - cell.x0; })
      .attr('height', function(cell) { return cell.y1 - cell.y0; })
      .style('fill', function(cell) { return color(cell.data.modifications)})
      .style('display', 'none')
      .on("mouseover", (function(cell) {
        this.tooltip(cell)
      }).bind(this));
  
    childCells.append('text') 
      .attr('x', function(cell) { return (cell.x1 - cell.x0)  / 2 })
      .attr('y', function(cell) { return (cell.y1 - cell.y0) / 2 })
      .attr('class', 'child title')
      .attr('text-anchor', 'middle')
      .attr('display', 'none')
      .text(function(cell) { return cell.data.name })
     
    childCells.append('text')
      .attr('x', function(cell) { return (cell.x1 - cell.x0) / 2 })
      .attr('y', function(cell) { return (cell.y1 - cell.y0) / 2 })
      .attr('dy', function(cell) { return (cell.y1 - cell.y0) / 4 })
      .attr('class', 'child modifications')
      .attr('text-anchor', 'middle')
      .style('display', 'none')
      .text(function(cell) { return cell.data.modifications + ' modifications' })
	
    // classes
    var parentCells = svg.selectAll('g.cell.parent')
      .data(parents)
      .enter()
      .append('g')
      .attr('class' , 'cell parent')
      .attr('width', function(cell) { return cell.x1 - cell.x0; })
      .attr('height', function(cell) { return cell.y1 - cell.y0; })
      .attr('transform', function(d) { return 'translate(' + d.x0 + ',' + d.y0 + ')'; });
    
    parentCells.append('rect')
      .attr('width', function(cell) { return cell.x1 - cell.x0; })
      .attr('height', function(cell) { return cell.y1 - cell.y0; })
      .style('fill', function(cell) { return color(cell.data.modifications)})
      .on("mouseover", (function(cell) {
        this.infobox(cell)
      }).bind(this))
    
    parentCells.append('text')
      .attr('x', function(cell) { return (cell.x1 - cell.x0) / 2 })
      .attr('y', function(cell) { return (cell.y1 - cell.y0) / 2 })
      .attr('class', 'parent title')
      .attr('text-anchor', 'middle')
      .text(function(cell) { return cell.data.name });
    
    parentCells.append('text')
      .attr('x', function(cell) { return (cell.x1 - cell.x0) / 2 })
      .attr('y', function(cell) { return (cell.y1 - cell.y0) / 2 })
      .attr('dy', function(cell) { return (cell.y1 - cell.y0) / 4 })
      .attr('class', 'parent modifications')
      .attr('text-anchor', 'middle')
      .text(function(cell) { return cell.data.modifications + ' modifications' })
    
    svg.selectAll('g.cell').on('click', (function(cell) {
      if (this.selectedNode.depth == 1) {
        return this.zoom(this.root, svg)
      }
      return this.zoom(cell, svg)
    }).bind(this));
    
    svg.selectAll('g.cell').on('contextmenu', function(cell) {
      if (!d3v5.event.shiftKey) {
        d3v5.event.stopPropagation()
        d3v5.event.preventDefault()
        var menu = new ContextMenu(this, [
          ["Open file", () => lively.openBrowser(cell.url, true)],
        ]);
        menu.openIn(document.body, d3v5.event, this);
        return true;
      }
    });
    this.infobox(this.root)
  }*/
  
  async updateViz() {
    this.svgElement.innerHTML = ''
    this.root = d3v5.hierarchy(this.data)
    this.setPositions(this.root)
    this.selectedNode = this.root
    var children = this.root.leaves()
    var parents = [] 
    this.root.descendants().forEach((node) => { if (node.children && node != this.root) parents.push(node) })
   
    var maxValue = Math.max.apply(Math, this.root.descendants().map(function(node){return (!node.parent) ? 0 : node.data.modifications}));
    var color = d3v5.scaleLinear()
      .range(['#ffffe6', '#ffd6b8', '#ffad8a', '#ff855c', '#ff5c2e', '#ff3300'])
      .domain([0, 2*(maxValue/10), 4*(maxValue/10), 6*(maxValue/10), 8*(maxValue/10), maxValue])
      .interpolate(d3v5.interpolateHcl);
    
    var svg = d3v5.select(this.svgElement)  
    svg.append('g').attr('transform', 'translate(.5,.5)')  
    // methods
    var childCells = svg.selectAll('g.cell.child') 
      .data(children)
      .enter()
      .append('g')
      .attr('class' , 'cell child')
      .attr('transform', function(cell) { return 'translate(' + cell.x0 + ',' + cell.y0 + ')'})
      .attr('width', function(cell) { return cell.x1 - cell.x0; })
      .attr('height', function(cell) { return cell.y1 - cell.y0; });

    childCells.append('rect')
      .attr('width', function(cell) { return cell.x1 - cell.x0; })
      .attr('height', function(cell) { return cell.y1 - cell.y0; })
      .style('fill', function(cell) { return color(cell.data.modifications)})
      .style('display', 'none')
      .on("mouseover", (function(cell) {
        this.tooltip(cell)
      }).bind(this));
  
    childCells.append('text') 
      .attr('x', function(cell) { return (cell.x1 - cell.x0) / 2 })
      .attr('y', function(cell) { return (cell.y1 - cell.y0) / 2.5 })
      .attr('class', 'child title')
      .attr('text-anchor', 'middle')
      .attr('display', 'none')
      .text(function(cell) { return cell.data.name });
     
    childCells.append('text')
      .attr('x', function(cell) { return (cell.x1 - cell.x0) / 2 })
      .attr('y', function(cell) { return (cell.y1 - cell.y0) / 1.5 })
      .attr('class', 'child modifications')
      .attr('text-anchor', 'middle')
      .style('display', 'none')
      .text(function(cell) { return cell.data.modifications + ' modifications' });
	
    // classes
    var parentCells = svg.selectAll('g.cell.parent')
      .data(parents)
      .enter()
      .append('g')
      .attr('class' , 'cell parent')
      .attr('width', function(cell) { return cell.x1 - cell.x0; })
      .attr('height', function(cell) { return cell.y1 - cell.y0; })
      .attr('transform', function(cell) { return 'translate(' + cell.x0 + ',' + cell.y0 + ')'});
    
    parentCells.append('rect')
      .attr('x', '0')
      .attr('y', '0')
      .attr('width', function(cell) { return cell.x1 - cell.x0; })
      .attr('height', function(cell) { return cell.y1 - cell.y0; })
      .style('fill', function(cell) { return color(cell.data.modifications) })
      .on("mouseover", (function(cell) {
        this.infobox(cell)
      }).bind(this));
    
    parentCells.append('text')
      .attr('x', function(cell) { return (cell.x1 - cell.x0) / 2 })
      .attr('y', function(cell) { return (cell.y1 - cell.y0) / 2.5 })
      .attr('class', 'parent title')
      .attr('text-anchor', 'middle')
      .text(function(cell) { return cell.data.name });
    
    parentCells.append('text')
      .attr('x', function(cell) { return (cell.x1 - cell.x0) / 2 })
      .attr('y', function(cell) { return (cell.y1 - cell.y0) / 1.5 })
      .attr('class', 'parent modifications')
      .attr('text-anchor', 'middle')
      .text(function(cell) { return cell.data.modifications + ' modifications' });
    
    svg.selectAll('g.cell').on('click', (function(cell) {
      if (this.selectedNode.depth == 1) {
        return this.zoom(this.root, svg)
      }
      return this.zoom(cell, svg)
    }).bind(this));
    
    svg.selectAll('g.cell').on('contextmenu', function(cell) {
      if (!d3v5.event.shiftKey) {
        d3v5.event.stopPropagation()
        d3v5.event.preventDefault()
        var menu = new ContextMenu(this, [
          ["Open file", () => lively.openBrowser(cell.url, true)],
        ]);
        menu.openIn(document.body, d3v5.event, this);
        return true;
      }
    });
    this.infobox(this.root)
  }
  
  zoom(cell, svg) {
    var zoomX = this.svgWidth / (cell.x1 - cell.x0)
    var zoomY = this.svgHeight / (cell.y1 - cell.y0);   
    var xPosition = d3v5.scaleLinear().range([0, this.svgWidth]).domain([cell.x0, cell.x1])
    var yPosition = d3v5.scaleLinear().range([0, this.svgHeight]).domain([cell.y0, cell.y1])

    var transition = svg.selectAll('g.cell')
      .transition()
      .duration(550)
      .attr('transform', function(cell) { return 'translate(' + xPosition(cell.x0) + ',' + yPosition(cell.y0) + ')';  });

    transition.select('rect')
      .attr('width', function(cell) { return zoomX * (cell.x1 - cell.x0) - 1; })
      .attr('height', function(cell) { return zoomY * (cell.y1 - cell.y0) - 1; })
    
    if (cell != this.root) { 						// child
      svg.selectAll('g.cell.child').select('rect').style('display', 'block')
      svg.selectAll('g.cell.parent').select('rect').style('display', 'none')
      svg.selectAll('text.child.title')
        .style('display', 'block')
        .attr('x', function(cell) { return (zoomX * (cell.x1 - cell.x0)) / 2 })
        .attr('y', function(cell) { return (zoomY * (cell.y1 - cell.y0)) / 2.5 });
      svg.selectAll('text.child.modifications')
        .style('display', 'block')
        .attr('x', function(cell) { return (zoomX * (cell.x1 - cell.x0)) / 2 })
        .attr('y', function(cell) { return (zoomY * (cell.y1 - cell.y0)) / 1.5 });
      svg.selectAll('text.parent').style('display', 'none')
    } else {								        // parent
      svg.selectAll('g.cell.parent').select('rect').style('display', 'block')
      svg.selectAll('g.cell.child').select('rect').style('display', 'none')
      svg.selectAll('text.child').style('display', 'none')
      svg.selectAll('text.parent.title')
        .style('display', 'block')
        .attr('x', function(cell) { return (cell.x1-cell.x0) / 2 })
        .attr('y', function(cell) { return (cell.y1-cell.y0) / 2.5 });
      svg.selectAll('text.parent.modifications')
        .style('display', 'block')
        .attr('x', function(cell) { return (cell.x1-cell.x0) / 2 })
        .attr('y', function(cell) { return (cell.y1-cell.y0) / 1.5 });
    }
    this.selectedNode = cell
    d3v5.event.stopPropagation() 
  }
  
  tooltip(cell) {
    this.tooltipElement.style.top = d3v5.event.pageX + 10 + 'px'
    this.tooltipElement.style.left = d3v5.event.pageY + 10 + 'px'
    this.tooltipElement.innerHTML = 'Class: ' + cell.name + '<br/>'  + 'Modifications: ' + cell.data.modifications + '<br/>' + 'Url: ' + cell.data.url
  }
  
  infobox(cell) {
    let parent = (cell.parent) ? cell.parent.data.name + ' - ' : ''
    let name = cell.data.name
    this.infoboxElement.innerHTML = 'Selected source: - ' + parent + name
    this.infoboxElement.style.width = this.svgWidth + 'px'
  }
  
  getPosition(i, columns, rows) {
    let index = i+1
    let row = Math.ceil(index/columns)
    let column = (index % columns == 0) ? columns : index % columns
    return [row-1, column-1]
  }

  setPositions() {
    let columns =  Math.ceil(Math.sqrt(this.root.children.length))
    let rows = Math.ceil(this.root.children.length / columns)
    this.root.x0 = 0
    this.root.x1 = this.svgWidth
    this.root.y0 = 0
    this.root.y1 = this.svgHeight
    let gridSizeX = (this.root.x1 - this.root.x0) / columns
    let gridSizeY = (this.root.y1 - this.root.y0) / rows

    for (let i = 0; this.root.children && i < this.root.children.length; ++i) {
      let clazz = this.root.children[i];
      let position = this.getPosition(i, columns, rows);
      clazz.x0 = position[1] * gridSizeX 
      clazz.x1 = position[1] * gridSizeX + gridSizeX
      clazz.y0 = position[0] * gridSizeY 
      clazz.y1 = position[0] * gridSizeY + gridSizeY

      for(let j = 0; clazz.children && j < clazz.children.length; ++j) {
        let columns =  Math.ceil(Math.sqrt(clazz.children.length))
        let rows = Math.ceil(clazz.children.length / columns)
        let method = clazz.children[j];
        let position = this.getPosition(j, columns, rows);
        let gridSizeX = (clazz.x1 - clazz.x0) / columns
        let gridSizeY = (clazz.y1 - clazz.y0) / rows

        method.x0 = clazz.x0 + position[1] * gridSizeX 
        method.x1 = clazz.x0 + position[1] * gridSizeX + gridSizeX
        method.y0 = clazz.y0 + position[0] * gridSizeY 
        method.y1 = clazz.y0 + position[0] * gridSizeY + gridSizeY
      }
    }
  }
  
    
  // this method is autmatically registered through the ``registerKeys`` method
  onKeyDown(evt) {
    lively.notify("Key Down!" + evt.charCode)
  }
  

  /* Lively-specific API */

  livelyPreMigrate() {
    // is called on the old object before the migration
  }
  
  livelyMigrate(other) {
    // whenever a component is replaced with a newer version during development
    // this method is called on the new object during migration, but before initialization
    this.someJavaScriptProperty = other.someJavaScriptProperty
  }
  
  livelyInspect(contentNode, inspector) {
    // do nothing
  }
  
  livelyPrepareSave() {
    
  }
   
  async livelyExample() {
    this.data = {
      name: "root",
      modifications: 150,
      children: [
        {name: "classA", modifications: 50, children: [{name: "methodA1", modifications: 36}, {name: "methodA2", modifications: 14}]},
        {name: "classB", modifications: 25, children: [{name: "methodB1", modifications: 24}]},
        {name: "classC", modifications: 15, children: [{name: "methodC1", modifications: 14}]}
      ]}
    this.setWidth(400, 'px')
    this.setHeight(300, 'px')
    await this.updateViz()
  }
}