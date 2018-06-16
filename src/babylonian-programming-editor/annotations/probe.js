import Annotation from "./annotation.js";
import ProbeWidget from "../ui/probe-widget.js";


export default class Probe extends Annotation {
  constructor(editor, location, examples, deleteCallback) {
    super(editor, location, deleteCallback);
    this._widget = new ProbeWidget(editor, location, this.kind, examples, this._deleteCallback);
  }
  
  setActiveRunForExampleId(exampleId, activeRun) {
    this._widget.setActiveRunForExampleId(exampleId, activeRun);
  }

  unsetActiveRunForExample(exampleId) {
    this._widget.unsetActiveRunForExample(exampleId);
  }
  
  set values(values) {
    this._widget.values = values;
  }
  
  empty() {
    this._widget.values = new Map();
  }
}