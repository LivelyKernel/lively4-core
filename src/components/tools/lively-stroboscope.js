import Morph from "src/components/widgets/lively-morph.js"
import d3 from "src/external/d3.v5.js"

class ObjectView
{
  constructor(event){
    this.id = event.object_id
    this.events = []
    this.events.push(event)
  }
  
  append(event){
    this.events.push(event)
  }
}


export default class LivelyStroboscope extends Morph {

  getTreeData() {
    if (!this.treeData) {
      this.treeData = {
        "name": "Top Level",
        "children": [{
            "name": "Level 2: A",
            "children": [
              { "name": "Son of A" },
              { "name": "Daughter of A" }
            ]
          },
          { "name": "Level 2: B" }
        ]
      };
    }
    return this.treeData
  }

  setTreeData(data) {
    this.treeData = data;
    this.updateViz()
  }

  async initialize() {
    
    this._objectViewsMap = new Map();
    
    this._addObjectView(new ObjectView({object_id : 0}))
    this._addObjectView(new ObjectView({object_id : 1}))
    this._addObjectView(new ObjectView({object_id : 2}))
    
    this.updateViz()

  }

  onEvents(events){
    for(var i = 0; i < events.length; ++i){
      this._handleEvent(events[i])
    }
    
    this.updateViz()
  }
  
  updateViz() {
    this._updateSVGViz()
    this._updateObjectsViz()
  }

  _handleEvent(event){
    if(event.object_id in this._objectViewsMap){
      this._objectViewsMap[event.object_id].append(event);
    }
    else
    {
      this._addObjectView(new ObjectView(event));
    }
  }
  
  _addObjectView(objectView){
    this._objectViewsMap.set(objectView.id, objectView)
  }
  
  _updateSVGViz(){
    var bounds = this.getBoundingClientRect()
    this.shadowRoot.querySelector("svg").innerHTML = ""

    var margin = { top: 10, right: 20, bottom: 10, left: 20 },
      width = bounds.width - margin.right - margin.left,
      height = bounds.height - margin.top - margin.bottom;

    var svg = d3.select(this.shadowRoot.querySelector("svg"))
      .attr("width", width + margin.right + margin.left)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    this.svg = svg
    this.duration = 750
  }
  
  _updateObjectsViz() {
    this._reset_offset()
    
    var objects = this.svg.selectAll("g.object")
      .data(this._objectViews());

    // Enter any new nodes at the parent's previous position.
    var objectsEnter = objects.enter().append("g")
      .attr("class", "object")
      .attr("transform", d => "translate(" + 0 + "," + this._next_offset() + ")")

    objectsEnter.append("rect")
      .attr('class', 'object')

    // Add labels for the nodes
    objectsEnter.append("text")
      .attr("x", 10)
      .attr("dy", 20)
      .text(d => this.id !== undefined ? "ID: " + d.id : "undefined id")
    
    // UPDATE
    var objectsUpdate = objectsEnter.merge(objects)

    // Update the node attributes and style
    objectsUpdate.select("rect.object")
      .attr("width", 100)
      .attr("height", 30);
  }

  _objectViews(){
    return Array.from(this._objectViewsMap.values());
  }
  
  _next_offset() {
    var o = this._offset
    this._offset += 50
    return o
  }
  
  _reset_offset() {
    this._offset = 0
  }
  
  update(source) {

    // Assigns the x and y position for the nodes
    var treeData = this.treemap(this.root);

    // Compute the new tree layout
    const nodes = treeData.descendants()
    const links = treeData.descendants().slice(1) // links() // 

    // Normalize for fixed-depth.
    nodes.forEach((d) => { d.y = d.depth * 180; });

    // Update the nodes…
    var node = this.svg.selectAll("g.node")
      .data(nodes, (d) => d.id || (d.id = ++this.i));

    // Enter any new nodes at the parent's previous position.
    var nodeEnter = node.enter().append("g")
      .attr("class", "node")
      .attr("transform", d => "translate(" + source.y0 + "," + source.x0 + ")")
      .on("click", (d) => this.click(d));

    // Add Circle for the nodes
    nodeEnter.append("circle")
      .attr('class', 'node')
      .attr("r", 1e-6)
      .style("fill", d => d._children ? "lightsteelblue" : "#fff");

    // Add labels for the nodes
    nodeEnter.append("text")
      .attr("x", d => d.children || d._children ? -13 : 13)
      .attr("dy", ".35em")
      .attr("text-anchor", d => d.children || d._children ? "end" : "start")
      .text(d => this.dataName ? this.dataName(d.data) : d.data.name)
    // .style("fill-opacity", 1e-6);

    // UPDATE
    var nodeUpdate = nodeEnter.merge(node)

    // Transition nodes to their new position.
    nodeUpdate.transition()
      .duration(this.duration)
      .attr("transform", d => "translate(" + d.y + "," + d.x + ")");


    // Update the node attributes and style
    nodeUpdate.select("circle.node")
      .attr("r", 10)
      .style("fill", d => d._children ? "lightsteelblue" : "white")
      .attr('cursor', 'pointer');

    // nodeUpdate.select("text")
    //   .style("fill-opacity", 1);

  }

  livelyExample() {

  }

  livelyMigrate(other) {
    this.treeData = other.treeData
    this.dataName = other.dataName
  }

}
