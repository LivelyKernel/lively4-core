import Morph from './Morph.js';
import highlight from 'src/external/highlight.js';
import {pt} from 'lively.graphics';

import halo from 'templates/lively-halo.js';


import * as cop  from "src/external/ContextJS/src/contextjs.js"
import ScopedScripts from "./ScopedScripts.js"

export default class Container extends Morph {

  initialize() {
    // this.shadowRoot.querySelector("livelyStyle").innerHTML = '{color: red}'
    
    // there seems to be no <link ..> tag allowed to reference css inside of templates
    // lively.files.loadFile(lively4url + "/templates/livelystyle.css").then(css => {
    //   this.shadowRoot.querySelector("#livelySt\yle").innerHTML = css
    // })
    this.windowTitle = "Browser";
    if (this.isSearchBrowser) {
      this.windowTitle = "Search Browser";
    }

    // make sure the global css is there...
    lively.loadCSSThroughDOM("hightlight", lively4url + "/src/external/highlight.css");

    console.log("Initialize Container");
    
    lively.addEventListener("Container", this, "mousedown", evt => this.onMouseDown(evt));

    // #TODO continue here, halo selection and container do now work yet
    // var halos = halo.halo && halo.halo[0];
    // if (halos)
    //   halos.registerBodyDragAndDrop(this); // for content selection
    if (this.useBrowserHistory()) {
      window.onpopstate = (event) => {
        var state = event.state;
        if (state && state.followInline) {
          console.log("follow " + state.path);
          this.followPath(state.path);
        }
      };
      var path = lively.preferences.getURLParameter("load");
      var edit = lively.preferences.getURLParameter("edit");
      if (path) {
          this.setPath(path);
      } else if (edit) {
          this.setPath(edit, true).then(() => {
            this.editFile();
          });
      } else {
        if (lively4url.match(/github\.io/)) { 
          this.setPath("/"); // the lively4url is not listable
        } else {
          this.setPath(lively4url +"/");
        }
      }
    } else {
    	var src = this.getAttribute("src");
    	if (src) {
    		this.setPath(src).then(() => {
          if (this.getAttribute("mode") == "edit") {
            this.editFile();
      		}
        });
    	}
    }
    

    // #TODO very ugly... I want to hide that level of JavaScript and just connect "onEnter" of the input field with my code
    var input = this.get("#container-path");
    $(input).keyup(event => {
      if (event.keyCode == 13) { // ENTER
        this.onPathEntered(input.value);
      }
    });
    lively.html.registerButtons(this);

    this.addEventListener('contextmenu',  evt => this.onContextMenu(evt), false);
    // this.addEventListener('keyup',   evt => this.onKeyUp(evt));
    this.addEventListener('keydown',   evt => this.onKeyDown(evt));
    this.setAttribute("tabindex", 0)	
    this.hideCancelAndSave()
  }
  
  onContextMenu(evt) {
    // fall back to system context menu if shift pressed
    if (!evt.shiftKey) { 
      evt.preventDefault();
	    lively.openContextMenu(document.body, evt, undefined, this);
	    return false;
    }
  }
    
  useBrowserHistory() {
    return this.getAttribute("load") == "auto";
  }  

  hideCancelAndSave() {
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
    _.each(this.shadowRoot.querySelectorAll(".browse"), (ea) => {
      ea.style.visibility = "hidden";
      ea.style.display = "none";
    });
    _.each(this.shadowRoot.querySelectorAll(".edit"), (ea) => {
      ea.style.visibility = "visible";
      ea.style.display = "inline-block";
    });

  }
  
  history() {
    if (!this._history) this._history = [];
    return this._history;
  }

  forwardHistory() {
    if (!this._forwardHistory) this._forwardHistory = [];
    return this._forwardHistory;
  }

  onKeyDown(evt) {
    var char = String.fromCharCode(evt.keyCode || evt.charCode);
    if (evt.ctrlKey && char == "S") {
      this.onSave();
      evt.preventDefault();
      evt.stopPropagation();
    }
  }

  reloadModule(url) {
    System.import(url.toString()).then( m => {
        this.shadowRoot.querySelector("#live").disabled =false;
        lively.notify({
          title: "Loaded " + url, color: "green"});
        this.resetLoadingFailed();
      }, error => {
        this.loadingFailed(url.toString().replace(/.*\//,""), error);
      });
  }
  
  resetLoadingFailed() {
    // that.resetLoadingFailed()
    // System.import(urlString)
    var urlString = this.getURL().toString();
    if (urlString.match(/\.js$/)) {
      var m = lively.modules.module(urlString);
      this.get("#live").disabled = !m.isLoaded();
    }
    this.lastLoadingFailed = false;
    var b = this.get("#apply"); if (b) b.style.border = "";

  }
  
  loadingFailed(moduleName, err) {
    this.lastLoadingFailed = err;
    this.get("#live").disabled = true;
    this.get("#apply").style.border = "2px solid red";

    lively.notify({
      title: "Error loading module " + moduleName,
      text:  err.toString().slice(0,200),
      color: "red",
      details: err});
    console.error(err);
  }

  openTemplateInstance(url) {
      var name = url.toString().replace(/.*\//,"").replace(/\.html$/,"");
      lively.openComponentInWindow(name);
  }

  onApply() {
    var url = this.getURL().toString();
    if (url.match(/\.js$/))  {
      this.reloadModule(url);
    } else if (url.match(/templates\/.*\.html$/)) {
      this.openTemplateInstance(url);
    } else {
      lively.openBrowser(url);
    }
  }

  async onSync(evt) {
    var comp = lively.components.createComponent("lively-sync");
    var compWindow;
    lively.components.openInWindow(comp).then((w) => {
      compWindow = w;
      lively.setPosition(w, lively.pt(100, 100));
    });
  
    var serverURL = lively4url.match(/(.*)\/([^\/]+$)/)[1];
    comp.setServerURL(serverURL);
    console.log("server url: " + serverURL);
    if (!this.getPath().match(serverURL)) {
      return lively.notify("can only sync on our repositories");
    }
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

  onCancel() {
    if (this.unsavedChanges()) { 
      if (!confirm("There are unsaved changes. Discard them?")) {
        return;
      }
    }
    this.setAttribute("mode", "show");
    this.setPath(this.getPath());
    this.hideCancelAndSave();

  }

  onUp() {
    var path = this.getPath();
    if (path.match(/index\.((html)|(md))/))
      // one level more
      this.followPath(path.replace(/(\/[^/]+\/[^/]+$)|([^/]+\/$)/,"/"));
    else
      this.followPath(path.replace(/(\/[^/]+$)|([^/]+\/$)/,"/"));
  }

  onBack() {
    if (this.history().length < 2) {
      lively.notify("No history to go back!");
      return;
    }
    var url = this.history().pop();
    var last = _.last(this.history());
    // lively.notify("follow " + url)
    this.forwardHistory().push(url);
    this.followPath(last);
  }
  
  onMouseDown(evt) {
    if (halo.halo && halo.halo[0])
      halo.halo[0].onBodyMouseDown(evt, this);
    evt.stopPropagation();
    // evt.preventDefault();
    
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
    var comp = await lively.openComponentInWindow("lively-container")
    comp.editFile("" + url)
  }

  onSaveAs() {
    lively.notify("Save as... not implemented yet")
  }

  onSave(doNotQuit) {
    if (!this.isEditing()) {
      this.saveEditsInView();
      return; 
    }
    
    if (this.getPath().match(/\/$/)) {
      lively.files.saveFile(this.getURL(),"");
      return;
    }
    this.get("#editor").setURL(this.getURL());
    
    return this.get("#editor").saveFile().then( () => {
      var sourceCode = this.get("#editor").currentEditor().getValue();
      if (this.getPath().match(/templates\/.*html/)) {
        lively.updateTemplate(sourceCode);
      }
      var url = this.getURL();
      
      document.body.querySelectorAll('lively-container').forEach(ea => {
        var url = "" + this.getURL();
        if (ea !== this && !ea.isEditing() 
          && ("" +ea.getURL()).match(url.replace(/\.[^.]+$/,""))) {
          console.log("update container content: " + ea);
          ea.setPath(ea.getURL() + "");
        }  
        
      });
      
      var moduleName = this.getURL().pathname.match(/([^/]+)\.js$/);
      if (moduleName) {
        moduleName = moduleName[1];
        if (this.lastLoadingFailed) {
          this.reloadModule(url); // use our own mechanism...
        } else if ((this.get("#live").checked && !this.get("#live").disabled)) {
          lively.reloadModule("" + url).then(module => {
            lively.notify("Scripting","Module " + moduleName + " reloaded!", 3, null, "green");
            if (this.getPath().match(/templates\/.*js/)) {
              var templateURL = this.getPath().replace(/\.js$/,".html");
              try {
                console.log("[container] update template " + templateURL);
                lively.files.loadFile(templateURL).then( sourceCode => 
                  lively.updateTemplate(sourceCode));
              } catch(e) {
                lively.notify("[container] could not update template " + templateURL, ""+e);
              }
            }
            this.resetLoadingFailed();
          }, err => {
            this.loadingFailed(moduleName, err);
          });
        }
      }
    }).then(() => this.showNavbar());
  }

  async onDelete() {
    var url = this.getURL() +"";
    if (window.confirm("delete " + url)) {
      var result = await fetch(url, {method: 'DELETE'})
        .then(r => r.text());
      this.setPath(url.replace(/[^/]*$/, ""));
      lively.notify("deleted " + url, result);
    }
  }

  async onNewfile() {
    var fileName = window.prompt('Please enter the name of the file', this.getPath());
    if (!fileName) {
      lively.notify("no file created");
      return;
    }
    await lively.files.saveFile(fileName,"");
    lively.notify("created " + fileName);
    this.followPath(fileName);
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

  clear() {
    this.getContentRoot().innerHTML = '';
    this.get('#container-editor').innerHTML = '';
  }
  
  appendMarkdown(content) {
    System.import(lively4url + '/src/external/showdown.js').then((showdown) => {
      var converter = new showdown.Converter();
      var enhancedMarkdown = lively.html.enhanceMarkdown(content);
      var htmlSource = converter.makeHtml(enhancedMarkdown);
      var html = $.parseHTML(htmlSource);
      lively.html.fixLinks(html, this.getDir(), (path) => this.followPath(path));
      console.log("html", html);
      var root = this.getContentRoot();
      html.forEach((ea) => {
        root.appendChild(ea);
        if (ea.querySelectorAll) {
          ea.querySelectorAll("pre code").forEach( block => {
            highlight.highlightBlock(block);
          });
        }
      });
      lively.components.loadUnresolved(root);
      // get around some async fun
      if (this.preserveContentScroll) {
       this.get("#container-content").scrollTop = this.preserveContentScroll
      delete this.preserveContentScroll
    }
    });
  }

  appendLivelyMD(content) {
    content = content.replace(/@World.*/g,"");
    content = content.replace(/@+Text: name="Title".*\n/g,"# ");
    content = content.replace(/@+Text: name="Text.*\n/g,"\n");
    content = content.replace(/@+Text: name="Content.*\n/g,"\n");
    content = content.replace(/@+Box: name="SteppingWordCounter".*\n/g,"\n");
    content = content.replace(/@+Text: name="MetaNoteText".*\n(.*)\n\n/g,  "<i style='color:orange'>$1</i>\n\n");
    content = content.replace(/@+Text: name="WordsText".*\n.*/g,"\n");

    this.appendMarkdown(content);
  }
  
  appendScript(scriptElement) {
    // #IDEA by instanciating we can avoid global (de-)activation collisions
    // Scenario (A) There should be no activation conflict in this case, because appendScript wait on each other...
    // Scenario (B)  #TODO opening a page on two licely-containers at the same time will produce such a conflict. 
    // #DRAFT instead of using ScopedScripts as a singleton, we should instanciate it. 
    var layers = ScopedScripts.layers(this.getURL(), this.getContentRoot());
    ScopedScripts.openPromises = [];  
    return new Promise((resolve, reject)=> {
      var root = this.getContentRoot();
      var script   = document.createElement("script");
      script.type  = "text/javascript";
      
      layers.forEach( ea => ea.beGlobal());

      if (scriptElement.src) {
        script.src  = scriptElement.src;
        script.onload = () => {
          // #WIP multiple activations are not covered.... through this...
          Promise.all(ScopedScripts.openPromises).then( () => {
            layers.forEach( ea => ea.beNotGlobal());
            // console.log("ScopedScripts openPromises: " + ScopedScripts.openPromises)
            resolve();
          }, () => {
            // error
            reject();
          });
        };
        script.onerror = reject; 
      }
      script.text  = scriptElement.textContent;
      
      cop.withLayers(layers, () => {
        root.appendChild(script);  
      });
      if (!script.src) {
        Promise.all(ScopedScripts.openPromises).then( () => {
          layers.forEach( ea => ea.beNotGlobal());
          // console.log("ScopedScripts openPromises: " + ScopedScripts.openPromises)
          resolve();
        }, () => {
          // error
          reject();
        });
      }
    })
    
  }

  async appendHtml(content) {
    // strip lively boot code... 
    
    // content = content.replace(/\<\!-- BEGIN SYSTEM\.JS(.|\n)*\<\!-- END SYSTEM.JS--\>/,"");
    // content = content.replace(/\<\!-- BEGIN LIVELY BOOT(.|\n)*\<\!-- END LIVELY BOOT --\>/,"");
    
    if (content.match(/<script src=".*d3\.v3(.min)?\.js".*>/)) {
      if (!window.d3) {
        console.log("LOAD D3");
        // #TODO check if dealing with this D3 is covered now through our general approach...
        await lively.loadJavaScriptThroughDOM("d3", "src/external/d3.v3.js");
      }
    
      if (!window.ScopedD3) {
        console.log("LOAD D3 Adaption Layer");
        await System.import("templates/ContainerScopedD3.js")
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
      var nodes = $.parseHTML(content, document, true);
      if (nodes[0] && nodes[0].localName == 'template') {
      	lively.notify("append template " + nodes[0].id);
		    return this.appendTemplate(nodes[0].id);
      }
      lively.html.fixLinks(nodes, this.getDir(),
        (path) => this.followPath(path));
      for(var ea of nodes) {
        if (ea.tagName == "SCRIPT") {
          await this.appendScript(ea);
        } else {
          root.appendChild(ea);
          if (ea.querySelectorAll) {
            for(var block of ea.querySelectorAll("pre code")) {
              highlight.highlightBlock(block);
            }
          }
        }
      }
    } catch(e) {
      console.log("Could not append html:" + content.slice(0,200) +"..." +" ERROR:", e);
    }
    
    // get around some async fun
    if (this.preserveContentScroll) {
       this.get("#container-content").scrollTop = this.preserveContentScroll
      delete this.preserveContentScroll
    }
  }

  appendTemplate(name) {
    try {
    	var node = lively.components.createComponent(name);
    	this.getContentRoot().appendChild(node);
      lively.components.loadByName(name);
    } catch(e) {
      console.log("Could not append html:" + content);
    }
  }
  
  async followPath(path) {
    if (this.unsavedChanges()) {
      if (!window.confirm("You will lose unsaved changes, continue anyway?")) {
        return;
      }
    } 
    
    var m = path.match(/start\.html\?load=(.*)/);
    if (m) {
      lively.notify(m[1]);
      return this.followPath(m[1]);
    }
   
   
    // this check could happen later
    if (!path.match("https://lively4") && !path.match(window.location.host)) {
      lively.notify("follow foreign url: " + path);
      var startTime = Date.now();
      if (!await fetch(path, {method: "OPTIONS"}).catch(e => false)) {
        return window.open(path);
      }
      lively.notify("delayx " + (Date.now() - startTime));
    }

    if (_.last(this.history()) !== path)
      this.history().push(path);
    if (this.isEditing() && !path.match(/\/$/)) {
      if (this.useBrowserHistory())
        window.history.pushState({ followInline: true, path: path }, 'view ' + path, window.location.pathname + "?edit="+path);
      return this.setPath(path, true).then(() => this.editFile());
    } else {
      if (this.useBrowserHistory())
        window.history.pushState({ followInline: true, path: path }, 'view ' + path, window.location.pathname + "?load="+path);
      // #TODO replace this with a dynamic fetch
      return this.setPath(path);
    }
  }

  isEditing() {
    return this.getAttribute("mode") == "edit";
  }

  getContentRoot() {
    // return this.get('#container-root')
    return this;
  }

  getDir() {
    return this.getPath().replace(/[^/]*$/,"");
  }

  getURL() {
    var path = this.getPath();
    if (path && path.match(/^https?:\/\//)) {
      return new URL(path);
    } else {
      return new URL("https://lively4/" + path);
    }
  }

  getPath() {
    return this.shadowRoot.querySelector("#container-path").value;
  }

  getEditor() {
    var container = this.get('#container-editor');
    var editor = container.querySelector("lively-editor");
    if (editor) return Promise.resolve(editor);
    editor = lively.components.createComponent("lively-editor");
    editor.id = "editor";
    return lively.components.openIn(container, editor).then( () => {
        editor.hideToolbar();
        var aceComp = editor.get('juicy-ace-editor');
        aceComp.enableAutocompletion();
        aceComp.getDoitContext = () => {
          return window.that;
        };
        aceComp.aceRequire('ace/ext/searchbox');
        aceComp.doSave = text => {
          this.onSave();
        };
      return editor;
    });
  }

  getAceEditor() {
    var livelyEditor = this.get('lively-editor');
    if (!livelyEditor) return;
    return livelyEditor.get('juicy-ace-editor');
  }
  
  // #TODO replace this with asyncGet
  async realAceEditor() {
    return new Promise(resolve => {
      var checkForEditor = () => {
        var editor = this.getAceEditor();
        if (editor && editor.editor) {
          resolve(editor.editor);
        } else {
          setTimeout(() => {
            checkForEditor();
          },100);
        }
      };
      checkForEditor();
    });
  }
  
  thumbnailFor(url, name) {
    if (name.match(/\.((png)|(jpe?g))$/))
      return "<img class='thumbnail' src='" + name +"'>";
    else
      return "";    
  }
  
  linksForFile(url, name) {
    if (name.match(/\.((mkv)|(mp4)|(avi))$/))
      return "<a class='play' href='" + (""+url).replace(/\/?$/,"/") + name +"'>play</href>";
    else
      return "";  
  }
  
  listingForDirectory(url, render) {
    return lively.files.statFile(url).then((content) => {
      var files = JSON.parse(content).contents;
      var index = _.find(files, (ea) => ea.name.match(/^index\.md$/i));
      if (!index) index = _.find(files, (ea) => ea.name.match(/^index\.html$/i));
      if (index) { 
        return this.setPath(url + "/" + index.name) ;
      }
      // return Promise.resolve(""); // DISABLE Listings
      
      this.sourceContent = content;
      var html = "<div class='table-container'>"+
        "<table class='directory'>"+
        "<tr><th></th><th>name</th><th>size</th></tr>" +
        // "<li><a href='../'>..</a></li>" +
        _.sortBy(files, ea => ea.name)
          .filter(ea => !ea.name.match(/^\./))
          .map( ea =>
          // "<li><a href='"+ea.name + (ea.type == "directory" ? "/" : "")+"''>" +ea.name+ "</a></li>"
          "<tr><td>"+this.thumbnailFor(url, ea.name)+"</td><td>" + ea.name + '</td><td>' + ea.size+ '</td><td>'+this.linksForFile(url, ea.name)+'</td></tr>'
          ).join("\n")+"</table></div>";
      if (render) {
        this.appendHtml(html);
      }
    }).catch(function(err){
      console.log("Error: ", err);
      lively.notify("ERROR: Could not set path: " + url,  "because of: ",  err);
    });
  }
  
  setPath(path, donotrender) {
    this.get('#container-content').style.display = "block";
    this.get('#container-editor').style.display = "none";

    if (!path) {
        path = "";
    }
	  var isdir= path.match(/.\/$/);
    var url;
    if (path.match(/^https?:\/\//)) {
      url = new URL(path);
      url.pathname = lively.paths.normalize(url.pathname);
      path = "" + url;
    } else {
      path = lively.paths.normalize(path);
    }
    path =  path + (isdir ? "/" : "");

    var container=  this.get('#container-content');
    // don't scroll away whe reloading the same url
    if (this.getPath() == path) {
      this.preserveContentScroll = this.get("#container-content").scrollTop;
    }
	  this.setAttribute("src", path);
    this.clear();
    this.get('#container-path').value = path;
    container.style.overflow = "auto";

    url = this.getURL();
    this.showNavbar();
    // console.log("set url: " + url);
    this.sourceContent = "NOT EDITABLE";
    var render = !donotrender;
    // Handling directories
    
    if (isdir) {
      // return new Promise((resolve) => { resolve("") });
      return this.listingForDirectory(url, render)
    }
    // Handling files
    this.lastVersion = null; // just to be sure
    return fetch(url).then( resp => {
      this.lastVersion = resp.headers.get("fileversion");
      return resp.text();
    }).then((content) => {
      var format = path.replace(/.*\./,"");
      if (format == "html")  {
        this.sourceContent = content;
        if (render) return this.appendHtml(content);
      } else if (format == "md") {
        this.sourceContent = content;
        if (render) return this.appendMarkdown(content);
      } else if (format == "livelymd") {
        this.sourceContent = content;
        if (render) return this.appendLivelyMD(content);
      } else if (format.match(/(png)|(jpe?g)/)) {
        if (render) return this.appendHtml("<img src='" + url +"'>");
      } else if (format == "pdf") {
        if (render) return this.appendHtml('<object style="width:21cm;height:29cm" data="'
          + url +'" type="application/pdf"></object>');
      } else {
        this.sourceContent = content;
        if (render) return this.appendHtml("<pre><code>" + content +"</code></pre>");
      }
    }).catch(function(err){
      console.log("Error: ", err);
      lively.notify("ERROR: Could not set path: " + path,  "because of: ", err);
    });
  }

  navigateToName(name) {
    lively.notify("navigate to " + name);
    this.getAceEditor().editor.find(name);
  }

  clearNavbar() {
    var container = this.get('#container-leftpane');
    // container.style.display = "block";

    container.innerHTML= "";
    var navbar = document.createElement("ul");
    navbar.id = "navbar";
    container.appendChild(navbar);
    return navbar;
  }
  

  showNavbarSublist(targetItem) {
    var subList = document.createElement("ul");
    targetItem.appendChild(subList);

    if (this.getPath().match(/templates\/.*html$/)) {
      var template = $($.parseHTML(this.sourceContent)).filter("template")[0];
      if (!template) {
        console.log("showNavbar: no template found");
        return;
      }
      // fill navbar with list of script
      lively.array(template.content.querySelectorAll("script")).forEach((ea) => {
	      var element = document.createElement("li");
	      element.innerHTML = ea.getAttribute('data-name');
	      element.classList.add("subitem");
	      element.onclick = () => {
	        this.navigateToName(
	          "data-name=\""+ea.getAttribute('data-name')+'"');
	      };
	      subList.appendChild(element) ;
      });
    } else if (this.getPath().match(/\.js$/)) {
      // |async\\s+
      let instMethod = "(^|\\s+)([a-zA-Z0-9$_]+)\\s*\\(\\s*[a-zA-Z0-9$_ ,]*\\s*\\)\\s*{",
          klass = "(?:^|\\s+)class\\s+([a-zA-Z0-9$_]+)",
          func = "(?:^|\\s+)function\\s+([a-zA-Z0-9$_]+)\\s*\\(",
          oldProtoFunc = "[a-zA-Z0-9$_]+\.prototype\.([a-zA-Z0-9$_]+)\\s*=";
      let defRegEx = new RegExp(`(?:(?:${instMethod})|(?:${klass})|(?:${func})|(?:${oldProtoFunc}))`);
      let m;
      let links = {};
      let i = 0;
      let lines = this.sourceContent.split("\n");
      lines.forEach((line) => {
        m = defRegEx.exec(line);
        if (m) {
          var theMatch = m[2] ||
                        (m[3] && "class " + m[3]) ||
                        (m[4] && "function " + m[4]) ||
                         m[5];
          if(!theMatch.match(/^(if|switch|for|catch|function)$/)) {
            let name = (line.replace(/[A-Za-z].*/g,"")).replace(/\s/g, "&nbsp;") + theMatch,
                navigateToName = m[0],
                element = document.createElement("li");
    	      element.innerHTML = name;
    	      element.classList.add("link");
    	      element.classList.add("subitem");
    	      element.onclick = () => this.navigateToName(navigateToName);
    	      subList.appendChild(element) ;
          }
        }
      });
    } else if (this.getPath().match(/\.md$/)) {
      let defRegEx = /(?:^|\n)((#+) ?(.*))/g;
      let m;
      let links = {};
      let i=0;
      while (m = defRegEx.exec(this.sourceContent)) {
        if (i++ > 1000) throw new Error("Error while showingNavbar " + this.getPath());
  
        links[m[3]] = {name: m[0], level: m[2].length};
      }
      _.keys(links).forEach( name => {
        var item = links[name];
        var element = document.createElement("li");
  	    element.innerHTML = name;
  	    element.classList.add("link");
  	    element.classList.add("subitem");
  	    element.classList.add("level" + item.level);

  	    element.onclick = () => {
  	        this.navigateToName(item.name);
  	    };
  	    subList.appendChild(element);
      });
    }
  }
  
  hideNavbar() {
    this.get('#container-leftpane').style.display = "none";
    this.get('lively-separator').style.display = "none";
  }

  showNavbar() {
    // this.get('#container-leftpane').style.display = "block";
    // this.get('lively-separator').style.display = "block";


    var filename = ("" + this.getURL()).replace(/.*\//,"");

    var root =("" + this.getURL()).replace(/\/[^\/]+$/,"/");
    this.currentDir = root;
    lively.files.statFile(root).then( (text) => {
      var navbar = this.clearNavbar();
      var targetItem;

      var stats = JSON.parse(text);
      var names = {};
      stats.contents.forEach(ea => names[ea.name] = ea);
      
      var files = stats.contents
        .sort((a, b) => {
          if (a.type > b.type) {
            return 1;
          }
          if (a.type < b.type) {
            return -1;
          }
          return (a.name >= b.name) ? 1 : -1;
        })
        .filter(ea => ! ea.name.match(/\.((ogm)|(m4v)|(mp4)|(avi)|(mpe?g)|(mkv))$/))
        .filter(ea => ! ea.name.match(/^\./));

      files.unshift({name: "..", type: "directory"});
      files.forEach((ea) => {

        // if there is an Markdown File, ignore the rest
        var m = ea.name.match(/(.*)\.(.*)/);
        if (m && m[2] != "md" && names[m[1]+".md"]) return;
        if (m && m[2] != "livelymd" && names[m[1]+".livelymd"]) return;

	      var element = document.createElement("li");
	      var link = document.createElement("a");

	      if (ea.name == filename) targetItem = element;
	      if (targetItem) targetItem.classList.add("selected");
	      
	      var name = ea.name;
	      var icon;
	      if (ea.type == "directory") {
	        name += "/";
	        icon = '<i class="fa fa-folder"></i>';
	      } else {
	        icon = '<i class="fa fa-file"></i>';
	      }
	      
	      // name.replace(/\.(lively)?md/,"").replace(/\.(x)?html/,"")
	      link.innerHTML = icon + name;
	      link.href = ea.name;
	      link.onclick = () => {
	        this.followPath(root + name);
	        return false;
	      };
	      element.appendChild(link);
	      navbar.appendChild(element);
      });

      if (this.isEditing() && targetItem) {
        this.showNavbarSublist(targetItem);
      }
    });
  }
  
  editFile(path) {
    this.setAttribute("mode","edit"); // make it persistent
    (path ? this.setPath(path, true /* do not render */) : Promise.resolve()).then( () => {
      this.clear();
      var containerContent=  this.get('#container-content');
      containerContent.style.display = "none";
      var containerEditor =  this.get('#container-editor');
      containerEditor.style.display = "block";

      var urlString = this.getURL().toString();
      this.resetLoadingFailed();

      this.getEditor().then(livelyEditor => {
        var aceComp = livelyEditor.get('juicy-ace-editor');
        
        
        var url = this.getURL();
        livelyEditor.setURL(url);
        aceComp.changeModeForFile(url.pathname);

        if (aceComp.editor && aceComp.editor.session) {
          aceComp.editor.session.setOptions({
      			mode: "ace/mode/javascript",
          		tabSize: 2,
          		useSoftTabs: true
      		});
        }
        // NOTE: we don't user loadFile directly... because we don't want to edit PNG binaries etc...
        livelyEditor.setText(this.sourceContent); // directly setting the source we got
        
        if (aceComp.editor) {
          aceComp.editor.selection.moveCursorTo(0,0);
          var lineWidth = 100
          aceComp.editor.session.setWrapLimit(lineWidth);
          aceComp.editor.renderer.setPrintMarginColumn(lineWidth)
          
        }
        
        livelyEditor.lastVersion = this.lastVersion;
        this.showCancelAndSave();
    
        if ((""+url).match(/\.js$/)) {
          aceComp.targetModule = "" + url; // for editing
        }

        // livelyEditor.loadFile() // ALT: Load the file again?
      });
      this.showNavbar();
      lively.components.loadUnresolved(containerEditor);
    });
  }

  saveHTML() {
    var source  = this.getContentRoot().innerHTML;
    return this.getEditor().then( editor => {
      editor.setURL(this.getURL());
      editor.setText(source);
      editor.lastVersion = this.lastVersion;
      editor.saveFile().then( () => {
        // #TODO we should update here after conflict resolution?
      });
    });
    
  }
  
  saveEditsInView() {
    var url = this.getURL().toString();
    if (url.match(/template.*\.html$/)) {
        return lively.notify("Editing templates in View not supported yet!");
    } else if (url.match(/\.html$/)) {
       this.saveHTML().then( () => {
         lively.notify({
           title: "saved HTML",
           color: "green"});
       });
    } else {
      lively.notify("Editing in view not supported for the content type!");
    }
    
  }
  
  unsavedChanges() {
    var editor = this.get("#editor");
    if (!editor) return false;
    return  editor.textChanged;
  }
  
  // make a gloval position relative, so it can be used in local content
  localizePosition(pos) {
    var offsetBounds = this.get('#container-content').getBoundingClientRect();
    return pos.subPt(pt(offsetBounds.left, offsetBounds.top));
  }
  
  // let's do it the hard way
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
  
  livelyPreMigrate() {
    // do something before I got replaced  
    this.oldContentScroll = this.get("#container-content").scrollTop;
  }
  
  livelyMigrate(other) {
    // other = that
    var editor = other.get("#editor")
    if (editor) {
      var otherAce = editor.currentEditor();  
      if (otherAce && otherAce.selection) {
        var range = otherAce.selection.getRange();
        var scrollTop = otherAce.session.getScrollTop();
        this.asyncGet("#editor").then( editor => {
          var thisAce = editor.currentEditor();
          if (otherAce && thisAce) {
            thisAce.session.setScrollTop(scrollTop);
            thisAce.selection.setRange(range);
          }
        });
      }
    }
    
    this.get("#container-content").scrollTop = other.oldContentScroll  
    this.preserveContentScroll = other.oldContentScroll 
  }
}