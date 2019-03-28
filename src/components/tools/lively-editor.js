/*
 * Lively 4 Text Editor
 * - simple load/save/navigate UI, that can be disabled to use elsewhere, e.g. container
 * - updates change indicator while when editting,loading, and saving
 */

/* 
## EDITOR ... we have to many objects called "editor", because the wrap around and FACADE each other...

- (babylonian-programming-editor)
 - lively-editor
   - lively-code-mirror
     - cm CodeMirror object
 

*/
import Morph from 'src/components/widgets/lively-morph.js';
import moment from "src/external/moment.js";
import diff from 'src/external/diff-match-patch.js';
import preferences from 'src/client/preferences.js';
import components from "src/client/morphic/component-loader.js";

import {pt} from "src/client/graphics.js"

import {getObjectFor, updateEditors} from "utils";
import files from "src/client/files.js"



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
        
    
    editor.doSave = text => {
      this.saveFile(); // CTRL+S does not come through...    
    };
    
    
    this.addEventListener("drop", evt => {
      this.onDrop(evt)
    })       
    
    this.get("lively-version-control").editor = editor

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
    
    this.addEventListener("paste", evt => this.onPaste(evt))

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
    console.warn('updateEditors')
    const url = this.getURL().toString();
    updateEditors(url, [this]);
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
  
  async onFilenameEntered() {
    this.setAttribute("url", this.getURLString())
    await this.loadFile();
    this.dispatchEvent(new CustomEvent("url-changed", {detail: { url: this.getURLString() }}));
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
    var codeMirror = this.currentEditor();
    var cur = this.getCursor()
    var scroll = this.getScrollInfo()
    
    if (codeMirror) {
      if (!this.isCodeMirror()) {
          var oldRange = this.currentEditor().selection.getRange()
      }

      this.updateChangeIndicator();
      codeMirror.setValue(text);
      if (codeMirror.resize) codeMirror.resize();
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
    return text
  }
  
  updateAceMode() {
    var url = this.getURL();
    var editorComp = this.get("#editor");
    if (editorComp && editorComp.changeModeForFile) {
      editorComp.changeModeForFile(url.pathname);
    }
  }
  
  async loadFile(version) {
    var url = this.getURL();
    console.log("load " + url);
    this.updateAceMode();

    var result = await fetch(url, {
      headers: {
        fileversion: version
      }
    }).then( response => {
      // remember the commit hash (or similar version information) if loaded resource
      this.lastVersion = response.headers.get("fileversion");
      // lively.notify("loaded version " + this.lastVersion);
      return response.text();
    }).then((text) => {
       return this.setText(text, true); 
    }, (err) => {
        lively.notify("Could not load file " + url +"\nMaybe next time you are more lucky?");
        return ""
    });
    if (this.postLoadFile) {
      result = await this.postLoadFile(result) // #TODO babylonian programming requires to adapt editor behavior
    }
    return result
  }

  
  async saveFile() {
    var url = this.getURL();
    // console.log("save " + url + "!");
    // console.log("version " + this.latestVersion);
    var data = this.currentEditor().getValue();
    if (this.preSaveFile) {
      data = await this.preSaveFile(data)
    }
    
    
    var urlString = url.toString();
    if (urlString.match(/\/$/)) {
      return fetch(urlString, {method: 'MKCOL'});
    } else {
      window.LastData = data
      
      var headers = {}
      if (this.lastVersion) {
        headers.lastversion = this.lastVersion
      }
      await fetch(urlString, {
        method: 'PUT', 
        body: data,
        headers: headers
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

  showToolbar() {
    this.getSubmorph("#toolbar").style.display = "";
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
  
  
  livelyEditor() {
    return this  
  }
  
  livelyCodeMirror() {
    return this.get('#editor')
  }
  
  async awaitEditor() {
    while(!editor) {
      var editor = this.currentEditor()
      if (!editor) {
        await lively.sleep(10) // busy wait
      }
    }
    return editor
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
  
  insertDataTransfer(dataTransfer, evt, generateName) {
    // #CopyAndPaste mild code duplication with #Clipboard 
    
    var items = dataTransfer.items;
    if (items.length> 0) {
      for (var index in items) {
        var item = items[index];
        if (item.kind === 'file') {
          this.pasteFile(item, evt, generateName) 
          return true
        }
        if (item.type == 'lively/element') {
          
          item.getAsString(data => {
            var element = getObjectFor(data)
            if (element.localName == "lively-file") {
              this.pasteDataUrlAs(element.url, 
                                  this.getURLString().replace(/[^/]*$/,"") + element.name, 
                                  element.name, 
                                  evt)
            }
            // lively.showElement(element)
          })
          
          return true
        }
      }
    }
  }
  
  
  
  async pasteFile(fileItem, evt, generateName) {
    var editor = this.currentEditor()
    if (!editor) return;
    var file = fileItem.getAsFile();
    if (generateName) {
      var name = "file_" + moment(new Date()).format("YYMMDD_hhmmss")
      var selection = editor.getSelection()
      if (selection.length > 0 ) name = selection;
      var filename = name + "." + fileItem.type.replace(/.*\//,"")
      filename = await lively.prompt("paste as... ", filename)
      
    } else {
      filename = fileItem.getAsFile().name
      if (filename.match(/\.((md)|(txt))/)) return // are handle by code mirror to inline text // #Content vs #Container alt: value vs reference? #Journal
      
    }
    if (!filename) return
    
    
    var newurl = this.getURLString().replace(/[^/]*$/,"") + filename 
    
    var dataURL = await files.readBlobAsDataURL(file)  
    this.pasteDataUrlAs(dataURL, newurl, filename, evt)
  }
  
  async pasteDataUrlAs(dataURL, newurl, filename, evt) {
    
    var blob = await fetch(dataURL).then(r => r.blob())
    await files.saveFile(newurl, blob)
    
    this.withEditorObjectDo(editor => {
      var text = encodeURIComponent(filename)
      if (this.getURLString().match(/\.md/)) {
        if (files.isVideo(filename)){
          text = `<video autoplay controls><source src="${text}" type="video/mp4"></video>`
        } else if (files.isPicture(filename)){
          text = "![](" + text + ")" // #ContextSpecificBehavior ?  
        } else {
          text = `[${text.replace(/.*\//,"")}](${text})`
          
        }
      }  

      // #Hack... this is ugly... but seems the official way to do it
      if (evt) {
        var coords = editor.coordsChar({
          left:   evt.clientX + window.scrollX,
          top: evt.clientY + window.scrollY
        });
        editor.setSelection(coords)        
      }
      editor.replaceSelection(text, "around")
    })
    
    
    lively.notify("uploaded " + newurl)
    
    var navbar = lively.query(this, "lively-container-navbar")
    if (navbar) navbar.update() 
    
  }
  
  onPaste(evt) {
    if(this.insertDataTransfer(evt.clipboardData, undefined, true)) {
      evt.stopPropagation()
      evt.preventDefault();
    }
  }
  
  async onBrowse() {
    lively.openBrowser(this.getURLString())
  }
  
  async onDrop(evt) {
    
    if(this.insertDataTransfer(evt.dataTransfer, evt, false)) {
      evt.stopPropagation()
      evt.preventDefault();
    }
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