import Annotation from "./annotation.js";
import ProbeWidget from "../ui/probe-widget.js";


export default class Probe extends Annotation {
  constructor(editor, location, deleteCallback, babylonianEditor) {
    super(editor, location, deleteCallback);
    this._widget = new ProbeWidget(editor, location, this.kind, this._deleteCallback, this);
    this.babylonianEditor = babylonianEditor // #TODO figure out how the dependencies should flow...
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
  
  set iterationParentId(parentId) {
    this._widget.iterationParentId = parentId;
  }
  
  empty() {
    this._widget.values = new Map();
  }
}