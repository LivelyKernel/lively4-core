import * as componentLoader from "./component-loader.js";

export function handle(el) {
  var inspectTarget = el;
  var editor = componentLoader.createComponent('lively-object-editor');
  editor.targetElement = inspectTarget;

  componentLoader.openInWindow(editor).then((objectEditorWindow) => {
    var title = '';
    if (inspectTarget.name) {
        title = inspectTarget.name;
    } else if (inspectTarget.id) {
        title = '#'+ inspectTarget.id;
    }
    title += ' <small>' + inspectTarget.tagName.toLowerCase() + '</small>';
    objectEditorWindow.setAttribute('title', title);
    objectEditorWindow.centerInWindow();
  });

}
