export function handle(el) {
  var inspectTarget       = el;
  var editor              = document.createElement('lively-object-editor');
  var objectEditorWindow  = document.createElement('lively-window');

  editor.targetElement    = inspectTarget;

  $(objectEditorWindow).append(editor);
  $('body').append(objectEditorWindow);

  objectEditorWindow.centerInWindow();
}
