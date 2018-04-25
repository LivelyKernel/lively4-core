/*
 * Lively 4 Text Editor
 * - based Ace editor
 * - simple load/save/navigate UI, that can be disabled to use elsewhere, e.g. container
 * - updates change indicator while when editting,loading, and saving
 */

import Morph from 'src/components/widgets/lively-morph.js';
import moment from "src/external/moment.js";
import diff from 'src/external/diff-match-patch.js';
import preferences from 'src/client/preferences.js';
import components from "src/client/morphic/component-loader.js";

import {pt} from "src/client/graphics.js"

export default class Editor extends Morph {

  async initialize() {
    var container = this.get(".container");
		this.versionControl = this.shadowRoot.querySelector("#versionControl");
    
    var editor = document.createElement("lively-code-mirror")
    editor.id = "editor"; // this is important to do before opening 
    await components.openIn(container, editor);
    editor.setAttribute("overscroll", "contain")
    editor.setAttribute("wrapmode", true)
    editor.setAttribute("tabsize", 2)
    
    this.get("lively-version-control").editor = editor

    // container.appendChild(editor)
    this.registerButtons();
    var input = this.get("#filename");
    
    
    input.addEventListener("keyup", event => {
      if (event.keyCode == 13) { // ENTER
        this.onFilenameEntered(input.value);
      }
    });
    var url = this.getAttribute("url") 
    if (url) {
      this.setURL(url)
    }
    
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
      ea.getURLString() == url && !ea.textChanged && ea !== this);
          
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
    this.toggleVersions()
  }

  currentVersion() {
    var selection = this.get("#versions").selection;
    if (selection) return selection.version;
  }
  
  onFilenameEntered() {
    this.setAttribute("url", this.getURLString())
    this.loadFile();
  }

  getMountURL() {
    return "https://lively4/sys/fs/mount";
  }

  currentEditor() {
    return this.get('#editor').editor;
  }
  
  getURL() {
    return new URL(this.getURLString());
  }

  getURLString() {
    return this.getSubmorph('#filename').value;
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
    text = text.replace(/\r\n/g, "\n") // code mirror changes it anyway
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
    if (this.solvingConflict) {
      lively.notify("Sovling conflict stopped, due to recursion1")
      return 
    }
    
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
    this.solvingConflict = true // here it can come to infinite recursion....
    try {
      await this.saveFile(); 
    } finally {
      this.solvingConflict = false
    }
  }

  hideToolbar() {
    this.getSubmorph("#toolbar").style.display = "none";
  }

  toggleVersions() {
    var editor = this.shadowRoot.querySelector("#editor");

    if (this.versionControl.style.display == "block") {
      this.versionControl.remove()
      this.versionControl.style.display = "none";
      if (editor.editView) {
        editor.editView(); // go back into normal editing...
      }
    } else {
      var myWindow = lively.findWindow(this)
      if (myWindow.isWindow) {
        myWindow.get(".window-content").style.overflow = "visible"
      }
      myWindow.appendChild(this.versionControl)
      lively.showElement(this.versionControl)

      this.versionControl.style.display = "block";
      this.versionControl.style.backgroundColor = "gray";
            
      this.versionControl.querySelector("#versions").showVersions(this.getURL());
      lively.setGlobalPosition(this.versionControl, 
      	lively.getGlobalPosition(this).addPt(pt(lively.getExtent(this.parentElement).x,0)));
      // we use "parentElement" because the extent of lively-editor is broken #TODO
      lively.setExtent(this.versionControl, pt(400, 500))
      this.versionControl.style.zIndex = 10000;

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
  
  livelyExample() {
  	this.setURL(lively4url + "/README.md");
    this.loadFile()
  }
  
  livelyMigrate(obj) {
		if (obj.versionControl) obj.versionControl.remove();
    this.setURL(obj.getURL());
    this.loadFile();
  }
}