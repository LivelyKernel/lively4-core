import ReplacementWidget from "./replacement-widget.js";


export default class InstanceWidget extends ReplacementWidget {
  constructor(editor, location, kind, changeCallback, deleteCallback) {
    super(editor, location, kind, changeCallback, deleteCallback);
  }
}
