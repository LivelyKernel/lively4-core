import ValueView from 'src/client/stroboscope/valueview.js';
import { EventType } from 'src/client/stroboscope/eventtype.js';

export default class PropertyView {
  constructor(event) {
    this.property = event.property
    this.valueViews = [];
    this.handleEvent(event);
  }

  handleEvent(event) {
    switch (event.event_type) {
      case EventType.create:
        this._handleCreateEvent(event);
        break;
      case EventType.change:
        this._handleChangeEvent(event);
        break;
      case EventType.delete:
        this._handleDeleteEvent(event);
        break;
      default:
        lively.warn("Recieved unknown event type: " + event.event_type)
    }
  }

  _handleCreateEvent(event) {
    this.valueViews.push(new ValueView(event));
  }

  _handleChangeEvent(event) {
    if (this._lastView().property_type === event.property_type) {
      this._lastView().changeValue(event);
    } else {
      this._lastView().close(event);
      this.valueViews.push(new ValueView(event));
    }
  }

  _handleDeleteEvent(event) {
    this._lastView().close(event);
  }

  _lastView() {
    return this.valueViews[this.valueViews.length - 1]
  }
}
