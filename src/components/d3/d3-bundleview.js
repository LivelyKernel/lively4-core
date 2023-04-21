import Morph from 'src/components/widgets/lively-morph.js';
import d3 from 'src/external/d3.v5.js';
import * as cop from 'src/client/ContextJS/src/contextjs.js'

/*MD # D3 Bundleview 

![](d3-bundleview.png){height=400px}

MD*/


export function isLeaf(d) { return !d.children || d.children.length === 0; }

const DEFAULT_COLOR_LEAF_NODE = "#6666af";
const DEFAULT_COLOR_DIRECTORY = "#999999";

const COLOR_NODE_HOVERED = 'steelblue';
const COLOR_NODE_descendant = '#dfd89d';
const COLOR_NODE_ancestor = '#efe8ad';
const COLOR_NODE_target = '#d62728';
const COLOR_NODE_source = '#2ca02c';

const DEFAULT_IDENTIFIER = 'default';

var bundleviewCount = 0;

export function walkTree(root, beforeChildren = () => {}, afterChildren = () => {}) {
  beforeChildren(root);
  if (root.children) {
    root.children.forEach((child, i) => {
      walkTree(child, beforeChildren, afterChildren);
    })
  }
  afterChildren(root);
}

export function randomLeaf(root) {
  if (isLeaf(root)) { return root; }

  var index = parseInt((Math.random() * root.children.length), 10);
  return randomLeaf(root.children[index]);
}

export class Bundleview {
  static get zoomTransitionTime() { return 1000; }
  static get sizeMetricTransitionTime() { return 1500; }

  preprocessData(root, links) {
    this.nodesByID = new Map();
    walkTree(root, node => {
      this.nodesByID.set(node.id, node); // #TODO this does not work any more, because the nodes here are not the nodes in the vis...
    });
    links.forEach(link => {
      link.source = this.nodesByID.get(link.source);
      link.target = this.nodesByID.get(link.target);
    });
    return [root, links];
  }

  getSizeMetricsFor(root) {

    var leaf = randomLeaf(root);
    var metrics = {
      [DEFAULT_IDENTIFIER]: (d) => {
        if (!isLeaf(d)) return 0
        return 1
      }
    };
    var leafData = leaf.data || leaf // #Hack, to work around initial cyclic dependeny....
    Object.keys(leafData.attributes).forEach(attributeName => {
      if (Number.isFinite(leafData.attributes[attributeName])) {
        metrics[attributeName] = d => {
          var data = d.data || d // I honestly don't know any more... :-(
          if (!data.attributes) return 1;
          var result = Number(data.attributes[attributeName])
          // console.log("size metric for " + attributeName + " " + result)
          return result
        };
        walkTree(root, node => {
          if (!isLeaf(node)) { return; }
        });
      }
    });
    return metrics;
  }

  constructor(input, rootContainer, component) {
    this.component = component


    var bundleviewID = bundleviewCount++;
    // Declarations
    var innerRadius = 0.65,
      bundleTension = 0.85;

    // Stuff that does something

    var [domainRoot, links] = this.preprocessData(input.nodes, input.relations);


    console.log('init bundleview with', root, links);

    var width = 700,
      height = 600,
      radius = Math.min(width, height) / 2;
    //var color = d3.scale.category20c();

    rootContainer = d3.select(rootContainer);

    rootContainer.attr("title", "") // override outter tooltips


    var realSVG = rootContainer.append("svg");

    // gradient as reference for hierarchical edge bundles
    var defs = realSVG.append('defs');
    var gradient = defs.append('linearGradient')
      .attr("id", 'bundleview-gradient')
      // .attr('gradientTransform', 'translate(0.5, 0.5),rotate(270),translate(-0.5, -0.5)')
      .attr('gradientTransform', 'rotate(270, 0.5, 0.5)')
    ;
    gradient.append('stop').attr('stop-color', '#2ca02c');
    gradient.append('stop')
      .attr('stop-color', '#d62728')
      .attr('offset', '100%');

    var svg = realSVG
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    var sizeMetrics = this.getSizeMetricsFor(domainRoot);
    let currentSizeMetric = sizeMetrics[DEFAULT_IDENTIFIER];

    var partition = d3.partition()
      .size([2 * Math.PI, 1])

    var nodes = new Map()
    var hierrachy = d3.hierarchy(domainRoot)

    hierrachy.sum((d) => currentSizeMetric(d)) //
    var rootNode = partition(hierrachy);
    var root = rootNode // just to be sure!

    var rootArcWidth = 2 * Math.PI; // initally it is the full circle
    var rootArcOffset = 0; // we could also look into root...

    walkTree(rootNode, node => {
      nodes.set(node.data.id, node) // nodes are not the nodes of the data tree
    })

    function sizeMetricChanged(value) {
      lively.notify("sizeMetrics ", value)
      currentSizeMetric = value;

      // we have to relayout...
      hierrachy.sum((d) => currentSizeMetric(d)) //
      rootNode = partition(hierrachy);
      root = rootNode

      var newlyLayoutedData = rootNode.descendants();

      path
        .data(newlyLayoutedData)
        .transition()
        .duration(Bundleview.sizeMetricTransitionTime)
        .attrTween("d", arcTween)
        .call(colorStyleTween, "fill", n => styleNodeWith(n, lockedNode, currentColorMetric));

      hiddenLineSegment
        .data(newlyLayoutedData)
        .transition()
        .duration(Bundleview.sizeMetricTransitionTime)
        .attrTween("d", hiddenArcTween);

      link
        .transition()
        .duration(Bundleview.sizeMetricTransitionTime)
        .attrTween("d", lineTween);
    }
    this.sizeMetricChanged = sizeMetricChanged;

    let sizeMetricSelection = rootContainer.append("form");
    sizeMetricSelection
      .html('Size Metric: ');
    sizeMetricSelection.selectAll('label')
      .html('Metrics')
      .data(Object.keys(sizeMetrics))
      .enter()
      .append('label')
      .html(d => d)
      .append('input')
      .attr("type", 'radio')
      .attr('name', 'mode')
      .attr('value', d => d)
      .property('checked', (d, i) => d === DEFAULT_IDENTIFIER)
      .on('change', function() {
        sizeMetricChanged(sizeMetrics[this.value]);
      });

    function getColorMetricsFor(node) {
      var leaf = randomLeaf(node);
      var metrics = {
        [DEFAULT_IDENTIFIER]: d => isLeaf(d) ?
          DEFAULT_COLOR_LEAF_NODE : DEFAULT_COLOR_DIRECTORY
      };

      Object.keys(leaf.data.attributes).forEach(attributeName => {
        var useLinearColorScale = Number.isFinite(leaf.data.attributes[attributeName]);
        if (useLinearColorScale) {
          let maxValue = Number.NEGATIVE_INFINITY,
            minValue = Number.POSITIVE_INFINITY;
          walkTree(root, node => {
            if (isLeaf(node)) {
              maxValue = Math.max(maxValue, node.data.attributes[attributeName]);
              minValue = Math.min(minValue, node.data.attributes[attributeName]);
            }
          });

          let linearColorScale = d3.scaleLinear()
            .domain([minValue, (minValue + maxValue) / 2, maxValue])
            .range(["red", "white", "green"])
            .range(["#001e5e", "#f56f72", "#fffef5"]) // darkblue to yellow
            .interpolate(d3.interpolateLab);

          let violetToYellowColors = [ // pale violet over blue and green to yellow
            "#6F3E4F", "#74455B", "#764D67", "#785573", "#775E7F", "#74678A",
            "#707194", "#6A7B9E", "#6385A6", "#5A8FAC", "#5098B1", "#47A2B4",
            "#3EACB5", "#3AB5B4", "#3BBEB2", "#42C7AD", "#4FCFA8", "#60D7A1",
            "#72DE99", "#87E591", "#9CEB89", "#B3F180", "#CBF579", "#E3FA73"
          ];
          let violetToYellowDomain = violetToYellowColors.map((color, index) =>
            minValue + (maxValue - minValue) * index / (violetToYellowColors.length - 1)
          );

          linearColorScale = d3.scaleLinear()
            .domain(violetToYellowDomain)
            .range(violetToYellowColors)
            .interpolate(d3.interpolateHcl);

          linearColorScale = d3.scaleLinear()
            .domain([minValue, maxValue])
            .range(["#ff7637", "#00a238"])
            .range(["#ffffe5", "#0073a5"])
            .range(["#0042a1", "#fffef5"]) // darkblue to yellow
            .range(["#3a2265", "#ffffd3"]) // darkblue to yellow v2
            .range(["#005083", "#ffffe3"]) // greenish blue to yellow
            //.range(["#800026", "#ffffcc"]) // red to yellow
            //.range(["#ffe48e", "#b60026"]) // yellow to red (higher saturation)
            //.range(["#533F57", "#E7FC74"]) // dark violet to yellow
            .interpolate(d3.interpolateHcl);

          metrics[attributeName] = d => {
            if (isLeaf(d)) {
              return linearColorScale(d.data.attributes[attributeName])
            }

            function accumulateSize(n) {
              if (isLeaf(n)) {
                return currentSizeMetric(n);
              }
              return n.children.reduce((acc, child) => acc + accumulateSize(child), 0);
            }

            function accumulateColor(n) {
              if (isLeaf(n)) {
                return n.data.attributes[attributeName];
              }
              var sizeSum = accumulateSize(n);
              return n.children.reduce((acc, child) => {
                return acc + accumulateColor(child) * accumulateSize(child)
              }, 0) / sizeSum;
            }
            return linearColorScale(accumulateColor(d));
          };
        } else {
          // categorical scale
          let values = new Set();
          walkTree(root, node => {
            if (isLeaf(node)) {
              values.add(node.data.attributes[attributeName]);
            }
          });
          let ordinalColorScale = d3.scale.category20()
            .domain(...(Array.from(values)));
          metrics[attributeName] = d => isLeaf(d) ?
            ordinalColorScale(d.data.attributes[attributeName]) :
            DEFAULT_COLOR_DIRECTORY;
        }
      });
      return metrics;
    }


    var colorMetrics = getColorMetricsFor(root);
    let currentColorMetric = colorMetrics[DEFAULT_IDENTIFIER];

    function colorStyleTween(transition, name, value) {
      transition.styleTween(name, function(d, i) {
        // TODO: aggregate values for directories
        //if(!isLeaf(d)) { return null;}
        return d3.interpolate(this.style[name], value(d));
      });
    }

    function colorMetricChanged(scale) {
      currentColorMetric = scale;
      path.transition()
        .duration(750)
        .call(colorStyleTween, "fill", n => styleNodeWith(n, lockedNode, scale));
    }
    this.colorMetricChanged = colorMetricChanged;

    let colorMetricSelection = rootContainer.append("form");
    colorMetricSelection
      .html('Color Metric: ');
    colorMetricSelection.selectAll('label')
      .html('Metrics')
      .data(Object.keys(colorMetrics))
      .enter()
      .append('label')
      .html(d => d)
      .append('input')
      .attr("type", 'radio')
      .attr('name', 'mode')
      .attr('value', d => d)
      .property('checked', (d, i) => d === DEFAULT_IDENTIFIER)
      .on('change', function() {
        colorMetricChanged(colorMetrics[this.value]);
      });

    var pieInverter = d3.scaleLinear()
      .domain([0, 1])
      .range([1, innerRadius]);
    var converterForInnerLayout = d3.scaleLinear()
      .domain([0, 1])
      .range([0, innerRadius]);

    var x = d3.scaleLinear()
      .domain([0, 2 * Math.PI])
      .range([0, (2 - 0.00001) * Math.PI])
      .clamp(true);

    function getArcInnerRadius(d) {
      return radius * (isLeaf(d) ?
        innerRadius :
        pieInverter(d.y1)
      );
    }

    function getArcOuterRadius(d) {
      return pieInverter(d.y0) * radius;
    }

    function getArcMiddleRadius(d) {
      return (getArcInnerRadius(d) + getArcOuterRadius(d)) / 2;
    }
    var outerMargin = 10;


    var arc = d3.arc()
      .startAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x0))); })
      .endAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x1))); })
      .innerRadius(d => Math.min(radius + outerMargin, getArcInnerRadius(d)))
      .outerRadius(d => Math.min(radius + outerMargin, getArcOuterRadius(d)));

    function lowerHalf(d) {
      var middleAngle = d.x0 + (d.x1 - d.x0) / 2;
      return Math.PI / 2 < middleAngle && middleAngle < Math.PI * 1.5;
    }

    function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
      var angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;

      return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians))
      };
    }

    // http://stackoverflow.com/a/18473154/1152174
    function describeArc(x, y, radius, startAngle, endAngle) {
      var start = polarToCartesian(x, y, radius, endAngle);
      var end = polarToCartesian(x, y, radius, startAngle);

      var arcSweep = endAngle - startAngle <= 180 ? "0" : "1";


      var d = [
        "M", start.x, start.y,
        "A", radius, radius, 0, arcSweep, 0, end.x, end.y
      ].join(" ");

      return d;
    }

    function radialLineGenerator(d) {
      if (d.x0 == undefined || d.x1 == undefined) throw new Error("x0 and x1 were undefined")
      // if (d.data.label != "scale") return "" // for debugging

      var start = x(d.x0)
      var stop = x(d.x1)
      if (isNaN(start) || isNaN(stop)) {
        debugger
      }

      var result = describeArc(
        0, 0,
        getArcMiddleRadius(d), // radius 
        radToDeg.invert(start), // start angle
        radToDeg.invert(stop) // stop angle
      );
      if (result && result.match("NaN")) {
        debugger
      }
      return result
    }


    var radToDeg = d3.scaleLinear()
      .domain([0, 360])
      .range([0, 2 * Math.PI]);

    var originalLine = d3.radialLine()
      .curve(d3.curveBundle.beta(bundleTension))
      .radius(function(d) {
        return radius * (isLeaf(d) ?
          innerRadius :
          Math.max(0, Math.min(innerRadius, converterForInnerLayout(d.y1)))
        );
      })
      .angle(function(d) {
        return x(d.x0 + (d.x1 - d.x0) / 2); // Position curve in the center of pie piece
      });
    var line = function(d) {
      var result = originalLine(d)
      //           if (result.match(/NaN/)) {
      //             debugger    

      //             // again... debug into it
      //             // originalLine(d)
      //           }
      return result
    }

    // Keep track of the node that is currently being displayed as the root.
    var nodeDisplayedAsRoot = rootNode;


    var enterElem = svg.datum(root).append("g").selectAll("path")
      .data(rootNode.descendants())
      .enter();


    var hierarchicalEdgeBundleEnterElementGroup = enterElem.append("g")
      /* Invoke the tip in the context of your visualization */
      //            .call(tip)
      .on('mouseover', function(d) {


        if (!lockedNode) {
          highlightNode(d);
        }
      })
      .on("mouseout", d => {

        // tooltip.classed("hidden", true);
        //                tip.hide(d);
        if (!lockedNode) {
          unhighlightNode();
        }
      })
      .on('mousedown', function(d) {
        if (d3.event.shiftKey) {
          lively.openInspector({ element: this, d: d })
          return
        }

        if (d3.event.button == 0) {
          clickedOnNode(d)
        } else {
          // rightclick
          if (isLocked(d)) {
            unlockNode(d);
          } else {
            lockNode(d);
          }
        }


      })
      .on('contextmenu', function(d, ...args) {
        d3.event.preventDefault();
        d3.event.stopPropagation();
      })


    var path = hierarchicalEdgeBundleEnterElementGroup.append("path")
      //.attr("display", function(d) { return null; return d.depth ? null : "none"; }) // hide inner ring
      .attr("d", arc)
      //.style("fill", function(d) { return color((d.children ? d : d.parent).label); })
      .style("fill-rule", "evenodd")
      .each(stash)
      .classed('node', true)
      .classed('node--leaf', isLeaf)
      .style('fill', currentColorMetric //d => isLeaf(d) ? null /*'#6666af'*/ : null
      );
    var node = path;


    function zoomToNode(d) {


      function isDescendentOf(desc, ance) {
        return desc === ance || (desc.parent && isDescendentOf(desc.parent, ance));
      }
      if (lockedNode && !isDescendentOf(lockedNode, d)) {
        unlockNode();
      }

      nodeDisplayedAsRoot = d;
      
      rootArcWidth = d.x1 - d.x0
      rootArcOffset = d.x0
      
      path
        .transition()
        .duration(Bundleview.zoomTransitionTime)
        .attrTween("d", arcTweenZoom(nodeDisplayedAsRoot));

      hiddenLineSegment
        .transition()
        .duration(Bundleview.zoomTransitionTime)
        .attrTween("d", hiddenArcTweenZoom(nodeDisplayedAsRoot));

      labels
        .classed('label--invisible', d => { return false; });

      updateGradients();
      
      updateLabelText(labels)

      link
        .transition()
        .duration(Bundleview.zoomTransitionTime)
        .attrTween("d", lineTweenZoom(nodeDisplayedAsRoot));
    }

    function clickedOnNode(d) {
      if (isLeaf(d)) {
        if (component.dataClick) {
          component.dataClick(d, d3.event)
        }
        return console.log('clicked on leaf node', d);
      } else {
        return zoomToNode(d);
      }
    }

    var hiddenLineSegment = defs.datum(root).selectAll("path")
      .data(rootNode.descendants())
      .enter().append("path")
      .each(stash)
      .attr('id', (d, i) => 'bundleview_node_' + bundleviewID + '_' + i)
      .attr("d", radialLineGenerator);

    var debugColor = d3.scaleOrdinal(d3.schemeCategory10);

    // FOR DEBUGGING "hiddenLineSegment"
    // var debugLineSegment = svg.datum(root).append("g").selectAll("path")
    //     .data(rootNode.descendants())
    //     .enter().append("path")
    //     .each(stash)
    //     .attr("fill", "none" )
    //     .attr("stroke", "rgba(250,0,0,0.5)" )
    //     .style('stroke-width', 4)
    //     .style('stroke-opacity', 0.8)
    //     .style('stroke', d => {debugger ; return d.data && debugColor(d.data.id) })
    //     .attr("d", radialLineGenerator);


    var labels = hierarchicalEdgeBundleEnterElementGroup.append("text")
      .classed('bundle--text', true)
      .append("textPath")
      .attr("startOffset", "50%")
      .style("text-anchor", "middle") // 
      .style('alignment-baseline', 'central')
      .attr("xlink:href", (d, i) => '#bundleview_node_' + bundleviewID + '_' + i)

    updateLabelText(labels)


    var tooltips = hierarchicalEdgeBundleEnterElementGroup.append("title")
      .text(d => {
        return `${d.data.label} id: ${d.data.id}` +
          Object.keys(colorMetrics)
          .filter(name => name !== DEFAULT_IDENTIFIER && d.data.attributes && d.data.attributes[name])
          .map(name => ` ${name}: ${d.data.attributes[name]}`)
          .join(" ");
      })

    function bundleLinks(links) {

      return links.map(link => {

        return nodes.get(link.source.id).path(nodes.get(link.target.id)) // data tree !== node tree
      })
    }

    var bundeledLinks = bundleLinks(links)
    var link = svg.append("g").selectAll(".link")

      .data(bundeledLinks) //bundle(links)

      .enter().append("path")
      // only for interactions?
      // .each(d => {
      //     if(d.length > 3) {
      //         // remove the least common ancestor
      //         let lastNode = d[0],
      //             currentNode;
      //         for(var i = 1; i < d.length; i++) {
      //             currentNode = d[i];
      //             if(currentNode.parent === lastNode) {
      //                 d.splice(i-1, 1);
      //                 break;
      //             }
      //             lastNode = d[i];
      //         }
      //     }
      // })

      .each(function(d) {
        d.source = d[0];
        d.target = d[d.length - 1];
      })
      .attr("class", "link")
      // .each(function(d) { debugger })  
      .attr("d", (d) => { var result = line(d); return result })
       
      .attr('stroke', d => `url(#bundleview-gradient_${d.source.data.id}_${d.target.data.id})`)

      .on('click', function(d) {
        
        lively.openInspector({ element: this, d: d })
      })

      //.attr("d", line)
      .on('mouseover', function(d) {
        console.log('over ' + d)
      })
      // .on("mouseout", d => {
      // })


    function updateGradients() {
      gradient
      .attr('gradientTransform', function(d) {
        function absoluteRadiantToDisplayedRelative(r) {
          return (r / rootArcWidth) * 2 * Math.PI + rootArcOffset;
        }
        var mA = absoluteRadiantToDisplayedRelative((d.source.x0 + d.source.x1) / 2);
        var mB = absoluteRadiantToDisplayedRelative((d.target.x0 + d.target.x1) / 2);
        var radiant = ((mA + mB) / 2);
        var degrees = (radiant / Math.PI * 180) + (mB > mA ? 0 : 180)
        return `rotate(${degrees}, 0.5, 0.5)`;
      });
    }
    var gradient = defs.selectAll('linearGradient').data(bundeledLinks)
    .enter().append('linearGradient')
      .attr("id", d => `bundleview-gradient_${d.source.data.id}_${d.target.data.id}`)
      // .attr('gradientTransform', 'translate(0.5, 0.5),rotate(270),translate(-0.5, -0.5)')
    updateGradients()
    gradient.append('stop').attr('stop-color', '#2ca02c');
    gradient.append('stop')
      .attr('stop-color', '#d62728')
      .attr('offset', '100%');


    var lockedNode;

    function clearMarkers(nodes) {
      // clear node markers
      node
        .each(function(n) { n.target = n.source = n.descendant = n.ancestor = false; });
    }

    function highlightNode(d) {

      function markDescendants(n) {
        if (n.children) {
          n.children.forEach(child => {
            child.descendant = true;
            markDescendants(child);
          });
        }
      }

      function markAncestors(n) {
        if (n.parent) {
          markAncestors(n.parent);
          n.parent.ancestor = true;
        }
      }

      clearMarkers(node);

      markDescendants(d);
      markAncestors(d);

      link
        .each(function(d) {
          d.source = d[0];
          d.target = d[d.length - 1];
        })
        .classed("link--target", function(l) {
          if (l.target === d || l.target.descendant) {
            return l.source.source = true;
          }
        })
        .classed("link--source", function(l) {
          if (l.source === d || l.source.descendant) {
            return l.target.target = true;
          }
        })
        .classed("link--none", function(l) {
          if (l.target === d) { return false; }
          if (l.target.descendant) { return false; }
          if (l.source === d) { return false; }
          if (l.source.descendant) { return false; }
          return true;
        });
      //.filter(function(l) { return l.target === d || l.source === d; })
      //.each(function() { this.parentNode.appendChild(this); });

      node
        .classed("node--hovered", function(n) { return n === d; })
        .classed("node--descendant", function(n) { return n.descendant; })
        .classed("node--ancestor", function(n) { return n.ancestor; })
        .classed("node--target", function(n) { return n.target; })
        .classed("node--source", function(n) { return n.source; })
        .classed("node--none", function(n) {
          if (n === d) { return false; }
          if (n.target) { return false; }
          if (n.source) { return false; }
          if (n.descendant) { return false; }
          if (n.ancestor) { return false; }
          return true;
        })
        .style('fill', n => styleNodeWith(n, d, currentColorMetric));

      labels
        .classed("bundle--text--none", function(n) {
          if (n === d) { return false; }
          if (n.target) { return false; }
          if (n.source) { return false; }
          if (n.descendant) { return false; }
          if (n.ancestor) { return false; }
          return true;
        });
    }

    function styleNodeWith(n, highlightedNode, colorMetric) {
      if (n === highlightedNode) { return COLOR_NODE_HOVERED; }
      if (n.target) { return COLOR_NODE_target; }
      if (n.source) { return COLOR_NODE_source; }
      if (n.descendant && (!isLeaf(n) || currentColorMetric === colorMetrics[DEFAULT_IDENTIFIER])) { return COLOR_NODE_descendant; }
      if (n.ancestor) { return COLOR_NODE_ancestor; }
      return colorMetric(n);
    }

    function unhighlightNode() {
      clearMarkers(node);

      link
        .classed("link--target", false)
        .classed("link--source", false)
        .classed("link--none", false);

      node
        .classed("node--hovered", false)
        .classed("node--descendant", false)
        .classed("node--ancestor", false)
        .classed("node--target", false)
        .classed("node--source", false)
        .classed("node--none", false)
        .style('fill', currentColorMetric);

      labels
        .classed("bundle--text--none", false);
    }

    function isLocked(d) {
      return lockedNode === d;
    }

    function lockNode(d) {
      lockedNode = d;
      highlightNode(d);
    }

    function unlockNode(d) {
      lockedNode = undefined;
      unhighlightNode();
    }

    // Stash the old values for transition.
    function stash(d) {
      d.x0a = d.x0;
      d.x1a = d.x1;
    }

    // Interpolate the arcs in data space.
    function getCommonArcTween(a, i, arcGenerator) {
      var oi = d3.interpolate({ x0: a.x0a, x1: a.x1a }, a);

      function tween(t) {
        var b = oi(t);
        a.x0a = b.x0;
        a.x1a = b.x1;
        return arcGenerator(b);
      }
      if (i === 0) {
        // If we are on the first arc, adjust the x domain to match the root node
        // at the current zoom level. (We only need to do this once.)
        if (nodeDisplayedAsRoot.x0 === undefined || nodeDisplayedAsRoot.x1 === undefined) {
          debugger
        }
        var xd = d3.interpolate(x.domain(), [nodeDisplayedAsRoot.x0, nodeDisplayedAsRoot.x1]);
        return function(t) {
          var newdomain = xd(t)
          if (isNaN(newdomain[0])) {
            debugger
          }
          x.domain(newdomain);
          return tween(t);
        };
      } else {
        return tween;
      }
    }

    function arcTween(d, i) { return getCommonArcTween(d, i, arc); }

    function hiddenArcTween(d, i) { return getCommonArcTween(d, i, radialLineGenerator); }

    // depends on that the .stash method was called for each point
    function lineTween(a) {
      var length = a.length,
        interpolations = a.map(point => d3.interpolate({ x0: point.x0a, x1: point.x1a }, point));
      // d3.interpolate({x0: 1, x1: 2},{x0: 5, x1: 8})(0.5)

      return function(t) {
        var interpolatedPoints = interpolations.map(i => i(t));
        interpolatedPoints.forEach((b, index) => {
          a[index].x0a = b.x0;
          a[index].x1a = b.x1;
        });
        return line(interpolatedPoints);
      };
    }

    // depends on that the .stash method was called for each point
    function lineTweenZoom(rootDisplay) {
      return function(a, i) {
        var length = a.length,
          interpolations = a.map(point => d3.interpolate({ x0: point.x0a, x1: point.x1a }, point));

        function tween(t) {
          // return line(t) // #TODO

          var interpolatedPoints = interpolations.map(i => i(t));
          interpolatedPoints.forEach((b, index) => {
            a[index].x0a = b.x0;
            a[index].x1a = b.x1;
          });

          return line(interpolatedPoints);
        }

        if (i === 0) {
          var xd = d3.interpolate(x.domain(), [rootDisplay.x0, rootDisplay.x1]),
            yd = d3.interpolate(converterForInnerLayout.domain(), [rootDisplay.y0, 1]);
          return function(t) {
            x.domain(xd(t));
            converterForInnerLayout.domain(yd(t));
            return tween(t);
          };
        } else {
          return tween;
        }
      }
    }

    // When zooming: interpolate the scales.
    function commonArcTweenZoom(displayedRoot, arcGenerator) {
      var xd = d3.interpolate(x.domain(), [displayedRoot.x0, displayedRoot.x1]),
        yd = d3.interpolate(pieInverter.domain(), [displayedRoot.y0, 1]);
      return function(d, i) {
        return i ?
          function(t) { return arcGenerator(d); } :
          function foo(t) {
            x.domain(xd(t));
            pieInverter.domain(yd(t));
            return arcGenerator(d);
          };
      };
    }

    function arcTweenZoom(d) { return commonArcTweenZoom(d, arc); }

    function hiddenArcTweenZoom(d) { return commonArcTweenZoom(d, radialLineGenerator); }

    function updateLabelText(labels) {
      labels.text(d => {
        var arcShare = (d.x1 - d.x0) / rootArcWidth
        if (arcShare < 0.02) return; // in ANGLE of pie piece, don't show to small rabel
        return d.data.label
      });
    }
  }
}

export default class D3Bundleview extends Morph {
  initialize() {
    this.windowTitle = "D3Bundleview";

    this.addEventListener('extent-changed', evt => this.onExtentChanged());
  }

  onExtentChanged() {
    lively.notify('extent changed');

    const svgWidth = 700,
      svgHeight = 600;
    const paint = (w, h) => {
      var ratio = Math.min(w / svgWidth, h / svgHeight);

      const percentage = 1.0;
      var sw = (svgWidth * ratio) * percentage,
        sh = (svgHeight * ratio) * percentage;

      this.get('#rootContainer').style.left = (w - sw) / 2 + 'px';
      this.get('#rootContainer').style.top = (h - sh) / 2 + 'px';

      this.get('#rootContainer').style.transformOrigin = 'top left';
      this.get('#rootContainer').style.transform = 'scale(' + (ratio * percentage) + ')';

    }

    const bounds = lively.getTotalClientBounds(this);

    paint(bounds.width, bounds.height);
  }

  display(json) {
    // the json becomes un-reusable later
    this.json = JSON.parse(JSON.stringify(json));
    new Bundleview(json, this.get('#rootContainer'), this);
    this.onExtentChanged()
  }

  setData(data) {
    this.display(data)
  }

  getData() {
    return this.json
  }

  livelyPreMigrate() {
    // is called on the old object before the migration
  }

  livelyMigrate(other) {
    if (other.json) {
      this.display(other.json);
    }
  }

  livelyInspect(contentNode, inspector) {
    // do nothing
  }

  livelyPrepareSave() {

  }


  async livelyExample() {
    const json = await fetch(
      'https://raw.githubusercontent.com/onsetsu/d3-bundleview/master/example/flare-compat.json').then(r => r.json());

    this.display(json);
  }
}
