export default class StroboscopeEvent {

  constructor(object, trigger, property, property_type, event_type, value, object_id) {
    this.object_id = object_id;
    this.__id(this);
    this.trigger = trigger;
    this.timestamp = Date.now();
    this.property = property;
    this.property_type = property_type;
    this.event_type = event_type;
    this.value = value;
  }

  __id(o) {
    if (StroboscopeEvent.prototype.next_id == undefined) {
      StroboscopeEvent.prototype.next_id = 0
    }

    if (typeof o.id == "undefined") {
      Object.defineProperty(o, "id", {
        value: ++StroboscopeEvent.prototype.next_id,
        enumerable: false,
        writable: false
      });
    }
  }
}
