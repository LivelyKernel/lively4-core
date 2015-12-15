export function handle(el) {
  var inspectTarget = el;
  var editor = document.createElement('lively-object-editor');
  editor.targetElement = inspectTarget;
  var objectEditorWindow = document.createElement('lively-window');
  $(objectEditorWindow).append(editor);

  var title = '';
  if (inspectTarget.name) {
      title = inspectTarget.name;
  } else if (inspectTarget.id) {
      title = '#'+ inspectTarget.id;
  }
  title += ' <small>' + inspectTarget.tagName.toLowerCase() + '</small>';
  objectEditorWindow.setAttribute('title', title);

  $('body').append(objectEditorWindow);
  objectEditorWindow.centerInWindow();
}
