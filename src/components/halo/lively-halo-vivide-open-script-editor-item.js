import HaloItem from 'src/components/halo/lively-halo-item.js';

export default class HaloVivideOpenScriptEditorItem extends HaloItem {
  async onClick(evt) {
    var inspectTarget = window.that;

    this.hideHalo();
    let scriptEditor = await inspectTarget.createScriptEditor();
    scriptEditor.initialFocus();
  }
  
  updateTarget(view) {
    this._view = view;
  }
}