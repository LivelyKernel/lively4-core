import Morph from "src/components/widgets/lively-morph.js";
import d3 from "src/external/d3.v5.js";
import annealing from "doc/PX2018/project_6/annealing.js";
import graphLoader from "doc/PX2018/project_6/graphLoader.js";

export default class LivelyPx18GraphDrawing extends Morph {
  async initialize() {   
    this.updateViz();
  }
  
  async updateViz() {
    console.log(this)
    var bounds = this.getBoundingClientRect();
    this.shadowRoot.querySelector("#annealing-svg").innerHTML = ""

    var width = bounds.width * 0.5,
      height = bounds.height * 0.95;


    var annealSvg = d3.select(this.shadowRoot.querySelector("#annealing-svg"))
      .attr("width", width)
      .attr("height", height)
      .append("g");
    
    var forceSvg = d3.select(this.shadowRoot.querySelector("#force-svg"))
      .attr("width", width)
      .attr("height", height)
      .append("g");
    
    var simulation = d3.forceSimulation();

    var forceProperties = {
        center: {
            x: 0.5,
            y: 0.5
        },
        charge: {
            enabled: true,
            strength: -10,
            distanceMin: 1,
            distanceMax: 200
        },
        collide: {
            enabled: true,
            strength: .7,
            iterations: 1,
            radius: 5
        },
        forceX: {
            enabled: false,
            strength: .1,
            x: .5
        },
        forceY: {
            enabled: false,
            strength: .1,
            y: .5
        },
        link: {
            enabled: true,
            distance: 30,
            iterations: 1
        }
    }
    
    var color = d3.scaleOrdinal(d3.schemeCategory20);
    
    var annealGraph = await graphLoader().loadMediumData(),
        forceGraph = await graphLoader().loadMediumData();

    var annealNode, annealLink, forceNode, forceLink;
    
    var startButton = this.get("#startAnneal");
    startButton.addEventListener("click", startAnnealing);
    
    var graphSelect = this.get("#graphSelect");
    graphSelect.addEventListener("change", graphSelectChange);
    
    var currentEnergySpan = this.get('#currentEnergy');
    
    async function graphSelectChange() {
      switch(graphSelect.value) {
        case 'small':
          annealGraph = await graphLoader().loadSmallData();
          forceGraph = await graphLoader().loadSmallData();
          break;
        case 'medium':
          annealGraph = await graphLoader().loadMediumData();
          forceGraph = await graphLoader().loadMediumData();
          break;
        case 'medium2':
          annealGraph = await graphLoader().loadThankYouData();
          forceGraph = await graphLoader().loadThankYouData();
          break;
        case 'large':
          annealGraph = await graphLoader().loadModuleData();
          forceGraph = await graphLoader().loadModuleData();
          break;
        default:
          break;
      }
      annealSvg.selectAll("*").remove().append("g");
      forceSvg.selectAll("*").remove().append("g");
      start();
    }
    
    function initializeSimulation() {
      simulation.nodes(forceGraph.nodes);
      initializeForces();
      simulation.on("tick", () => ticked());
    }
    
    function initializeDisplay() {
      // set the data and properties of link lines
      forceLink = forceSvg.append("g")
            .attr("class", "links")
        .selectAll("line")
        .data(forceGraph.links)
        .enter().append("line");

      // set the data and properties of node circles
      forceNode = forceSvg.append("g")
            .attr("class", "nodes")
        .selectAll("circle")
        .data(forceGraph.nodes)
        .enter().append("circle")
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));

      // node tooltip
      forceNode.append("title")
          .text(function(d) { return d.id; });
      // visualize the graph
      updateDisplay();
    }
    
    function updateDisplay() {
        forceNode
            .attr("r", forceProperties.collide.radius)
            .attr("stroke", forceProperties.charge.strength > 0 ? "blue" : "red")
            .attr("stroke-width", forceProperties.charge.enabled==false ? 0 : Math.abs(forceProperties.charge.strength)/15);

        forceLink
            .attr("stroke-width", forceProperties.link.enabled ? 1 : .5)
            .attr("opacity", forceProperties.link.enabled ? 1 : 0);
    }
    
    function initializeForces() {
      // add forces and associate each with a name
      simulation
          .force("link", d3.forceLink())
          .force("charge", d3.forceManyBody())
          .force("collide", d3.forceCollide())
          .force("center", d3.forceCenter())
          .force("forceX", d3.forceX())
          .force("forceY", d3.forceY());
      // apply properties to each of the forces
      updateForces();
    }

    // apply new force properties
    function updateForces() {    // get each force by name and update the properties
      simulation.force("center")
          .x(width * forceProperties.center.x)
          .y(height * forceProperties.center.y);
      simulation.force("charge")
          .strength(forceProperties.charge.strength * forceProperties.charge.enabled)
          .distanceMin(forceProperties.charge.distanceMin)
          .distanceMax(forceProperties.charge.distanceMax);
      simulation.force("collide")
          .strength(forceProperties.collide.strength * forceProperties.collide.enabled)
          .radius(forceProperties.collide.radius)
          .iterations(forceProperties.collide.iterations);
      simulation.force("forceX")
          .strength(forceProperties.forceX.strength * forceProperties.forceX.enabled)
          .x(width * forceProperties.forceX.x);
      simulation.force("forceY")
          .strength(forceProperties.forceY.strength * forceProperties.forceY.enabled)
          .y(height * forceProperties.forceY.y);
      simulation.force("link")
          .id(function(d) {return d.id;})
          .distance(forceProperties.link.distance)
          .iterations(forceProperties.link.iterations)
          .links(forceProperties.link.enabled ? forceGraph.links : []);

      // updates ignored until this is run
      // restarts the simulation (important if simulation has already slowed down)
      simulation.alpha(1).restart();
    }
    
    const ticked = () => {
        forceLink
            .attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });

        forceNode
            .attr("cx", function(d) { return d.x = Math.max(forceProperties.collide.radius, Math.min(width - forceProperties.collide.radius, d.x)); })
            .attr("cy", function(d) { return d.y = Math.max(forceProperties.collide.radius, Math.min(height - forceProperties.collide.radius, d.y)); });
    }

    function dragstarted(d) {
      if (!d3.event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(d) {
      d.fx = d3.event.x;
      d.fy = d3.event.y;
    }

    function dragended(d) {
      if (!d3.event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
    
    d3.select(window).on("resize", function(){
      width = +forceSvg.node().getBoundingClientRect().width;
      height = +forceSvg.node().getBoundingClientRect().height;
      updateForces();
    });

    async function start() {
      annealNode = annealSvg.append("g")
      .selectAll(".node");

      annealLink = annealSvg.append("g")
        .selectAll(".link")
        .attr("stroke-width", function(d) { return Math.sqrt(d.value); })
        .attr("stroke", "#A8A8A8");
      annealNode = annealNode.data(annealGraph.nodes, function(d) { return d.id;});
      annealNode.exit().remove();
      annealNode = annealNode.enter().append("circle")
        .attr("r", d => d.r)
        .attr("fill", function(d) { return color(d.id); })
        .merge(annealNode);

      annealLink = annealLink.data(annealGraph.links).enter().append("line")
        .attr("stroke-width", function(d) { return Math.sqrt(d.value); })
        .attr("stroke", "#A8A8A8")
        .merge(annealLink);

      annealLink.append("title")
        .text(function(d) { return d.id; });
      initializeDisplay();
      initializeSimulation();
      startAnnealing();
    }
    
    async function updatePositionsAndEnergy(ener) {
      annealNode
        .attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; });
      annealLink
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });
      currentEnergySpan.innerHTML = ener;
    }
    
    async function startAnnealing() {
      annealing()
        .width(width * 0.75)
        .height(height * 0.9)
        .nodes(annealGraph.nodes)
        .links(annealGraph.links)
        .updateFunction(updatePositionsAndEnergy)
        .weights({
          nodeIntersection: {
            enabled: true,
            weight: 30.0
          },
          edgeIntersection: {
            enabled: true,
            weight: 30.0
          },
          edgeNodeIntersection: {
            enabled: true,
            weight: 30.0
          },
          edgeLength: {
            enabled: true,
            weight: 0.1,
            tolerated: 50
          }
        })
        .sweepsPerStep(100)
        .start(1000);
    }

    start();
  }
  
}
