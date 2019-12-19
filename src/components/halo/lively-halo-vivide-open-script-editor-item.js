import HaloItem from 'src/components/halo/lively-halo-item.js';

export default class HaloVivideOpenScriptEditorItem extends HaloItem {
  // #TODO: drag ScriptEditor out of this halo item

  async onClick(evt) {
    const inspectTarget = window.that;
    this.hideHalo();
    const scriptEditor = await inspectTarget.createScriptEditor();
    scriptEditor.initialFocus();
    console.log(inspectTarget.getAttribute('vivide-script'));
  }
  
  updateTarget(view) {
    this._view = view;
  }
}
