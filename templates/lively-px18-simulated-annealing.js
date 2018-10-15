import Morph from "src/components/widgets/lively-morph.js"
import d3 from "src/external/d3.v5.js"
import annealing from "doc/PX2018/project_6/annealing.js";
import graphLoader from "doc/PX2018/project_6/graphLoader.js";

export default class LivelyPx18SimulatedAnnealing extends Morph {
  async initialize() {   
    this.updateViz();
  }
  
  async updateViz() {
    var bounds = this.getBoundingClientRect();
    this.shadowRoot.querySelector("#svg").innerHTML = ""

    var width = Math.max(bounds.width * 0.58, 400),
      height = Math.max(bounds.height, 700);

    var svg = d3.select(this.shadowRoot.querySelector("#svg"))
      .attr("width", width)
      .attr("height", height)
      .append("g")
    
    var color = d3.scaleOrdinal(d3.schemeCategory20);
    
    var graph = await graphLoader().loadSmallData();

    var node, link;
    
    var startButton = this.get("#startAnneal");
    startButton.addEventListener("click", startAnnealing);
    
    var annealingProperties = {
      nodeIntersection: {
        enabled: true,
        weight: 30.0
      },
      edgeIntersection: {
        enabled: true,
        weight: 30.0
      },
      edgeNodeIntersection: {
        enabled: false,
        weight: 10.0
      },
      edgeLength: {
        enabled: false,
        weight: 0.1,
        tolerated: 20
      },
      timeout: 1,
      iterations: 1000
    };
    
    var nodeIntersectionCheckbox = this.get("#weight_nodeIntersection");
    nodeIntersectionCheckbox.addEventListener("change", nodeIntersectionCheckboxChange);
    
    var edgeIntersectionCheckbox = this.get("#weight_edgeIntersection");
    edgeIntersectionCheckbox.addEventListener("change", edgeIntersectionCheckboxChange);
    
    var edgeNodeIntersectionCheckbox = this.get("#weight_edgeNodeIntersection");
    edgeNodeIntersectionCheckbox.addEventListener("change", edgeNodeIntersectionCheckboxChange);
    
    var edgeLengthCheckbox = this.get("#edgeLength_checkbox");
    edgeLengthCheckbox.addEventListener("change", edgeLengthCheckboxChange);
    
    var graphSelect = this.get("#graphSelect");
    graphSelect.addEventListener("change", graphSelectChange);
    
    var nodeIntersection_SliderInput = this.get("#nodeIntersection_SliderInput");
    nodeIntersection_SliderInput.addEventListener("input", () => nodeIntersection_SliderInputChange());
    
    var edgeIntersection_SliderInput = this.get("#edgeIntersection_SliderInput");
    edgeIntersection_SliderInput.addEventListener("input", () => edgeIntersection_SliderInputChange());
    
    var edgeNodeIntersection_SliderInput = this.get("#edgeNodeIntersection_SliderInput");
    edgeNodeIntersection_SliderInput.addEventListener("input", () => edgeNodeIntersection_SliderInputChange());
    
    var nodeSize_SliderInput = this.get("#nodeSize_SliderInput");
    nodeSize_SliderInput.addEventListener("input", () => nodeSize_SliderInputChange());
    
    var edgeLength_SliderInput = this.get("#edgeLength_SliderInput");
    edgeLength_SliderInput.addEventListener("input", () => edgeLength_SliderInputChange());
    
    var edgeLengthWeight_SliderInput = this.get("#edgeLengthWeight_SliderInput");
    edgeLengthWeight_SliderInput.addEventListener("input", () => edgeLengthWeight_SliderInputChange());
    
    var iterations_SliderInput = this.get("#iterations_SliderInput");
    iterations_SliderInput.addEventListener("input", () => iterations_SliderInputChange());
    
    var timeout_SliderInput = this.get("#timeout_SliderInput");
    timeout_SliderInput.addEventListener("input", () => timeout_SliderInputChange());
    
    var currentEnergySpan = this.get('#currentEnergy');
    
    function edgeIntersectionCheckboxChange() {
      annealingProperties.edgeIntersection.enabled = !annealingProperties.edgeIntersection.enabled;
    }
    
    function nodeIntersectionCheckboxChange() {
      annealingProperties.nodeIntersection.enabled = !annealingProperties.nodeIntersection.enabled;
    }
    
    function edgeNodeIntersectionCheckboxChange() {
      annealingProperties.edgeNodeIntersection.enabled = !annealingProperties.edgeNodeIntersection.enabled;
    }
    
    function edgeLengthCheckboxChange() {
      if (edgeLengthCheckbox.checked) {
        annealingProperties.edgeLength.weight = edgeLengthWeight_SliderInput.value;
        annealingProperties.edgeLength.tolerated = edgeLength_SliderInput.value;
        annealingProperties.edgeLength.enabled = true;
      } else {
        annealingProperties.edgeLength.enabled = false;
      }
    }
    
    async function graphSelectChange() {
      switch(graphSelect.value) {
        case 'small':
          graph = await graphLoader().loadSmallData();
          break;
        case 'medium':
          graph = await graphLoader().loadMediumData();
          break;
        case 'medium2':
          graph = await graphLoader().loadThankYouData();
          break;
        case 'large':
          graph = await graphLoader().loadModuleData();
          break;
        default:
          break;
      }
      svg.selectAll("*").remove().append("g");
      start();
    }
    
    const nodeIntersection_SliderInputChange = () => {
      var value = nodeIntersection_SliderInput.value;
      var output = this.get("#nodeIntersection_SliderOutput");
      output.textContent = value;
      annealingProperties.nodeIntersection.weight = value; 
    }
    
    const edgeIntersection_SliderInputChange = () => {
      var value = edgeIntersection_SliderInput.value;
      var output = this.get("#edgeIntersection_SliderOutput");
      output.textContent = value;
      annealingProperties.edgeIntersection.weight = value; 
    }
    
    const edgeNodeIntersection_SliderInputChange = () => {
      var value = edgeNodeIntersection_SliderInput.value;
      var output = this.get("#edgeNodeIntersection_SliderOutput");
      output.textContent = value;
      annealingProperties.edgeNodeIntersection.weight = value; 
    }
    
    const timeout_SliderInputChange = () => {
      var value = timeout_SliderInput.value;
      var output = this.get("#timeout_SliderOutput");
      output.textContent = value;
      annealingProperties.timeout = value; 
    }
    
    const iterations_SliderInputChange = () => {
      var value = iterations_SliderInput.value;
      var output = this.get("#iterations_SliderOutput");
      output.textContent = value;
      annealingProperties.iterations = value; 
    }
    
    const nodeSize_SliderInputChange = () => {
      var value = nodeSize_SliderInput.value;
      var output = this.get("#nodeSize_SliderOutput");
      output.textContent = value;
      node.attr("r", value);
      for (let n of graph.nodes)
        n.r = value;
    }
    
    const edgeLength_SliderInputChange = () => {
      var value = edgeLength_SliderInput.value;
      var output = this.get("#edgeLength_SliderOutput");
      output.textContent = value;
      if (edgeLengthCheckbox.checked) {
        annealingProperties.edgeLength.tolerated = value;
      }
    }
    
    const edgeLengthWeight_SliderInputChange = () => {
      var value = edgeLengthWeight_SliderInput.value;
      var output = this.get("#edgeLengthWeight_SliderOutput");
      output.textContent = value;
      if (edgeLengthCheckbox.checked) {
        annealingProperties.edgeLength.weight = value;
      }
    }

    async function start() {
      node = svg.append("g")
      .selectAll(".node");

      link = svg.append("g")
        .selectAll(".link")
        .attr("stroke-width", function(d) { return Math.sqrt(d.value); })
        .attr("stroke", "#A8A8A8");
      node = node.data(graph.nodes, function(d) { return d.id;});
      node.exit().remove();
      node = node.enter().append("circle")
        .attr("r", d => d.r)
        .attr("fill", function(d) { return color(d.id); })
        .merge(node);

      link = link.data(graph.links).enter().append("line")
        .attr("stroke-width", function(d) { return Math.sqrt(d.value); })
        .attr("stroke", "#A8A8A8")
        .merge(link);

      node.append("title")
        .text(function(d) { return d.id; });
    }
    
    async function updatePositionsAndEnergy(ener) {
      node
        .attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; });
      link
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });
      currentEnergySpan.innerHTML = ener;
    }
    
    async function startAnnealing() {
      annealing()
        .width(width)
        .height(height)
        .nodes(graph.nodes)
        .links(graph.links)
        .updateFunction(updatePositionsAndEnergy)
        .sweepsPerStep(annealingProperties.timeout)
        .weights(annealingProperties)
        .start(annealingProperties.iterations);
    }

    start();
  }
  
}
