'use strict';

import Morph from './Morph.js';


export default class Container extends Morph {

  initialize() {
    // this.shadowRoot.querySelector("livelyStyle").innerHTML = '{color: red}'
    
    // there seems to be no <link ..> tag allowed to reference css inside of templates
    // lively.files.loadFile(lively4url + "/templates/livelystyle.css").then(css => {
    //   this.shadowRoot.querySelector("#livelyStyle").innerHTML = css
    // })
    this.windowTitle = "Browser";
    if (this.isSearchBrowser) {
      this.windowTitle = "Search Browser"
    }

    console.log("Initialize Container");
    if (this.useBrowserHistory()) {
      window.onpopstate = (event) => {
        var state = event.state;
        if (state && state.followInline) {
          console.log("follow " + state.path);
          this.setPath(state.path);
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
    var input = this.getSubmorph("#container-path");
    $(input).keyup(event => {
      if (event.keyCode == 13) { // ENTER
        this.onPathEntered(input.value);
      }
    });
    lively.html.registerButtons(this);
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
    _.each(this.shadowRoot.querySelectorAll(".edit"), (ea) => {
      ea.style.visibility = "visible";
      ea.style.display = "inline-block";
    });
    
    _.each(this.shadowRoot.querySelectorAll(".browse"), (ea) => {
      ea.style.visibility = "hidden";
      ea.style.display = "none";
    });
  }
  
  history() {
    if (!this._history) this._history = []
    return this._history
  }

  forwardHistory() {
    if (!this._forwardHistory) this._forwardHistory = []
    return this._forwardHistory
  }
    
  async onSync(evt) {
    var username = await lively.focalStorage.getItem("githubUsername")
    var token = await lively.focalStorage.getItem("githubToken")
    if (!token) {
      var comp = lively.components.createComponent("lively-sync");
      lively.components.openInWindow(comp).then((w) => {
        lively.setPosition(w, lively.pt(evt.pageX, evt.pageY));
      });
    }
    var serverURL = lively4url.match(/(.*)\/([^\/]+$)/)[1];
    console.log("server url: " + serverURL);
    if (!this.getPath().match(serverURL)) {
      return lively.notify("can only sync on our repositories");
    }
    var repo =  this.getPath().replace(serverURL +"/", "").replace(/\/.*/,"");
    lively.files.syncRepository(serverURL, repo, username, token).then((r) =>
      lively.notify("Synced " + repo, r, 10, () => lively.openWorkspace(r)));
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
      this.setAttribute("mode", "show");
      this.setPath(this.getPath());
      this.hideCancelAndSave();
    }

  onUp() {
    var path = this.getPath()
    if (path.match(/index\.((html)|(md))/))
      // one level more
      this.followPath(path.replace(/(\/[^/]+\/[^/]+$)|([^/]+\/$)/,"/"));
    else
      this.followPath(path.replace(/(\/[^/]+$)|([^/]+\/$)/,"/"));
  }

  onBack() {
    if (this.history().length < 2) {
      lively.notify("No history to go back!")
      return
    }
    var url = this.history().pop()
    var last = _.last(this.history())
    // lively.notify("follow " + url)
    this.forwardHistory().push(url)
    this.followPath(last)
  }

  onForward() {
    var url = this.forwardHistory().pop()
    if (url) {
      this.followPath(url)
    } else {
      lively.notify("Could not navigate forward")
    }
  }

  onSave(doNotQuit) {
    if (this.getPath().match(/\/$/)) {
      lively.files.saveFile(this.getURL(),"") 
      return
    }
    return this.getSubmorph("#editor").saveFile().then( () => {
      var sourceCode = this.getSubmorph("#editor").currentEditor().getValue()
      lively.updateTemplate(sourceCode)
      var url = this.getURL();
      // if (this.getURL().pathname.match(/\/test\/.*([^/]+)\.js$/)) {
      //   console.log("ignore test: " + this.getURL())
      //   return
      // }
      
      document.body.querySelectorAll('lively-container').forEach(ea => {
        var url = "" + this.getURL()
        if (ea !== this && !ea.isEditing() 
          && ("" +ea.getURL()).match(url.replace(/\.[^.]+$/,""))) {
          console.log("update container content: " + ea)
          ea.setPath(ea.getURL() + "")
        }  
        
      })
      
      var moduleName = this.getURL().pathname.match(/([^/]+)\.js$/)
      if (moduleName) {
        moduleName = moduleName[1]
        if (this.getSubmorph("#live").checked) {
          
          lively.reloadModule("" + url).then( module => {
            // lively.notify("Module " + moduleName + " reloaded!")
            console.log("Module " + moduleName + " reloaded!")
          }, err => {
            window.LastError = err
            lively.notify("Error loading module " + moduleName, err)
            console.error(err)
          })
        }
      }
    }).then(() => this.showNavbar())
  }

  async onDelete() {
    var url = this.getURL() +""
    if (window.confirm("delete " + url)) {
      var result = await fetch(url, {method: 'DELETE'})
        .then(r => r.text())
      this.setPath(url.replace(/[^/]*$/, ""))
      lively.notify("deleted " + url, result)
    }
  }

  onAccept() {
    this.setAttribute("mode", "show")
    this.onSave().then((sourceCode) => {
      this.setPath(this.getPath());
      this.hideCancelAndSave();
    })
  }

  clear() {
    this.getContentRoot().innerHTML = ''
    this.getSubmorph('#container-editor').innerHTML = ''
  }
  


  appendMarkdown(content) {
    System.import(lively4url + '/src/external/showdown.js').then((showdown) => {
      var converter = new showdown.Converter();
      var enhancedMarkdown = lively.html.enhanceMarkdown(content);
      var htmlSource = converter.makeHtml(enhancedMarkdown);
      var html = $.parseHTML(htmlSource);
      lively.html.fixLinks(html, this.getDir(), (path) => this.followPath(path));
      console.log("html", html);
      var root = this.getContentRoot()
      html.forEach((ea) => root.appendChild(ea));
      lively.components.loadUnresolved(root);
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
    var root = this.getContentRoot()
    var script   = document.createElement("script");
    script.type  = "text/javascript";
    if (scriptElement.src) script.src  = scriptElement.src;
    script.text  = scriptElement.textContent;
    root.appendChild(script);
  }

  async appendHtml(content) {
    if (content.match(/<script src=".*d3\.v3(.min)?\.js".*>/)) {
      if (!window.d3) {
        console.log("LOAD D3")
        await lively.loadJavaScriptThroughDOM("d3", "src/external/d3.v3.js")
      }
    
      if (!window.ScopedD3) {
        console.log("LOAD D3 Adaption Layer")
        await System.import("templates/classes/ContainerScopedD3.js")
        ScopedD3.updateCurrentBodyAndURLFrom(this)
        // return this.appendHtml(content) // try again
      }
    }

    if (content.match(/<script src=".*cola(\.min)?\.js".*>/)) {
        console.log("LOAD Cola")
        await lively.loadJavaScriptThroughDOM("cola", "src/external/cola.js")
    }
    
    //  var content = this.sourceContent
    try {
      var root = this.getContentRoot()
      var nodes = $.parseHTML(content, document, true);
      if (nodes[0] && nodes[0].localName == 'template') {
      	lively.notify("append template " + nodes[0].id);
		    return this.appendTemplate(nodes[0].id);
      }
      lively.html.fixLinks(nodes, this.getDir(),
        (path) => this.followPath(path));
      nodes.forEach((ea) => {
        if (ea.tagName == "SCRIPT") {
          this.appendScript(ea)
        } else {
          root.appendChild(ea);
        }
      });
    } catch(e) {
      console.log("Could not append html:" + content.slice(0,200) +"..." +" ERROR:", e);
    }
  }

  appendTemplate(name) {
    try {
    	var node = lively.components.createComponent(name)
    	this.getContentRoot().appendChild(node)
      lively.components.loadByName(name)
    } catch(e) {
      console.log("Could not append html:" + content)
    }
  }
  


  followPath(path) {
    console.log("follow path2: " + path)
    if (_.last(this.history()) !== path)
      this.history().push(path)

    if (this.isEditing() && !path.match(/\/$/)) {
      if (this.useBrowserHistory())
        window.history.pushState({ followInline: true, path: path }, 'view ' + path, window.location.pathname + "?edit="+path);
      return this.setPath(path, true).then(() => this.editFile())
    } else {
      if (this.useBrowserHistory())
        window.history.pushState({ followInline: true, path: path }, 'view ' + path, window.location.pathname + "?load="+path);
      return this.setPath(path)
    }
  }

  isEditing() {
    return this.getAttribute("mode") == "edit"
  }

  getContentRoot() {
    // return this.getSubmorph('#container-root')
    return this
  }

  getDir() {
       return this.getPath().replace(/[^/]*$/,"")
  }

  getURL() {
    var path = this.getPath()
    if (path && path.match(/^https?:\/\//)) {
      return new URL(path)
    } else {
      return new URL("https://lively4/" + path)
    }
  }

  getPath() {
    return this.getAttribute("src")
  }
  
  getAceEditor() {
    var livelyEditor = this.shadowRoot.querySelector('lively-editor')
    if (!livelyEditor) return;
    return livelyEditor.shadowRoot.querySelector('juicy-ace-editor')
  }
  
  async realAceEditor() {
    return new Promise(resolve => {
      var checkForEditor = () => {
        var editor = this.getAceEditor()
        if (editor && editor.editor) {
          resolve(editor.editor)
        } else {
          setTimeout(() => {
            checkForEditor()
          },100) 
        }
      };
      checkForEditor()
    })
  }
  
  thumbnailFor(url, name) {
    if (name.match(/\.((png)|(jpe?g))$/))
      return "<img class='thumbnail' src='" + name +"'>"
    else
      return ""    
  }
  
  linksForFile(url, name) {
    if (name.match(/\.((mkv)|(mp4)|(avi))$/))
      return "<a class='play' href='" + (""+url).replace(/\/?$/,"/") + name +"'>play</href>"
    else
      return ""    
  }
  
  listingForDirectory(url, render) {
    return lively.files.statFile(url).then((content) => {
      var files = JSON.parse(content).contents;
      var index = _.find(files, (ea) => ea.name.match(/^index\.md$/i)) 
      if (!index) index = _.find(files, (ea) => ea.name.match(/^index\.html$/i))
      if (index) { 
        return this.setPath(url + "/" + index.name) 
      }
      this.sourceContent = content
      var html = "<div class='table-container'>"+
        "<table class='directory'>"+
        "<tr><th></th><th>name</th><th>size</th></tr>" +
        // "<li><a href='../'>..</a></li>" +
        _.sortBy(files, ea => ea.name)
          .filter(ea => !ea.name.match(/^\./))
          .map( ea =>
          // "<li><a href='"+ea.name + (ea.type == "directory" ? "/" : "")+"''>" +ea.name+ "</a></li>"
          "<tr><td>"+this.thumbnailFor(url, ea.name)+"</td><td>" + ea.name + '</td><td>' + ea.size+ '</td><td>'+this.linksForFile(url, ea.name)+'</td></tr>'
          ).join("\n")+"</table></div>"
      if (render) {
        this.appendHtml(html)
      }
    }).catch(function(err){
      console.log("Error: ", err)
      lively.notify("ERROR: Could not set path: " + url,  "because of: ",  err)
    })
  }
  
  setPath(path, donotrender) {
    console.log("set path")
    this.getSubmorph('#container-content').style.display = "block"
    this.getSubmorph('#container-editor').style.display = "none"

    // this.getSubmorph('#container-leftpane').style.display = "none"

    if (!path) {
        path = ""
    }
	  var isdir= path.match(/.\/$/)

    if (path.match(/^https?:\/\//)) {
      var url = new URL(path)
      url.pathname = lively.paths.normalize(url.pathname)
      path = "" + url
    } else {
      path = lively.paths.normalize(path)
    }
    path =  path + (isdir ? "/" : "")

    var container=  this.getSubmorph('#container-content')
    
	  this.setAttribute("src", path)
    this.clear()
    this.getSubmorph('#container-path').value = path
    container.style.overflow = "auto";


    var url = this.getURL()
    this.showNavbar()
    // console.log("set url: " + url)
    this.sourceContent = "NOT EDITABLE"
    var render = !donotrender
    // Handling directories
    
    if (isdir) {
      // return new Promise((resolve) => { resolve("") })
      return this.listingForDirectory(url, render)
    }
    // Handling files
    return lively.files.loadFile(url).then((content) => {
      var format = path.replace(/.*\./,"")
      if (format == "html")  {
        this.sourceContent = content
        if (render) return this.appendHtml(content)
      } else if (format == "md") {
        this.sourceContent = content
        if (render) return this.appendMarkdown(content)
      } else if (format == "livelymd") {
        this.sourceContent = content
        if (render) return this.appendLivelyMD(content)
      } else if (format.match(/(png)|(jpe?g)/)) {
        if (render) return this.appendHtml("<img src='" + url +"'>")
      } else if (format == "pdf") {
        if (render) return this.appendHtml('<object style="width:21cm;height:29cm" data="'
          + url +'" type="application/pdf"></object>')
      } else {
        this.sourceContent = content
        if (render) return this.appendHtml("<pre>" + content +"</pre>")
      }
    }).catch(function(err){
      console.log("Error: ", err)
      lively.notify("ERROR: Could not set path: " + path,  "because of: ", err)
    })
  }

  navigateToName(name) {
    lively.notify("navigate to " + name)
    this.getAceEditor().editor.find(name)
  }

  clearNavbar() {
    var container = this.getSubmorph('#container-leftpane');
    // container.style.display = "block";

    container.innerHTML= "";
    var navbar = document.createElement("ul");
    navbar.id = "navbar";
    container.appendChild(navbar);
    return navbar
  }
  

  showNavbarSublist(targetItem) {
    var subList = document.createElement("ul")
    targetItem.appendChild(subList)

    if (this.getPath().match(/templates\/.*html$/)) {
      var template = $($.parseHTML(this.sourceContent)).filter("template")[0];
      if (!template) {
        console.log("showNavbar: no template found");
        return
      }
      // fill navbar with list of script
      lively.array(template.content.querySelectorAll("script")).forEach((ea) => {
	      var element = document.createElement("li");
	      element.innerHTML = ea.getAttribute('data-name');
	      element.classList.add("subitem")
	      element.onclick = () => {
	        this.navigateToName(
	          "data-name=\""+ea.getAttribute('data-name')+'"')
	      };
	      subList.appendChild(element) ;
      })
    } else if (this.getPath().match(/\.js$/)) {
      // |async\\s+
      var instMethod = "(^|\\s+)([a-zA-Z0-9$_]+)\\s*\\(\\s*[a-zA-Z0-9$_ ,]*\\s*\\)\\s*{",
          klass = "(?:^|\\s+)class\\s+([a-zA-Z0-9$_]+)",
          func = "(?:^|\\s+)function\\s+([a-zA-Z0-9$_]+)\\s*\\(",
          oldProtoFunc = "[a-zA-Z0-9$_]+\.prototype\.([a-zA-Z0-9$_]+)\\s*=";
      var defRegEx = new RegExp(`(?:(?:${instMethod})|(?:${klass})|(?:${func})|(?:${oldProtoFunc}))`);
      var m
      var links = {}
      var i = 0;
      var lines = this.sourceContent.split("\n");
      lines.forEach((line) => {
        if (m = defRegEx.exec(line)) {
          var theMatch = m[2] ||
                        (m[3] && "class " + m[3]) ||
                        (m[4] && "function " + m[4]) ||
                         m[5]
          if(!theMatch.match(/^(if|switch|for|catch|function)$/)) {
            let name = (line.replace(/[A-Za-z].*/g,"")).replace(/\s/g, "&nbsp;") + theMatch,
                navigateToName = m[0],
                element = document.createElement("li");
    	      element.innerHTML = name
    	      element.classList.add("link")
    	      element.classList.add("subitem")
    	      element.onclick = () => this.navigateToName(navigateToName);
    	      subList.appendChild(element) ;
          }
        }
      });
    } else if (this.getPath().match(/\.md$/)) {
      var defRegEx = /(?:^|\n)((#+) ?(.*))/g
      var m
      var links = {}
      var i=0
      while (m = defRegEx.exec(this.sourceContent)) {
        if (i++ > 1000) throw new Error("Error while showingNavbar " + this.getPath());
  
        links[m[3]] = {name: m[0], level: m[2].length}
      }
      _.keys(links).forEach( name => {
        var item = links[name];
        var element = document.createElement("li");
  	    element.innerHTML = name
  	    element.classList.add("link")
  	    element.classList.add("subitem")
  	    element.classList.add("level" + item.level)

  	    element.onclick = () => {
  	        this.navigateToName(item.name)
  	    };
  	    subList.appendChild(element) ;
      })
    }
  }
  
  hideNavbar() {
    this.getSubmorph('#container-leftpane').style.display = "none";
    this.getSubmorph('lively-separator').style.display = "none";
  }

  showNavbar() {
    // this.getSubmorph('#container-leftpane').style.display = "block";
    // this.getSubmorph('lively-separator').style.display = "block";


    var filename = ("" + this.getURL()).replace(/.*\//,"")

    var root =("" + this.getURL()).replace(/\/[^\/]+$/,"/")
    this.currentDir = root
    lively.files.statFile(root).then( (text) => {
      var navbar = this.clearNavbar()
      var targetItem;

      var stats = JSON.parse(text)
      var names = {}
      stats.contents.forEach(ea => names[ea.name] = ea)
      
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
        .filter(ea => ! ea.name.match(/^\./))

      files.unshift({name: "..", type: "directory"})
      files.forEach((ea) => {

        // if there is an Markdown File, ignore the rest
        var m = ea.name.match(/(.*)\.(.*)/)
        if (m && m[2] != "md" && names[m[1]+".md"]) return
        if (m && m[2] != "livelymd" && names[m[1]+".livelymd"]) return

	      var element = document.createElement("li");
	      var link = document.createElement("a");
	      
	      if (ea.name == filename) targetItem = element;
	      var name = ea.name;
	      var icon;
	      if (ea.type == "directory") {
	        name += "/";
	        icon = '<i class="fa fa-folder"></i>';
	      } else {
	        icon = '<i class="fa fa-file"></i>';
	      }
	      
	      link.innerHTML = icon + name.replace(/\.(lively)?md/,"").replace(/\.(x)?html/,"");
	      link.href = ea.name
	      link.onclick = () => {
	        this.followPath(root + name);
	        return false
	      }
	      element.appendChild(link)
	      navbar.appendChild(element) ;
      })

      if (this.isEditing() && targetItem) {
        this.showNavbarSublist(targetItem)
      }
    })
  }
  
  async editFile(path) {
    return new Promise(async (resolve, reject) => {
      this.setAttribute("mode","edit") // make it persistent
      if (path) await this.setPath(path)
      
      this.clear()
      
      var containerContent=  this.getSubmorph('#container-content')
      containerContent.style.display = "none"
      var containerEditor =  this.getSubmorph('#container-editor')
      containerEditor.style.display = "block"

      var livelyEditor = lively.components.createComponent("lively-editor");
      lively.components.openIn(containerEditor,livelyEditor).then( comp => {
        console.log("comp: " + comp)

        comp.hideToolbar()
        comp.id = "editor"
        var aceComp = comp.shadowRoot.querySelector('juicy-ace-editor')
        aceComp.enableAutocompletion()

        aceComp.getDoitContext = () => {
          return window.that;
        }

        aceComp.aceRequire('ace/ext/searchbox')

        aceComp.doSave = text => {
          this.onSave()
        }
        
        var url = this.getURL()

        comp.setURL(url)
        aceComp.changeModeForFile(url.pathname);

        if (aceComp.editor && aceComp.editor.session) {
          aceComp.editor.session.setOptions({
      			mode: "ace/mode/javascript",
          		tabSize: 2,
          		useSoftTabs: true
      		});
        }

        // NOTE: we don't user loadFile directly... because we don't want to edit PNG binaries etc...
        comp.setText(this.sourceContent); // directly setting the source we got

        this.showCancelAndSave()
    
        if ((""+url).match(/\.js$/)) {
          aceComp.targetModule = "" + url // for editing
        }
        setTimeout(resolve, 1000) // Promise from AceEditor needed here... #Jens #TODO
        
        // comp.loadFile() // ALT: Load the file again?
      })
      this.showNavbar()
      lively.components.loadUnresolved(containerEditor)
    })
  }
}


