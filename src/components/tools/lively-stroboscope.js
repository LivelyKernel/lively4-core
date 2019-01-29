import Morph from "src/components/widgets/lively-morph.js"
import d3 from "src/external/d3.v5.js"

import ObjectView from "src/client/stroboscope/objectview.js"
import StroboscopeEvent from 'src/client/stroboscope/stroboscopeevent.js';

export default class LivelyStroboscope extends Morph {

  async initialize() {

    this._rowHeight = 32
    this._objectWidth = 105

    this._objectViewsMap = new Map();

    var view = new ObjectView(new StroboscopeEvent(1, "Test", "solution", "number", "create", 1))
    view.append(new StroboscopeEvent(1, "Test", "other", "number", "create", 1))
    view.append(new StroboscopeEvent(1, "Test", "next", "number", "create", 1))
    this._addObjectView(view)
    
    this._addObjectView(new ObjectView(new StroboscopeEvent(2, "Test", "solution", "number", "create", 1)))
    this._addObjectView(new ObjectView(new StroboscopeEvent(3, "Test", "solution", "number", "create", 1)))
    this._addObjectView(new ObjectView(new StroboscopeEvent(4, "Test", "solution", "number", "create", 1)))



    this.updateViz()
  }

  onEvents(events) {
    for (var i = 0; i < events.length; ++i) {
      this._handleEvent(events[i])
    }

    this.updateViz()
  }

  updateViz() {
    this._update_offsets()
    this._updateSVGViz()
    this._updateObjectsViz()
  }

  _handleEvent(event) {
    if (event.object_id in this._objectViewsMap) {
      this._objectViewsMap.get(event.object_id).append(event);
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
    var objects = this.svg.selectAll("g")
      .data(this._objectViews());
    this._updatePropertiesDiv(objects);
    this._updateObjectsDiv(objects);
  }

  _updateObjectsDiv(objects) {
    var objectsEnter = objects.enter().append("g")
      .attr("class", "object")
      .attr("transform", d => "translate(" + 0 + "," + d.offset + ")")
    
    objectsEnter.append('rect')
      .attr('class', 'object')
      .attr("width", this._objectWidth)
      .attr("height", d => d.propertyCount() * this._rowHeight);

    objectsEnter.append("text")
      .attr("x", 10)
      .attr("dy", 20)
      .text(d => d.id !== undefined ? "ID: " + d.id : "undefined id")
  }

  _updatePropertiesDiv(objects) {
    var objectsEnter = objects.enter().append("g")
      .attr("class", "propertybundle")
      .attr("transform", d => "translate(" + this._objectWidth + "," + d.offset + ")");
    
    
    objectsEnter.selectAll("g.property")
      .data(function(d) {return d.viewsAsArray;})
      .enter().append("g")
          .attr("class", "property")
          //.attr("transform", "translate(0,200)")
          .attr("transform", d => "translate(" + 0 + "," + 2 * this._rowHeight + ")")
          .append("rect")
          .attr("width", 300)
          .attr("height", this._rowHeight);
    
    objectsEnter.selectAll("g.property")
      .append("text")
      .attr("x", 10)
      .attr("dy", 20)
      .text(function (d,i) {return "index: " + i + " name: " + d.property; });

    //propertiesEnter.selectAll("g.property")
    //  .data([1, 2]).enter().append("g")
    //  .attr("transform", d => "translate(" + 0 + "," + d * this._rowHeight + ")")
    //  .append("rect")
    //  .attr("width", 100)
    //  .attr("height", 30);
  }

  _objectViews() {
    return Array.from(this._objectViewsMap.values());
  }

  _update_offsets() {
    this._property_offset = 0
    this._object_offset = 0
    this._allocated_rows = 0

    var objectViews = this._objectViews()
    var totalProperties = 0

    for (var i = 0; i < objectViews.length; i++) {
      objectViews[i].offset = totalProperties * this._rowHeight
      totalProperties += objectViews[i].propertyCount()
    }
  }

  _next_row_offset() {
    var offset = this._allocated_rows * this._rowHeight
    this._allocated_rows += 1
    return offset
  }

  livelyExample() {}

  livelyMigrate(other) {}

}
