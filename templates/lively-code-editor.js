/*
 * Lively 4 Text Editor
 * - simple load/save/navigate UI, that can be disabled to use elsewhere, e.g. container
 * - updates change indicator while when editting,loading, and saving
 */
 
import Morph from './Morph.js';
import moment from "src/external/moment.js";
import diff from 'src/external/diff-match-patch.js';

export default class CodeEditor extends Morph {

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
    
    var editor = this.currentEditor();
    // check if we are not fully initialized
    if (editor) editor.on('change', () => {
      this.onTextChanged();
    });
  }
  
  onTextChanged() {
    this.updateChangeIndicator();
  }

  updateChangeIndicator() {
    var editor = this.currentEditor();
    if(!editor) return;
    
    if (!this.lastText) return;
    var newText = editor.getValue();
    if (newText != this.lastText) {
      this.get("#changeIndicator").style.backgroundColor = "rgb(220,30,30)";
      this.textChanged = true;
    } else {
      this.get("#changeIndicator").style.backgroundColor = "rgb(200,200,200)";
      this.textChanged = false;
    }
  }
  
  updateOtherEditors() {
    var url = this.getURL().toString();
    var editors = lively.array(document.querySelectorAll("lively-container::shadow lively-editor, lively-editor"));

    var editorsToUpdate = editors.filter( ea => 
      ea.getURL().toString() == url && !ea.textChanged && ea !== this);
          
    editorsToUpdate.forEach( ea => {
      // lively.showElement(ea);
      ea.loadFile()
    });
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
    return this.getSubmorph('lively-code-mirror').editor;
  }

  getURL() {
    var filename = $(this.getSubmorph('#filename')).val();
    return new URL(filename);
  }

  setURL(urlString) {
    if (!urlString) {
      this.getSubmorph("#filename").value = "";
    } else {
      var url = new URL(urlString);
      this.getSubmorph("#filename").value = url.href;
    }
    
    this.dispatchEvent(new CustomEvent("url-changed", {detail: {url: urlString}}))
  }

  setText(text) {
    this.lastText = text;
    this.updateChangeIndicator();
    this.currentEditor().setValue(text);
  }


  loadFile(version) {
    var url = this.getURL();
    console.log("load " + url);

    fetch(url, {
      headers: {
        fileversion: version
      }
    }).then( response => {
      // remember the commit hash (or similar version information) if loaded resource
      this.lastVersion = response.headers.get("fileversion");
      // lively.notify("loaded version " + this.lastVersion);
      return response.text();
    }).then((text) => {
        // var oldRange = this.currentEditor().selection.getRange()
        this.setText(text);
        // this.currentEditor().selection.setRange(oldRange)
        
        
      },
      (err) => {
        lively.notify("Could not load file " + url +"\nMaybe next time you are more lucky?");
      });
  }

  saveFile() {
    var url = this.getURL();
    console.log("save " + url + "!");
    console.log("version " + this.latestVersion);
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
        var newVersion = response.headers.get("fileversion");
        var conflictVersion = response.headers.get("conflictversion");
        if (conflictVersion) {
          return this.solveConflic(conflictVersion);
        }
        if (newVersion) {
          // lively.notify("new version " + newVersion);
          this.lastVersion = newVersion;
        }
        lively.notify("saved file", url );
        this.lastText = data;
        this.updateChangeIndicator();
        this.updateOtherEditors();
      }, (err) => {
         lively.notify("Could not save file" + url +"\nMaybe next time you are more lucky?");
         throw err;
      }); // don't catch here... so we can get the error later as needed...
    }
  }
  
  threeWayMerge(a,b,c) {
    var dmp = new diff.diff_match_patch();
    var diff1 = dmp.diff_main(a, b);
    var diff2 = dmp.diff_main(a, c);
    
    var patch1 = dmp.patch_make(diff1);
    var patch2 = dmp.patch_make(diff2);
    var merge = dmp.patch_apply(patch1.concat(patch2), a);
    // #TODO handle conflicts detected in merge
    return merge[0];
  }

  /*
   * solveConflict
   * use three-way-merge
   */ 
  async solveConflic(otherVersion) {
    lively.notify("Solve Conflict: " + otherVersion);
    var parentText = this.lastText; // 
    var myText = this.currentEditor().getValue(); // data
    // load from conflict version
    var otherText = await fetch(this.getURL(), {
        headers: {fileversion: otherVersion}
      }).then( r => r.text()); 

    // #TODO do something when actual conflicts occure?
    var mergedText = this.threeWayMerge(parentText, myText, otherText);
    this.setText(mergedText);
    this.lastVersion = otherVersion;
    this.saveFile();
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