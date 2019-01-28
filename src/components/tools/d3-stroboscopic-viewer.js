import Morph from "src/components/widgets/lively-morph.js"
import d3 from "src/external/d3.v5.js"

import ObjectView from "src/client/stroboscope/objectview.js"
import StroboscopeEvent from 'src/client/stroboscope/stroboscopeevent.js';


export default class D3StroboscopicViewer extends Morph {

  async initialize() {

    this._objectViewsMap = new Map();

    this._addObjectView(new ObjectView( new StroboscopeEvent(1, "Test", "solution", "number", "create", 1) ))
    this._addObjectView(new ObjectView( new StroboscopeEvent(2, "Test", "question", "string", "create", "Does it work?") ))
    this._addObjectView(new ObjectView( new StroboscopeEvent(3, "Test", "question", "string", "create", "bla") ))

    this.updateViz()
  }

  onEvents(events) {
    for (var i = 0; i < events.length; ++i) {
      this._handleEvent(events[i])
    }

    this.updateViz()
  }

  updateViz() {
    this._updateSVGViz()
    this._updateObjectsViz()
  }

  _handleEvent(event) {
    if (event.object_id in this._objectViewsMap) {
      this._objectViewsMap[event.object_id].append(event);
    } else {
      this._addObjectView(new ObjectView(event));
    }
  }

  _addObjectView(objectView) {
    this._objectViewsMap.set(objectView.id, objectView)
  }

  _updateSVGViz() {
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

    var propertiesEnter = objects.enter().append("g")
      .attr("class", "property")
      .attr("transform", d => "translate(" + 120 + "," + this._next_offset() + ")")
    
    this._updateObjectsDiv(objectsEnter);
    this._updatePropertiesDiv(propertiesEnter);
  }

  _updateObjectsDiv(objectsEnter) {
    objectsEnter.append("rect")
      .attr('class', 'object')
      .attr("width", 100)
      .attr("height", 30);

    objectsEnter.append("text")
      .attr("x", 10)
      .attr("dy", 20)
      .text(d => d.id !== undefined ? "ID: " + d.id : "undefined id")
  }

  
  
  _updatePropertiesDiv(propertiesEnter) {
    propertiesEnter.append("rect")
      .attr('class', 'property')
      .attr("width", 100)
      .attr("height", 30);
    
    
    propertiesEnter.append("text")
      .attr("x", 10)
      .attr("dy", 20)
      .text(d => d.id !== undefined ? "ID: " + d.id : "not working")
    
    
  }

  _objectViews() {
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

  livelyExample() {

  }

  livelyMigrate(other) {
    this.treeData = other.treeData
    this.dataName = other.dataName
  }

}
