import ValueView from 'src/client/stroboscope/valueview.js';
import {EventType} from 'src/client/stroboscope/eventtype.js';

export default class PropertyView
{
  constructor(event){
    this.id = event.object_id;
    this.property = event.property
    this.valueViews = [];
    this.handleEvent(event);
  }
  
  handleEvent(event) {
    // if property gets created -> new ValueView
    if(event.event_type === "create") {
      this.valueViews.push(new ValueView(event));
    }
    
    // a change event occurs
    // figure out if value change or property_type change -> the latter requires new ValueView
    if(event.event_type === EventType.change) {
      // property_type is the same -> just change value
      if(this.valueViews[this.valueViews.length-1].property_type === event.property_type ){
        this.valueViews[this.valueViews.length-1].changeValue(event);
      } else {
        // when property_type changes -> end current ValueView
        this.valueViews[this.valueViews.length-1].endThisView(event);
        // add new ValueView
        this.valueViews.push(new ValueView(event));
      }
    }
    
    if(event.event_type === EventType.delete) {
      this.valueViews[this.valueViews.length-1].endThisView(event);
    }
  }
}
