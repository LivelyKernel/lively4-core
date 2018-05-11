export function loadFile(editor, version) {
  return fetch(editor.getURL(), {
    headers: {
      fileversion: version
    }
  }).then( response => {
    editor.lastVersion = response.headers.get("fileversion");
    return response.text();
  });
}

export function saveFile(editor, text) {
  const url = editor.getURL();
  return fetch(url, {
    method: 'PUT', 
    body: text,
    headers: {
      lastversion: editor.lastVersion
    }
  }).then((response) => {
    let newVersion = response.headers.get("fileversion");
    let conflictVersion = response.headers.get("conflictversion");
    if (conflictVersion) {
      return editor.solveConflic(conflictVersion);
    }
    if (newVersion) {
      editor.lastVersion = newVersion;
    }
    lively.notify("saved file", url);
    editor.lastText = text;
    editor.updateChangeIndicator();
    editor.updateOtherEditors();
  }, (err) => {
     lively.notify("Could not save file" + url +"\nMaybe next time you are more lucky?");
     throw err;
  });
}
