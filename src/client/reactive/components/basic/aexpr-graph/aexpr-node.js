
import GraphNode from './graph-node.js';
export default class AExprNode extends GraphNode {
  
  constructor(aexpr, onClickMap) {
    super(onClickMap);
    this.aexpr = aexpr;
  }
    
  onClick(clickEvent) {
    const timelineEvents = this.aexpr.meta().get("events")
      .filter((event) => event.value && event.value.dependency && event.type === "changed value")
      .map(event => [event.value.lastValue + "=>" + event.value.value, (timeline) => {
        timeline.showEvents([event], this.aexpr);
      }])
    this.constructContextMenu(this.aexpr, [this.aexpr.meta().get("location")], timelineEvents, clickEvent);
  }
  
  getInfo() {
    const data = [];
    const location = this.aexpr.meta().get("location");
    if (location) {
      const locationText = location.file.substring(location.file.lastIndexOf("/") + 1) + " line " + location.start.line;
      data.push(locationText);
    } else {
      data.push(this.aexpr.id);
    }

    data.push(this.aexpr.meta().get("sourceCode") + "\n");
    return data;
  }
}