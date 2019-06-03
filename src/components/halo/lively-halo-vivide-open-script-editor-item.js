import HaloItem from 'src/components/halo/lively-halo-item.js';

export default class HaloVivideOpenScriptEditorItem extends HaloItem {
  // #TODO: drag ScriptEditor out of this halo item

  async onClick(evt) {
    var inspectTarget = window.that;

    debugger
    this.hideHalo();
    let scriptEditor = await inspectTarget.createScriptEditor();
    scriptEditor.initialFocus();
  }
  
  updateTarget(view) {
    this._view = view;
  }
}
