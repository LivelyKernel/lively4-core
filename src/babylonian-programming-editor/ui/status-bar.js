const VALID_STATUSES = ["ready", "parsing", "evaluating", "error", "warning"];

export default class StatusBar {
  constructor(element) {
    this._element = element;
    this._status = null;
    this._className = null
    this.setStatus("ready");
  }
  
  setStatus(status, message) {
    if(VALID_STATUSES.includes(status)) {
      this._status = status;
      this._update(message);
    } else {
      this.setStatus("ready");
    }
  }
  
  _update(message) {
    this._element.className = this._status;
    switch(this._status) {
      case "ready":
        this._element.textContent = "Ready";
        break;
      case "parsing":
        this._element.textContent = "Parsing code...";
        break;
      case "evaluating":
        this._element.textContent = "Evaluating examples...";
        break;
      case "warning":
        this._element.textContent = `Warning: ${message}`;
        break;
      case "error":
        this._element.textContent = `Error: ${message}`;
        break;
    }
  }
}

