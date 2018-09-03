import { guid } from "../utils/utils.js";

export default class CustomInstance {
  constructor(name = "", code = "") {
    this.id = guid();
    this.name = name;
    this.code = code;
  }

  serializeForWorker() {
    return Object.assign({}, this);
  }

  serializeForSave() {
    return this.serializeForWorker();
  }

  load(serialized) {
    Object.assign(this, serialized);
    return this;
  }
}
