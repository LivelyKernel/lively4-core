import Morph from "src/components/widgets/lively-morph.js"
import d3 from "src/external/d3.v5.js"

import ObjectView from "src/client/stroboscope/objectview.js"
import StroboscopeEvent from 'src/client/stroboscope/stroboscopeevent.js';
import { ValueType } from 'src/client/stroboscope/valuetype.js';

export default class LivelyStroboscope extends Morph {

  async initialize() {

    this._rowHeight = 32
    this._valueRowHeight = 30
    this._objectWidth = 105
    this._propertySectionWidth = 150
    this._propertySectionMargin = 5
    this._objectSectionsMargin = 10

    this.indexMap = new Map();
    this.objectViews = []
    this._objectViewsMap = new Map();

    var view = new ObjectView(new StroboscopeEvent(1, "Test", "solution", "number", "create", 1))
    view.append(new StroboscopeEvent(1, "Test", "other", "number", "create", 1))
    view.append(new StroboscopeEvent(1, "Test", "next", "number", "create", 1))
    view.append(new StroboscopeEvent(1, "Test", "next", "string", "change", "hello"))
    view.append(new StroboscopeEvent(1, "Test", "next2", "string", "create", "hello"))
    this._addObjectView(view)

    this._addObjectView(new ObjectView(new StroboscopeEvent(2, "Test", "symbol", "symbol", "create", 1)))
    this._addObjectView(new ObjectView(new StroboscopeEvent(3, "Test", "function", "function", "create", 1)))
    this._addObjectView(new ObjectView(new StroboscopeEvent(4, "Test", "undefined", "undefined", "create", 1)))
    this._addObjectView(new ObjectView(new StroboscopeEvent(4, "Test", "boolean", "boolean", "create", 1)))
    this._addObjectView(new ObjectView(new StroboscopeEvent(4, "Test", "string", "string", "create", 1)))
    this._addObjectView(new ObjectView(new StroboscopeEvent(4, "Test", "object", "object", "create", 1)))
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
    if (this.indexMap.has(event.object_id)) {
      var index = this.indexMap.get(event.object_id);
      this.objectViews[index].append(event);
    } else {
      this._addObjectView(new ObjectView(event));
    }
  }

  _addObjectView(objectView) {
    this.indexMap.set(objectView.id, this.objectViews.length)
    this.objectViews.push(objectView)
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
      .data(this.objectViews);
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
      .attr("transform", d => "translate(" + this._objectWidth + "," + d.offset + ")");

    this._updatePropertiesDivsHeaders(objectsEnter)
    this._updateValueDivs(objectsEnter);
  }

  _updatePropertiesDivsHeaders(objectsEnter) {
    objectsEnter.selectAll("g.property")
      .data(function(d) { return d.propertyViews; })
      .enter().append("g")
      .attr("class", "property")
      .attr("transform", (d, i) => "translate(" + 0 + "," + i * this._rowHeight + ")")

    objectsEnter.selectAll("g.property")
      .append("rect")
      .attr("width", this._propertySectionWidth)
      .attr("height", this._rowHeight);

    objectsEnter.selectAll("g.property")
      .append("text")
      .attr("x", 10)
      .attr("dy", 13)
      .text((d) => d.property);

    objectsEnter.selectAll("g.property")
      .append("text")
      .attr("x", 10)
      .attr("dy", 28)
      .style("font-style", "italic")
      .text((d, i) => "<" + d._openView().type + ">");
  }

  _updateValueDivs(objectsEnter) {
    objectsEnter.selectAll("g.property")
      .append("g")
      .attr("transform", (d, i) => "translate(" + (this._propertySectionWidth + this._propertySectionMargin) + ",0)")
      .selectAll("g.value")
      .data(function(d, i) { return d.valueViews; })
      .enter()
      .append("g")
      .attr("class", "value")
      .attr("transform", (d, i) => "translate(" + i * this._propertySectionWidth + ",0)");

    objectsEnter.selectAll("g.value")
      .append("rect")
      .attr("class", "value")
      .attr("y", () => (this._rowHeight - this._valueRowHeight) / 2)
      .attr("width", 50)
      .attr("height", this._valueRowHeight)
      .style("fill", d => this._colorForType(d));
  }

  _update_offsets() {
    this._property_offset = 0
    this._object_offset = 0
    this._allocated_rows = 0

    var totalProperties = 0
    for (var i = 0; i < this.objectViews.length; i++) {
      this.objectViews[i].offset = totalProperties * this._rowHeight + i * this._objectSectionsMargin
      totalProperties += this.objectViews[i].propertyCount()
    }
  }

  _next_row_offset() {
    var offset = this._allocated_rows * this._rowHeight
    this._allocated_rows += 1
    return offset
  }

  _colorForType(valueView) {
    switch (valueView.type) {
      case ValueType.number:
        return "whitesmoke"
      case ValueType.string:
        return "powderblue"
      case ValueType.boolean:
        return "#ccccff"
      case ValueType.object:
        return "khaki"
      case ValueType.undefined:
        return "thistle"
      case ValueType.symbol:
        return "pink"
      case ValueType.function:
        return "peachpuff"
      default:
        return "red"
    }
  }

  livelyExample() {}

  livelyMigrate(other) {}

}
