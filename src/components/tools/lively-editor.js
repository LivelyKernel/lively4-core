/*MD
# Lively 4 Text Editor

[doc](browse://doc/tools/editor.md)

 - simple load/save/navigate UI, that can be disabled to use elsewhere, e.g. container
 - updates change indicator while when editting,loading, and saving
 
![](lively-editor.png){height=200} 
 
 
We have to many objects called "editor", because they wrap around and FACADE each other.

- (babylonian-programming-editor)
 - lively-editor
   - lively-code-mirror
     - cm CodeMirror object
 
![](../../../doc/figures/editors.drawio)

MD*/
import Strings from "src/client/strings.js"
import Morph from 'src/components/widgets/lively-morph.js'
import moment from "src/external/moment.js"
import diff from 'src/external/diff-match-patch.js'
import components from "src/client/morphic/component-loader.js"
import {pt} from "src/client/graphics.js"
import {getObjectFor, updateEditors} from "utils";
import files from "src/client/files.js"

import {AnnotatedText, Annotation, default as AnnotationSet} from "src/client/annotations.js"
import ContextMenu from 'src/client/contextmenu.js'

import { DebuggingCache } from 'src/client/reactive/active-expression/ae-debugging-cache.js';

import Clipboard from 'src/client/clipboard.js'


export default class Editor extends Morph {
  /*MD ## Setup MD*/
  
  async initialize() {
    var container = this.get(".container");
		this.versionControl = this.shadowRoot.querySelector("#versionControl");
    
    var editor = document.createElement("lively-code-mirror")
    editor.id = "editor"; // this is important to do before opening 
    await components.openIn(container, editor);
    editor.setAttribute("overscroll", "contain")
    editor.setAttribute("wrapmode", true)
    editor.setAttribute("tabsize", 2)

    editor.doSave = async (text) => {
      await this.saveFile(); // CTRL+S does not come through...    
    };

    editor.getDoitContext = () => {
      return that
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
    this.addEventListener('contextmenu', evt => this.onContextMenu(evt), false);  
    
    // wait for CodeMirror for adding custom keys
    await  editor.editorLoaded()
    editor.registerExtraKeys({
      "Alt-P": cm => {
        // lively.notify("toggle widgets")
        editor.ensureTextContent()
        this.toggleWidgets();
      },
      
      "Ctrl-Alt-P": cm => {
        // #TODO how can we have custom snippets?
        this.currentEditor().replaceSelection("/" + "*MD MD*" +"/")
        this.currentEditor().execCommand(`goWordLeft`)
      },
      
      "Ctrl-Alt-L": cm => {
        this.currentEditor().replaceSelection("/" + "*PW PW*" +"/")
        
        this.showEmbeddedWidgets()
        this.currentEditor().execCommand(`goWordLeft`)
      }

    })
  }
  
  updateChangeIndicator() {
    if (!this.lastText) return;
    var newText = this.currentEditor().getValue();
    if (newText != this.lastText) {
      this.get("#changeIndicator").style.backgroundColor = "rgb(220,30,30)";
      this.textChanged = true;
    } else {
      if (this.annotatedText && !this.annotatedText.equals(this.lastAnnotatedText)) {
        this.get("#changeIndicator").style.backgroundColor = "rgb(20,20,220)";  
        this.textChanged = false;
      } else {
        this.get("#changeIndicator").style.backgroundColor = "rgb(200,200,200)";
        this.textChanged = false;
      }
    }
  }
  
  updateOtherEditors() {
    console.warn('updateEditors')
    const url = this.getURL().toString();
    updateEditors(url, [this]);
  }
  
  updateEditorMode() {
    var url = this.getURL();
    if (!url) return;
    var editorComp = this.get("#editor");
    if (editorComp && editorComp.changeModeForFile) {
      editorComp.changeModeForFile(url.pathname);
    }
  }
  /*MD ## Event Handlers MD*/
  
  onTextChanged() {
    this.updateChangeIndicator();
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
  
  
  onPaste(evt) {
    if(this.insertDataTransfer(evt.clipboardData, undefined, true)) {
      evt.stopPropagation()
      evt.preventDefault();
    }
    
    if (this.isShowingWidgets()) {
      this.showEmbeddedWidgets()
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
  
  onContextMenu(evt) {
    if (!evt.shiftKey) {
      // #Hack #Workaround weired browser scrolling behavior
      if (lively.lastScrollLeft || lively.lastScrollTop) {
        document.scrollingElement.scrollTop = lively.lastScrollTop;
        document.scrollingElement.scrollLeft = lively.lastScrollLeft;
      }
      var items = []
      
      var source = this.getText()
      if (lively.files.hasGitMergeConflict(source)) {
        // there is as git merge conflict here we have to deal with
        items.push(...[
            ["(Auto) Resolve Merge Conglicts", () => this.autoResolveMergeConflicts()],
          ])
      } else if (this.annotatedText) {
        items.push(...[
            ["<b>Annotations</b>"],
            ["mark <span style='background-color: yellow'>yellow</span>", () => this.onAnnotationsMarkColor("yellow")],
            ["mark <span style='background-color: blue'>blue</span>", () => this.onAnnotationsMarkColor("blue")],
            ["mark <span style='background-color: red'>red</span>", () => this.onAnnotationsMarkColor("red")],
            ["clear", () => this.onAnnotationsClear()],
            ["delete all anntations", () => this.onDeleteAllAnnotations()],
          ])
      } else {
        return 
        // Disable enabling #Annotations for now  
        // items.push(...[
        //     ["<b>Enable Annotations</b>", () => this.enableAnnotations()],
        //   ])
      }      
      if (items.length > 0) {
        evt.stopPropagation();
        evt.preventDefault();

        var menu = new ContextMenu(this, items);
        menu.openIn(document.body, evt, this);
        return         
      }
    }
  }
  
  /*MD ## Getters/Setters MD*/
  
  getVersionWidget() {
    var myWindow = lively.findWindow(this)
    if (myWindow) {
      var versionControl = myWindow.querySelector("#versionControl")
    }
    return versionControl.get("#versions")  
  }
  
  currentVersion() {
    var selection = this.getVersionWidget().selection;
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

  editorComp() {
    return this.get("#editor")
  }
  
  currentEditor() {
    return this.get('#editor').editor;
  }
  
  getURL() {
    try {
      return new URL(this.getURLString());
    } catch(e) {
      return undefined
    }
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
      this.updateEditorMode();
      
      this.showEmbeddedWidgets()
      
    } else {
      // Code Mirror
      this.get('#editor').value = text
    }
    
    // To solve "empty editor after Ctrl+Z" bug clear undo history of Codemirror after initial file loading 
    this.clearHistory()
    
    if (preserveView) {
      this.setScrollInfo(scroll)
      this.setCursor(cur)
      if (!this.isCodeMirror()) {
        this.currentEditor().selection.setRange(oldRange)
      }
    }
    return text
  }
  
  getText() {
    return this.get('#editor').value 
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
  
  isCodeMirror() {
    return this.get("#editor").tagName == "LIVELY-CODE-MIRROR"
  }
  
  /*MD ## Get UI Elements MD*/
  
  livelyEditor() {
    return this  
  }
  
  livelyCodeMirror() {
    return this.get('#editor')
  }
  
  // #deprecated
  withEditorObjectDo(func) {
    var editor = this.currentEditor()
    if (editor) {
      return func(editor)
    }    
  }

  // #refactor #generalize?
  async awaitEditor() {
    while(!editor) {
      var editor = this.currentEditor()
      if (!editor) {
        await lively.sleep(10) // busy wait
      }
    }
    return editor
  }

  /*MD ## Files MD*/
  
  async loadFile(version) {
    var url = this.getURL();
    
    // console.log("load " + url);
    this.updateEditorMode();

    try {
      var response = await fetch(url, {
        headers: {
          fileversion: version
        }
      })
      // remember the commit hash (or similar version information) if loaded resource
      this.lastVersion = response.headers.get("fileversion");
        // lively.notify("loaded version " + this.lastVersion);
      var text = await response.text();
      var result =  this.setText(text, true); 
    } catch(e) {
        lively.notify("Could not load file " + url +"\nMaybe next time you are more lucky?");
        return ""
    }
    this.dispatchEvent(new CustomEvent("loaded-file", {detail: {
          "url": url,
          "text": result,
          "version": this.lastVersion}})); 
    

    await this.checkAndLoadAnnotations()
    
    if (this.postLoadFile) {
      result = await this.postLoadFile(result) // #TODO babylonian programming requires to adapt editor behavior
    }
    
    return result
  }
  
  clearHistory() {
    this.livelyCodeMirror().clearHistory()
  }

  async checkAndLoadAnnotations() {
    if(await lively.files.exists(this.getAnnotationsURL())) {
      this.enableAnnotations()   
    } else {
      this.disableAnnotations()   
    }
  }
  
  // #important
  async saveFile() {
    var url = this.getURL();
    // console.log("save " + url + "!");
    // console.log("version " + this.latestVersion);
    
    
    var data = this.livelyCodeMirror().value
    
    // hook, e.g. for babylonian programming editor 
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
      if (urlString.match(/\.svg$/)) {
        headers['Content-Type'] = 'image/svg+xml'
      }
      
      
        /*MD ### Example 
```javascript
  fetch("https://lively-kernel.org/lively4/lively4-dummy/foo/hello2.txt", {
  method: "PUT",
  body: "hello world"
}).then(r => r.text())
```
  ```
 {
  "type": "file",
  "name": "foo/hello2.txt",
  "size": 11,
  "version": "716c0289ecba04604307d33734285314ab783235",
  "modified": "2020-02-19 14:21:03"
}
  ```
  MD*/
      try {
        const prev = await urlString.fetchText();
        DebuggingCache.updateFile(urlString, prev, data);
        var response = await fetch(urlString, {
          method: 'PUT', 
          body: data,
          headers: headers
        })
        // console.log("edited file " + url + " written.");
        var newVersion = response.headers.get("fileversion");
        var conflictVersion = response.headers.get("conflictversion");
        // lively.notify("LAST: " + this.lastVersion + " NEW: " + newVersion + " CONFLICT:" + conflictVersion)
        if (conflictVersion) {
          return this.solveConflict(conflictVersion, newVersion);
        }
        if (newVersion) {
          // lively.notify("new version " + newVersion);
          this.lastVersion = newVersion;
        }
        lively.notify("saved file", url );
        this.lastText = data;
        this.lastAnnotatedText = this.annotatedText
        this.updateChangeIndicator();
        this.updateOtherEditors();

        var stats = {version: newVersion}

        this.dispatchEvent(new CustomEvent("saved-file", {detail: {
          "url": urlString,
          "text": data,
          "version": this.lastVersion}})); 
        
        return stats

      } catch(e) {
         lively.notify("Could not save file" + url +"\nMaybe next time you are more lucky?:", response);
         throw new Error("LivelyEditor save failed:" + e);
        // don't catch here... so we can get the error later as needed...
      }
    }
  }
  
  /*MD ## Merging MD*/
  
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

  highlightChanges(otherText) {
    var editor = this.currentEditor();
    var myText = editor.getValue(); // data
    var dmp = new diff.diff_match_patch();
    var d = dmp.diff_main(otherText, myText);
    var index = 0;
    for (var ea of d) {
      var change = ea[0];
      var text = ea[1];
      index = this.highlightChange(change, editor, text, index);
    }
  }  

  highlightChange(change, editor, text, index) {
    if (change != 0) {
      var cm = editor;
      var toPos;
      var backgroundColor;
      let marker;
      let widget = <span>{text}</span>;
      let targetColor = "black";
      if (change == 1) {
        // Added 
        toPos = cm.posFromIndex(index + text.length);
        backgroundColor = "green";
        try {
          marker = cm.markText(cm.posFromIndex(index), toPos, { replacedWith: widget });
        } catch(e) {
          console.warn("[lively-editor] Could not mark change");
        }
      } else {
        backgroundColor = "red";
        targetColor = "transparent";
        try {
          marker = cm.setBookmark(cm.posFromIndex(index), { widget: widget });
        } catch(e) {
          console.warn("[lively-editor] Could not set bookmark");
        }
      }
      var animation = widget.animate([{ background: backgroundColor, color: "black" }, { background: "transparent", color: targetColor }], {
        duration: 3000
      });
      animation.onfinish = () => marker && marker.clear();
    } else {

      index += text.length;
    }

    return index;
  }

  
  /*
   * solveConflict
   * use three-way-merge
   */
  async solveConflict(otherVersion, newVersion) {
    var conflictId = `conflic-${otherVersion}-${newVersion}`;
    if (this.solvingConflict == conflictId) {
      lively.error("Sovling conflict stopped", "due to recursion: " + this.solvingConflict);
      return;
    }
    if (this.solvingConflict) {
      lively.warn("Recursive Solving Conflict", "" + this.solvingConflict + " and now: " + conflictId);
      return;
    }

    lively.notify("Solve Conflict between: " + otherVersion + `and ` + newVersion);
    var parentText = this.lastText; // 
    // load from conflict version
    let url = this.getURL();
    var otherText = await fetch(url, {
      headers: { fileversion: otherVersion }
    }).then(r => r.text());
    var myText = this.currentEditor().getValue(); // data

    // #TODO do something when actual conflicts occure?
    var mergedText = this.threeWayMerge(parentText, myText, otherText);
    this.setText(mergedText, true);
    this.highlightChanges(myText);
    this.lastVersion = otherVersion;
    this.solvingConflict = conflictId;
    let stats = {}
    try {
      // here it can come to infinite recursion....
      stats = await this.saveFile();
    } finally {
      this.solvingConflict = false;
    }
    if (stats) {
      var mergedVersion = stats.version
      this.dispatchEvent(new CustomEvent("solved-conflict", {detail: {
        "url": url,
        "other-version": otherVersion,
        "other-text": otherText,
        "my-version": newVersion,
        "my-text": myText,
        "text": mergedText,
        "version": mergedVersion}}));      
    } else {
      // could not save file... :-(
    }
    
  }
  
  /*MD ## Editor MD*/

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

      this.versionControl.style.display = "block";
      this.versionControl.style.backgroundColor = "gray";
            
      this.versionControl.querySelector("#versions").showVersions(this.getURL());
      lively.setClientPosition(this.versionControl, 
        lively.getClientPosition(this).addPt(pt(lively.getExtent(this.parentElement).x,0)));
      // we use "parentElement" because the extent of lively-editor is broken #TODO
      lively.setExtent(this.versionControl, pt(400, 500))
      this.versionControl.style.zIndex = 10000;

    }
  }
  
  find(pattern) {
    var editor = this.get('#editor')
    if (editor) {
      editor.find(pattern)
    }
  }
  /*MD ## Copy and Paste MD*/
  
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
      var text = encodeURIComponent(filename).replace(/%2F/g,"/")
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
  
  /*MD ## Widgets MD*/

  
  
  // #important
  async showEmbeddedWidgets(regionStart, regionEnd) {
    var url = this.getURL()
    if (!url) return
    var type = files.getEnding(url)
    var codeMirrorComponent = this.get("lively-code-mirror")
    if (!codeMirrorComponent) return

    
    regionStart = regionStart || 0
    regionEnd = regionEnd || codeMirrorComponent.value.length
    
    
    
    
    if (type == "js") {
      for(let m of Strings.matchAll(/\/\*((?:HTML)|(?:MD)|(?:PW))(.*?)\1\*\//, codeMirrorComponent.value)) {
          var widgetName = "div"
          var mode = m[1]
          var source = m[2]
          if (mode == "MD") {
            widgetName = "lively-markdown"
          }
           if (mode == "PW") {
            widgetName = "persistent-code-widget"
          }
          let cm = codeMirrorComponent.editor,
            // cursorIndex = cm.doc.indexFromPos(cm.getCursor()),
            fromIndex = m.index,
            toIndex = m.index + m[0].length

          if (fromIndex < regionStart || toIndex >  regionEnd) continue
          
          // if (cursorIndex > fromIndex && cursorIndex < toIndex) continue;
          var from = cm.posFromIndex(fromIndex)
          var to = cm.posFromIndex(toIndex)
          let widget = await codeMirrorComponent.wrapWidget(widgetName, from, to)
          // widget.style.border = "2px dashed orange "
          widget.classList.add('inline-embedded-widget');
          lively.removeEventListener('widget', widget)
          // widget.style.padding = "5px"
//           lively.addEventListener("context", widget, "contextmenu", evt => {
//             if (!evt.shiftKey) {
//                const menuElements = [
//                 ["edit source", () =>  widget.marker.clear()],
//               ];
//               const menu = new lively.contextmenu(this, menuElements)
//               menu.openIn(document.body, evt, this)
              
//               evt.stopPropagation();
//               evt.preventDefault();
//               return true;
//             }
//           })
        
          if (mode == "MD") {
            await widget.setContent(source)
            widget.classList.add("sketchy") // experiment
            let container = lively.query(this, "lively-container")
            if (container) {
              lively.html.fixLinks(widget.shadowRoot.querySelectorAll("[href],[src]"), 
                                    this.getURLString().replace(/[^/]*$/,""),
                                    url => container.followPath(url))
            }
          } else  if (mode == "PW") {
            widget.source = source
          } else {
            widget.innerHTML = source
            let container = lively.query(this, "lively-container")
            if (container) {
              lively.html.fixLinks(widget.querySelectorAll("[href],[src]"), 
                                    this.getURL().toString().replace(/[^/]*$/,""),
                                    url => container.followPath(url))
            }
          }
          var allElements = lively.allElements(true, widget)
          Clipboard.initializeElements(allElements, false)
      }
     
    }
  }
  
  async hideEmbeddedWidgets() {
    var codeMirrorComponent = this.get("lively-code-mirror")
    if (!codeMirrorComponent) return
    codeMirrorComponent.editor.doc.getAllMarks()
      .filter(ea => ea.widgetNode && ea.widgetNode.querySelector(".lively-widget")).forEach(ea => ea.clear())
  }
  
  isShowingWidgets() {
    var codeMirrorComponent = this.get("lively-code-mirror")
    if (!codeMirrorComponent) return false
    
    // var cm = codeMirrorComponent.editor
    // var cursorPos = cm.getCursor()
    
    var allWidgets = codeMirrorComponent.editor.doc.getAllMarks()
      .filter(ea => ea.widgetNode && ea.widgetNode.querySelector(".lively-widget"))
  
    return allWidgets.length > 0
  }
  
  async toggleWidgets() {
    if (this.isShowingWidgets()) {
      await this.hideEmbeddedWidgets()
    } else {
      await this.showEmbeddedWidgets()
    }
    
    // scroll back into view...
    // #TODO make it stable...
    // await lively.sleep(1000)
    // cm.setCursor(cursorPos)
    // cm.scrollTo(null, cm.charCoords(cursorPos).top)
  }
  
  async solveAnnotationConflict(newAnnotationsVersion, conflictingAnnotationsVersion) {
    
    var cm = await this.awaitEditor()
    // solveConflict
    var lastText = this.lastAnnotatedText
    var text = this.annotatedText
    
    if (this.solvingAnnotationConflict) {
      lively.warn("prevent endless recursion in solving conflict?")
      return
    }
    lively.notify("Conflicting Annotations: " + conflictingAnnotationsVersion)
    
    var parentAnnotations = lastText.annotations
    var otherAnnotationsSource = await fetch(this.getAnnotationsURL(), {
      headers: { fileversion: conflictingAnnotationsVersion }
    }).then(r => r.text());
    var otherAnnotations = AnnotationSet.fromJSONL(otherAnnotationsSource)
  
    var myAnnotations = text.annotations
    
    debugger
    // only when no text diff.....
    var mergedAnnotations =   myAnnotations.merge(otherAnnotations, parentAnnotations)
      
    text.annotations = mergedAnnotations
    text.annotations.renderCodeMirrorMarks(cm)
    text.annotations.lastVersion = conflictingAnnotationsVersion  // is not textVersion
    
    this.solvingAnnotationConflict = true;
    try {
      await this.saveAnnotations()
    } finally {
      this.solvingAnnotationConflict = false;
    }
  }
  
  /*MD ## Annotations MD*/
  
  getAnnotationsURL() {
    return this.getURLString().replace(/[#?].*$/,"")+ ".l4a"
  } 
  
  async saveAnnotations(textVersion=this.lastVersion) {
    var cm = await this.awaitEditor()
    var text = this.annotatedText
    text.setText(this.getText(), textVersion)
    
    var headers  = {}
    if (this.annotatedText.annotations.lastVersion) {
      headers.lastversion = this.annotatedText.annotations.lastVersion
    }
  
    var response = await fetch(this.getAnnotationsURL(), {
      method: 'PUT', 
      body: text.annotations.toJSONL(),
      headers: headers
    })
    
    var writeResult = await response.text()
    lively.notify("save annotations: " + writeResult)
    
    var newAnnotationsVersion = response.headers.get("fileversion");
    var conflictAnnotationsVersion = response.headers.get("conflictversion");  
    if (conflictAnnotationsVersion) {
        await this.solveAnnotationConflict(newAnnotationsVersion, conflictAnnotationsVersion)
    } else {
      this.annotatedText.annotations.lastVersion = newAnnotationsVersion 
    } 
    
    this.annotatedText.annotations.renderCodeMirrorMarks(cm)
  }
  
  async onAnnotationsMarkColor(color="yellow") {
    if (!this.annotatedText) {
      await this.enableAnnotations()
    }
    
    var cm = await this.awaitEditor()
    var from  = cm.indexFromPos(cm.getCursor("from"))
    var to  = cm.indexFromPos(cm.getCursor("to"))  
    var annotation = new Annotation({from: from, to: to, name: "color", color: color})
    this.annotatedText.setText(this.getText())
    this.annotatedText.annotations.add(annotation)
    annotation.codeMirrorMark(cm)
    this.updateChangeIndicator()
  }
  
  async onAnnotationsClear() {
    var cm = await this.awaitEditor()
    var from  = cm.indexFromPos(cm.getCursor("from"))
    var to  = cm.indexFromPos(cm.getCursor("to"))
    this.annotatedText.annotations.removeFromTo(from, to)
    this.annotatedText.annotations.renderCodeMirrorMarks(cm) 
    this.updateChangeIndicator()
  }  

  async onDeleteAllAnnotations() {
    var cm = await this.awaitEditor()
    this.annotatedText.annotations.removeFromTo(0, this.getText().length)
    this.annotatedText.annotations.renderCodeMirrorMarks(cm) 
    this.updateChangeIndicator()
    
    // an now delete file...
    var file = this.annotatedText.annotations.annotationsURL
    if (await lively.confirm("delete all the annotations? <br><code>"  + file +"</code>")) {
      await fetch(file, {method: "DELETE"})
    }
  }
  
  async loadAnnotations(text, version) {
    var cm = await this.awaitEditor()
    // load annotated text in the version that was  last annotated
    this.annotatedText  = await AnnotatedText.fromURL(this.getURLString(), this.getAnnotationsURL(), version, true)
    
    // set current text and version, and update annotations accordingly 
    this.annotatedText.setText(text, version)
    this.annotatedText.annotations.renderCodeMirrorMarks(cm)
    this.lastAnnotatedText = this.annotatedText.clone()
  }
  
  async disableAnnotations() { 
    if (this.annotatedText) {
      this.annotatedText.clearCodeMirrorMarks(await this.awaitEditor())
    }
    lively.removeEventListener("annotations", this)
    delete this.annotatedText
  }
  
  async enableAnnotations() { 
    var version = undefined; // this.lastVersion does not work
    console.log("[annotations] enable :", this.getText(), version)
    await this.loadAnnotations(this.getText(), version) 
    lively.removeEventListener("annotations", this)
    lively.addEventListener("annotations", this, "loaded-file", async evt => {
      this.loadAnnotations(evt.detail.text, evt.detail.version) 
    })
    lively.addEventListener("annotations", this, "saved-file", async evt => {
      this.saveAnnotations(evt.detail.version)
    })
    // lively.addEventListener("annotations", this, "solved-conflict", evt => {
    //   // we can ignore this, since it will be solved... by the editor
    //   lively.notify("TEXT CONFLICT " + evt.detail.version )
    // })
  }
  
  // lets try to resolve the merge, that git could not resolve!
  async autoResolveMergeConflicts() {
    var source = this.getText()
    
    if (this.getURLString().match(/.l4a$/)) {
      lively.notify("not supported yet... #TODO")
      
      // use solveAnnotationConflict
      return
    }
    
     var versions = lively.files.extractGitMergeConflictVersions(source) 
    if (versions.length == 0) return // nothing to do
    
    if (versions.length != 2) throw new Error("merge  != 2 not support yet")
    var versionA= versions[0]
    var versionB = versions[1]
    var versionBase = await this.getGitMergeBase(serverURL, repositoryName, versionA, versionB)
    
    
    lively.notify("yeah... here we go")
  }
  /*MD ## Hooks MD*/

  livelyExample() {
    this.setURL(lively4url + "/README.md");
    this.loadFile()
  }
  
  livelyMigrate(obj) {
		if (obj.versionControl) obj.versionControl.remove();
    this.setURL(obj.getURL());
    
    // #TODO take care of customizations
    // codeMirror.doSave
    // codeMirror.getDoitContext
    // .. and all the others in lively-container getEditor
    
    this.loadFile();
  }
}