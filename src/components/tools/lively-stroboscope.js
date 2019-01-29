import Morph from "src/components/widgets/lively-morph.js"
import d3 from "src/external/d3.v5.js"

import ObjectView from "src/client/stroboscope/objectview.js"
import StroboscopeEvent from 'src/client/stroboscope/stroboscopeevent.js';
import { ValueType } from 'src/client/stroboscope/valuetype.js';

export default class LivelyStroboscope extends Morph {

  async initialize() {
    this.d3 = d3

    this._rowHeight = 32
    this._valueRowHeight = 30
    this._objectWidth = 60
    this._propertySectionWidth = 80
    this._propertySectionMargin = 5
    this._objectSectionsMargin = 10
    this._timeframewidth = 300 // size in px
    this._timeframelength = 30000 // time in ms
    this._timeframelatest = undefined
    this._timeframeoldest = undefined
    this._updateRate = 100
    this.indexMap = new Map();
    this.objectViews = []
    this._objectViewsMap = new Map();

    this._handleEvent(new StroboscopeEvent(1, "Test", "solution", "number", "create", 1))
    this._handleEvent(new StroboscopeEvent(1, "Test", "other", "number", "create", 1))
    this._handleEvent(new StroboscopeEvent(1, "Test", "next", "number", "create", 1))
    this._handleEvent(new StroboscopeEvent(1, "Test", "next", "string", "change", "hello"))
    this._handleEvent(new StroboscopeEvent(1, "Test", "next2", "string", "create", "hello"))
    this._handleEvent(new StroboscopeEvent(2, "Test", "symbol", "symbol", "create", 1))
    this._handleEvent(new StroboscopeEvent(3, "Test", "function", "function", "create", 1))
    this._handleEvent(new StroboscopeEvent(4, "Test", "undefined", "undefined", "create", 1))
    this._handleEvent(new StroboscopeEvent(4, "Test", "boolean", "boolean", "create", 1))
    this._handleEvent(new StroboscopeEvent(4, "Test", "string", "string", "create", 1))
    this._handleEvent(new StroboscopeEvent(4, "Test", "object", "object", "create", 1))

    this.updateViz()

    d3.interval(this.updateViz.bind(this), this._updateRate)
  }

  onEvents(events) {
    for (var i = 0; i < events.length; ++i) {
      this._handleEvent(events[i])
    }

    this.updateViz()
  }

  updateViz() {
    this._updateTimeframe()
    this._update_offsets()
    this._updateSVGViz()
    this._updateObjectsViz()
  }

  _updateTimeframe() {
    this._timeframelatest = Date.now()
    this._timeframeoldest = this._timeframelatest - this._timeframelength
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
      .attr("x", 6)
      .attr("dy", 13)
      .text((d) => d.property);

    objectsEnter.selectAll("g.property")
      .append("text")
      .attr("x", 12)
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
      .attr("class", "value");
    //.attr("transform", (d, i) => "translate(" + i * this._propertySectionWidth + ",0)");

    objectsEnter.selectAll("g.value")
      .append("rect")
      .attr("class", "value")
      .attr("y", () => (this._rowHeight - this._valueRowHeight) / 2)
      .attr("x", (d) => this._yInTimeframe(d.startTime))
      .attr("width", (d) => this._widthInTimeframe(d.startTime, d.endTime))
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
        return "lightsteelblue"
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

  // 0 is most right and 1 is most left
  // Returns 0 on timestamp is smaller or equal oldest timeframe timestamp
  // Returns 1 on timestamp is greater or equal latest timeframe timestamp
  // Returns 1 on undefined
  // Interpolates inbetween
  _interpolationInTimeframe(timestamp) {
    if (timestamp === undefined || timestamp >= this._timeframelatest)
      return 1
    else if (timestamp <= this._timeframeoldest)
      return 0
    else
      return 1 - ((this._timeframelatest - timestamp) / this._timeframelength)

  }

  _yInTimeframe(timestamp) {
    return this._timeframewidth * this._interpolationInTimeframe(timestamp)
  }

  _widthInTimeframe(start, end) {
    return this._yInTimeframe(end) - this._yInTimeframe(start)
  }

  livelyExample() {}

  livelyMigrate(other) {}

}
