/*
 * Lively 4 Text Editor
 * - based Ace editor
 * - simple load/save/navigate UI, that can be disabled to use elsewhere, e.g. container
 * - updates change indicator while when editting,loading, and saving
 */

import Morph from './Morph.js';
import moment from "src/external/moment.js";
import diff from 'src/external/diff-match-patch.js'

export default class Editor extends Morph {

  initialize() {
    var container = this.get(".container");
    lively.html.registerButtons(this);
    var input = this.get("#filename");
    $(input).keyup(event => {
      if (event.keyCode == 13) { // ENTER
        this.onFilenameEntered(input.value);
      }
    });
    container.dispatchEvent(new Event("initialized"));
    
    this.currentEditor().on('change', () => {
      this.onTextChanged();
    });
  }
  
  onTextChanged() {
    this.updateChangeIndicator();
  }

  updateChangeIndicator() {
    if (!this.lastText) return;
    var newText = this.currentEditor().getValue();
    
    if (newText != this.lastText) {
      this.get("#changeIndicator").style.backgroundColor = "rgb(220,30,30)";
      this.textChanged = true;
    } else {
      this.get("#changeIndicator").style.backgroundColor = "rgb(200,200,200)";
      this.textChanged = false;
    }
  }

  onSaveButton() {
    this.saveFile();
  }
  
  onLoadButton() {
    this.loadFile();
  }
  
  onVersionsButton() {
    this.toggleVersions();
  }
  
  onLoadVersionButton() {
    this.loadFile(this.currentVersion());
  }

  onCloseVersionsButton() {
    this.get("#versionControl").style.display = "none";
  }

  currentVersion() {
    var selection = this.get("#versions").selection;
    if (selection) return selection.version;
  }
  
  onFilenameEntered() {
    this.loadFile();
  }

  getMountURL() {
    return "https://lively4/sys/fs/mount";
  }

  currentEditor() {
    return this.getSubmorph('juicy-ace-editor').editor;
  }

  getURL() {
    var filename = $(this.getSubmorph('#filename')).val();
    return new URL(filename);
  }

  setURL(urlString) {
    var url = new URL(urlString);
    this.getSubmorph("#filename").value = url.href;
  }

  setText(text) {
    this.lastText = text;
    this.updateChangeIndicator();
    this.currentEditor().setValue(text);
    this.currentEditor().resize();
    this.updateAceMode();
  }

  updateAceMode() {
    var url = this.getURL();
    var editorComp = this.getSubmorph("juicy-ace-editor");
    editorComp.changeModeForFile(url.pathname);
  }

  loadFile(version) {
    var url = this.getURL();
    console.log("load " + url);
    this.updateAceMode();

    fetch(url, {
      headers: {
        fileversion: version
      }
    }).then( response => {
      // remember the commit hash (or similar version information) if loaded resource
      this.lastVersion = response.headers.get("fileversion");
      lively.notify("loaded version " + this.lastVersion);
      return response.text();
    }).then((text) => {
        this.setText(text);
      },
      (err) => {
        lively.notify("Could not load file " + url +"\nMaybe next time you are more lucky?");
      });
  }

  saveFile() {
    lively.notify("SAVE!!!!")
    var url = this.getURL();
    console.log("save " + url + "!");
    var data = this.currentEditor().getValue();
    var urlString = url.toString();
    if (urlString.match(/\/$/)) {
      return fetch(urlString, {method: 'MKCOL'});
    } else {
      return fetch(urlString, {
        method: 'PUT', 
        body: data,
        headers: {
          lastversion:  this.lastVersion
        }
      }).then((response) => {
        console.log("edited file " + url + " written.");
        var newVersion = response.headers.get("fileversion") 
        var conflictVersion = response.headers.get("conflictversion")
        if (conflictVersion) {
          return this.solveConflic(conflictVersion)
        }
        if (newVersion) {
          lively.notify("new version " + newVersion);
          this.lastVersion = newVersion;
        }
        lively.notify("saved file", url );
        this.lastText = data;
        this.updateChangeIndicator();
      }, (err) => {
         lively.notify("Could not save file" + url +"\nMaybe next time you are more lucky?");
         throw err;
      }); // don't catch here... so we can get the error later as needed...
    }
  }

  /*
   * solveConflict
   * use three-way-merge
   */ 
  async solveConflic(otherVersion) {
    lively.notify("Solve Conflict: " + otherVersion)
    var parentText = this.lastText // 
    var myText = this.currentEditor().getValue(); // data
    // load from conflict version
    var otherText = await fetch(this.getURL(), {
        headers: {fileversion: otherVersion}
      }).then( r => r.text()); 
    
    lively.notify("OTHER", otherText)
    
    
  }

  hideToolbar() {
    this.getSubmorph("#toolbar").style.display = "none";
  }

  toggleVersions() {
    var versionControl = this.shadowRoot.querySelector("#versionControl");
    if (versionControl.style.display == "block") {
      versionControl.style.display = "none";
    } else {
      versionControl.style.display = "block";
      versionControl.querySelector("#versions").showVersions(this.getURL());
    }
  }

  livelyMigrate(obj) {
    this.setURL(obj.getURL());
    this.loadFile();
  }
}