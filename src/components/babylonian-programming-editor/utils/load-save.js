import LocationConverter from "./location-converter.js";

/**
 * Patches the load and save functionality of the editor to append and load examples
 */
export const patchEditor = (editor, getMarkers, setMarkers) => {
  const originalLoad = editor.loadFile;
  const originalSave = editor.saveFile;
  
  editor.loadFile = (version) => {
    loadFile(editor, setMarkers, version);
  };
  
  editor.saveFile = () => {
    saveFile(editor, getMarkers);
  };
}

const serializeMarkers = (markers) => ({
  probe: Array.from(markers.probe.entries())
              .map(serializeMarker)
              .sort(compareMarkers),
  replacement: Array.from(markers.replacement.entries())
                    .map(serializeMarker)
                    .sort(compareMarkers),
  example: Array.from(markers.example.entries())
                .map(serializeMarker)
                .sort(compareMarkers),
})

const serializeMarker = (marker) => {
  const [textMarker, widget] = marker;
  const result = {
    loc: LocationConverter.markerToKey(textMarker.find())
  };
  if(widget.getSerializableValue) {
    result.value = widget.getSerializableValue();
  }
  return result;
}

const compareMarkers = (a, b) => {
  for(let i = 0; i < 4; i++) {
    if(a.loc[i] !== b.loc[i]) {
      return a.loc[i] - b.loc[i];
    }
  }
  return 0;
}

const saveFile = (editor, getMarkers) => {
  var url = editor.getURL();
  console.log("save " + url + "!");
  console.log("version " + editor.latestVersion);
  
  // Get normal content
  var data = editor.currentEditor().getValue();
  
  // Get and append examples
  const serializedMarkers = serializeMarkers(getMarkers());
  const stringMarkers = JSON.stringify(serializedMarkers);
  data = `${data}/* Examples: ${stringMarkers} */`;
  
  var urlString = url.toString();
  if (urlString.match(/\/$/)) {
    return fetch(urlString, {method: 'MKCOL'});
  } else {
    return fetch(urlString, {
      method: 'PUT', 
      body: data,
      headers: {
        lastversion:  editor.lastVersion
      }
    }).then((response) => {
      console.log("edited file " + url + " written.");
      var newVersion = response.headers.get("fileversion");
      var conflictVersion = response.headers.get("conflictversion");
      if (conflictVersion) {
        return editor.solveConflic(conflictVersion);
      }
      if (newVersion) {
        // lively.notify("new version " + newVersion);
        editor.lastVersion = newVersion;
      }
      lively.notify("saved file", url );
      editor.lastText = data;
      editor.updateChangeIndicator();
      editor.updateOtherEditors();
    }, (err) => {
       lively.notify("Could not save file" + url +"\nMaybe next time you are more lucky?");
       throw err;
    });
  }
}

const loadFile = (editor, setMarkers, version) => {
  var url = editor.getURL();
  console.log("load " + url);

  fetch(url, {
    headers: {
      fileversion: version
    }
  }).then( response => {
    editor.lastVersion = response.headers.get("fileversion");
    return response.text();
  }).then(
    (text) => {
      const [newText, markers] = findMarkers(text);
      editor.setText(newText);
      setMarkers(markers);
    },
    (err) => {
      lively.notify("Could not load file " + url +"\nMaybe next time you are more lucky?");
    }
  );
}

const findMarkers = (text) => {
  let markers = null;
  const matches = text.match(/\/\* Examples: (.*) \*\//);
  if(matches) {
    markers = JSON.parse(matches[matches.length-1]);
    text = text.replace(matches[matches.length-2], "");
  }
  return [text, markers];
}