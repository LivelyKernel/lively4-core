import StroboscopeEvent from 'src/client/stroboscope/stroboscopeevent.js';
import { EventType } from 'src/client/stroboscope/eventtype.js';

export default class Stroboscope {
  constructor(target) {
    this.target = target;
  }

  slice() {
    var events = [];
    
    if (this.target == undefined)
      return events;
    
    for (var property in Object.keys(this.target)) {
        events.push(this._create_event_for_property(property));
    }

    return events;
  }
  
  _create_event_for_property(property) {
    var trigger = "Stroboscope";
    var value = 42;
    var property_type = Object.prototype.toString.call(value);
    var event_type = EventType.create;
    
    return new StroboscopeEvent(this.target, trigger, property, property_type, event_type, value);
  }
}
