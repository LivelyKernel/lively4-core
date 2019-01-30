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
    this.selectElement = this.shadowRoot.querySelector('#lively-analysis-heatmap-selection')
    
    this.selectElement.addEventListener("change", () => this.onSelectionChanged())
    
    this.selectedOption = this.selectElement.options[this.selectElement.selectedIndex].value;
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
    
  async updateViz() {
    this.svgElement.innerHTML = ''
    this.root = d3v5.hierarchy(this.data)
    this.selectedNode = this.root
    var children = []
    var parents = [] 
    
    if (this.selectedOption == 'view-all-classes') {
      children = this.root.leaves()
      this.root.descendants().forEach((node) => { if (node.children && node != this.root) parents.push(node) })
    } else if (this.selectedOption == 'view-all-methods') {
      children = []
      parents = this.root.leaves()
    }
   
    this.createGrid(parents)

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
      .attr('width', function(cell) { return cell.x1 - cell.x0 ; })
      .attr('height', function(cell) { return cell.y1 - cell.y0; });

    childCells.append('rect')
      .attr('width', function(cell) { return cell.x1 - cell.x0; })
      .attr('height', function(cell) { return cell.y1 - cell.y0; })
      .attr('class' , 'child')
      .style('fill', function(cell) { return color(cell.data.modifications) })
      .style('stroke-width', 1.5)
      .style('stroke', 'white')
      .style('display', 'none')
  
    /*childCells.append('text') 
      .attr('x', function(cell) { return (cell.x1 - cell.x0) / 2 })
      .attr('y', function(cell) { return (cell.y1 - cell.y0) / 2.5 })
      .attr('class', 'child title')
      .attr('text-anchor', 'middle')
      .attr('display', 'none')
      .text(function(cell) { return cell.data.name });*/
     
   /* childCells.append('text')
      .attr('x', function(cell) { return (cell.x1 - cell.x0) / 2 })
      .attr('y', function(cell) { return (cell.y1 - cell.y0) / 1.5 })
      .attr('class', 'child modifications')
      .attr('text-anchor', 'middle')
      .style('display', 'none')
      .text(function(cell) { return cell.data.modifications });*/
	
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
      .attr('class' , 'parent')
      .style('fill', function(cell) { return color(cell.data.modifications) })
      .style('stroke-width', 1)
      .style('stroke', 'white')
      .on("mouseover", (function(cell) {
        this.infobox(cell)
      }).bind(this));
    
    /*parentCells.append('text')
      .attr('x', function(cell) { return (cell.x1 - cell.x0) / 2 })
      .attr('y', function(cell) { return (cell.y1 - cell.y0) / 2.5 })
      .attr('class', 'parent title')
      .attr('text-anchor', 'middle')
      .text(function(cell) { return cell.data.name });*/
    
    /*parentCells.append('text')
      .attr('x', function(cell) { return (cell.x1 - cell.x0) / 2 })
      .attr('y', function(cell) { return (cell.y1 - cell.y0) / 1.5 })
      .attr('class', 'parent modifications')
      .attr('text-anchor', 'middle')
      .text(function(cell) { return cell.data.modifications });*/
    
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
          ["Open file", () => lively.openBrowser(cell.data.url, true)],
        ]);
        menu.openIn(document.body, d3v5.event, this);
        return true;
      }
    });
    svg.selectAll('g.cell').on('mousemove', (function(cell) {
      this.tooltip(cell)
    }).bind(this))
    this.infobox(this.root)
  }
  
  onSelectionChanged() {
    let selection = d3v5.select(this.selectElement)
    this.selectedOption = selection.node().value
    this.updateViz()
  }
  
  createGrid(cells) {
    this.root.x0 = 0
    this.root.x1 = this.svgWidth
    this.root.y0 = 0
    this.root.y1 = this.svgHeight
    let columns =  Math.ceil(Math.sqrt(cells.length))
    let rows = Math.ceil(cells.length / columns)

    let gridSizeX = this.svgWidth / columns
    let gridSizeY = this.svgHeight / rows

    for (let i = 0; i < cells.length; ++i) {
      let parent = cells[i];
      let position = this.getPosition(i, columns, rows);
      parent.x0 = position[1] * gridSizeX 
      parent.x1 = position[1] * gridSizeX + gridSizeX
      parent.y0 = position[0] * gridSizeY 
      parent.y1 = position[0] * gridSizeY + gridSizeY

      for(let j = 0; parent.children && j < parent.children.length; ++j) {
        let columns =  Math.ceil(Math.sqrt(parent.children.length))
        let rows = Math.ceil(parent.children.length / columns)
        let child = parent.children[j];
        let position = this.getPosition(j, columns, rows);
        let gridSizeX = (parent.x1 - parent.x0) / columns
        let gridSizeY = (parent.y1 - parent.y0) / rows

        child.x0 = parent.x0 + position[1] * gridSizeX 
        child.x1 = parent.x0 + position[1] * gridSizeX + gridSizeX
        child.y0 = parent.y0 + position[0] * gridSizeY 
        child.y1 = parent.y0 + position[0] * gridSizeY + gridSizeY
      }
    }
  }
  
  zoom(cell, svg) {
    var zoomX = this.svgWidth / (cell.x1 - cell.x0)
    var zoomY = this.svgHeight / (cell.y1 - cell.y0)
    var xPosition = d3v5.scaleLinear().range([0, this.svgWidth]).domain([cell.x0, cell.x1])
    var yPosition = d3v5.scaleLinear().range([0, this.svgHeight]).domain([cell.y0, cell.y1])

    var transition = svg.selectAll('g.cell')
      .transition()
      .duration(550)
      .attr('transform', function(cell) { return 'translate(' + xPosition(cell.x0) + ',' + yPosition(cell.y0) + ')';  });

    transition.select('rect')
      .attr('width', function(cell) { return zoomX * (cell.x1 - cell.x0); })
      .attr('height', function(cell) { return zoomY * (cell.y1 - cell.y0); })
    
    if (cell != this.root) { 						// child
      svg.selectAll('g.cell.child').select('rect').style('display', 'block')
      svg.selectAll('g.cell.parent').select('rect').style('display', 'none')
     /* svg.selectAll('text.child.title')
        .style('display', 'block')
        .attr('x', function(cell) { return (zoomX * (cell.x1 - cell.x0)) / 2 })
        .attr('y', function(cell) { return (zoomY * (cell.y1 - cell.y0)) / 2.5 });*/
     /* svg.selectAll('text.child.modifications')
        .style('display', 'block')
        .attr('x', function(cell) { return (zoomX * (cell.x1 - cell.x0)) / 2 })
        .attr('y', function(cell) { return (zoomY * (cell.y1 - cell.y0)) / 1.5 });*/
      svg.selectAll('text.parent').style('display', 'none')
    } else {								        // parent
      svg.selectAll('g.cell.parent').select('rect').style('display', 'block')
      svg.selectAll('g.cell.child').select('rect').style('display', 'none')
      svg.selectAll('text.child').style('display', 'none')
     /* svg.selectAll('text.parent.title')
        .style('display', 'block')
        .attr('x', function(cell) { return (cell.x1-cell.x0) / 2 })
        .attr('y', function(cell) { return (cell.y1-cell.y0) / 2.5 });*/
     /* svg.selectAll('text.parent.modifications')
        .style('display', 'block')
        .attr('x', function(cell) { return (cell.x1-cell.x0) / 2 })
        .attr('y', function(cell) { return (cell.y1-cell.y0) / 1.5 });*/
    }
    this.selectedNode = cell
    d3v5.event.stopPropagation() 
  }
  
  tooltip(cell) {
    this.tooltipElement.style.top = d3v5.event.pageY + 10 + 'px'
    this.tooltipElement.style.left = d3v5.event.pageX + 10 + 'px'
    if (cell.children) {
      this.tooltipElement.innerHTML = '<h4 class="title"> Class: ' + cell.data.name + '</h4>'
        + '<strong>Modifications: ' + cell.data.modifications + '</strong>'
        + '<div>Module: ' + cell.data.url + '</div>'
    } else {
      this.tooltipElement.innerHTML = '<h4 class="title"> Method: ' + cell.data.name + '</h4>'
        + '<h4 class="subtitle">Class: ' + cell.parent.data.name + '</h4>'
        + '<strong>Modifications: ' + cell.data.modifications + '</strong>'
        + '<div>Module: ' + cell.data.url + '</div>'
    }
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
        {name: "class A", modifications: 50, children: [{name: "method A1", modifications: 36}, {name: "method A2", modifications: 14}]},
        {name: "class B", modifications: 25, children: [{name: "method B1", modifications: 20}, {name: "method B2", modifications: 3}, {name: "method B3", modifications: 1}]},
        {name: "class C", modifications: 15, children: [{name: "method C1", modifications: 14}]}
      ]}
    this.setWidth(400, 'px')
    this.setHeight(300, 'px')
    await this.updateViz()
  }
}