import Edge from './edge.js'

export default class EventEdge extends Edge {
  constructor(from, to, graph, toPort, eventGetter = () => this.from.getEvents(to)) {
    super(from, to, graph, { color: "blue" }, toPort);
    this.eventGetter = eventGetter;
  }
  
  currentStyle(){
    const currentEvent = this.graph.getCurrentEvent().event;
    const style = Object.assign({}, this.options);
    if(this.relatedEvents.some(({event}) => event === currentEvent)) {
      style.penwidth = 3;
    } else {
      //Needed for a weird bug in DOT where omitting the penwidth or setting it to 1 is ignored, if it was previously set
      style.penwidth = 0.99;
    }
    if(this.relatedEvents.length === 0) {
      style.color = "lightblue";
    } else {
      style.color = "blue";      
    }
    return style;
  };
  
  get relatedEvents() {
    return this.eventGetter();
  }
  
  multiplicity() {
    return Math.max(this.relatedEvents.length, 1);
  }
}