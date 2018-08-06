import Morph from "src/components/widgets/lively-morph.js";
import d3 from "src/external/d3.v5.js";
import graphLoader from "doc/PX2018/project_6/graphLoader.js";

export default class LivelyPx18ForceLayout extends Morph {
  async initialize() {   
    this.updateViz()
  }
  
  async updateViz() {
    var bounds = this.getBoundingClientRect()
    this.shadowRoot.querySelector("svg").innerHTML = ""

    var width = bounds.width,
      height = bounds.height;

    var svg = d3.select(this.shadowRoot.querySelector("svg"))
      .attr("width", width)
      .attr("height", height)
      .append("g");
    
    var graph = await graphLoader().loadMediumData();
    
    var simulation = d3.forceSimulation();

    var forceProperties = {
        center: {
            x: 0.5,
            y: 0.5
        },
        charge: {
            enabled: true,
            strength: -30,
            distanceMin: 1,
            distanceMax: 2000
        },
        collide: {
            enabled: true,
            strength: 0.7,
            iterations: 1,
            radius: 5
        },
        forceX: {
            enabled: false,
            strength: 0.1,
            x: 0.5
        },
        forceY: {
            enabled: false,
            strength: 0.1,
            y: 0.5
        },
        link: {
            enabled: true,
            distance: 30,
            strength: 1,
            iterations: 1
        }
    }

    var node = svg.append("g")
      .selectAll(".node");

    var link = svg.append("g")
      .selectAll(".link")
      .attr("stroke-width", function(d) { return Math.sqrt(d.value); })
      .attr("stroke", "lightgray");
    
    var resetControlsButton = this.get("#resetControls");
    resetControlsButton.addEventListener("click", () => resetControls());
    
    var alphaBar = this.get("#alpha_bar");
    alphaBar.addEventListener("click", updateAll);
    
    var center_XSliderInput = this.get("#center_XSliderInput");
    center_XSliderInput.addEventListener("input", ()  => center_XSliderInputChange());
    
    var center_YSliderInput = this.get("#center_YSliderInput");
    center_YSliderInput.addEventListener("input", () => center_YSliderInputChange());
    
    var force_ChargeCheckbox = this.get("#force_chargeCheckbox");
    force_ChargeCheckbox.addEventListener("change", () => force_chargeCheckboxChange());
    
    var charge_StrengthSliderInput = this.get("#charge_StrengthSliderInput");
    charge_StrengthSliderInput.addEventListener("input", () => charge_StrengthSliderInputChange());
    
    var charge_distanceMinSliderInput = this.get("#charge_distanceMinSliderInput");
    charge_distanceMinSliderInput.addEventListener("input", () => charge_distanceMinSliderInputChange());
    
    var charge_distanceMaxSliderInput = this.get("#charge_distanceMaxSliderInput");
    charge_distanceMaxSliderInput.addEventListener("input", () => charge_distanceMaxSliderInputChange());
    
    var force_collideCheckbox = this.get("#force_collideCheckbox");
    force_collideCheckbox.addEventListener("change", () => force_collideCheckboxChange());
    
    var collide_StrengthSliderInput = this.get("#collide_StrengthSliderInput");
    collide_StrengthSliderInput.addEventListener("input", () => collide_StrengthSliderInputChange());
    
    var collide_radiusSliderInput = this.get("#collide_radiusSliderInput");
    collide_radiusSliderInput.addEventListener("input", () => collide_radiusSliderInputChange());
    
    var collide_iterationsSliderInput = this.get("#collide_iterationsSliderInput");
    collide_iterationsSliderInput.addEventListener("input", () => collide_iterationsSliderInputChange());
    
    var force_forceXCheckbox = this.get("#force_forceXCheckbox");
    force_forceXCheckbox.addEventListener("change", () => force_forceXCheckboxChange());
    
    var forceX_StrengthSliderInput = this.get("#forceX_StrengthSliderInput");
    forceX_StrengthSliderInput.addEventListener("input", () => forceX_StrengthSliderInputChange());
    
    // var forceX_XSliderInput = this.get("#forceX_XSliderInput");
    // forceX_XSliderInput.addEventListener("input", () => forceX_XSliderInputChange());
    
    var force_forceYCheckbox = this.get("#force_forceYCheckbox");
    force_forceYCheckbox.addEventListener("change", () => force_forceYCheckboxChange());
    
    var forceY_StrengthSliderInput = this.get("#forceY_StrengthSliderInput");
    forceY_StrengthSliderInput.addEventListener("input", () => forceY_StrengthSliderInputChange());
    
    // var forceY_YSliderInput = this.get("#forceY_YSliderInput");
    // forceY_YSliderInput.addEventListener("input", () => forceY_YSliderInputChange());
    
    var force_linkCheckbox = this.get("#force_linkCheckbox");
    force_linkCheckbox.addEventListener("change", () => force_linkCheckboxChange());
    
    var link_DistanceSliderInput = this.get("#link_DistanceSliderInput");
    link_DistanceSliderInput.addEventListener("input", () => link_DistanceSliderInputChange());
    
    var link_StrengthSliderInput = this.get("#link_StrengthSliderInput");
    link_StrengthSliderInput.addEventListener('input', () => link_StrengthSliderInputChange());
    
    var link_IterationsSliderInput = this.get("#link_IterationsSliderInput");
    link_IterationsSliderInput.addEventListener("input", () => link_IterationsSliderInputChange());
    
    var graphSelect = this.get("#graphSelect");
    graphSelect.addEventListener("change", graphSelectChange);
    
    
    
    // set up the simulation and event to update locations after each tick
    function initializeSimulation() {
      simulation.nodes(graph.nodes);
      initializeForces();
      simulation.on("tick", () => ticked());
    }
    
    function initializeDisplay() {
      // set the data and properties of link lines
      link = svg.append("g")
            .attr("class", "links")
        .selectAll("line")
        .data(graph.links)
        .enter().append("line");

      // set the data and properties of node circles
      node = svg.append("g")
            .attr("class", "nodes")
        .selectAll("circle")
        .data(graph.nodes)
        .enter().append("circle")
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));

      // node tooltip
      node.append("title")
          .text(function(d) { return d.id; });
      // visualize the graph
      updateDisplay();
    }
    
        
    function updateDisplay() {
        node
            .attr("r", forceProperties.collide.radius)
            .attr("stroke", forceProperties.charge.strength > 0 ? "blue" : "red")
            .attr("stroke-width", forceProperties.charge.enabled==false ? 0 : Math.abs(forceProperties.charge.strength)/15);

        link
            .attr("stroke-width", forceProperties.link.enabled ? 1 : .5)
            .attr("opacity", forceProperties.link.enabled ? 1 : 0);
    }
    
    
    // add forces to the simulation
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
          .strength(forceProperties.link.strength)
          .iterations(forceProperties.link.iterations)
          .links(forceProperties.link.enabled ? graph.links : []);

      // updates ignored until this is run
      // restarts the simulation (important if simulation has already slowed down)
      simulation.alpha(1).restart();
    }
    
    const resetControls = () => {
      forceProperties = {
        center: {
            x: 0.5,
            y: 0.5
        },
        charge: {
            enabled: true,
            strength: -30,
            distanceMin: 1,
            distanceMax: 2000
        },
        collide: {
            enabled: true,
            strength: 0.7,
            iterations: 1,
            radius: 5
        },
        forceX: {
            enabled: false,
            strength: 0.1,
            x: 0.5
        },
        forceY: {
            enabled: false,
            strength: 0.1,
            y: 0.5
        },
        link: {
            enabled: true,
            distance: 30,
            strength: 1,
            iterations: 1
        }
      }
      updateUi();
      updateAll();
    }
    
    
    function updateAll() {
      updateForces();
      updateDisplay();
    }
    
    const center_XSliderInputChange = () => {
      var value = center_XSliderInput.value;
      var output = this.get("#center_XSliderOutput");
      output.textContent = value;
      forceProperties.center.x = value; 
      updateAll();
    }
    
    const center_YSliderInputChange = () => {
      var value = center_YSliderInput.value;
      var output = this.get("#center_YSliderOutput");
      output.textContent = value;
      forceProperties.center.y = value; 
      updateAll();
    }
    
    const force_chargeCheckboxChange = () => {
      forceProperties.charge.enabled = !forceProperties.charge.enabled;
      charge_StrengthSliderInput.disabled = !forceProperties.charge.enabled;
      charge_distanceMinSliderInput.disabled = !forceProperties.charge.enabled;
      charge_distanceMaxSliderInput.disabled = !forceProperties.charge.enabled;
      updateAll();
    }
    
    const charge_StrengthSliderInputChange = () => {
      var value = charge_StrengthSliderInput.value;
      var output = this.get("#charge_StrengthSliderOutput");
      output.textContent = value;
      forceProperties.charge.strength = value;
      updateAll();
    }
    
    const charge_distanceMinSliderInputChange = () => {
      var value = charge_distanceMinSliderInput.value;
      var output = this.get("#charge_distanceMinSliderOutput");
      output.textContent = value;
      forceProperties.charge.distanceMin = value;
      updateAll();
    }
    
    const charge_distanceMaxSliderInputChange = () => {
      var value = charge_distanceMaxSliderInput.value;
      var output = this.get("#charge_distanceMaxSliderOutput");
      output.textContent = value;
      forceProperties.charge.distanceMax = value; 
      updateAll();
    }
    
    const force_collideCheckboxChange = () => {
      forceProperties.collide.enabled = !forceProperties.collide.enabled;
      collide_StrengthSliderInput.disabled = !forceProperties.collide.enabled;
      collide_radiusSliderInput.disabled = !forceProperties.collide.enabled;
      collide_iterationsSliderInput.disabled = !forceProperties.collide.enabled;
      updateAll();
    }
    
    const collide_StrengthSliderInputChange = () => {
      var value = collide_StrengthSliderInput.value;
      var output = this.get("#collide_StrengthSliderOutput");
      output.textContent = value;
      forceProperties.collide.strength = value;
      updateAll();
    }
    
    const collide_radiusSliderInputChange = () => {
      var value = collide_radiusSliderInput.value;
      var output = this.get("#collide_radiusSliderOutput");
      output.textContent = value;
      forceProperties.collide.radius = value;
      updateAll();
    }
    
    const collide_iterationsSliderInputChange = () => {
      var value = collide_iterationsSliderInput.value;
      var output = this.get("#collide_iterationsSliderOutput");
      output.textContent = value;
      forceProperties.collide.iterations = value;
      updateAll();
    }
    
    const force_forceXCheckboxChange = () => {
      forceProperties.forceX.enabled = !forceProperties.forceX.enabled;
      forceX_StrengthSliderInput.disabled = !forceProperties.forceX.enabled;
      // forceX_XSliderInput.disabled = !forceProperties.forceX.enabled;
      updateAll();
    }
    
    const forceX_StrengthSliderInputChange = () => {
      var value = forceX_StrengthSliderInput.value;
      var output = this.get("#forceX_StrengthSliderOutput");
      output.textContent = value;
      forceProperties.forceX.strength = value;
      updateAll();
    }
    
    // const forceX_XSliderInputChange = () => {
    //   var value = forceX_XSliderInput.value;
    //   var output = this.get("#forceX_XSliderOutput");
    //   output.textContent = value;
    //   forceProperties.forceX.x = value; 
    //   updateAll();
    // }
    
    const force_forceYCheckboxChange = () => {
      forceProperties.forceY.enabled = !forceProperties.forceY.enabled;
      forceY_StrengthSliderInput.disabled = !forceProperties.forceY.enabled;
      // forceY_YSliderInput.disabled = !forceProperties.forceY.enabled;
      updateAll();
    }
    
    const forceY_StrengthSliderInputChange = () => {
      var value = forceY_StrengthSliderInput.value;
      var output = this.get("#forceY_StrengthSliderOutput");
      output.textContent = value;
      forceProperties.forceY.strength = value;
      updateAll();
    }
    
    // const forceY_YSliderInputChange = () => {
    //   var value = forceY_YSliderInput.value;
    //   var output = this.get("#forceY_YSliderOutput");
    //   output.textContent = value;
    //   forceProperties.forceY.y = value;
    //   updateAll();
    // }
    
    const force_linkCheckboxChange = () => {
      forceProperties.link.enabled = !forceProperties.link.enabled;
      link_DistanceSliderInput.disabled = !forceProperties.link.enabled;
      link_StrengthSliderInput.disabled = !forceProperties.link.enabled;
      link_IterationsSliderInput.disabled = !forceProperties.link.enabled;
      updateAll();
    }
    
    const link_DistanceSliderInputChange = () => {
      var value = link_DistanceSliderInput.value;
      var output = this.get("#link_DistanceSliderOutput");
      output.textContent = value;
      forceProperties.link.distance = value;
      updateAll();
    }
    
    const link_StrengthSliderInputChange = () => {
      var value = link_StrengthSliderInput.value;
      var output = this.get("#link_StrengthSliderOutput");
      output.textContent = value;
      forceProperties.link.strength = value;
      updateAll();
    }
    
    const link_IterationsSliderInputChange = () => {
      var value = link_IterationsSliderInput.value;
      var output = this.get("#link_IterationsSliderOutput");
      output.textContent = value; 
      forceProperties.link.iterations = value;
      updateAll();
    }
    
    async function graphSelectChange() {
      switch(graphSelect.value) {
        case 'small':
          graph = await graphLoader().loadSmallData();
          break;
        case 'large':
          graph = await graphLoader().loadModuleData();
          break;
        case 'medium':
          graph = await graphLoader().loadMediumData();
          break;
        default:
          break;
      }
      svg.selectAll("*").remove().append("g");
      initializeDisplay();
      initializeSimulation();
      resetControls();
    }
    
    const ticked = () => {
        link
            .attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });

        node
            .attr("cx", function(d) { return d.x = Math.max(forceProperties.collide.radius, Math.min(width - forceProperties.collide.radius, d.x)); })
            .attr("cy", function(d) { return d.y = Math.max(forceProperties.collide.radius, Math.min(height - forceProperties.collide.radius, d.y)); });
      var alpha = this.get("#alpha_value");
      var currentSimVal = (simulation.alpha()*100);
      var valueString = String(currentSimVal) + '%';
      alpha.setAttribute("style", "flex-basis:" + valueString);
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
    
    const updateUi = () => {
      this.get("#center_XSliderOutput").textContent = forceProperties.center.x;
      center_XSliderInput.value = forceProperties.center.x;
      this.get("#center_YSliderOutput").textContent = forceProperties.center.y;
      center_YSliderInput.value = forceProperties.center.y;
      this.get("#charge_StrengthSliderOutput").textContent = forceProperties.charge.strength;
      charge_StrengthSliderInput.value = forceProperties.charge.strength;
      charge_StrengthSliderInput.disabled = !forceProperties.charge.enabled;
      this.get("#charge_distanceMinSliderOutput").textContent = forceProperties.charge.distanceMin;
      charge_distanceMinSliderInput.value = forceProperties.charge.distanceMin;
      charge_distanceMinSliderInput.disabled = !forceProperties.charge.enabled;
      this.get("#charge_distanceMaxSliderOutput").textContent = forceProperties.charge.distanceMax;
      charge_distanceMaxSliderInput.value = forceProperties.charge.distanceMax;
      charge_distanceMaxSliderInput.disabled = !forceProperties.charge.enabled;
      this.get("#collide_StrengthSliderOutput").textContent = forceProperties.collide.strength;
      collide_StrengthSliderInput.value = forceProperties.collide.strength;
      collide_StrengthSliderInput.disabled = !forceProperties.collide.enabled;
      this.get("#collide_radiusSliderOutput").textContent = forceProperties.collide.radius;
      collide_radiusSliderInput.value = forceProperties.collide.radius;
      collide_radiusSliderInput.disabled = !forceProperties.collide.enabled;
      this.get("#collide_iterationsSliderOutput").textContent = forceProperties.collide.iterations;
      collide_iterationsSliderInput.value = forceProperties.collide.iterations;
      collide_iterationsSliderInput.disabled = !forceProperties.collide.enabled;
      this.get("#forceX_StrengthSliderOutput").textContent = forceProperties.forceX.strength;
      forceX_StrengthSliderInput.value = forceProperties.forceX.strength;
      forceX_StrengthSliderInput.disabled = !forceProperties.forceX.enabled;
      //this.get("#forceX_XSliderOutput").textContent = forceProperties.forceX.x;
      // forceX_XSliderInput.value = forceProperties.forceX.x; 
      // forceX_XSliderInput.disabled = !forceProperties.forceX.enabled;
      this.get("#forceY_StrengthSliderOutput").textContent = forceProperties.forceY.strength;
      forceY_StrengthSliderInput.value = forceProperties.forceY.strength;
      forceY_StrengthSliderInput.disabled = !forceProperties.forceY.enabled;
      //this.get("#forceY_YSliderOutput").textValue = forceProperties.forceY.y;
      // forceY_YSliderInput.value = forceProperties.forceY.y;
      // forceY_YSliderInput.disabled = !forceProperties.forceY.enabled;
      this.get("#link_DistanceSliderOutput").textContent = forceProperties.link.distance;
      link_DistanceSliderInput.value = forceProperties.link.distance;
      link_DistanceSliderInput.disabled = !forceProperties.link.enabled;
      this.get("#link_StrengthSliderOutput").textContent = forceProperties.link.strength;
      link_StrengthSliderInput.value = forceProperties.link.strength;
      link_StrengthSliderInput.disabled = !forceProperties.link.enabled;
      this.get("#link_IterationsSliderOutput").textContent = forceProperties.link.iterations;
      link_IterationsSliderInput.value = forceProperties.link.iterations;
      link_IterationsSliderInput.disabled = !forceProperties.link.enabled;
      this.get("#force_chargeCheckbox").checked = forceProperties.charge.enabled;
      this.get("#force_collideCheckbox").checked = forceProperties.collide.enabled;
      this.get("#force_forceXCheckbox").checked = forceProperties.forceX.enabled;
      this.get("#force_forceYCheckbox").checked = forceProperties.forceY.enabled;
      this.get("#force_linkCheckbox").checked = forceProperties.link.enabled;
    }

    initializeDisplay();
    initializeSimulation();
  }
  
}
