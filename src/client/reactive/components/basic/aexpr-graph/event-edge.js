import Edge from './edge.js'

export default class EventEdge extends Edge {
  constructor(from, to, graph, eventGetter = () => this.from.getEvents(to)) {
    super(from, to, graph, { color: "blue" });
    this.eventGetter = eventGetter;
  }
  
  currentStyle(){
    const currentEvent = this.graph.getCurrentEvent().event;
    const style = Object.assign({}, this.options);
    if(this.relatedEvents.some(({event}) => event === currentEvent)) {
      style.penwidth = 3;
    } else {
      //Needed for a wierd bug in DOT where omitting the penwidth or setting it to 1 is ignored, if it was previously set
      style.penwidth = 0.99;
    }
    return style;
  };
  
  get relatedEvents() {
    return this.eventGetter();
  }
  
  multiplicity() {
    return this.relatedEvents.length;
  }
}