import Morph from "src/components/widgets/lively-morph.js"
import d3 from "src/external/d3.v5.js"

import ObjectView from "src/client/stroboscope/objectview.js"
import StroboscopeEvent from 'src/client/stroboscope/stroboscopeevent.js';
import { ValueType } from 'src/client/stroboscope/valuetype.js';

export default class LivelyStroboscope extends Morph {

  async initialize() {
    
    this.windowTitle = "Stroboscopic Viewer"
    this.d3 = d3

    this._rowHeight = 32
    this._valueRowHeight = 30
    this._objectWidth = 60
    this._propertySectionWidth = 80
    this._propertySectionMargin = 5
    this._objectSectionsMargin = 40
    this._headerWidth = this._propertySectionWidth + this._propertySectionMargin + this._objectSectionsMargin
    
    this._changeMarkerRadius = 5
    this._timeframewidth = 400 // size in px
    this._timeframelength = 30000 // time in ms
    this._timeframelatest = undefined
    this._timeframeoldest = undefined
    this._updateRate = 75
    this.indexMap = new Map();
    this.objectViews = []
    this._objectViewsMap = new Map();
    this._startTime = Date.now()

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
    this._updateOffsets()
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

    var margin = { top: 30, right: 40, bottom: 10, left: 20 },
      width = bounds.width - margin.right - margin.left,
      height = bounds.height - margin.top - margin.bottom;

    this._width = width
    this._height = height
    this._timeframewidth = this._width - this._headerWidth

    var svg = d3.select(this.shadowRoot.querySelector("svg"))
      .attr("width", width + margin.right + margin.left)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    this.svg = svg

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
      .attr("transform", d => "translate(" + 0 + "," + d.offset + ")");


    objectsEnter.append('rect')
      .attr('class', 'object')
      .attr("width", this._objectWidth)
      .attr("height", d => d.propertyCount() * this._rowHeight)
      .on("mouseover", this._objectInfo.bind(this));

    objectsEnter.append("text")
      .attr("x", 10)
      .attr("dy", 20)
      .style("font-style", "italic")
      .text((d) => "<object>");
  }

  _updatePropertiesDiv(objects) {
    var objectsEnter = objects.enter().append("g")
      .attr("transform", d => "translate(" + this._objectWidth + "," + d.offset + ")");
    
    this._updateAxis(objectsEnter);
    this._updatePropertiesDivsHeaders(objectsEnter);
    this._updateValueDivs(objectsEnter);
  }

  _updateAxis(objectsEnter) {
    
    var scale = d3.scaleLinear()
      .domain([(this._timeframeoldest - this._startTime) / 1000, (this._timeframelatest - this._startTime)/1000])
      .range([this._propertySectionWidth + this._propertySectionMargin, this._propertySectionWidth + this._propertySectionMargin + this._timeframewidth]);

    var x_axis = d3.axisTop()
      .scale(scale)

    objectsEnter.append("g")
      .attr("class", "axis")
      .attr("transform", "translate(0," + -5 + ")")
      .call(x_axis)
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
      .text((d) => "<" + d._openView().type + ">");
  }

  _updateValueDivs(objectsEnter) {
    var propertiesEnter = objectsEnter.selectAll("g.property")
      .append("g")
      .attr("transform", () => "translate(" + (this._propertySectionWidth + this._propertySectionMargin) + ",0)")

    var values = propertiesEnter.selectAll("g.value")
      .data((d) => d.valueViews.filter(v => (this._interpolationInTimeframe(v.endTime) > 0)))

    var valuesEnter = values.enter()
      .append("g")
      .attr("class", "value");

    valuesEnter.append("rect")
      .attr("class", "value")
      .attr("y", () => (this._rowHeight - this._valueRowHeight) / 2)
      .attr("x", (d) => this._timestampToX(d.startTime))
      .attr("width", (d) => this._widthInTimeframe(d.startTime, d.endTime))
      .attr("height", this._valueRowHeight)
      .style("fill", d => this._colorForType(d))
      .on("mouseover", this._valueViewInfo.bind(this));

    var valueChangesEnter = valuesEnter.selectAll("g.value")
      .data((d) => d.changes.filter(t => (this._interpolationInTimeframe(t[0]) > 0)))
      .enter()
    
    valueChangesEnter.append("circle")
      .attr("class", "value")
      .attr("r", this._changeMarkerRadius)
      .attr("cx", (d) => this._timestampToX(d[0]))
      .attr("cy", () => this._rowHeight / 2)
      .append("text")
      .attr("x", 0)
      .attr("dy", 0)
      .style("font-style", "italic")
      .text("<changed>");
  }

  _updateOffsets() {
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

  _timestampToX(timestamp) {
    return this._timeframewidth * this._interpolationInTimeframe(timestamp)
  }

  _widthInTimeframe(start, end) {
    return this._timestampToX(end) - this._timestampToX(start)
  }


  _markerInfo(d) {
    lively.notify("At: " + d[0] + " Value changed : " + d[1])
  }

  _valueViewInfo(d) {
    lively.notify("Type: " + d.type + " Last Value: " + d.lastValue)
  }

  _objectInfo(d) {
    lively.notify("Object id: " + d.id)
  }

  livelyExample() {}

  livelyMigrate(other) {}

}
