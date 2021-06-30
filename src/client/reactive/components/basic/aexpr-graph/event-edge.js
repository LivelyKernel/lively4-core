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
  /*
  static dependencyEventFilter(dependencyKey, ae) {
    return ({event, eventAE}) => {
      if(event.type !== "changed value") return false;
      return eventAE === ae && dependencyKey.equals(event.value.dependency);
    };
  }
  
  static AEEventFilter(parentAE, callback) {
    return ({event}) => {
      if(event.type !== "changed value") return false;
      return parentAE === event.value.parentAE 
        && callback === event.value.callback;
    };
  }
  
  static callbackEventFilter(callback, dependencyKey) {
    return ({event}) => {
      if(event.type !== "changed value") return false;
      return dependencyKey.equals(event.value.dependency) 
        && callback === event.value.callback;
    };
  }*/
}