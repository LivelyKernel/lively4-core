import Edge from './edge.js'

export default class EventEdge extends Edge {
  constructor(from, to, graph, toPort, eventGetter = () => this.from.getEvents(to)) {
    super(from, to, graph, { color: "blue" }, toPort);
    this.eventGetter = eventGetter;
  }
  
  currentStyle(){
    const style = Object.assign({}, this.options);
    let currentEventWithIndex = this.graph.getCurrentEvent()
    if (!currentEventWithIndex) return style
    const currentEvent = currentEventWithIndex.event;
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
    
    if(this.to.isAE()) {
      const event = this.graph.getCurrentDependencyChangedEvent();
      if(event) {
        if(event.ae === this.to.getAE()) {
          if(event.value.added.some(key => key.equals(this.from.dependencyKey))) {
            style.color = "green";
            style.penwidth = 3;
          } else if (event.value.removed.some(key => key.equals(this.from.dependencyKey))) {
            style.color = "red";
            style.penwidth = 3;
          } else {
            style.penwidth = 0.99;          
          }
        }
      }
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