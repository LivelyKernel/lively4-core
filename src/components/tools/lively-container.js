"disable deepeval"
/*MD # Lively Container 

[doc](browse://doc/tools/container.md)

![](lively-container.png){height=400px}

MD*/

import Morph from 'src/components/widgets/lively-morph.js';
import highlight from 'src/external/highlight.js';
import {pt} from 'src/client/graphics.js';
import ContextMenu from 'src/client/contextmenu.js';
import SyntaxChecker from 'src/client/syntax.js';
import components from "src/client/morphic/component-loader.js";
import * as cop  from "src/client/ContextJS/src/contextjs.js";
import Favorites from 'src/client/favorites.js';
import files from "src/client/files.js"
import Strings from "src/client/strings.js"
let ScopedScripts; // lazy load this... #TODO fix #ContextJS #Bug actual stack overflow
import Clipboard from "src/client/clipboard.js"
import {fileEnding, replaceFileEndingWith, updateEditors} from "utils"
import ViewNav from "src/client/viewnav.js"
import Upndown from 'src/external/upndown.js'
import {AnnotatedText, Annotation, default as AnnotationSet} from "src/client/annotations.js"
import indentationWidth from 'src/components/widgets/indent.js';
import { isTestFile } from 'src/components/tools/lively-testrunner.js';

/*MD

![](lively-container.drawio)

MD*/


export default class Container extends Morph {
  
  get target() { return this.childNodes[0] }
  /*MD ## Setup MD*/
  initialize() {
    
    // this.shadowRoot.querySelector("livelyStyle").innerHTML = '{color: red}'

    // there seems to be no <link ..> tag allowed to reference css inside of templates
    // files.loadFile(lively4url + "/templates/livelystyle.css").then(css => {
    //   this.shadowRoot.querySelector("#livelySt\yle").innerHTML = css
    // })
    if (!this.getAttribute("mode")) {
      this.setAttribute("mode", "show")
    }

    this.windowTitle = "Browser";
    if (this.isSearchBrowser) {
      this.windowTitle = "Search Browser";
    }

    this.contentChangedDelay = (() => {
      this.checkForContentChanges()
    }).debounce(1000)

    lively.addEventListener("Container", this, "mousedown", evt => this.onMouseDown(evt));
    
    lively.html.addDeepMousePressed(this.get("#back"), () => this.history(), (evt, url) => {
      this.unwindAndFollowHistoryUntil(url)
    })
    lively.html.addDeepMousePressed(this.get("#forward"), () => this.forwardHistory(), (evt, url) => {
      this.unwindAndFollowForwardHistoryUntil(url)
    })
    
    this.addEventListener("extent-changed", function(evt) {
      if (this.target) {
        this.target.dispatchEvent(new CustomEvent("extent-changed"));
      }
    });
    
    let path, edit;
    if (!this.useBrowserHistory()) {
      path = this.getAttribute("src");
      edit = this.getAttribute("mode") == "edit"
    }
    this.viewOrEditPath(path, edit)
   
    
    // #TODO very ugly... I want to hide that level of JavaScript and just connect "onEnter" of the input field with my code
    var input = this.get("#container-path");
    input.addEventListener("keyup", evt => {
      if (evt.code == "Enter") { 
        this.onPathEntered(input.value);
      }
      if (evt.altKey && evt.code == "ArrowDown") {
        this.get("lively-container-navbar").focusFiles()
      }
    });
    this.get("#fullscreenInline").onclick = (e) => this.onFullscreen(e);

    this.registerButtons();

    this.addEventListener('contextmenu',  evt => this.onContextMenu(evt), false);
    this.addEventListener('keydown',   evt => this.onKeyDown(evt));
    this.setAttribute("tabindex", 0);
    this.addEventListener('click',   evt => this.onClick(evt));
    this.hideCancelAndSave();

    if(this.getAttribute("controls") =="hidden") {
      this.hideControls()
    }
    this.withAttributeDo("leftpane-flex", value =>
      this.get("#container-leftpane").style.flex = value)
    this.withAttributeDo("rightpane-flex", value =>
      this.get("#container-rightpane").style.flex = value)
    
    this.addEventListener("editorbacknavigation", (evt) => {
      this.onEditorBackNavigation(evt)
    }) 
  }
  /*MD ## Navigation MD*/
  // #private
  viewOrEditPath(path, edit) {
     if (path) {
      if (edit) {
        this.livelyContentLoaded = this.editFile(path);
      } else {    
        this.livelyContentLoaded = this.followPath(path)
      }      
    }
  }
  
  // #important #api
  async followPath(path) {
    if (path.toString().match(/^https?:\/\//)) {
      path = this.normalizeURL(path);
    }
    
    if (this.unsavedChanges()) {
      if (!await lively.confirm("You will lose unsaved changes, continue anyway?")) {
        return;
      }
    }
    
    if (path.match(/^#/)) {
      // just anchor navigation
      return this.scrollToAnchor(path)
    }
    

    var m = path.match(/start\.html\?load=(.*)/);
    if (m) {
      return this.followPath(m[1]);
    }
    
    this.get("#container-info").innerHTML = ""
    this.get("#container-info").appendChild(<div id="loading-info">Loading {path}</div>)
    
    
    
    try {
      var options = await fetch(path, {method: "OPTIONS"}).then(r => r.json())
    } catch(e) {
      // no options... found
    }
    // this check could happen later
    if (path.match(/^https?:\/\//) 
        && !path.match("https://lively4") && !path.match(/http:?\/\/localhost/)
        && !path.match(window.location.host)
        && !path.match("https://www.draw.io/")
      ) {
      if (!options) {
        this.clearLoadingInfo()
        return window.open(path);
      }
    }
    if (options && options.donotfollowpath) {
      fetch(path) // e.g. open://my-component
      this.clearLoadingInfo()
      return ;
    }

    var lastPath = _.last(this.history())
    if (lastPath !== path) {
      if (lastPath && path && path.startsWith(lastPath) && lastPath.match(/\.md\/?$/)) {
        // we have a #Bundle here... and the navigation is already in the history
      } else if(lastPath && path && (path.replace(/\/index\.((html)|(md))$/,"") == lastPath.replace(/\/?$/,""))) {
        // we have a index file redirection here...
      } else {
        this.history().push(path);
      }
    }

    var opts = ""
    if (this.useBrowserHistory() && this.isFullscreen()) {
      opts="&fullscreen=true"
    }
    
    if (this.isEditing() && (!path.match(/\/$/) || path.match(/\.((md)|(l4d))\//))) {
      if (this.useBrowserHistory())
        window.history.pushState({ followInline: true, path: path },
          'view ' + path, window.location.pathname + "?edit="+path  + opts);
      return this.setPath(path, true).then(() => this.editFile());
    } else {
      if (this.useBrowserHistory())
        window.history.pushState({ followInline: true, path: path },
          'view ' + path, window.location.pathname + "?load="+path  + opts);
      // #TODO replace this with a dynamic fetch
      return this.setPath(path);
    }
  }
  
  clearLoadingInfo() {
    this.get("#container-info").innerHTML = ""
  }
  
  getPath() {
    return encodeURI(this.shadowRoot.querySelector("#container-path").value);
  }
  
  // #important
  async setPath(path, donotrender) {
    
    this.get('#container-content').style.display = "block";
    this.get('#container-editor').style.display = "none";

    // if (this.viewNav) {
    //   lively.setPosition(this.get("#container-root"), pt(0,0))
    //   this.viewNav.disable()
    // }

    this.windowTitle = path.replace(/.*\//,"")
    if (!path) {
        path = "";
    }
	  var isdir = path.match(/.\/$/);

    var url;
    if (path.match(/^https?:\/\//)) {
      url = new URL(this.normalizeURL(path));
      // url.pathname = lively.paths.normalize(url.pathname);
      path = "" + url;
    } else if (path.match(/^[a-zA-Z]+:/)) {
      url = new URL(path)
      var other = true
    } else {
      path = lively.paths.normalize(path);
      url = "https://lively4" + path
    }
    
    // check if our file is a directory
    
    var options
    try { 
      options = await fetch(url, {method: "OPTIONS"}).then(r =>  r.json())
    } catch(e) {
      options = {}
    }
    if (!isdir && !other) {
      if (options && options.type == "directory") {
        isdir = true
      }
      // console.log("[container] isdir " + isdir)
    }
    if (!path.match(/\/$/) && isdir ) {
      path =  path + "/"
    }

    var container=  this.get('#container-content');
    // don't scroll away whe reloading the same url
    if (this.getPath() == path) {
      this.preserveContentScroll = this.get("#container-content").scrollTop;
    }

    var markdown = this.get("lively-markdown")
    if (markdown && markdown.get) {  // #TODO how to dynamically test for being initialized?
      var presentation = markdown.get("lively-presentation")
      if (presentation && presentation.currentSlideNumber) {
        this.lastPage  = presentation.currentSlideNumber()
      }
      this.wasContentEditable =   markdown.contentEditable == "true"
    }
    
    this.setPathAttributeAndInput(path)
    
    var anchorMatch = path.match(/^(https?\:\/\/[^#]*)(#.+)/)
    if (anchorMatch) {
      path = anchorMatch[1]
      var anchor = anchorMatch[2]    
      console.log("path " + path)
      console.log("anchor " + anchor)
      this.anchor = anchor
    } else {
      this.anchor = null
    }
        
    // this.clear(); // don't clear here yet... makes browsing more stable
    
    
    container.style.overflow = "auto";

    url = this.getURL();
    
    if (!url.toString().match(/^https?:\/\//)) {
      var resolvedURL = lively.swxURL(url)
    } else {
      resolvedURL = url
    }
    
    this.content = ""
  
    this.showNavbar();
  
    // console.log("set url: " + url);
    this.sourceContent = "NOT EDITABLE";
    var render = !donotrender;
    // Handling directories


    // Handling files
    this.lastVersion = null; // just to be sure
    var renderTimeStamp = Date.now() // #Idean, this is clearly a use-case for #COP, I have to refactor this propagate this dynamical context asyncronously #AsyncContextJS
    this.renderTimeStamp = renderTimeStamp
    
    var format = files.getEnding(path)
    if (url.protocol == "search:") {
      format = "html"
    }
    if (path.match(/\?html/)) {
      format = "html"
    }
    if (!donotrender && path.match(/sap\:/)) {
      format = "html" // when viewing... we want HTML
    }
    
    if (isdir) {
      // return new Promise((resolve) => { resolve("") });
      if (!options || !options["index-available"]) {
        return this.listingForDirectory(url, render, renderTimeStamp)
      } else {
        format = "html" // e.g. #Bundle 
      }
    }
    // ACM #Hack... #TODO -> find out when content is HTML
    if (format == "cfm") {
      format = "html"
    }
    
    if (files.isPicture(format)) {
      if (render) {
        fetch(resolvedURL) // cache bust IMG resources.... otherwise the SWX is not asked by the browser
        return this.appendHtml("<img style='max-width:100%; max-height:100%' src='" + resolvedURL +"'>", renderTimeStamp);
      }
      else return;
    } else if (files.isVideo(format)) {
      if (render) return this.appendHtml(`<video autoplay controls><source src="${resolvedURL}" type="video/${format}"></video>`, renderTimeStamp);
      else return;
    } else if (files.isAudio(format)) {
      if (render) return this.appendHtml(`<audio controls src="${resolvedURL}"></audio>`, renderTimeStamp); 
      else return;
    } else if (format == "pdf") {
      if (render) return this.appendHtml('<lively-pdf overflow="visible" src="'
        + resolvedURL +'"></lively-pdf>', renderTimeStamp);
      else return;
    } 
    
  
    var headers = {}
    if (format == "html") {
      headers["content-type"] = "text/html" // maybe we can convice the url to return html
    }
    if (path.match(/gs\:/)) {
      format = "md"
    }
    
    headers['cache-control'] = 'no-cache'
    // #deprecated since we now use no-ache
    if (url.toString().match(lively4url)) {
      headers["forediting"] = true
    }


    
    
    
    
    return fetch(url, {
      method: "GET",
      headers: headers
    }).then( resp => {
    
      
      
      this.clear(); // could already be filled again...
      
          
      this.lastVersion = resp.headers.get("fileversion");
      this.contentType = resp.headers.get("content-type");
      if (this.contentType && this.contentType.match("image"))  {
        this.appendHtml("<img style='max-width:100%; max-height:100%' src='" + resolvedURL +"'>", renderTimeStamp);
        return  
      }   
      
      // if (this.contentType.match("text/html"))  {
      //   format = "html"  
      // }
      
      

      // console.log("[container] lastVersion " +  this.lastVersion)
      
      // Handle cache error when offline
      if(resp.status == 503 || resp.status == 403) {
        format = 'error'
        
        
        // print error early...
        this.getContentRoot().appendChild(
          <div>
            <h2>
              <span style="color: darkred">{resp.status} {resp.statusText} </span>
            </h2>
            <a href="" click={async evt => {
                evt.preventDefault()
                var GitHub = await System.import("src/client/github.js").then(m => m.default)
                var gh = new GitHub()
                await gh.loadCredentials()
                window.lively4github =  gh
              }}>maybe loginto github?</a>
          </div>);
        
      }
      
      
      return resp.text();
    }).then((content) => {

      console.log("setPath content " + url)
      
      this.content = content
      this.showNavbar();
      
      if (format == "html" || this.contentType.match("text/html"))  {
        this.sourceContent = content;
        if (render) return this.appendHtml(content), renderTimeStamp;
      } else if (format == "md") {
        this.sourceContent = content;
        if (render) return this.appendMarkdown(content, renderTimeStamp);
      } else if (format == "livelymd") {
        this.sourceContent = content;
        if (render) return this.appendLivelyMD(content, renderTimeStamp);
      } else if (format == "csv") {
        this.sourceContent = content;
        if (render) return this.appendCSV(content, renderTimeStamp);
      } else if (format == "error") {
        this.sourceCountent = content;
        if (render) {
          return this.appendHtml(`
            <h2>
              <span style="color: darkred">Error: </span>${content}
            </h2>
          `, renderTimeStamp);
        }
      } else if (format == "bib") {
        this.sourceContent = content;
        if (render) {
          return this.appendHtml('<lively-bibtex src="'+ url +'"></lively-bibtex>', renderTimeStamp);
        }
      } else if (format == "dot") {
        this.sourceContent = content;
        if (render) {
          
          return this.appendHtml(`<graphviz-dot><script type="graphviz">${content}</script></graphviz-dot>`, renderTimeStamp); 
        } else return;
      } else if (format == "xhtml") {
        this.sourceContent = content;
        // if (render) {
        //   return this.appendHtml('<lively-iframe style="position: absolute; top: 0px;left: 0px;" navigation="false" src="'+ url +'"></lively-iframe>', renderTimeStamp);
        // }
        if (render) {
          return this.appendHtml('<lively-webwerkstatt url="'+ url +'"></lively-webwerkstatt>', renderTimeStamp);
        }
        
      } else if (format == "xml" || format == "drawio") {
        this.sourceContent = content;
        if (render && content.match(/^\<mxfile/)) {
          return this.appendHtml(`<lively-drawio src="${resolvedURL}"></<lively-drawio>`, renderTimeStamp);
        }
      } else {
        if (content) {
          if (content.length > (1 * 1024 * 1024)) {
            if (render) return this.appendHtml("file size to large", renderTimeStamp); 
          } else {
            this.sourceContent = content;
            if (render) return this.appendHtml("<pre><code>" + content.replace(/</g, "&lt;") +"</code></pre>", renderTimeStamp);
          }          
        }
      }
    }).then(() => {
      this.dispatchEvent(new CustomEvent("path-changed", {url: this.getURL()}));
      this.updateFavInfo();
    })
    .catch(function(err){
      console.log("Error: ", err);
      lively.notify("ERROR: Could not set path: " + path,  "because of: ", err);
    });
  }
  
  useBrowserHistory() {
    return this.getAttribute("load") == "auto";
  }
  
  history() {
    if (!this._history) this._history = [];
    return this._history;
  }

  forwardHistory() {
    if (!this._forwardHistory) this._forwardHistory = [];
    return this._forwardHistory;
  }
  /*MD ## Getter / Setter MD*/

  getSourceCode() {
    var editor = this.get("#editor")
    if (!editor) return ""
    return editor.currentEditor().getValue()
  }
  
  getBaseURL() {
    return this.getURL().toString().replace(/[#?].*/,"")
  }

  getContentRoot() {
    // #Design #Lively4 The container should hide all its contents. The styles defined here should not affect others.
    
    // return this // #TODO only reason.. interacting with Halo and drag and drop into container...
    
    return this.get('#container-root'); // #TODO fix halo interactrion with this hidden content!

    // #BUT #TODO Blockly and connectors just work globally...
    // but we do not use blockly and connectors any more...
    // return this;
  }

  getDir() {
    return this.getPath().replace(/[^/]*$/,"");
  }

  getURL() {
    var path = this.getPath();
    if (!path) return;
    if (files.isURL(path)) {
      return new URL(path);
    } if (path.match(/^[a-zA-Z]+:/)) {
      return new URL(path);
    } else {
      return new URL("https://lively4/" + path);
    }
  }
  

  async getEditor(editorType) {
    editorType = editorType || this.currentEditorType || "lively-editor"
    this.currentEditorType = editorType
    
    var container = this.get('#container-editor');
    
    var livelyEditor = container.querySelector("lively-image-editor, lively-editor, babylonian-programming-editor, lively-shadama-editor");
    
    if (livelyEditor && (livelyEditor.localName != editorType)) {
      livelyEditor.remove()
      livelyEditor = null
    }
    
    if (livelyEditor) return Promise.resolve(livelyEditor);
      
    livelyEditor = await lively.create(editorType, container);
    livelyEditor.id = "editor";
    
    if (livelyEditor.awaitEditor) {
      // console.log("[container] opened editor")
      livelyEditor.hideToolbar();
      await livelyEditor.awaitEditor();
      var livelyCodeMirror = livelyEditor.livelyCodeMirror();
      if (!livelyCodeMirror) throw new Error("Could not initialalize lively-editor");
      if (livelyCodeMirror.tagName == "LIVELY-CODE-MIRROR") {
        await new Promise(resolve => {
          if (livelyCodeMirror["editor-loaded"]) {
            resolve() // the livelyEditor was very quick and the event was fired in the past
          } else {
            livelyCodeMirror.addEventListener("editor-loaded", resolve)
          }
        })
      }

      livelyCodeMirror.enableAutocompletion();
      livelyCodeMirror.getDoitContext = () => this.getDoitContext();

      livelyCodeMirror.doSave = text => {
        if (livelyCodeMirror.tagName !== "LIVELY-CODE-MIRROR") {
          this.onSave(); // CTRL+S does not come through...
        }
      }  
      
      livelyCodeMirror.editor.on("cursorActivity", cm => {
        this.onEditorCursorActivity(cm)
      });
      
    }
    return livelyEditor;
  }
  
  getOtherContainers(editing=false) {
    var url = this.getURL()
    if (!url) return
    return document.body.querySelectorAll("lively-container").filter(ea => {
      var otherURL = ea.getURL()
      return otherURL && ea.isEditing() == editing && (otherURL.pathname == url.pathname) && (otherURL.host == url.host)
    })
  }
  
  
  getDoitContext() {
    if(this.getURL().pathname.match(/.*\.md/)) {
      var url = this.getURL()
      var otherContainer = this.getOtherContainers()[0]
      var markdown = otherContainer && otherContainer.get("lively-markdown")
      var script = markdown && markdown.get("lively-script")
      
      return script
    }
    
    return window.that
  }

  getLivelyCodeMirror() {
    var livelyEditor = this.get('#editor');
    return livelyEditor && livelyEditor.editorComp && livelyEditor.editorComp();
  }

  setPathAttributeAndInput(path) {
    this.setAttribute("src", path);
    this.get('#container-path').value = decodeURI(path);
  }
  
  // #private let's do it the hard way
  asyncGet(selector, maxtime) {
    maxtime = maxtime || 10000;
    var startTime = Date.now();
    return new Promise((resolve, reject) => {
      var check = () => {
        var found = this.get(selector);
        if (found) resolve(found);
        else if (Date.now() - startTime > maxtime) reject();
        else setTimeout(check, 100);
      };
      check();
    });
  }
  
  /*MD ## Testing MD*/
  
  async isTemplate(url) {
    var filename = url.replace(/[#?].*/,"").toString().replace(/.*\//,"") // #Idea #Refactor Extract getFilename, add "filename" to URL class 
    var foundTemplate = await lively.components.searchTemplateFilename(filename)
    return url == foundTemplate
  }
  
  isFullscreen() {
    return this.get("#container-navigation").style.display  == "none"
  }
  
  isEditing() {
    return this.getAttribute("mode") == "edit";
  }
  
  contentIsTemplate(sourceCode) {
    return this.getURL().pathname.match(/.*html/)
      && sourceCode.match(/<template/)
  }
  
  contentIsEditable() {
    var url = this.getURL()
    return url && url.pathname && (url.pathname.match(/\.html$/) || url.pathname.match(/\.md$/))
  }
  /*MD ## Modules MD*/

  reloadModule(url) {
    console.log("reloadModule " + url)
    var urlString = url.toString()
    lively.unloadModule(urlString)
    return System.import(urlString).then( m => {
        lively.notify({
          title: "Loaded " + url, color: "green"});
        this.resetLoadingFailed();
      }, error => {
        this.loadingFailed(url.toString().replace(/.*\//,""), error);
      });
  }

  async loadTestModule(url) {
    var testRunner = document.body.querySelector("lively-testrunner");
    if (testRunner) {
      try {
        console.group("run test: " + this.getPath());
        var scrollContainer = testRunner.get(".container")
        var scrollTop = scrollContainer && scrollContainer.scrollTop  // preserve scroll during update
        await testRunner.clearTests();
        await testRunner.resetMocha();
        await lively.reloadModule(url.toString(), true)
        await System.import(url.toString());
        console.log("RUN TESTS:")
        await testRunner.runTests();
        await lively.sleep(100)
        if (scrollContainer) scrollContainer.scrollTop = scrollTop        
      } finally {
        console.groupEnd("run test: " + this.getPath());
      }
    } else {
      lively.notify("no test-runner to run " + url.toString().replace(/.*\//,""));
    }
  }
  
  isDeepEvaling() {
     return this.get("#deep").checked && this.sourceContent && !this.sourceContent.match(/\"disable deepeval\"/)
  }
  
  async loadModule(url) {
    var deep = this.isDeepEvaling() 
    return lively.reloadModule("" + url, true, true, deep).then(module => {
      if (deep) {
        lively.notify("","Module " + url + " and depended modules reloaded!", 3, null, "green");
      } else {
        lively.warn("","Only module " + url + " reloaded!", 3, null, "green");
      }

      this.resetLoadingFailed();
    }, err => {
      this.loadingFailed(url, err);
    });
  }

  resetLoadingFailed() {
    // that.resetLoadingFailed()
    // System.import(urlString)
    var urlString = this.getURL().toString();

    // #TODO #babel6refactoring
    if (lively.modules) {
      if (urlString.match(/\.js$/)) {
        var m = lively.modules.module(urlString);
      }
    }
    this.lastLoadingFailed = false;
    var b = this.get("#apply"); if (b) b.style.border = "";

  }

  loadingFailed(moduleName, err) {
    this.lastLoadingFailed = err;
    this.get("#apply").style.border = "2px solid red";

    lively.notify({
      title: "Error loading module " + moduleName,
      text:  err.toString().slice(0,200),
      color: "red",
      details: err});
    console.error(err);
  }

  async openTemplateInstance(url) {
      var name = url.toString().replace(/.*\//,"").replace(/\.((html)|(js))$/,"");
      var comp = await lively.openComponentInWindow(name);
      if (comp.livelyExample) comp.livelyExample(); // fill in with example content
  }
  /*MD ## Navigation Hisotry MD*/
  unwindAndFollowHistoryUntil(urlInHistory) {
    var url = "nourl"
    while(url && url !== urlInHistory ) {
      url= this.history().pop();
      this.forwardHistory().push(url);
    }
    this.followPath(url)
  }
  
  unwindAndFollowForwardHistoryUntil(urlInHistory) {
    var url = "nourl"
    while(url && url !== urlInHistory ) {
      url= this.forwardHistory().pop();
      this.history().push(url);
    }
    this.followPath(url)
  }
  /*MD ## File Operations MD*/
  async deleteFile(url, urls) {
    
    // remember the old position of selection (roughly)
    var navbar = this.get("lively-container-navbar")
    var oldSelection = navbar.getSelectedItems()
    var firstOldSelection = oldSelection[0]
    if (firstOldSelection) {
      var selectionList = firstOldSelection.parentElement
      var firstOldSelectionIndex = Array.from(selectionList.childNodes).indexOf(firstOldSelection)
    }
    
    lively.notify("deleteFile " + url)
    if (!urls || !urls.includes(url)) {
      urls = [url] // clicked somewhere else
    }
    if (!urls) urls = [url]
    
    var allURLs = new Set()
    for(var ea of urls) {
      if (!allURLs.has(ea)) {
        allURLs.add(ea)
        if (ea.endsWith("/")) {
          for(var newfile of await lively.files.walkDir(ea)) {
            allURLs.add(newfile)
          }          
        }
      }    
    }
    urls = Array.from(allURLs)
    urls = urls.sortBy(ea => ea).reverse() // delete children first
    
    var prefix = Strings.longestCommonPrefix(urls.map(ea => ea.replace(/[^/]*$/,""))) // shared dir prefix
    
    var names = urls.reverse().map(ea => decodeURI(ea.replace(/\/$/,"").replace(prefix,"")))
    var customDialog = dialog => {
      var messageDiv = dialog.get("#message")
      messageDiv.style.maxHeight = "300px"
      messageDiv.style.overflow = "auto"
      messageDiv.style.backgroundColor = "white"
    }
    var msg = "<b>Delete " + urls.length + " files:</b><br>" +
        "<ol>" + names.map( ea => "<li>" + ea + "</li>",  ).join("") + "</ol>"
    if (await lively.confirm(msg, customDialog)) {
      for(let url of urls) {
        var result = await fetch(url, {method: 'DELETE'})
          .then(r => {
            if (r.status !== 200) {
              lively.error("Could not delete: " + url)
            }
            r.text()
          });  
      }
      this.get("#container-leftpane").update()
      
      this.setAttribute("mode", "show");
      if (selectionList) {
        // selection next element... in area
        var newSelection = selectionList.childNodes[firstOldSelectionIndex]
        if (newSelection) {
          var newURL = newSelection.querySelector("a").getAttribute('href')
          this.setPath(newURL);
        }
      } else {
        this.setPath(url.replace(/\/$/, "").replace(/[^/]*$/, ""));
      }
      this.hideCancelAndSave();
      
      lively.notify("deleted " + names);
      
      
    }
  }

  async renameFile(url, followFile=true, proposedNewName) {
    url = "" + url
    url = url.replace(/\/$/,"") // case of single dir
    var base = url.replace(/[^/]*$/,"")
    
    var name = proposedNewName || decodeURI(url.replace(/.*\//,""))
    var newName = await lively.prompt("rename", name)
    if (!newName) {
      lively.notify("cancel rename " + name)
      return
    }
    var newURL = base + encodeURI(newName)
    if (newURL != url) {
      await files.moveFile(url, newURL)
      
      if (followFile) {
        this.setPath(newURL);
        this.hideCancelAndSave();        
      }

      lively.notify("moved to " + newURL);
    }
    return newURL
  }
  
  async newFile(path="", type="md") {  
    var content = "here we go...."
    var ending = type
    if (type == "drawio") {
      ending = "drawio"
      content = await fetch(lively4url + "/media/drawio.xml").then(r => r.text())
    }
    
    path = path.replace(/[^/]*$/,"") + "newfile." + ending 
    
    var fileName = await lively.prompt('Please enter the name of the file', path, async dialog => {
      // select the filename in the path...
      await lively.sleep(100) // wait for the new file
      var input = dialog.get("input")
      var s = input.value
      var m = s.match(/([^/.]*)([^/]*)$/)
      input.select()
      input.setSelectionRange(m.index,m.index + m[1].length)      
    })
    if (!fileName) {
      lively.notify("no file created");
      return;
    }
    await files.saveFile(fileName, content);
    lively.notify("created " + fileName);
    
    if (type == "drawio") {
      this.setAttribute("mode", "show");      
    } else {
      this.setAttribute("mode", "edit");
    }
    
    this.showCancelAndSave();

    await this.followPath(fileName);
      
    this.focus()
  }
  
  async newDirectory(path="") {
    var fileName = await lively.prompt('Please enter the name of the directory', path);
      if (!fileName) {
        lively.notify("no file created");
        return;
      }
      await fetch(fileName, {method: 'MKCOL'});
      lively.notify("created " + fileName);
      this.followPath(fileName);
  }
  /*MD ## Events MD*/
  
  onKeyDown(evt) {
    var char = String.fromCharCode(evt.keyCode || evt.charCode);
    if ((evt.ctrlKey || evt.metaKey /* metaKey = cmd key on Mac */) && char == "S") {
      if (evt.shiftKey) {
        this.onAccept();
      } else {
        this.onSave();
      }
      evt.preventDefault();
      evt.stopPropagation();
    } else if(evt.key == "F7") {
      this.switchBetweenJSAndHTML();
      evt.stopPropagation();
      evt.preventDefault();
    }
  }
  
  onContextMenu(evt) {
    // fall back to system context menu if shift pressed
    if (!evt.shiftKey) {
      evt.preventDefault();
      evt.stopPropagation();
      
      var path = evt.composedPath()
      var markdown = path.find(ea => ea.localName == "lively-markdown") 
      if (markdown) {
        var elements = path.filter(ea => ea.getAttribute &&  ea.getAttribute("data-source-line"))
        if (elements.length > 0) {
          this.onMarkdownContextMenu(evt, markdown, elements)
          return false
        }
      }
      
      // var worldContext = document.body; // default to opening context menu content globally
      // opening in the content makes only save if that content could be persisted and is displayed
      // disable this for now:
      // if (this.contentIsEditable() && !this.isEditing()) {
      //  worldContext = this
      // }
      lively.onContextMenu(evt)
      // lively.openContextMenu(document.body, evt, undefined, worldContext);
      return false;
    }
  }
  
 

  onClick(evt) {
    if(evt.shiftKey && !this.isEditing() && this.getURL().pathname.match(/.*\.md/)) {
      this.onMarkdownClick(evt)  
    } 
  }
  
  
  
  onFullscreen(evt) {
    this.toggleControls();
    if (!this.parentElement.isMaximized) return;
    if ((this.isFullscreen() && !this.parentElement.isMaximized()) ||
       (!this.isFullscreen() && this.parentElement.isMaximized()))  {
      this.parentElement.toggleMaximize();
      if ( this.parentElement.isMaximized()) {
        this.parentElement.get(".window-titlebar").style.display = "none"
        this.parentElement.style.zIndex = 0
      } else {
        this.parentElement.style.zIndex = 1000
        this.parentElement.get(".window-titlebar").style.display = ""
      }
    }
  }
  
  onClose(evt) {
    this.parentElement.remove()
  }
  
  async onToggleOptions() {
    if (this.classList.contains('show-options')) {
      this.classList.remove('show-options');
    } else {
      this.classList.add('show-options');
    }
  }
  
  async onFavorite() {
    await Favorites.toggle(this.getPath());
    this.updateFavInfo()
  }
  
  async onBeautify() {
    const ending = this.getPath()::fileEnding();
    
    if (ending !== 'js' && ending !== 'css' && ending !== 'html') {
      return;
    }
    
    const editor = this.get("lively-editor");
    const text = editor.lastText;
    let beautifulText;
    const options = {
      'end_with_newline': true,
      'max_preserve_newlines': 3,
      'js': {
        'brace_style': ['collapse', 'preserve-inline'],
        'indent_size': indentationWidth(),
        'wrap_line_length': 120,
      },
      'indent_size': indentationWidth(),
    }
    // load the beatify code async... because they are big
    if (ending === 'js') {
      await System.import( "src/client/js-beautify/beautify.js")        
      beautifulText = global.js_beautify(text, options);
    } else if (ending === 'css') {
      await System.import( "src/client/js-beautify/beautify-css.js")
      beautifulText = global.css_beautify(text, options);
    } else if (ending === 'html') {
      await System.import("src/client/js-beautify/beautify-html.js")
      beautifulText = global.html_beautify(text, options);
    }
    editor.setText(beautifulText, true);      
  }

  onDelete() {
    var url = this.getURL() +"";
    this.deleteFile(url)
  }

  async onApply() {
    var url = this.getBaseURL();
    var filename = url.replace(/.*\//,"")
    var foundTemplate = await lively.components.searchTemplateFilename(filename)
    if (url == foundTemplate) {
      if(!filename.includes("-")) {
        lively.error("custom elements require a hyphen in their name!") // see https://html.spec.whatwg.org/multipage/custom-elements.html#prod-potentialcustomelementname
      }
      this.openTemplateInstance(url);
    } else if (url.match(/\.js$/))  {
      this.reloadModule(url);
    } else {
      lively.openBrowser(url);
    }
  }

  async onSpawnTestRunner(evt) {
    const path = this.getPath()

    if (!isTestFile(path)) {
      lively.warn('current file is no test file');
      return;
    }
    
    const pos = lively.getPosition(evt);
    const testRunner = await lively.openComponentInWindow('lively-testrunner', pos);
    testRunner.setTestPath(path);
    await testRunner.clearTests();
    await testRunner.resetMocha();
    await testRunner.loadTests();
    await testRunner.runTests();
  }

  onHome() {
    this.clearNavbar()
    this.followPath(lively4url)
  }

  async onSync(evt) {
    var comp = await (<lively-sync></lively-sync>);
    var compWindow;
    lively.components.openInWindow(comp).then((w) => {
      compWindow = w;
      lively.setPosition(w, lively.pt(100, 100));
    });

    var serverURL = lively.files.serverURL("" + this.getURL())
    comp.setServerURL(serverURL);
    console.log("server url: " + serverURL);
    // if (!this.getURL().pathname.match(serverURL)) {
    //   return lively.notify("can only sync on our repositories");
    // }
    var repo =  this.getPath().replace(serverURL +"/", "").replace(/\/.*/,"");
    comp.setRepository(repo);
    comp.sync();
    // .then(() => compWindow.remove())
  }


  onPathEntered(path) {
    this.followPath(path);
  }


  onEdit() {
    this.setAttribute("mode", "edit");
    this.showCancelAndSave();
    this.editFile();
  }

  async onCancel() {
    if (this.unsavedChanges()) {
      if (!await lively.confirm("There are unsaved changes. Discard them?")) {
        return;
      }
    }
    this.setAttribute("mode", "show");
    this.setPath(this.getPath());
    this.hideCancelAndSave();

  }

  onUp() {
    var path = this.getPath();
    if (path.match(/(README|index)\.((html)|(md))/))
      // one level more
      this.followPath(path.replace(/(\/[^/]+\/[^/]+$)|([^/]+\/$)/,"/"));
    else
      this.followPath(path.replace(/(\/[^/]+$)|(\/?[^/]+\/$)/,"/"));
  }

  onBack() {
    if (this.history().length < 2) {
      lively.notify("No history to go back!");
      return;
    }
    lively.lastBackButtonClicked = Date.now(); // can be used by scripts to prevent autoforwarding
    var url = this.history().pop();
    var last = _.last(this.history());
    // lively.notify("follow " + url)
    this.forwardHistory().push(url);
    this.followPath(last);
  }

  onMouseDown(evt) {
    if (lively.halo) {
      // close halo
      lively.halo.onBodyMouseDown(evt, this);
    }
    evt.stopPropagation();
    // evt.preventDefault();
    Clipboard.onBodyMouseDown(evt)
  }

  onForward() {
    var url = this.forwardHistory().pop();
    if (url) {
      this.followPath(url);
    } else {
      lively.notify("Could not navigate forward");
    }
  }

  async onBrowse() {
    var url = this.getURL();
    var comp = await lively.openComponentInWindow("lively-container");
    comp.editFile("" + url);
  }

  async onDependencies() {
     lively.openMarkdown(lively4url + "/src/client/dependencies/dependencies.md", 
      "Dependency Graph", {url: this.getURL().toString()})


  }
  
  onEditorBackNavigation() {
    this.get("lively-container-navbar").focusDetails()
  }

  async onSaveAs() {
    var newPath = await lively.prompt("Save as..", this.getPath())
    if (newPath === undefined) return;

    if (!this.isEditing()) {
      lively.notify("save as " + newPath)
      var result = await fetch(newPath, {
        method: "get"
      })
      this.lastVersion = result.headers.get("fileversion")
      this.saveEditsInView(newPath);
      this.get("#container-path").value = newPath
      return;
    }
    lively.notify("Save as... in EditMode not implemented yet");
  }

  async buildLatex(dir, pdf) {
        
    var serverURL = lively.files.serverURL(dir)
    if (!serverURL) {
      lively.warn("no lively server found for: " + dir)
      return
    }

    lively.notify("LaTeX", "build", 10)

    var buildPath = dir.replace(serverURL, "")
    var makeURL = serverURL + "/_make/" + buildPath + "?target=" + pdf.replace(/.*\//,"")
    
    var resp = await fetch(makeURL, {})
    
    var result = await resp.text()

    var logUniqId = "LaTexLog"
    var log = document.body.querySelector("#" + logUniqId)
    if (log) {
      log.value = result
      var show = lively.showElement(log)
      show.style.border = "1px solid green"

    } else {
      lively.notify("LaTeX", "finished", 10, async () => {
        var log = await lively.openComponentInWindow("lively-code-mirror")
        log.mode =  "text"
        log.id = logUniqId
        log.parentElement.setAttribute("title", "LaTexLog")
        log.value = "" + result
      })      
    }
     
    var pdfContainers = lively.queryAll(document.body, "lively-container").filter(ea => ea.getURL().toString() == pdf)
    pdfContainers.forEach(async ea => {
      var preserveContentScroll = ea.get("#container-content").scrollTop;
      var pdf = ea.getContentRoot().querySelector("lively-pdf")
      var page = pdf.getCurrentPage()
      await pdf.setURL(ea.getURL().toString())
      await pdf.pdfLoaded
      await lively.sleep(500) // #TODO fuck it... page loading seems not be finished, even if PDF.js said so
      
      if (page) pdf.setCurrentPage(page)
      lively.notify("page " + page)
      ea.get("#container-content").scrollTop = preserveContentScroll
    })
    
    if (pdfContainers.length == 0) {
      lively.notify("LaTeX", "view pdf", undefined, () => {
        lively.openBrowser(pdf)
      })
    }  
  }
  
  // #important
  async onSave(doNotQuit) {
    if (this.isCurrentlySaving) {
      lively.warn("WARNING: editor is still saving...", "but here we go")
    }
    try {
      this.isCurrentlySaving = true
      var url = this.getURL()
      url = url.toString().replace(/#.*/, ""); // strip anchors while saving and loading files
      if (!this.isEditing()) {
        await this.saveEditsInView();
        return;
      }

      if (this.getURL().pathname.match(/\/$/)) {
        await files.saveFile(url,"");
        return;
      }
      this.get("#editor").setURL(url);
      await this.get("#editor").saveFile()
      this.__ignoreUpdates = true // #LiveProgramming #S3 don't affect yourself...
      this.parentElement.__ignoreUpdates = true
      var sourceCode = this.getSourceCode();
      // lively.notify("!!!saved " + url)
      window.LastURL = url
      // lively.notify("update file: " + this.getURL().pathname + " " + this.getURL().pathname.match(/css$/))
      if (this.getURL().pathname.match(/\.css$/)) {
        this.updateCSS();
      } else if (await this.isTemplate(url)) {
        lively.notify("update template")
        if (url.toString().match(/\.html/)) {
          // var templateSourceCode = await fetch(url.toString().replace(/\.[^.]*$/, ".html")).then( r => r.text())
          var templateSourceCode = sourceCode

          await lively.updateTemplate(templateSourceCode, url.toString());

        }
      } else if (this.getURL().pathname.match(/\.md$/)){
          var m = sourceCode.match(/markdown-config .*latex\=([^ ]*)/)
          if (m) {
            var dir = this.normalizeURL(this.getDir() + m[1])

            var m2 = sourceCode.match(/markdown-config .*pdf\=([^ ]*)/)
            if (m2) {
              var pdf = this.normalizeURL(this.getDir() + m2[1])          
            }
            this.buildLatex(dir, pdf)
          }
      }
      this.updateOtherContainers();

      var moduleName = this.getURL().pathname.match(/([^/]+)\.js$/);
      if (moduleName) {
        moduleName = moduleName[1];

        const testRegexp = /((test\/.*)|([.-]test)|([.-]spec))\.js/;
        if (this.lastLoadingFailed) {
          console.log("last loading failed... reload")
          await this.reloadModule(url); // use our own mechanism...
        } else if (this.getURL().pathname.match(testRegexp)) {
          await this.loadTestModule(url);
        } else if (this.get("#live").checked) {
          // lively.notify("load module " + moduleName)
          await this.loadModule("" + url)
          console.log("START DEP TEST RUN")
          lively.findDependedModules("" + url).forEach(ea => {
            if (ea.match(testRegexp)) {
              this.loadTestModule(ea);
            }
          })
          console.log("END DEP TEST RUN")
        } else {
          lively.notify("ignore module " + moduleName)
        }
      }
      // this.showNavbar();
      this.updateNavbarDetails()
      
      // something async... 
      lively.sleep(5000).then(() => {
        this.__ignoreUpdates = false
        this.parentElement.__ignoreUpdates = false
      })
    } finally {
      // finished saving
      this.isCurrentlySaving = false
    }
  }
  
  onNewfile() {
    this.newFile(this.getPath())
  }

  async onNewdirectory() {
    this.newDirectory(this.getPath())
  }
  



  onVersions() {
    this.get("#editor").toggleVersions();
  }

  onAccept() {
    this.onSave().then((sourceCode) => {
      this.setAttribute("mode", "show");
      this.setPath(this.getPath());
      this.hideCancelAndSave();
    });
  }

  
  async onTextChanged() {
    if (!this.getURL().pathname.match(/\.js$/)) {
      return
    }
  }

  onHTMLMutation(mutations, observer) {
    if (this.isPersisting) return // we mutate while persisting

    mutations.forEach(record => {

      var indicator = this.get("#changeIndicator")
      if (indicator ) {
        indicator.style.backgroundColor = "rgb(250,250,0)";
      }

      // if (record.target.id == 'console'
      //     || record.target.id == 'editor') return;

      this.contentChangedDelay()

      // let shouldSave = true;
      if (record.type == 'childList') {
      //     let addedNodes = [...record.addedNodes],
      //         removedNodes = [...record.removedNodes],
      //         nodes = addedNodes.concat(removedNodes);

      //     //removed nodes never have a parent, so remeber orphans when they are created
      //     for (let node of addedNodes) {
      //         if (hasParentTag(node) == false) {
      //             orphans.add(node);
      //         }
      //     }

      //     // shouldSave = hasNoDonotpersistFlagInherited(addedNodes) || checkRemovedNodes(removedNodes, orphans);

      //     //remove removed orphan nodes from orphan set
      //     for (let node of removedNodes) {
      //         if (orphans.has(node)) {
      //             orphans.delete(node);
      //         }
      //     }
      }
      else if (record.type == 'attributes'
          || record.type == 'characterData') {


          // shouldSave = hasNoDonotpersistFlagInherited([record.target]);
      }

      // if (shouldSave) {
          // sessionStorage["lively.scriptMutationsDetected"] = 'true';
          // restartPersistenceTimerInterval();
      // }
    })
  }

  onEditorCursorActivity(cm) {
     if(this.getURL().pathname.match(/.*\.md/)) {
      var url = this.getURL()
      var otherContainer = this.getOtherContainers()[0]
      var markdown = otherContainer && otherContainer.get("lively-markdown")
      if (markdown) {
        this.onMarkdownEditorCursorActivity(cm, markdown)
      }
    }
     
  }
  
  
  /*MD ## Render Content MD*/

  async appendMarkdown(content, renderTimeStamp) {
    this.clear()
    var md = await lively.create("lively-markdown", this.getContentRoot())
    // md.setAttribute("data-lively4-donotpersist", true) // will be thrown away after loading anyway, #DoesNotWork
    if (renderTimeStamp && this.renderTimeStamp !== renderTimeStamp) {
      return md.remove()
    }
    md.classList.add("presentation") // for the presentation button
    md.getDir = this.getDir.bind(this);
    md.followPath = this.followPath.bind(this);
    await md.setContent(content)
    if (md.getAttribute("mode") == "presentation") {
      var presentation = await md.startPresentation()
      if (this.lastPage) {
        presentation.gotoSlideAt(this.lastPage)
      }
    }
    if (this.wasContentEditable) {
      md.contentEditable = true
    }

    // get around some async fun
    if (this.preserveContentScroll !== undefined) {
      this.get("#container-content").scrollTop = this.preserveContentScroll
      delete this.preserveContentScroll
    }
    
    var contentRoot = md.get("#content")
    
    contentRoot.querySelectorAll(`input[type="checkbox"]`).forEach(ea => {
      if (!ea.parentElement.classList.contains("task-list-item")) {
        return;
      }      
      lively.addEventListener("input", ea, "click", async evt => {
        ea.checked = !ea.checked
        this.markdownCheckCheckboxAndSave(ea)
        var highlight = lively.showElement(ea.parentElement)
        highlight.innerHTML = `<br><span style="background:white">SAVE...</span>`
        highlight.style.border = "1px solid green"
        highlight.style.color = "green"
        
      })  
    })
    await lively.sleep(500) // wait for renderer to get some positions to scroll to....
    this.scrollToAnchor(this.anchor)
  }

  
  
  
  appendLivelyMD(content, renderTimeStamp) {
    content = content.replace(/@World.*/g,"");
    content = content.replace(/@+Text: name="Title".*\n/g,"# ");
    content = content.replace(/@+Text: name="Text.*\n/g,"\n");
    content = content.replace(/@+Text: name="Content.*\n/g,"\n");
    content = content.replace(/@+Box: name="SteppingWordCounter".*\n/g,"\n");
    content = content.replace(/@+Text: name="MetaNoteText".*\n(.*)\n\n/g,  "<i style='color:orange'>$1</i>\n\n");
    content = content.replace(/@+Text: name="WordsText".*\n.*/g,"\n");

    this.appendMarkdown(content, renderTimeStamp);
  }

  async appendScript(scriptElement) {
    
    throw new Error("appendScript is disabled because of Zones")
    
    
    // #IDEA by instanciating we can avoid global (de-)activation collisions
    // Scenario (A) There should be no activation conflict in this case, because appendScript wait on each other...
    // Scenario (B)  #TODO opening a page on two licely-containers at the same time will produce such a conflict.
    // #DRAFT instead of using ScopedScripts as a singleton, we should instanciate it.
    if (!ScopedScripts) {
      ScopedScripts = await System.import("src/client/scoped-scripts.js").then(m => m.default)
    }
    var layers = ScopedScripts.layers(this.getURL(), this.getContentRoot());
    ScopedScripts.openPromises = [];
    return new Promise((resolve, reject)=> {
      var root = this.getContentRoot();
      var script   = document.createElement("script");
      script.type  = "text/javascript";

      layers.forEach( ea => ea && ea.beGlobal());

      if (scriptElement.src) {
        script.src  = scriptElement.src;
        script.onload = () => {
          // #WIP multiple activations are not covered.... through this...
          Promise.all(ScopedScripts.openPromises).then(() => {
            layers.forEach( ea => ea && ea.beNotGlobal());
            // console.log("ScopedScripts openPromises: " + ScopedScripts.openPromises)
            resolve();
          }, reject);
        };
        script.onerror = reject;
      }
      script.text  = scriptElement.textContent;

      cop.withLayers(layers, () => {
        try {
          root.appendChild(script);
        } catch(e) {
          console.error(e)  
        }
      });
      if (!script.src) {
        Promise.all(ScopedScripts.openPromises).then(() => {
          layers.forEach( ea => ea && ea.beNotGlobal());
          // console.log("ScopedScripts openPromises: " + ScopedScripts.openPromises)
          resolve();
        }, reject);
      }
    })

  }

  async appendHtml(content, renderTimeStamp) {
    if (renderTimeStamp && this.renderTimeStamp !== renderTimeStamp) {
      return 
    }
    // strip lively boot code...

    // content = content.replace(/\<\!-- BEGIN SYSTEM\.JS(.|\n)*\<\!-- END SYSTEM.JS--\>/,"");
    // content = content.replace(/\<\!-- BEGIN LIVELY BOOT(.|\n)*\<\!-- END LIVELY BOOT --\>/,"");

    this.clear(); 
    
    if (content.match("<template") && this.getURL().pathname.match("html$")) {

      content = "<pre><code> " + content.replace(/</g,"&lt;") +"</code></pre>"
    }


    if (content.match(/<script src=".*d3\.v3(.min)?\.js".*>/)) {
      if (!window.d3) {
        console.log("LOAD D3");
        // #TODO check if dealing with this D3 is covered now through our general approach...
        await lively.loadJavaScriptThroughDOM("d3", "src/external/d3.v3.js");
      }

      if (!window.ScopedD3) {
        console.log("LOAD D3 Adaption Layer");
        await System.import("src/client/container-scoped-d3.js")
        ScopedD3.updateCurrentBodyAndURLFrom(this);
        // return this.appendHtml(content) // try again
      }
    }

    if (content.match(/<script src=".*cola(\.min)?\.js".*>/)) {
        console.log("LOAD Cola");
        await lively.loadJavaScriptThroughDOM("cola", "src/external/cola.js")
    }

    //  var content = this.sourceContent
    try {
      var root = this.getContentRoot();
      var nodes = lively.html.parseHTML(content, document, true);
      if (nodes[0] && nodes[0].localName == 'template') {
      	// lively.notify("append template " + nodes[0].id);
		    return this.appendTemplate(nodes[0].id);
      }
      lively.html.fixLinks(nodes, this.getDir(),
        (path) => this.followPath(path));
      for(var ea of nodes) {
        if (ea && ea.tagName == "SCRIPT") {
          try {
            // await this.appendScript(ea);
            console.warn("script loading not supported")
          } catch(e) {
            console.error(e)
          }
        } else {
          root.appendChild(ea);
          if (ea.querySelectorAll) {
            for(var block of ea.querySelectorAll("pre code")) {
              highlight.highlightBlock(block);
            }
            // now we can use the structural information we got from the highlighter
            for(var comment of ea.querySelectorAll(".hljs-comment")) {
              var markdownMatch = comment.textContent.match(/^\/\*MD((.|\n)*)MD\*\/$/)
              if (markdownMatch) {
                  //source.startsWidth("/*MD") && source.endsWidth("MD*/")
                var markdown = await (<lively-markdown>{markdownMatch[1]}</lively-markdown>)
                comment.innerHTML = ""
                comment.appendChild(markdown)
                await markdown.updateView()
                markdown.style.whiteSpace = "normal" // revert effect of outside `pre` tag 
                markdown.style.display = "inline-block"
                // markdown.style.border = "2px solid blue"
                // markdown.style.backgroundColor = "lightgray"
                
                lively.html.fixLinks(markdown.shadowRoot.querySelectorAll("[href],[src]"), 
                                    this.getURL().toString().replace(/[^/]*$/,""),
                                    url => this.followPath(url))
              }
            }
            
          }
        }
      }
     
      
      await components.loadUnresolved(root, false, "container.js", true);
      
      lively.clipboard.initializeElements(root.querySelectorAll("*"))
      
      if (nodes.length == 1 
          && (nodes[0].localName == "lively-window" || nodes[0].classList.contains("lively-content"))) {
        lively.setPosition(nodes[0], pt(0,0))
      }
      
    } catch(e) {
      console.log("Could not append html:" + content.slice(0,200) +"..." +" ERROR:", e);
    }

    // get around some async fun
    if (this.preserveContentScroll !== undefined) {
      this.get("#container-content").scrollTop = this.preserveContentScroll
      delete this.preserveContentScroll
    }

    
    // this is bad and breaks layout 100% layout....
    // ViewNav.enable(this)

    
    // await lively.sleep(500) // wait for renderer to get some positions to scroll to....
    this.scrollToAnchor(this.anchor)
    
    setTimeout(() => {
      this.resetContentChanges()
      this.observeHTMLChanges()
    }, 0)
    
  }

  async appendCSV(content, renderTimeStamp) {
    var container= this.getContentRoot(); 
    var table = await lively.create("lively-table")
    table.setFromCSV(content)
    
    if (renderTimeStamp && this.renderTimeStamp !== renderTimeStamp) {
      return 
    }
    container.appendChild(table)
  }


  async appendTemplate(name, renderTimeStamp) {
    try {
    	var node = lively.components.createComponent(name);
    	if (renderTimeStamp && this.renderTimeStamp !== renderTimeStamp) {
        return 
      }
      this.getContentRoot().appendChild(node);
      await lively.components.loadByName(name);
      
    } catch(e) {
      console.log("Could not append html:" + content);
    }
  }

  
  /*MD ## Navbar MD*/

  clearNavbar() {
    var container = this.get('#container-leftpane');
    container.clear()
    return container;
  }

  hideNavbar() {
    if (lively.getExtent(this.navbar()).x > 1 ) {
      this.get('lively-separator').onClick()
    }
  }
  
  navbar() {
    return this.get('#container-leftpane')
    
  }
  
  async showNavbar() {
    // this.get('#container-leftpane').style.display = "block";
    // this.get('lively-separator').style.display = "block";

    var navbar = this.navbar()
    // implement hooks
    navbar.deleteFile = (url, urls) => { this.deleteFile(url, urls) }
    navbar.renameFile = (url) => { this.renameFile(url) }
    navbar.newFile = (url, type) => { this.newFile(url, type) }
    navbar.newDirectory = (url, type) => { this.newDirectory(url, type) }
    navbar.followPath = (path, lastPath) => { 
      this.contextURL = lastPath
      this.followPath(path) 
    }
    navbar.navigateToName = (name, data) => { this.navigateToName(name, data) }

    await navbar.show && navbar.show(this.getURL(), this.content, navbar.contextURL, false, this.contentType)
  }

  
    
  async updateNavbarDetails() {
    var navbar = this.navbar()
    navbar.sourceContent = this.getSourceCode()
    navbar.showDetailsContent()
  }
  /*MD ## Controls MD*/

  toggleControls() {
    var showsControls = this.get("#container-navigation").style.display  == "none"
    if (showsControls) {
      this.showControls();
    } else {
      this.hideControls();
    }
    // remember the toggle fullscreen in the url parameters
    var path = this.getPath()
    if (this.useBrowserHistory()) {
      window.history.pushState({ followInline: true, path: path }, 'view ' + path,
        window.location.pathname + "?edit=" + path  + "&fullscreen=" + !showsControls);
    }
  }

  hideControls() {
    this.setAttribute("controls","hidden")
    this.get("#fullscreenInline").style.display = "block"
    this.get("#container-navigation").style.display  = "none";
    this.get("#container-leftpane").style.display  = "none";
    this.get("#container-rightpane").style.flex = 1
    this.get("lively-separator").style.display  = "none";
  }

  showControls() {    this.getAttribute("controls")
    this.setAttribute("controls","shown")
    this.get("#fullscreenInline").style.display = "none"
    this.get("#container-navigation").style.display  = "";
    this.get("#container-leftpane").style.display  = "";
    
    this.get("#container-leftpane").style.flex = 20
    this.get("#container-rightpane").style.flex = 80
    this.get("lively-separator").style.display  = "";
  }
  
  /*MD ## Edit MD*/
  
  async editFile(path) {
    // console.log("[container] editFile " + path)
    this.setAttribute("mode","edit"); // make it persistent
    
    
    if (!path) path = this.getPath()
    
    if(path) await this.setPath(path, true /* do not render */) 
    
    this.clear();
    var urlString = this.getURL().toString().replace(/[#?].*/,"");
    
    var containerContent=  this.get('#container-content');
    containerContent.style.display = "none";
    var containerEditor =  this.get('#container-editor');
    containerEditor.style.display = "block";


    this.resetLoadingFailed();

    this.showNavbar();

    
    
    // console.log("[container] editFile befor getEditor")
    // ... demos\/
    var editorType = urlString.match(/babylonian-programming-editor\/demos\/.*\js$/) ? "babylonian-programming-editor" : "lively-editor";

    if (urlString.match(/\.js$/i) && lively.preferences.get("BabylonianProgramming")) {
      editorType = "babylonian-programming-editor"
    }
    
    if (this.sourceContent && this.sourceContent.match('^.*"enable examples"')) {
      editorType = "babylonian-programming-editor"
    }
    
    if (urlString.match(/((png)|(jpe?g)|(gif))$/i)) {
      editorType = "lively-image-editor"
    }

    if (urlString.match(/((shadama))$/i)) {
      editorType = "lively-shadama-editor"
    }
    
    var livelyEditor = await this.getEditor(editorType)
      // console.log("[container] editFile got editor ")
    
    if (livelyEditor.awaitEditor) {
      await livelyEditor.awaitEditor()
      var codeMirror = livelyEditor.livelyCodeMirror();

      codeMirror.addEventListener("change", evt => this.onTextChanged(evt))      
    }

    var url = this.getURL();
    livelyEditor.setURL(url);
    // console.log("[container] editFile setURL " + url)
    if (codeMirror) {
      if (codeMirror.editor && codeMirror.editor.session) {
        codeMirror.editor.session.setOptions({
          mode: "ace/mode/javascript",
          tabSize: indentationWidth(),
          useSoftTabs: true
        });
      }
      codeMirror.changeModeForFile(url.pathname);

      // NOTE: we don't user loadFile directly... because we don't want to edit PNG binaries etc...
      if (urlString.match(/\.svg$/)) {
        this.sourceContent  = await fetch(urlString).then(r => r.text())
      }
      
      livelyEditor.setText(this.sourceContent); // directly setting the source we got
      if (livelyEditor.checkAndLoadAnnotations) {
        await livelyEditor.checkAndLoadAnnotations()
      }

      if (codeMirror.editor) {
        if (!codeMirror.tagName == "LIVELY-CODE-MIRROR") {
          codeMirror.editor.selection.moveCursorTo(0,0);
          var lineWidth = 100
          codeMirror.editor.session.setWrapLimit(lineWidth);
          codeMirror.editor.renderer.setPrintMarginColumn(lineWidth)
        }
      }
    }

    livelyEditor.lastVersion = this.lastVersion;
    this.showCancelAndSave();

    if (codeMirror) {
      const cmURL = "" + url;
      if (cmURL.match(/\.((js)|(py))$/)) {
        codeMirror.setTargetModule("" + url); // for editing
      }
      
      // preload file for autocompletion
      if (cmURL.endsWith('.js')) {
        codeMirror.ternWrapper.then(tw => tw.request({
          files: [{
            type: 'full',
            name: codeMirror.getTargetModule(),
            text: codeMirror.value
          }]
        }));
      }
      
      if (this.anchor) {
        this.scrollToAnchor(this.anchor)
      }
    }

  }

  getHTMLSource() {
    this.getContentRoot().querySelectorAll("*").forEach( ea => {
      if (ea.livelyPrepareSave)
        ea.livelyPrepareSave();
    });
    return this.getContentRoot().innerHTML
  }

  /*MD ## Save Content MD*/
  
  saveSource(url, source) {
    return this.getEditor().then( editor => {
      editor.setURL(url);
      editor.setText(source);
      editor.lastVersion = this.lastVersion;
      editor.saveFile().then( () => {
        this.lastVersion = editor.lastVersion
        // #TODO we should update here after conflict resolution?
        this.updateOtherContainers()
      }).then(() => {
        this.resetContentChanges()
        lively.notify("saved content!")
      })
    });

  }

  async saveHTML(url) {
    return this.saveSource(url, this.getHTMLSource());
  }

  async saveMarkdown(url) {
    var markdown =  await this.get("lively-markdown")
    if (markdown.getAttribute("mode") == "presentation") {
      lively.notify("saving in presentation mode not supported yet")
    } else {
      var source = await markdown.htmlAsMarkdownSource()
      return this.saveSource(url, source);
    }   
  }

  async saveEditsInView(url) {
    url = (url || this.getURL()).toString();
    var contentElement = this.getContentRoot()
    if (url.match(/template.*\.html$/)) {
        return lively.notify("Editing templates in View not supported yet!");
    } else if (url.match(/\.html$/)) {
      this.saveHTML(new URL(url)).then( () => {
        // lively.notify({
        //   title: "saved HTML",
        //   color: "green"});
       });
    } else if (url.match(/\.md$/)) {
      this.saveMarkdown(new URL(url)).then( () => {
        // lively.notify({
        //   title: "saved HTML",
        //   color: "green"});
       });
    } else if (contentElement && contentElement.childNodes[0] && contentElement.childNodes[0].livelySource) {
      var source = contentElement.childNodes[0].livelySource()
      if (source.then) source = await source; // maybe some elements take a while to generate their source
      return this.saveSource(url, source);
    } else {
      lively.notify("Editing in view not supported for the content type!");
    }

  }

  unsavedChanges() {
    var url = this.getURL()
    if (!url) return false;
    if (url.toString().match(/\/$/)) return false // isDirectory...
    
    var editor = this.get("#editor");
    if (!editor) return this.contentChanged;
    return  editor.textChanged;
  }  
  /*MD ## ContentChange MD*/

  checkForContentChanges() {
    
    if (!this.contentIsEditable()) {
      this.contentChanged = false
      return
    }
    
    // don't know how to check for edits here... 
    if (!this.isEditing() && this.getURL().pathname.match(/\.md$/)) {
      this.contentChanged = false
      return
    }
    

    if (this.isPersisting) return;
    this.isPersisting = true;
    // console.log("checkForContentChanges " + (Date.now() - this.lastChecked) + "ms " + document.activeElement)
    this.lastChecked = Date.now()

    try {
      window.oldActiveElement = document.activeElement
      var currentSource = this.getHTMLSource()

      if (!this.lastSource || this.lastSource != currentSource) {
        this.contentChanged = true
      } else {
        this.contentChanged = false
      }
      this.updateChangeIndicator()
    } finally {
      // setTimeout(() => {
        // console.log("refocus " + oldActiveElement)

        if (oldActiveElement && oldActiveElement.editor) oldActiveElement.editor.focus()

        // we don't want to catch our own mutations... that were cause
        // by detecting some mutations in the first place
        this.isPersisting = false
      // }, 0)
    }
  }

  resetContentChanges() {
    this.lastSource  =  this.getHTMLSource();
    this.contentChanged = false
    this.updateChangeIndicator()
  }

  updateChangeIndicator() {
    var indicator = this.get("#changeIndicator")
    if (indicator && this.contentChanged) {
      indicator.style.backgroundColor = "rgb(220,30,30)";
    } else {
      indicator.style.backgroundColor = "rgb(200,200,200)";
    }
  }

 

  
  /*MD ## Focus / Scroll / Navigation MD*/
  
  focus() {
    const livelyCodeMirror = this.getLivelyCodeMirror();
    if (livelyCodeMirror) { 
      livelyCodeMirror.focus(); 
    } else {
      this.get("lively-container-navbar").focus()  
    }
  }
  
  async navigateToName(name, data) {
    // lively.notify("navigate to " + name);
    var baseURL = this.getURL().toString().replace(/\#.*/,"")
    var anchor = "#" + encodeURIComponent(name.replace(/# ?/g,"").replace(/\*/g,""))
    var nextURL = baseURL + anchor
    var codeMirrorComp = this.getLivelyCodeMirror()
    
    this.setPathAttributeAndInput(nextURL)
    this.history().push(nextURL);
      
    
    if (codeMirrorComp) {
      if (data && data.start) { // we have more information
        // can't use this.getSourceCode() because it may be different saved one
        var savedSourceCode = await fetch("cached://" + data.url).then(r => r.text())
        
        codeMirrorComp.scrollToCodeElement(data, savedSourceCode)
      } else {
        codeMirrorComp.find(name);
      }
    } else {      
      
      this.scrollToAnchor(anchor, true)
    }
  }
  

  /*MD ## UI MD*/


  clear() {
    this.clearLoadingInfo()
    this.getContentRoot().innerHTML = '';
    // Array.from(this.get('#container-content').childNodes)
    //   .filter( ea => ea.id !== "container-root")
    //   .forEach(ea => ea.remove());
    this.get('#container-editor').innerHTML = '';
  }


  
  hideCancelAndSave() {
    return;
    _.each(this.shadowRoot.querySelectorAll(".edit"), (ea) => {
      ea.style.visibility = "hidden";
      ea.style.display = "none";
    });
    _.each(this.shadowRoot.querySelectorAll(".browse"), (ea) => {
      ea.style.visibility = "visible";
      ea.style.display = "inline-block";
    });
  }

  showCancelAndSave() {
    return;
    _.each(this.shadowRoot.querySelectorAll(".browse"), (ea) => {
      ea.style.visibility = "hidden";
      ea.style.display = "none";
    });
    _.each(this.shadowRoot.querySelectorAll(".edit"), (ea) => {
      ea.style.visibility = "visible";
      ea.style.display = "inline-block";
    });

  }
  
  async switchBetweenJSAndHTML() {
    const ending = this.getPath().replace(/[#?].*/,"")::fileEnding();
    if(ending === 'js' || ending === 'html') {
      const targetURLString = this.getPath()::replaceFileEndingWith(ending === 'js' ? 'html' : 'js');
      const existingContainer = Array.from(document.body.querySelectorAll('lively-container'))
        .find(container => container.getPath().match(targetURLString));
      if(existingContainer) {
        lively.gotoWindow(existingContainer.parentElement, true);
        existingContainer.focus();
      } else {
        lively.openBrowser(targetURLString, true)
          .then(browser => browser.focus());
      }
    }
  }  
  
  // #private
  async updateFavInfo() {
    const starIcon = this.get('#favorite').querySelector('i');

    if (await Favorites.has(this.getPath())) {
      starIcon.classList.add('fa-star');
      starIcon.classList.remove('fa-star-o');
    } else {
      starIcon.classList.add('fa-star-o');
      starIcon.classList.remove('fa-star');
    }
  }
  
  observeHTMLChanges() {
    if (this.mutationObserver) this.mutationObserver.disconnect()
    this.mutationObserver = new MutationObserver((mutations, observer) => {
        this.onHTMLMutation(mutations, observer)
    });
     this.mutationObserver.observe(this, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true});
  }
  /*MD ## Update External Content MD*/
  
  updateCSS() {
    var url = "" + this.getURL()
    
    console.log('[container] updateCSS ', url)
    
    var all = Array.from(lively.allElements(true))
    all.push(...document.head.querySelectorAll("link"))
    
    Object.values(lively.components.templates).forEach(template => {
      all.push(...template.querySelectorAll("*"))      
    })
    
    all.filter(ea => ea.localName == "link")
      .filter(ea => ea.href == url)
      .forEach(ea => {
        var parent = ea.parentElement
        ea.remove()
        parent.appendChild(ea)
        lively.notify("update css",  ea.href)
      })
    
    all.filter(ea => ea.localName == "style") 
      .filter(ea => ea.getAttribute("data-url") == url) // vs. this.getAttribute("data-src")
      .forEach(ea => {
        lively.fillTemplateStyle(ea, url)
        lively.notify("update style css", url)
      })
  }

  updateOtherContainers(url="" + this.getURL()) {
    console.warn('updateOtherContainers')
    document.body.querySelectorAll('lively-container').forEach(ea => {
      if (ea !== this && !ea.isEditing()
        && ("" +ea.getURL()).match(url.replace(/\.[^.]+$/,""))) {
        console.log("update container content: " + ea);
        ea.setPath(ea.getURL() + "");        
      }
    });
    
    updateEditors(url, [this.get("lively-editor")])
  }
  
  /*MD ## Content Navigation MD*/
  
  async scrollToAnchor(anchor, preventRecursion=false) {
    if (anchor) {
      var name = decodeURI(anchor.replace(/#/,"")).replace(/\n/g,"")
      if (this.isEditing()) {
        
        // use Navbar and it's structural knowledge to find the right name
        var codeMirror = (await this.asyncGet("#editor")).currentEditor();
        var navbar = await this.asyncGet("lively-container-navbar")
        await lively.waitOnQuerySelector(navbar.shadowRoot, "#details ul li") // wait for some content
        var item = navbar.detailItems.find(ea => ea.name == name)
        if (item && !preventRecursion) {
          // #Issue... endless recursion here....
          navbar.onDetailsItemClick(item, new CustomEvent("nothing"))
        }
        return
      }
      
      // markdown specific ?
      var md = this.getContentRoot().querySelector("lively-markdown")
      if (md) {
        var root = md.shadowRoot
      } else {
        root = this.getContentRoot()
      }
          
      var presentation = md && md.get("lively-presentation")
      var pageNumberMatch = name.match(/^\@([0-9]+)$/)
      if (presentation && pageNumberMatch) {
        presentation.gotoSlideAt(parseInt(pageNumberMatch[1]))
        return
      }      
      
      // Special Case:
      
      // 1. search by id
      try {
        var element = root.querySelector(`#${name.replace(/"/g,"%22").replace(/%2F/g,"\\/")}`)
      } catch(e) {
        // ignore
      }
      // 2. search for exactly matching anchors
      if (!element) {
        element = root.querySelector(`a[name="${name.replace(/"/g,"%22")}"]`)
      }
      // 3. brute force search for headings with the text
      if (!element) {
        element = _.find(root.querySelectorAll("h1,h2,h3,h4"), ea => ea.textContent == name)
      }
            
      // 4. ok, try fulltext search
      if (!element) { 
        
        // search for the text nodes because they are the smallest entities and go to a nearby entity..
        var node = lively.allTextNodes(root).find(ea => ea.textContent.match(Strings.escapeRegExp(name)))
        // going one level up will go to far... in most cases
        // so we cannot do: element = node.parentElement 
        if (node) element = node.previousElementSibling // instead we go sideways
      }
      if (element) {
        // var element = that
        var slide = lively.allParents(element).find(ea => ea.classList.contains("lively-slide"))
        
        if (presentation && slide) {
          console.log('goto slide ', slide)
          presentation.setSlide(slide)
        }
        
        // await lively.sleep(500)
        // a very hacky way to somehow find the position where to scroll
        this.get("#container-content").scrollTop = 0 
        var offset = lively.getGlobalPosition(element).subPt(
          lively.getGlobalPosition(this.get("#container-content")))
        this.get("#container-content").scrollTop = offset.y
      }
    }    
  }
  
 
  /*MD ## Helper MD*/
  
  becomeMainContainer() {
    this.__ignoreUpdates = true; // a hack... since I am missing DevLayers...
    this.get('#container-content').style.overflow = "visible";
    
    this.parentElement.toggleMaximize()
    this.parentElement.hideTitlebar()
    this.parentElement.style.zIndex = 0
    this.parentElement.setAttribute("data-lively4-donotpersist","all");
    
    this.id = 'main-content';
    this.setAttribute("load", "auto");
      
    window.onpopstate = (event) => {
        var state = event.state;
        if (state && state.followInline) {
          console.log("follow " + state.path);
          this.followPath(state.path);
        }
    };
    var path = lively.preferences.getURLParameter("load");
    
    var editPath = lively.preferences.getURLParameter("edit");
    if (editPath) {
      path = editPath
      var edit = true
    }
    
    if (path) {
      // allow nested queries... http://localhost:9005/lively4-core/start.html?load=academic://Tim%20Felgentreff?count=3
      path = window.location.search.replace(/.*[?&]((load)|(edit))=/,"")
    }
  
    
    let fullscreen = lively.preferences.getURLParameter("fullscreen") == "true";
    if (fullscreen) {
      this.onFullscreen() // #TODO replace toggle logic with enableFullscreen, disableFullscreen
    }

    // force read mode
    if(this.getAttribute("mode") == "read" && edit) {
      path = edit;
      edit = undefined;
    }

    if (!path || path == "null") {
      path = lively4url + "/"
    }

    this.viewOrEditPath(path, edit) 
  }

  // #Refactor, currently used by _navigation.html
  // _navigation.html should instead use normal link creation... and we might do magic there?
  // #deprecated #Problem related to html.fixLinks
  createLink(base, name, href) {
    var link = document.createElement("a")
    link.textContent = name
    var path = base + href
    link.href = path
    link.addEventListener("click", (evt) => {
        this.followPath(path);
        evt.preventDefault();
        evt.stopPropagation()
    });
    return link
  }
  
  // #deprecated
  thumbnailFor(url, name) {
    if (name.match(/\.((png)|(jpe?g))$/))
      return "<img class='thumbnail' src='" + name +"'>";
    else
      return "";
  }
  
  listingForDirectory(url, render, renderTimeStamp) {
    return files.statFile(url).then((content) => {
      this.clear()
      if (this.renderTimeStamp !== renderTimeStamp) {
        return 
      }
      var files = JSON.parse(content).contents;
      var index = _.find(files, (ea) => ea.name.match(/^\index\.md$/i));
      if (!index) index = _.find(files, (ea) => ea.name.match(/^index\.html$/i));
      if (!index) index = _.find(files, (ea) => ea.name.match(/^README\.md$/i));
      if (index) {
        // lively.notify("found index" + index)
        // this.contextURL
        
        return this.followPath(url.toString().replace(/\/?$/, "/" + index.name)) ;
      }
      return Promise.resolve(""); // DISABLE Listings

      this.sourceContent = content;

      var fileBrowser = document.createElement("lively-file-browser");
      /* DEV
        fileBrowser = that.querySelector("lively-file-browser")
        url = "https://lively-kernel.org/lively4/"
       */
      if (render) {
        return lively.components.openIn(this.getContentRoot(), fileBrowser).then( () => {
          if (this.renderTimeStamp !== renderTimeStamp) {
            fileBrowser.remove()
            return
          }
          
          // lively.notify("set url " + url)
          fileBrowser.hideToolbar();
          // override browsing file and direcotry
          fileBrowser.setMainAction((newURL) => {
            // lively.notify("go " + newURL)
            this.followPath(newURL.toString());
          });
          fileBrowser.setMainDirectoryAction((newURL) => {
            // lively.notify("go dir " + newURL)
            this.followPath(newURL.toString() + "/");
          });
          fileBrowser.setURL(url);
        });
      } else {
        return ;
      }
    }).catch(function(err){
      console.log("Error: ", err);
      lively.notify("ERROR: Could not set path: " + url,  "because of: ",  err);
    });
  }
  
  // #private
  normalizeURL(urlString) {
    var url = new URL(urlString);
    url.pathname = lively.paths.normalize(url.pathname);
    return  "" + url;
  }
  
  /*MD ## Markdown Source Mapping 
  
  ![](../../../doc/figures/markdown-mapping.drawio)
  
  MD*/
  
  async onMarkdownContextMenu(evt, markdown, elements) {
    let menuItems = [
      ['edit source', () => this.showMarkdownElement(elements[0]), '', ``],
      ['edit', () => this.editMarkdownElement(elements.last, markdown), '', ``],
      ['show annotations', () => this.showMarkdownAnnotations(markdown), '', ``],
    ];
    var checkbox = elements[0].querySelector(`input[type="checkbox"]`)
    if (checkbox) {
      menuItems.push(["check", async () => { 
        this.markdownCheckCheckboxAndSave(checkbox)
      }])
    }
    let menu = await ContextMenu.openIn(document.body, evt, undefined, document.body,  menuItems);
    return false
  }
  
  async markdownCheckCheckboxAndSave(checkbox) {
    var elements = lively.allParents(checkbox).filter(ea => ea.getAttribute("data-source-line"))
    checkbox.checked = !checkbox.checked
    if (checkbox.checked) {
      checkbox.setAttribute("checked", undefined)
    } else {
      checkbox.removeAttribute("checked")
    }
    var source = await this.elementToMarkdown(elements.last)
    var range = this.getMarkdownRange(elements.last)
    this.saveRegionWithEditor(this.getURL(), range, source)   
  }
  
  
  getMarkdownRange(element) {
    var sourceLine = element.getAttribute("data-source-line")
    return sourceLine && sourceLine.split("-").map(n => parseFloat(n))
  }
  
  setMarkdownRange(element, range) {
    element.setAttribute("data-source-line", range[0] + "-" +  range[1])
  }
  
  
  onMarkdownEditorCursorActivity(cm, markdown) {
    var line = cm.getCursor().line + 1
    var root = markdown.get("#content")
    var highlights = markdown.get("#highlights")
    
    var elements = root.querySelectorAll(`[data-source-line]`).filter(ea => {
      var range = this.getMarkdownRange(ea)
      return (range[0] == line) // && (line < range[1])
    })
    if (elements.length > 0) {
      var element = Array.from(elements).last
      var slide = lively.allParents(element).find(ea => ea.classList.contains("lively-slide"))

      if (slide) {
        var presentation = lively.allParents(element).find(ea => ea.localName == "lively-presentation")
        if (presentation) presentation.setSlide(slide)  
      }

      if (this.lastEditCursorHighlight ) this.lastEditCursorHighlight.remove()
      this.lastEditCursorHighlight = lively.showElement(element)
      this.lastEditCursorHighlight.style.borderColor = "rgba(0,0,200,0.5)"
      this.lastEditCursorHighlight.innerHTML = ""
      highlights.appendChild(this.lastEditCursorHighlight)
      this.lastEditCursorHighlight
      lively.setGlobalPosition(this.lastEditCursorHighlight, lively.getGlobalPosition(element))
    }
  }
  
  onMarkdownClick(evt) {
    var markdownElements = evt.composedPath().filter(ea => ea && ea.getAttribute && ea.getAttribute("data-source-line"))
    if (markdownElements.length == 0) return;
    var last = markdownElements.first

    var otherContainer = this.getOtherContainers(true)[0]
    if (otherContainer) {
      this.containerShowMarkdownElement(otherContainer, last)
    }
  }
  
  async showMarkdownElement(element) {
    var otherContainer = this.getOtherContainers(true)[0]
    if (!otherContainer) {
      otherContainer = await lively.openBrowser(this.getURL().toString(), true)
    }
    this.containerShowMarkdownElement(otherContainer, element)
    
  }

  async elementToMarkdown(element) {
    var markdownConverter = new Upndown()
    markdownConverter.tabindent = "  "
    markdownConverter.bullet = "- "
    return markdownConverter.convert(element.outerHTML, {keepHtml: true})
  }
  
  async editMarkdownElement(element, markdown) {
    var source = await this.elementToMarkdown(element)
    var range = this.getMarkdownRange(element)
    var rangeOffset = range[0] - 1
    
    if (this.lastMarkdownWorkspace) {
      if (this.lastMarkdownWorkspace.targetElement) {
        this.lastMarkdownWorkspace.targetElement.style.display = ""
      }
      this.lastMarkdownWorkspace.remove()
    }
    
    
    var workspace = await (<lively-code-mirror mode="gfm"></lively-code-mirror>)
    workspace.targetElement = element
    
    this.lastMarkdownWorkspace = workspace

    
    element.parentElement.insertBefore(workspace, element)
    element.style.display = "none"
    await  workspace.editorLoaded()    
    workspace.value = source
    workspace.focus()
    workspace.registerExtraKeys({
      Enter: async () => {
        await workspace.doSave()
        element.style.display = ""


        var root = <div></div>
            
        // Just a preview... since we have to reload later .... #TODO make the real thing?
        await markdown.renderMarkdown(root, workspace.value)
        Array.from(root.childNodes).forEach(ea  => {
          workspace.parentElement.insertBefore(ea, workspace)

          var tmpRange =  this.getMarkdownRange(ea)
          tmpRange[0] += rangeOffset
          tmpRange[0] += rangeOffset
          this.setMarkdownRange(element, range)
          
          
          // lively.showElement(ea)
        })
        
        // #TODO fix data-source-line ... in elements after this element! or give up and reload!
        this.followPath(this.getURL()) // #GiveUp
        
        element.remove()
        workspace.remove()
      }
    })

    // prevent slide navigation etc....
    workspace.addEventListener("keydown", async (evt) => {
      evt.stopPropagation();
    })
    
    workspace.doSave = async () => {
      lively.notify("save range " + range[0] + "-" + range[1])
      range = await this.saveRegionWithEditor(this.getURL(), range, workspace.value)    
    }
    
  }
  
  async showMarkdownAnnotations(markdown) {
    var url = this.getURL()
    var annotationURL = url.replace(/([?#].*$)/,"") + ".l4a"
    if (await lively.files.exists(annotationURL)) {
      var annotatedText = await AnnotatedText.fromURL(url, annotationURL)
      var root = markdown.get("#content")
      var renderedText = root.textContent

      annotatedText.setText(renderedText)


      for(var ea of annotatedText.annotations) {
        ea.annotateInDOM(root)
      }      
    }
  }
  
  async saveRegionWithEditor(url, range, text) {
    var editor = await lively.create("lively-editor");
    editor.setURL(url)
    await editor.loadFile()
    var cm = editor.currentEditor()
    
    // #Hack... realy hack: preserve trailing lines... because outerHTML and the markdown range only fit roughly 
    var lines = cm.getValue().split("\n")
    var lastRangeLine = range[1] - 2
    if (lines[lastRangeLine] == "") {
      range[1]--
    }
    
    cm.setSelection({line: range[0] - 1, ch:0 }, {line: range[1] - 1, ch:0 })    
    cm.replaceSelection(text + "\n")

    // update element...
    var newRangeHeight = text.split("\n").length
    range[1] = range[0] + newRangeHeight
    editor.saveFile()
    return range
  }
  
  containerShowMarkdownElement(otherContainer, element) {
    var livleyEditor = otherContainer.get('#editor')
    var livleyCodeMirror = livleyEditor && livleyEditor.get('#editor')
    var cm = livleyCodeMirror && livleyCodeMirror.editor

    if (cm) {
      var line = element.getAttribute("data-source-line").split("-")[0]
      // cm.setCursor({line: line - 1, ch: 0}) 
      cm.setSelection({line: line - 1, ch: 0}, {line: line , ch: 0})         
      otherContainer.parentElement.focus()
      otherContainer.focus()
    }
  }
  

  
  
  /*MD ## Lively Hooks MD*/
  
  // #hook make a gloval position relative, so it can be used in local content
  localizePosition(pos) {
    var offsetBounds = this.get('#container-content').getBoundingClientRect();
    return pos.subPt(pt(offsetBounds.left, offsetBounds.top));
  }
  
  // #hook
  livelyAllowsSelection(evt) {
    if (!this.contentIsEditable() || this.isEditing()) return false

    if (evt.composedPath()[0].id == "container-content") return true;

    return false
  }
  
  // #hook
  livelyAcceptsDrop() {
    return this.contentIsEditable() && !this.isEditing()
  }

  // #hook
  livelyPrepareSave() {
    this.setAttribute("leftpane-flex", this.get("#container-leftpane").style.flex)
    this.setAttribute("rightpane-flex", this.get("#container-rightpane").style.flex)
  }

  // #hook
  livelyPreMigrate() {
    // do something before I got replaced
    this.oldContentScroll = this.get("#container-content").scrollTop;
 	  var livelyEditor = this.get("#editor");
    if (livelyEditor) {
      this.oldScrollInfo = livelyEditor.getScrollInfo()
      this.oldCursor = livelyEditor.getCursor()
      this.oldFocused = document.activeElement == this
    }
  }

  // #hook
  async livelyExample() {
    return this.followPath(lively4url + "/README.md")
  }

  // customize clipboard interaction... etc
  // navigating in this multidimensional space can be hard
  // #hook
  livelyTarget() {
    var markdownElement = this.get("lively-markdown")
    if (markdownElement && markdownElement.get) { // maybe not initialized yet.. damn! 
      return markdownElement.get("#content")
    }
    return this
  }
  
  // #hook
  livelyMigrate(other) {
    // other = that

    this._history = other._history;
    this._forwardHistory = other._forwardHistory;
    
    this.isMigrating = true;
    this.preserveContentScroll = other.oldContentScroll;
    var editor = other.get("#editor");
    if (editor) {
      var otherCodeMirror = editor.currentEditor();
      if (otherCodeMirror && otherCodeMirror.selection) {
        var range = otherCodeMirror.selection.getRange();
        var scrollTop = otherCodeMirror.session.getScrollTop();
        this.asyncGet("#editor").then( editor => {
          var thisCodeMirror = editor.currentEditor();
          if (otherCodeMirror && thisCodeMirror) {
            thisCodeMirror.session.setScrollTop(scrollTop);
            thisCodeMirror.selection.setRange(range);
          }
          this.isMigrating = false;
        }).catch(() => {
          // jsut to be sure..
          this.isMigrating = false;
        });
      }
      this.asyncGet("#editor").then( editor => {
        editor.setScrollInfo(other.oldScrollInfo)
      	editor.setCursor(other.oldCursor)
      	if (other.oldFocused) {
      	  // lively.notify("set focus again!")
      	  // setTimeout(() => editor.focus(), 1000)
        }
      })
    } else {
      this.isMigrating = false;
    }
  }
  
}
