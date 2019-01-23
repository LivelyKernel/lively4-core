import StroboscopeEvent from 'src/client/stroboscope/stroboscopeevent.js';
import { EventType } from 'src/client/stroboscope/eventtype.js';

export default class Stroboscope {
  constructor(target) {
    this.target = target;
    this.known_attributes = undefined;
  }

  slice() {
    var events = [];

    if (this.target == undefined)
      return events;

    for (var property in Object.keys(this.target)) {

      if (this._is_property_new(property))
        events.push(this._create_event_for_property(property));
      else if (this._has_property_value_changed(property))
        continue;
    }

    return events;
  }

  _create_event_for_property(property) {
    return this._value_event_for_property(property, EventType.create);
  }
  
  _change_event_for_property(property) {
    return this._value_event_for_property(property, EventType.change);
  }

  _value_event_for_property(property, event_type)
  {
    var trigger = "Stroboscope";
    var property_name = Object.keys(this.target)[property]
    var value = this.target[property_name]
    var property_type = typeof value;

    return new StroboscopeEvent(this.target, trigger, property_name, property_type, event_type, value);
  }  
  
  _is_property_new(property) {
    return true;
  }

  _has_property_value_changed() {
    return false;
  }
}
