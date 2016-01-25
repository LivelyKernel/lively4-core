import * as componentLoader from "./component-loader.js";

export function handle(el) {
  var inspectTarget       = el;
  var editor              = componentLoader.createComponent('lively-object-editor');
  var objectEditorWindow  = document.createElement('lively-window');

  editor.targetElement    = inspectTarget;

  componentLoader.openInWindow(editor).then((objectEditorWindow) => {
    objectEditorWindow.centerInWindow();
  });
}
