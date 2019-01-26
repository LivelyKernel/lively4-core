import StroboscopeEvent from 'src/client/stroboscope/stroboscopeevent.js';
import { EventType } from 'src/client/stroboscope/eventtype.js';

export default class Stroboscope {
  constructor(target, idle_time=10) {
    this.target = target;
    this._property_cache = {};
    this.reciever = undefined
    this._is_running = false
    this._idle_time = idle_time
  }

  start() {
    this._is_running = true
    this._start_background_task()
  }

  _idle() {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve('resolved');
      }, this._idle_time);
    });
  }

  async _start_background_task() {
    while (this._is_running) {
      this.scan()
      var result = await this._idle();
    }
  }

  stop() {
    this._is_running = false
  }

  is_running() {
    return this._is_running
  }

  scan() {
    var events = [];

    if (this.target == undefined)
      return events;

    this._add_create_and_change_events(events);
    this._add_delete_events(events);

    if (this.reciever !== undefined)
      this.reciever.on_events_callback(events)

    return events;
  }

  _add_create_and_change_events(events) {
    for (var index in Object.keys(this.target)) {
      var property = Object.keys(this.target)[index]
      var event;
      if (this._is_property_new(property)) {
        this._cache_property(property);
        event = this._create_event_for_property(property);
        events.push(event);
      } else if (this._has_property_value_changed(property)) {
        this._cache_property(property);
        event = this._change_event_for_property(property);
        events.push(event);
      }
    }
  }

  _add_delete_events(events) {
    var deprecated_properties = []
    for (var index in Object.keys(this._property_cache)) {
      var property = Object.keys(this._property_cache)[index]

      if (this._is_property_deleted(property)) {
        deprecated_properties.push(property)
        var event = this._delete_event_for_property(property);
        events.push(event);
      }
    }
    this._remove_properties_cache(deprecated_properties);
  }

  _create_event_for_property(property) {
    return this._value_event_for_property(property, EventType.create);
  }

  _change_event_for_property(property) {
    return this._value_event_for_property(property, EventType.change);
  }

  _delete_event_for_property(property) {
    var trigger = "Stroboscope";
    return new StroboscopeEvent(this.target, trigger, property, undefined, EventType.delete, undefined);
  }

  _value_event_for_property(property, event_type) {
    var trigger = "Stroboscope";
    var value = this.target[property]
    var type = typeof value;

    return new StroboscopeEvent(this.target, trigger, property, type, event_type, value);
  }

  _is_property_new(property) {
    return !this._is_property_cached(property);
  }

  _is_property_cached(property) {
    return this._property_cache.hasOwnProperty(property);
  }

  _is_property_deleted(property) {
    return !this._target_has_property(property)
  }

  _target_has_property(property) {
    return this.target.hasOwnProperty(property);
  }

  _has_property_value_changed(property) {
    return this._property_cache[property] !== this.target[property]
  }

  _cache_property(property) {
    var value = this.target[property]
    this._property_cache[property] = value;
  }

  _remove_properties_cache(deprecated_properties) {
    for (var index in Object.keys(deprecated_properties)) {
      var property = Object.keys(this._property_cache)[index]
      delete this._property_cache[property];
    }
  }
}
