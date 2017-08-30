/*
 * Lively 4 Text Editor
 * - based Ace editor
 * - simple load/save/navigate UI, that can be disabled to use elsewhere, e.g. container
 * - updates change indicator while when editting,loading, and saving
 */

import Morph from './Morph.js';
import moment from "src/external/moment.js";
import diff from 'src/external/diff-match-patch.js';
import preferences from 'src/client/preferences.js';
import components from "src/client/morphic/component-loader.js";

export default class Editor extends Morph {

  async initialize() {
    var container = this.get(".container");
    var editor
    if (preferences.get("UseCodeMirror")) {
      editor = document.createElement("lively-code-mirror")
    } else {
      editor = document.createElement("juicy-ace-editor")
    }
    editor.id = "editor"; // this is important to do before opening 
    await components.openIn(container, editor);
    editor.setAttribute("wrapmode", true)
    editor.setAttribute("tabsize", 2)

    // container.appendChild(editor)
    lively.html.registerButtons(this);
    var input = this.get("#filename");
    $(input).keyup(event => {
      if (event.keyCode == 13) { // ENTER
        this.onFilenameEntered(input.value);
      }
    });
    container.dispatchEvent(new Event("initialized"));   
    editor.addEventListener('change', () => {
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
  
  updateOtherEditors() {
    var url = this.getURL().toString();
    var editors = Array.from(document.querySelectorAll("lively-container::shadow lively-editor, lively-editor"));

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
    return this.get('#editor').editor;
  }
  
  getURL() {
    var filename = $(this.getSubmorph('#filename')).val();
    return new URL(filename);
  }

  getURLString() {
    return $(this.getSubmorph('#filename')).val();
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

  setText(text, preserveView) {
    this.lastText = text;
    var editor = this.currentEditor();
    var cur = this.getCursor()
    var scroll = this.getScrollInfo()
    
    if (editor) {
      if (!this.isCodeMirror()) {
          var oldRange = this.currentEditor().selection.getRange()
      }

      this.updateChangeIndicator();
      editor.setValue(text);
      if (editor.resize) editor.resize();
      this.updateAceMode();
    } else {
      // Code Mirror
      this.get('#editor').value = text
    }
    
    if (preserveView) {
    	this.setScrollInfo(scroll)
    	this.setCursor(cur)
      	if (!this.isCodeMirror()) {
    		this.currentEditor().selection.setRange(oldRange)
    	}
    }
  }

  
  
  updateAceMode() {
    var url = this.getURL();
    var editorComp = this.get("#editor");
    if (editorComp && editorComp.changeModeForFile) {
      editorComp.changeModeForFile(url.pathname);
    }
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
      // lively.notify("loaded version " + this.lastVersion);
      return response.text();
    }).then((text) => {
       this.setText(text, true); 
      },
      (err) => {
        lively.notify("Could not load file " + url +"\nMaybe next time you are more lucky?");
      });
  }

  
  saveFile() {
    var url = this.getURL();
    // console.log("save " + url + "!");
    // console.log("version " + this.latestVersion);
    var data = this.currentEditor().getValue();
    var urlString = url.toString();
    if (urlString.match(/\/$/)) {
      return fetch(urlString, {method: 'MKCOL'});
    } else {
      window.LastData = data
      
      return fetch(urlString, {
        method: 'PUT', 
        body: data,
        headers: {
          lastversion:  this.lastVersion
        }
      }).then((response) => {
        // console.log("edited file " + url + " written.");
        var newVersion = response.headers.get("fileversion");
        var conflictVersion = response.headers.get("conflictversion");
        // lively.notify("LAST: " + this.lastVersion + " NEW: " + newVersion + " CONFLICT:" + conflictVersion)
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
    this.setText(mergedText, true);
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

  withEditorObjectDo(func) {
    var editor = this.currentEditor()
    if (editor) {
    	return func(editor)
    }    
  }
  
  getScrollInfo() {
    if (!this.isCodeMirror()) return 
    return this.withEditorObjectDo(editor => editor.getScrollInfo())
  }
  
  setScrollInfo(info) {
    if (!this.isCodeMirror()) return 
    return this.withEditorObjectDo(editor => editor.scrollTo(info.left, info.top))
  }
  
  getCursor() {
    if (!this.isCodeMirror()) return 
    return this.withEditorObjectDo(editor => editor.getCursor())
  }
  
  setCursor(cur) {
    if (!cur || !this.isCodeMirror()) return 
    return this.withEditorObjectDo(editor => editor.setCursor(cur))
  }
  
  find(pattern) {
    var editor = this.get('#editor')
    if (editor) {
    	editor.find(pattern)
    }
  }
  
  isCodeMirror() {
  	return this.get("#editor").tagName == "LIVELY-CODE-MIRROR"
  }
  
  livelyMigrate(obj) {
    this.setURL(obj.getURL());
    this.loadFile();
  }
}