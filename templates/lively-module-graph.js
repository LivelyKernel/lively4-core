import Morph from "./Morph.js"


export default class LivelyModuleGraph extends Morph {

  async initialize() {
    lively.notify("initialize!")
      if (!window.d3 || !window.cola || !window.ScopedD3) {
        console.log("LOAD D3");
        await lively.loadJavaScriptThroughDOM("d3", "src/external/d3.v3.js");
        await System.import("templates/ContainerScopedD3.js");
        await lively.loadJavaScriptThroughDOM("cola", "src/external/cola.js");
        await lively.loadJavaScriptThroughDOM("cola-layout", "src/external/cola-layout.js");
        await lively.loadJavaScriptThroughDOM("cola-shortestpaths", "src/external/cola-shortestpaths.js");
      }
      this.d3cola = cola.d3adaptor().convergenceThreshold(0.1);

      var bounds = this.getBoundingClientRect()
      var width = bounds.width, height = bounds.height;
      var scale = 0.3;
      var zoom = d3.behavior.zoom();
      
      var zoomWidth = (width-scale*width)/2
      var zoomHeight = (height-scale*height)/2
      zoom.translate([zoomWidth,zoomHeight]).scale(scale);
      this.shadowRoot.querySelector("svg").innerHTML = ""
      
      var outer = d3.select(this.shadowRoot.querySelector("svg"))
          .attr({ width: width, height: height, "pointer-events": "all" });
      outer.append('rect')
          .attr({ class: 'background', width: "100%", height: "100%" })
          .call(zoom.on("zoom", () => this.redraw()));

      

      this.vis = outer
          .append('g')
          .attr('transform', "translate("+zoomWidth+","+zoomHeight+") scale(" + scale +' )');

      outer.append('svg:defs').append('svg:marker')
          .attr({
              id: 'end-arrow',
              viewBox: '0 -5 10 10',
              refX: 8,
              markerWidth: 6,
              markerHeight: 6,
              orient: 'auto'
          })
        .append('svg:path')
          .attr({
              d: 'M0,-5L10,0L0,5L2,0',
              'stroke-width': '0px',
              fill: '#000'});

        this.render()
    }
    
    render() {
      var bounds = this.getBoundingClientRect()
      var width = bounds.width, height = bounds.height;

      var graph = {nodes: [], links: []},
          graphModules = [];
          
      Object.values(System.loads).map( ea => ea.key).map(function (moduleName) {
        if (moduleName.match(/\.js\?[0-9]+/)) return;
        
        
        
        graphModules.push(moduleName);
        graph.nodes.push({name: moduleName, id: graphModules.length - 1});
        return moduleName;
      }).forEach(function (moduleName) {
          if (!moduleName) return;
          var mod = System.loads[moduleName]
          mod.dependencies.forEach(function (dependency) {
            var depKey = System.normalizeSync(dependency, mod.key)
            var targetIdx = graphModules.indexOf(depKey);
            if (targetIdx < 0) return;
            graph.links.push({
              source: targetIdx,
              target: graphModules.indexOf(moduleName), value: 1
            });
          });
      })
      var nodes = graph.nodes;
      var edges = graph.links;

      this.d3cola
          .avoidOverlaps(true)
          .convergenceThreshold(1e-3)
          .flowLayout('x', 350)
          .size([width, height])
          .nodes(nodes)
          .links(edges)
          .jaccardLinkLengths(250);

      var link = this.vis.selectAll(".link")
          .data(edges)
          .enter().append("path")
          .attr("class", "link");

      var margin = 10, pad = 12;
      var node = this.vis.selectAll(".node")
          .data(nodes)
          .enter().append("rect")
          .classed("node", true)
          .attr({ rx: 5, ry: 5 })
          .call(this.d3cola.drag);
      node.append("title").text(function(d) { return d.name; });
      var label = this.vis.selectAll(".label")
          .data(nodes)
          .enter().append("text")
          .attr("class", "label")
          .text(function (d) { return d.name.replace(/.*\//, ""); })
          //.style("user-select", "none")
          
          .call(this.d3cola.drag)
          .on("click", (d) => {
            if (d3.event.defaultPrevented) return; // click suppressed
            lively.openBrowser(d.name, true);
          })
          .each(function (d) {
              var b = this.getBBox();
              var extra = 2 * margin + 2 * pad;
              d.width = b.width + extra;
              d.height = b.height + extra;
          });
      label
        .append("title")
        .text(function(d) { return d.name; });
      

      var lineFunction = d3.svg.line()
          .x(function (d) { return d.x; })
          .y(function (d) { return d.y; })
          .interpolate("linear");

      var routeEdges = () => {
          this.d3cola.prepareEdgeRouting();
          link.attr("d", (d) => {
            
              return lineFunction(this.d3cola.routeEdge(d
              // show visibility graph
                  //, function (g) {
                  //    if (d.source.id === 10 && d.target.id === 11) {
                  //    g.E.forEach(function (e) {
                  //        this.vis.append("line").attr("x1", e.source.p.x).attr("y1", e.source.p.y)
                  //            .attr("x2", e.target.p.x).attr("y2", e.target.p.y)
                  //            .attr("stroke", "green");
                  //    });
                  //    }
                  //}
              ));
          });
        }
        
      this.d3cola.start(50, 100, 200).on("tick", function () {
          node.each(function (d) { d.innerBounds = d.bounds.inflate(-margin); })
              .attr("x", function (d) { return d.innerBounds.x; })
              .attr("y", function (d) { return d.innerBounds.y; })
              .attr("width", function (d) {
                  return d.innerBounds.width();
              })
              .attr("height", function (d) { return d.innerBounds.height(); });

          link.attr("d", function (d) {
              var route = cola.vpsc.makeEdgeBetween(d.source.innerBounds, d.target.innerBounds, 5);
              return lineFunction([route.sourceIntersection, route.arrowStart]);
          });

          label
              .attr("x", function (d) { return d.x })
              .attr("y", function (d) { return d.y + (margin + pad) / 2 });

      }).on("end", () => {
        try {
          routeEdges()
        } catch(e) {
          lively.showError(e)
        }
      });
    }
    
    redraw() {
      // console.log("translate " + d3.event.translate + " scale " + d3.event.scale)
        
      this.vis.attr("transform", "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")");
    }
    
}
