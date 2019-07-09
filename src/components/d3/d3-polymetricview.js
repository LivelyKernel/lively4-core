import Morph from "src/components/widgets/lively-morph.js"
import d3 from "src/external/d3.v5.js"
import { debounce } from "utils";
import "src/external/d3-selection-multi.v1.js"
import flextree from "src/external/d3-flextree.js"
import D3Component from "./d3-component.js"

export default class D3Polymetricview extends D3Component {

  initialize() {
    super.initialize()
  }
  
  updateViz() {
    var bounds = this.getBoundingClientRect()
    if (bounds.width == 0) { // we are not opened
      bounds = lively.getBounds(this)
    }
   
    
    this.shadowRoot.querySelector("svg").innerHTML = ""


    var treeData = this.getData()
    if (!treeData) return; // nothing to render

    var margin = { top: 10, right: 10, bottom: 10, left: 10 }
    var width = bounds.width,
      height = bounds.height;

    var svgElement = this.shadowRoot.querySelector("svg")
    var svgOuter = d3.select(svgElement)
      .attr("width", width + margin.right + margin.left)
      .attr("height", height + margin.top + margin.bottom)
    
    svgOuter.append("rect")
      .attr("width", width)
      .attr("height", height)
      .style("fill", "none")
      .style("pointer-events", "all")
      .call(d3.zoom()
          .scaleExtent([1 / 4, 20])
          .on("zoom", () => {
            zoomG.attr("transform", d3.event.transform);
          }));
    var zoomG = svgOuter.append("g")
    
    var svg = zoomG.append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    this.svg = svg
    
    var g = svg.append("g").attr("transform", "translate(0,0)");
    
    var data = treeData
    
    const minWidth = (tree) => tree.nodes.reduce(
      (min, n) => {return Math.min(min, this.dataWidth(n))}, Infinity) ;

    const minHeight = (tree) => tree.nodes.reduce(
      (min, n) => {return Math.min(min, this.dataHeight(n))}, Infinity) ;

    var hackSizeX = 10
    var hackSizeY = 10
    
    var treeLayout = flextree({
      nodeSize: node => [this.dataWidth(node), this.dataHeight(node) + hackSizeX],
      spacing: (a, b) => 0.2 *  minWidth(tree)  * a.path(b).length + hackSizeY
    })
    var tree = treeLayout.hierarchy(data)
    tree.eachBefore((d) => { d.data.id = (d.parent ? d.parent.data.id + "." : "") + d.data.name })
    
    treeLayout(tree); // or 
      
    function drawTree() {
      var padding = 0 // outer padding
      const extents = tree.extents;
      const tw = extents.right - extents.left;
      const scale = Math.min(width / tw, height / extents.bottom);
      const stw = tw * scale;
      
      const transX = (stw >= width) ? -extents.left * scale :
        (width + scale * (extents.right + extents.left)) / 2;
      
      
      var reverseScale = 1
    
      var scaleG = svg.append('g')
        .attr('transform',
            `scale(${reverseScale} ${reverseScale})`);

      
      var drawing = scaleG.append('g')
        .attr('transform',
          `translate(${padding + transX} ${padding}) scale(${scale} ${scale})`);
      
 
      var context = {
        tree, drawing, scale
      }
 
      drawSubtree(tree, context);
    }

    var poly = this
    function drawSubtree(node, context, parent = null) {
      const { tree, drawing, scale } = context;
      const [width, height] = node.size;
      const { x, y } = node;
      
      var layoutRect = drawing.append('rect').attrs({
        'class': 'node',
        // rx: 5 / scale,
        // ry: 5 / scale,
        x: x - width / 2,
        y: y ,
        width,
        height,
        // stroke: "gray",
        // "stroke-width": "1px",
        // "stroke-dasharray": "5, 5",
        fill: "none"
      });
      

      const paddingSide = minWidth(tree) * 0.1; 
      const paddingBottom = minHeight(tree) * 0.2 + hackSizeX;
      if (isNaN(paddingBottom) || isNaN(paddingSide) ) {
        throw new Error("padding... should be Number!") // just in case...
      }
      
      var innerRect = drawing.append('rect').attrs({
        // rx: 5 / scale,
        // ry: 5 / scale,
        x: x - width / 2 + paddingSide,
        y: y,
        width: width - 2 * paddingSide,
        height: height - paddingBottom,
        stroke: "gray",
        "stroke-width": "1px",
        fill: poly.dataColor(node),
      });
      
      innerRect.append("title") 
        .text(node.data.name);

      innerRect.on("click", () => poly.onNodeClick(node, d3.event))
      
      // drawing.append('text')
      //   .attrs({
      //     x: x,
      //     y: y + 3 / scale,
      //     fill: `hsl(${node.hue}, 70%, 60%)`,
      //     'text-anchor': 'middle',
      //     'alignment-baseline': 'hanging',
      //   })
      //   .styles({
      //     'font-family': 'sans-serif',
      //     'font-size': (12 / scale) + 'pt',
      //   })
      //   .text(node.id);

      if (node.parent) {
        
        drawing.append('path')
          .attr("class", "link")
          .attr('d', d3.linkVertical()({
            source: [node.parent.x, (node.parent.y + node.parent.size[1] - paddingBottom)  ],
            target: [node.x, node.y],
          }))
          //.attr('d', poly.diagonal(node, paddingBottom));

      }
      for (const kid of (node.children || [])) drawSubtree(kid, context, node);
    }
    drawTree();
  }

  
  async livelyExample2() {
    this.config({
      color(node) {
        if (!node) return ""
        return `hsl(10, 0%,  ${node.data.children ? (node.data.children.length * 50) : 10 }%)`
      },
      width(node) {
        return 10
        if (node.data.size) {
          return parseInt(node.data.size) // #TODO -> loc
        }
      },
      height(node) {
        return 1
        if (node.data.size) {
          return parseInt(node.data.size) // #TODO -> loc
        }
      },
      onclick(node) {
        lively.openInspector(node.data)
      },
    }) 
    this.setData({
      name: "classes",
      children: [
        {name: "class A", loc: 10, size: 10, children: [{name: "method A1", loc: 3, size: 3}, {name: "method A2", loc: 7, size: 7}]},
        {name: "class B", loc: 30, size: 30, children: [{name: "method B1", loc: 30, size: 30}]},
        {name: "class C", loc: 50, size: 50, children: [{name: "method C1", loc: 50, size: 50}]}
      ]
    })

  }
  
  async livelyExample() {
    var seed = 1;
    function random() {
        var x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    }
    
    this.config({
      color(node) {
        if (!node.data) return ""
        return `hsl(10, 0%,  ${node.data.size / 100}%)`
      },
      
      width(node) {
        if (node.data.width === undefined) {
          try {
            var width = Math.sqrt(Number(node.data.size))
            if (! width > 0) {
              width = 1
            }
          } catch(e) {
            width = 1
          }
          node.data.width =  width
        } 
        return  node.data.width
      },

      height(node) {
        if (node.data.height === undefined) {
          try {
            var height = Math.sqrt(Number(node.data.size))
            if (! height > 0) {
              height = 1
            }
          } catch(e) {
            height = 1
          }
          node.data.height =  height
        } 
        return  node.data.height
      },
      
      onclick(node) {
        lively.openInspector(node)
      },
    })
    this.setData(await d3.json(lively4url + "/src/components/demo/flare.json"))

  }

}
