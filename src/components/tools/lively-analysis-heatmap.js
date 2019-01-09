"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js'
import d3 from "src/external/d3.v3.js"
import ContextMenu from 'src/client/contextmenu.js'
//import d3v3 from "src/external/d3.v3.js"

export default class LivelyAnalysisHeatmap extends Morph {
  async initialize() {
    this.windowTitle = "LivelyAnalysisHeatmap";
    this.registerButtons()
    lively.html.registerKeys(this); // automatically installs handler for some methods
    this.svgElement = this.shadowRoot.querySelector("#lively-analysis-heatmap-svg")
    this.tooltipElement = this.shadowRoot.querySelector("#lively-analysis-heatmap-tooltip")
    this.infoboxElement = this.shadowRoot.querySelector("#lively-analysis-heatmap-infobox")
    this.root = undefined
    this.selectedNode = undefined
    this.nodes = undefined
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
    var treemap = d3.layout.treemap()
      .round(false)
      .size([this.svgWidth, this.svgHeight])
      .children(function(d) { return d.children; })
      .sticky(false)
      .value(function(d) {
        let size = d.parent.children.length
        if (size == 0)
          return 100
        return 100 / size
      });
    this.svgElement.innerHTML = ''
    this.root = this.data
    this.selectedNode = this.data
    this.nodes = treemap.nodes(this.data)
    
    var children = this.nodes.filter(function(d) {
      return !d.children
    })
    var parents = this.nodes.filter(function(d) {
      return d.children && d.parent
    })

    var maxValue = Math.max.apply(Math, this.nodes.map(function(node) { if (!node.parent) return 0; return node.modifications }))
    var color = d3.scale.linear().interpolate(d3.interpolateHcl).range(['#ffffe6', '#ffd6b8', '#ffad8a', '#ff855c', '#ff5c2e', '#ff3300'])
    color.domain([0, 2*(maxValue/10), 4*(maxValue/10), 6*(maxValue/10), 8*(maxValue/10), maxValue])
    
    var svg = d3.select(this.svgElement)  
    svg.append('g').attr('transform', 'translate(.5,.5)')  
    // methods
    var childCells = svg.selectAll('g.cell.child')
      .data(children)
      .enter()
      .append('g')
      .attr('class' , 'cell child')
      .attr('transform', function(cell) { return 'translate(' + cell.x + ',' + cell.y + ')'; });	      

    childCells.append('rect')
      .attr('width', function(cell) { return cell.dx - 1; })
      .attr('height', function(cell) { return cell.dy - 1; })
      .style('fill', function(cell) { return color(cell.modifications)})
      .style('display', 'none')
      .on("mouseover", (function(cell) {
        this.tooltip(cell)
      }).bind(this));
  
    childCells.append('text') 
      .attr('x', function(cell) { return cell.dx / 2 })
      .attr('y', function(cell) { return cell.dy / 2 })
      .attr('class', 'child title')
      .attr('text-anchor', 'middle')
      .attr('display', 'none')
      .text(function(cell) { return cell.name })
     
    childCells.append('text')
      .attr('x', function(cell) { return cell.dx / 2 })
      .attr('y', function(cell) { return cell.dy / 2 })
      .attr('dy', function(cell) { return cell.dy / 4 })
      .attr('class', 'child modifications')
      .attr('text-anchor', 'middle')
      .style('display', 'none')
      .text(function(cell) { return cell.modifications + ' modifications' })
	
    // classes
    var parentCells = svg.selectAll('g.cell.parent')
      .data(parents)
      .enter()
      .append('g')
      .attr('class' , 'cell parent')
      .attr('transform', function(cell) { return 'translate(' + cell.x + ',' + cell.y + ')'; });
    
    parentCells.append('rect')
      .attr('width', function(cell) { return cell.dx - 1; })
      .attr('height', function(cell) { return cell.dy - 1; })
      .style('fill', function(cell) { return color(cell.modifications)})
      .on("mouseover", (function(cell) {
        this.infobox(cell)
      }).bind(this))
    
    parentCells.append('text')
      .attr('x', function(cell) { return cell.dx / 2 })
      .attr('y', function(cell) { return cell.dy / 2 })
      .attr('class', 'parent title')
      .attr('text-anchor', 'middle')
      .text(function(cell) { return cell.name });
    
    parentCells.append('text')
      .attr('x', function(cell) { return cell.dx / 2 })
      .attr('y', function(cell) { return cell.dy / 2 })
      .attr('dy', function(cell) { return cell.dy / 4 })
      .attr('class', 'parent modifications')
      .attr('text-anchor', 'middle')
      .text(function(cell) { return cell.modifications + ' modifications' })
    
    svg.selectAll('g.cell').on('click', (function(cell) {
      if (this.selectedNode.depth == 1) {
        return this.zoom(this.root, svg)
      }
      return this.zoom(cell, svg)
    }).bind(this));
    
    svg.selectAll('g.cell').on('contextmenu', function(cell) {
      if (!d3.event.shiftKey) {
        d3.event.stopPropagation()
        d3.event.preventDefault()
        var menu = new ContextMenu(this, [
          ["Open file", () => lively.openBrowser(cell.url, true)],
        ]);
        menu.openIn(document.body, d3.event, this);
        return true;
      }
    });
    this.infobox(this.root)
  }
  
  zoom(d, svg) {
    let kx = this.svgWidth / d.dx
    let ky = this.svgHeight / d.dy
    var xPosition = d3.scale.linear().range([0, this.svgWidth]).domain([d.x, d.x + d.dx])
    var yPosition = d3.scale.linear().range([0, this.svgHeight]).domain([d.y, d.y + d.dy])

    var transition = svg.selectAll('g.cell')
      .transition()
      .duration(650)
      .attr('transform', function(d) { return 'translate(' + xPosition(d.x) + ',' + yPosition(d.y) + ')'; });

    transition.select('rect')
      .attr('width', function(d) { return kx * d.dx - 1; })
      .attr('height', function(d) { return ky * d.dy - 1; })
    
    if (d != this.root) { 						// child
      svg.selectAll('g.cell.child').select('rect').style('display', 'block')
      svg.selectAll('g.cell.parent').select('rect').style('display', 'none')
      svg.selectAll('text.child')
        .style('display', 'block')
        .attr('x', function(cell) { return (kx * cell.dx) / 2 })
        .attr('y', function(cell) { return (ky * cell.dy) / 2 })
        svg.selectAll('text.parent').style('display', 'none')
    } else {								        // parent
      svg.selectAll('g.cell.parent').select('rect').style('display', 'block')
      svg.selectAll('g.cell.child').select('rect').style('display', 'none')
      svg.selectAll('text.child').style('display', 'none')
      svg.selectAll('text.parent')
        .style('display', 'block')
        .attr('x', function(cell) { return cell.dx / 2 })
        .attr('y', function(cell) { return cell.dy / 2 })
    }
    this.selectedNode = d
    d3.event.stopPropagation() 
  }
  
  tooltip(cell) {
    this.tooltipElement.style.top = d3.event.pageX + 10 + 'px'
    this.tooltipElement.style.left = d3.event.pageY + 10 + 'px'
    this.tooltipElement.innerHTML = 'Class: ' + cell.name + '<br/>'  + 'Modifications: ' + cell.modifications + '<br/>' + 'Url: ' + cell.url
  }
  
  infobox(cell) {
    let parent = (cell.parent) ? cell.parent.name + ' - ' : ''
    let name = cell.name
    this.infoboxElement.innerHTML = 'Selected source: - ' + parent + name
    this.infoboxElement.style.width = this.svgWidth + 'px'
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