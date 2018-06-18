import Morph from 'src/components/widgets/lively-morph.js';
import { debounce } from "utils";

const HEADER_TEMPLATE = (order, type, keys) => `${order} ${type.toLowerCase()}${keys.length ? " ("+keys.join(", ")+")" : ""}:`;
const PRE_HEADER_TEMPLATE = (type, keys) => HEADER_TEMPLATE("Before", type, keys);
const POST_HEADER_TEMPLATE = (type, keys) => HEADER_TEMPLATE("After", type, keys);

export default class PrePostScriptEditor extends Morph {
  
  initialize() {
    this.windowTitle = "Edit Pre/Postscript";
    
    this._preEditor = this.get("#prescript");
    this._postEditor = this.get("#postscript");
    
    this._preEditor.addEventListener("editor-loaded", (e) => this._addEditorListeners(e.target));
    this._postEditor.addEventListener("editor-loaded", (e) => this._addEditorListeners(e.target));
    
    this._preHeader = this.get("#prescript-header");
    this._postHeader = this.get("#postscript-header");
    
    this._type = "Example";
    this.keys = [];
    this.name = null;
    this.callback = null;
  }
  
  _addEditorListeners(editor) {
    editor.editor.setOption("lint", false);
    editor.editor.on("change", ((value) => {
      if(this._callback) {
        this._callback({
          prescript: this._preEditor.value,
          postscript: this._postEditor.value,
        });
      }
    })::debounce(1000));
  }
  
  setup(name, keys, prescript, postscript, callback, type = "Example") {
    this._type = type;
    this.name = name;
    this.keys = keys;
    this.callback = callback;
    this._preEditor.value = prescript;
    this._postEditor.value = postscript;
  }
  
  set callback(callback) {
    this._callback = callback;
  }
  
  set keys(keys) {
    this._keys = keys;
    this._preHeader.textContent = PRE_HEADER_TEMPLATE(this._type, this._keys);
    this._postHeader.textContent = POST_HEADER_TEMPLATE(this._type, this._keys);
  }
  
  set name(name) {
    if(name) {
      if(name.value) {
        name = name.value;
      }
      this._name = name;
      this.windowTitle = `Edit Pre/Postscript for "${this._name}"`;
    } else {
      this._name = null;
      this.windowTitle = "Edit Pre/Postscript";
    }
  }
}