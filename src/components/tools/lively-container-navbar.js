import Morph from 'src/components/widgets/lively-morph.js';
import ContextMenu from 'src/client/contextmenu.js';
import { applyDragCSSClass, DropElementHandler } from 'src/client/draganddrop.js';
import { fileName, copyTextToClipboard } from 'utils';
import components from 'src/client/morphic/component-loader.js';
import Preferences from 'src/client/preferences.js';
import Mimetypes from 'src/client/mimetypes.js';
import JSZip from 'src/external/jszip.js';
import moment from "src/external/moment.js";


export default class LivelyContainerNavbar extends Morph {
  async initialize() {
    this.addEventListener("drop", this.onDrop);
    this.addEventListener("dragover", this.onDragOver);
    // this.addEventListener("dragenter", this.onDragEnter)
    this::applyDragCSSClass();
    this.lastSelection = [];
    this.addEventListener('contextmenu', (evt) => {
        if (!evt.shiftKey) {
          this.onContextMenu(evt, this.getRoot())
          evt.stopPropagation();
          evt.preventDefault();
          return true;
        }
    }, false);
  }
  
  clear(parentElement=this.get("#navbar")) {
    parentElement.innerHTML = ""
  }
  
  async dragFilesAsZip(urls, evt) {
    // working around issue https://bugs.chromium.org/p/chromium/issues/detail?id=438479
    // to achieve https://html.spec.whatwg.org/multipage/dnd.html#dom-datatransferitemlist-add
    let url = lively.files.tempfile() + ".zip", 
    name = `${lively.files.name(urls[0])} and more.zip`,
    mimetype = "application/zip";
    evt.dataTransfer.setData("DownloadURL", `${mimetype}:${name}:${url}`);

    // and now... we download, zip, and upload the files during the user drags them... 
    // #Hack and will definitely not work well all the time!
    // #Idea, #Solution, we could make it stable if the lively4-serv will wait on the first "GET" request
    // if the upload is not finished yet, but if it knows about a new tempFile
    
    
    // Oh, my god! Now we are getting crazy!
    // first fownload the files, then zip them, then upload then again, so that they can be dropped...?
    // Yeah! :-)
    var zip = new JSZip();
    for(var ea of urls) {
      zip.file(lively.files.name(ea), await lively.files.loadFile(ea));
    }
    lively.files.saveFile(url, await zip.generateAsync({type:"blob"})) 
  }

  onItemDragStart(link, evt) {
    let urls = this.getSelection();
    if (urls.length > 1) {
      this.dragFilesAsZip(urls, evt)
    } else {
      let url = link.href,
        name = lively.files.name(url)
      var mimetype = Mimetypes.mimetype(lively.files.extension(name)) || "text/plain";
      evt.dataTransfer.setData("DownloadURL", `${mimetype}:${name}:${url}`);  
    }
    evt.dataTransfer.setData("text/plain", urls.join("\n"));
  }
  
  onDragOver(evt) {   
    if (evt.shiftKey) {
      evt.dataTransfer.dropEffect = "move";
      this.transferMode = "move"
    } else {
      evt.dataTransfer.dropEffect = "copy";
      this.transferMode = "copy"
    }
    evt.preventDefault()    
  }

  async onDrop(evt) {
    evt.preventDefault();
    evt.stopPropagation();
        
    const files = evt.dataTransfer.files;
    let dir = lively.files.directory(this.url);
    if(files.length > 0 &&
      await lively.confirm(`Copy ${files.length} file(s) into directory ${dir}?`)
    ) {
      Array.from(files).forEach(async (file) => {
        var newURL = dir + "/" + file.name;
        var dataURL = await lively.files.readBlobAsDataURL(file)  
        var blob = await fetch(dataURL).then(r => r.blob())
        await lively.files.saveFile(newURL, blob)
        this.show(newURL, ""); // #TODO blob -> text
      });
      return;
    }
    
    if (DropElementHandler.handle(evt, this, 
        (element, evt) => {lively.notify("handle " + element)})
    ) {
      return;
    }
       
    var data = evt.dataTransfer.getData("text");   
    var htmlData = evt.dataTransfer.getData("text/html");    
    if (data.match("^https?://") || data.match(/^data\:image\/png;/)) {
      this.copyFromURL(data);        
    } else if (htmlData) {
      data = evt.dataTransfer.getData();
      this.dropHTMLAsURL(htmlData)
    } else {
      console.log('ignore data ' + data);
    }
  }
  /* 
   *  Upload the dragged contents into a file.. and make up a name. 
   *  #Idea, instead of using a timestamp should be able to store a name in the data?
   */
  async dropHTMLAsURL(data) {
    var targetDir = lively.files.directory(this.url)
    var name = "dropped_" + moment(new Date()).format("YYMMDD_hhmmss")
    var newurl = targetDir + "/" + name + ".html"
    await fetch(newurl, {
      method: "PUT",
      body: data
    })
    this.update()
    this.updateOtherNavbars(this.getRoot(newurl))
    console.log("dropped " + newurl)
  }
  
  async copyFromURL(data) {
    var urls = data.split("\n")
    var targetDir = lively.files.directory(this.url)
    if (await lively.confirm(`${this.transferMode} ${urls.length} files to ${targetDir}?`)) {
      for(var fromurl of urls) {
        var filename = fromurl::fileName();
        var isDataURI;
        if (fromurl.match(/^data\:image\/png;/)) {
          isDataURI = true
          if (fromurl.match(/^data\:image\/png;name=/)) {
            filename = fromurl.replace(/.*?name=/,"").replace(/;.*/,"")    
          } else {
            filename = "dropped_" + Date.now() + ".png";
          }
        } else {
          isDataURI = false
        }

        var newurl = this.url.replace(/[^/]*$/, filename)
        var content = await fetch(fromurl).then(r => r.blob());
        await fetch(newurl, {
          method: "PUT",
          body: content
        })
        if (this.transferMode == "move") {
          await fetch(fromurl, {
            method: "DELETE"
          });
          // put again... to be not delete it by accident
          await fetch(newurl, {
            method: "PUT",
            body: content
          })
          this.updateOtherNavbars(this.getRoot(fromurl))
          this.updateOtherNavbars(this.getRoot(newurl))

          lively.notify(`${this.transferMode}d to ` + newurl + ": " + content.size)  
        }
        this.show(newurl, content)
      }
    }  
  }
  
  updateOtherNavbars(url) {  
    lively.queryAll(document.body, "lively-container-navbar").forEach( ea => {
      if (ea.getRoot() == url) {
        ea.update()
      }
    })
  }
  
  getRoot(url) {
    url = url || this.url;
    return url.toString().replace(/\/[^\/]+$/,"/") 
    /// return url.toString().replace(/\.l4d\/(index\.md)?$/,"").replace(/\/[^\/]+$/,"/") // .l4d directories are treated as files
  }
  
  getFilename(url) {
    url = url || this.url;
    return url.replace(/.*\//,"")
    // return url.replace(/\.l4d\/(index\.md)?$/,".l4d").replace(/.*\//,"")
  }
  
  async update() {
    
    var urls = this.targetItem ? _.uniq(lively.allParents(this.targetItem)
      .reverse()
      .map(ea => ea.url)
      .filter(ea => ea)) : []
    var url = this.url
    var content = this.sourceContent
    
    for(let ea of urls) {
      console.log("show " + ea)
      await this.show(ea, "", urls[0])  
      
      await lively.sleep(50)
    }
    // await lively.sleep(1000)

    await this.show(url, content, urls[0])  

  }
  
  getSelection() {
    return _.map(this.shadowRoot.querySelectorAll(".selected a"), ea => ea.href)
  }
  
  selectItem(item) {
    this.get("#navbar").querySelectorAll(".selected").forEach(ea => ea.classList.remove("selected"))
    item.classList.add("selected");      
  }
  
  getRootElement() {
    return this.get("#navbar")
  }
  
  findItem(url) {
    return _.find(this.getRootElement().querySelectorAll("li"), ea => {
      if (ea.textContent == "../") return false
      var link = ea.querySelector("a")
      return link && (link.href == url )
    });
  }
  
  
  async show(targetURL, sourceContent, contextURL, force=false) {
    console.log("[navbar] show " + targetURL + (sourceContent ? " source content: " + sourceContent.length : ""))
    var lastURL = this.url
    this.url = ("" + targetURL).replace(/[?#].*/,""); // strip options 
    var lastContent = this.sourceContent
    this.sourceContent = sourceContent;
    
    this.contextURL = contextURL;
    var lastDir = this.currentDir
    this.currentDir = this.getRoot(targetURL);

    let urlWithoutIndex = this.url.replace(/(README.md)|(index\.((html)|(md)))$/,"")
    this.targetItem = this.findItem(this.url) || this.findItem(urlWithoutIndex)
    
    var parentURL = this.url.replace(/[^/]*$/,"")   
    
    this.targetParentItem = this.findItem(parentURL)

    if (this.targetItem || this.targetParentItem ) {
        
      if (!this.targetItem) {
        // newfile or deleted file?
        // lively.notify("NEW ?RESET DIR")
        this.targetItem = this.targetParentItem
      }
      
      this.selectItem(this.targetItem)
      if (lastDir !== this.currentDir) {
        this.showSublist()
      } else if (lastURL !== this.url) {
        this.showSublist()
      } else if (lastContent != this.sourceContent) {
        this.showSublisContent(true)
      }        
      
      return         
    } else {
      // lively.notify("RESET DIR")
      await this.showDirectory(targetURL, this.get("#navbar"))
      await this.showSublist()    
    }
  }
  
  async fetchStats(targetURL) {
    
    var root = this.getRoot(targetURL)
    
    try {
      var stats = await fetch(root, {
        method: "OPTIONS",
      }).then(r => r.status == 200 ? r.json() : {})
    } catch(e) {
      // no options....
    }
    
    
    if (!stats || !stats.type) {
      stats = {};// fake it
      stats.contents = [{type: "file", name: "index.html"}];
      
      var html = await fetch(root.replace(/\/?$/,"/")).then(r => r.text())
      var div = document.createElement("div");
      div.innerHTML = html;
      var i=0;
      Array.from(div.querySelectorAll("a"))
        .filter( ea => ea.getAttribute("href") && !ea.getAttribute("href").match(/^javascript:/))
        .forEach( ea => {
        stats.contents.push({
          type: 'link', 
          name: '' + ea.getAttribute("href").replace(/\/(index.html)?$/,"").replace(/.*\//,""), // ea.textContent,
          href: "" + ea.getAttribute("href") 
        });
      });
    }
    return stats
  }
  
  fileType(file) {
    // l4d bundle should sort like files
    if (file.name.match(/\.((l4d)|(md))$/)) return "file"
    return file.type
  }
  
  filesFromStats(stats) {
    var files = stats.contents
      .sort((a, b) => {        
        if (this.fileType(a) > this.fileType(b)) {
          return 1;
        }
        if (this.fileType(a) < this.fileType(b)) {
          return -1;
        }
        // #Hack, date based filenames are sorted so lastest are first
        if (a.name.match(/\d\d\d\d-\d\d-\d\d/) && b.name.match(/\d\d\d\d-\d\d-\d\d/)) {
          return (a.name >= b.name) ? -1 : 1;          
        }
        
        return ((a.title || a.name) >= (b.title || b.name)) ? 1 : -1;
      })
      .filter(ea => ! ea.name.match(/^\./));
    files.unshift({name: "..", type: "directory", url: stats.parent});
    return files
  }
  

  async showDirectory(targetURL, parentElement) {
    
    var filename = this.getFilename();
    
    var stats = await this.fetchStats(targetURL)
    this.clear(parentElement);
     
    
    var names = {};
    stats.contents.forEach(ea => names[ea.name] = ea);
    
    var files = this.filesFromStats(stats).filter(ea =>
      !(ea.name == ".." && parentElement !== this.getRootElement()))
    
    parentElement.url = targetURL
   
    files.forEach((ea) => {

      var element = document.createElement("li");
      var link = document.createElement("a");
      
      
      if (ea.name == filename) {
        this.targetItem = element;
      }
      
      if (this.targetItem) this.targetItem.classList.add("selected");
      
      var name = ea.name;
      var icon;
      if (ea.name.match(/\.l4d$/) || ea.name.match(/\.md$/)) {
        icon = '<i class="fa fa-file"></i>';
        // some directories in lively are considered bundles and should behave like documents
        if (ea.type == "directory") {
          element.classList.add("directory")
        } else {
          element.classList.add("file")
        }
      } else if (ea.type == "directory") {
        name += "/";
        icon = '<i class="fa fa-folder"></i>';
        element.classList.add("directory")
      } else if (ea.type == "link") {
        icon = '<i class="fa fa-arrow-circle-o-right"></i>';
        element.classList.add("link")
      } else if (/(\.|-)(spec|test)\.js$/i.test(name)) {
        icon = '<i class="fa fa-check-square-o"></i>'
        element.classList.add("test")
      } else {
        icon = '<i class="fa fa-file"></i>';
        element.classList.add("file")
      }
      var title = ea.title || name
      // name.replace(/\.(lively)?md/,"").replace(/\.(x)?html/,"")
      link.innerHTML =  icon + title;
      var href = ea.href || ea.name;
      if (ea.type == "directory" && !href.endsWith("/")) {
        href += "/"
      }
      var otherUrl = href.match(/^[a-z]+:\/\//) ? href : this.currentDir + "" + href;
      link.href = ea.url || otherUrl;
      element.url = link.href
      if (this.lastSelection && this.lastSelection.includes(otherUrl)) {
        element.classList.add("selected")
      }
      
      link.onclick = (evt) => { 
        this.onItemClick(link, evt); 
        return false
      };
      link.ondblclick = (evt) => { 
        this.onItemDblClick(link, evt); 
        return false
      };

      link.addEventListener('dragstart', evt => this.onItemDragStart(link, evt))
      link.addEventListener('contextmenu', (evt) => {
          if (!evt.shiftKey) {
            this.onContextMenu(evt, otherUrl)
            evt.stopPropagation();
            evt.preventDefault();
            return true;
          }
      }, false);
      element.appendChild(link);
      parentElement.appendChild(element);
    });
    // this.clearSublists()
  }
  
  onItemClick(link, evt) {
    if (evt.shiftKey) {
      link.parentElement.classList.toggle("selected")
      this.lastSelection = this.getSelection()     
    } else {
      this.lastSelection = []
      if (!link.parentElement.classList.contains("selected")) {
        this.followPath(link.href);
      } else {
        // this.url = undefined
        this.currentDir = null
        
        link.parentElement.classList.remove("selected")
        var sublist = link.parentElement.querySelector("ul")
        if (sublist) sublist.remove()
      }
    }
  }
  
  onItemDblClick(link, evt) {
    this.clear()
    this.followPath(link.href);
  }
  async editWithSyvis (url) {
    const editor = await components.createComponent('syvis-editor');
    await editor.loadUrl(url);
    await components.openInWindow(editor);
  }

  onContextMenu(evt, otherUrl=this.getRoot()) {
    var isDir = otherUrl.match(/\/$/,"")
    var file = otherUrl.replace(/\/$/,"").replace(/.*\//,"");
    
    const menuElements = []
    
    var selection =  this.getSelection()
    
    if (selection.length > 0) {
      menuElements.push(...[
        ['<b>' + (selection.map(ea => ea.replace(/.*\//, "")).join(", ") + "</b>"), 
         () => {}, "", '>'],
        [`delete `, () => this.deleteFile(otherUrl, selection)],
      ])
    } else {
      menuElements.push(...[
        ['<b>' + file + "</b>", 
         () => {}, "", '>'],
      ])
    }
    if (selection.length == 1) {
      menuElements.push(...[
        [`rename`, () => this.renameFile(otherUrl)],
        [`become bundle`, () => this.convertFileToBundle(otherUrl)],
        
        ["edit ", () => lively.openBrowser(otherUrl, true)],
        ["browse", () => lively.openBrowser(otherUrl)],
        ["save as png", () => lively.html.saveAsPNG(otherUrl)],
        ["copy path to clipboard", () => copyTextToClipboard(otherUrl), "", '<i class="fa fa-clipboard" aria-hidden="true"></i>'],
        ["copy file name to clipboard", () => copyTextToClipboard(otherUrl::fileName()), "", '<i class="fa fa-clipboard" aria-hidden="true"></i>'],
      ])
    }
    menuElements.push(...[
      ["new", [
        [`text file`, () => this.newfile(otherUrl)],
        ["drawio figure", () => this.newfile(otherUrl, "drawio")],
      ], "", ''],  
    ])
    const menu = new ContextMenu(this, menuElements)
    menu.openIn(document.body, evt, this)
  }
  
  deleteFile(url, selectedURLs) {
    lively.notify("please implement deleteFile()")
  }

  renameFile(url) {
    lively.notify("please implement renameFile()")
  }

  newfile(path, type) {
    lively.notify("please implement newfile()")
  }
  
  navigateToName(url) {
    lively.notify(`please implement navigateToName(${url})`)
  }

  followPath(url, lastPath) {
    this.show(new URL(url), "", this.contextURL)
  }

  async convertFileToBundle(url) {
    // var url = "https://lively-kernel.org/lively4/lively4-jens/doc/journal/2018-08-17.md"
    if (!await lively.files.isFile(url)) {
      lively.notify("Converion failed: " + url + " is no file!")
      return
    }
    var contents = await fetch(url).then(r => r.text());
    await fetch(url, {method: 'DELETE'})
    
    await fetch(url + "/", {method: 'MKCOL'});
    var newURL = url + "/" + "index.md"
    await fetch(newURL, {method: 'PUT', body: contents});
    this.followPath(newURL);
  }

  showSublistHTML(subList) {
    if (!this.sourceContent) return;
    var template =  lively.html.parseHTML(this.sourceContent).find(ea => ea.localName == "template");
      if (!template) {
        console.log("showNavbar: no template found");
        return;
      }
      // fill navbar with list of script
      Array.from(template.content.querySelectorAll("script")).forEach(ea => {
        var element = document.createElement("li");
        element.innerHTML = ea.getAttribute('data-name');
        element.classList.add("subitem");
        element.onclick = () => {
          this.navigateToName(
            `data-name="${ea.getAttribute('data-name')}"`);
        };
        subList.appendChild(element) ;
      });
  }
  
  showSublistJS(subList) {
    if (!this.sourceContent || !this.sourceContent.split) {
      // undefined or Blob
      return;
    }
    let instMethod = "(^|\\s+)([a-zA-Z0-9$_]+)\\s*\\(\\s*[a-zA-Z0-9$_ ,=]*\\s*\\)\\s*{",
        klass = "(?:^|\\s+)class\\s+([a-zA-Z0-9$_]+)",
        func = "(?:^|\\s+)function\\s+([a-zA-Z0-9$_=]+)\\s*\\(",
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
  }
  
  showSublistMD(subList) {
    // console.log("sublist md " + this.sourceContent.length)
    if (!this.sourceContent) return;
    let defRegEx = /(?:^|\n)((#+) ?(.*))/g;
    let m;
    let links = {};
    let i=0;
    while (m = defRegEx.exec(this.sourceContent)) {
      if (i++ > 1000) throw new Error("Error while showingNavbar " + this.url);

      links[m[3]] = {name: m[0], level: m[2].length};
    }
    _.keys(links).forEach( name => {
      var item = links[name];
      var element = document.createElement("li");
      element.textContent = name.replace(/<.*?>/g,"");
      element.classList.add("link");
      element.classList.add("subitem");
      element.classList.add("level" + item.level);

      element.onclick = () => {
        this.navigateToName(item.name);
      };
      subList.appendChild(element);
    });
  }

  async showSublistOptions(subList, url) {
    url = url || this.url
    try {
      var options = await fetch(url, {method: "OPTIONS"})
        .then(r => r.status == 200 ? r.json() : {})
    } catch(e) {
      // no options...
      return 
    }
    if (!options.contents) return;
    for(let ea of options.contents) { // #Bug for(var ea) vs for(let)
      let element = <li 
          class="link subitem" title={ea.name}>{ea.name}</li>
      subList.appendChild(element);
      element.onclick = () => {
        lively.notify("follow " + ea.name)
        this.followPath(url + "/" + ea.name)
      }
    }
  }
  
  clearSublists() {
    // console.log("clear sublists")
    var parents = this.targetItem ? lively.allParents(this.targetItem) : [];
    // remove all sublists... but my own tree
    Array.from(this.get("#navbar").querySelectorAll("ul"))
      .filter(ea => !parents.includes(ea) && !lively.allParents(ea).includes(this.targetItem))
      .forEach(ea => ea.remove())    

    Array.from(this.get("#navbar").querySelectorAll(".subitem"))
      .forEach(ea => ea.remove())    

  }
  
  async showSublist() {
    // console.log("show sublist " + this.url)
     
    if (!this.targetItem) return 
    if (this.targetItem.querySelector("ul")) return // has sublist
    
    var subList = document.createElement("ul");
    this.targetItem.appendChild(subList);
    if (this.url !== this.contextURL && this.targetItem.classList.contains("directory")) {
      var optionsWasHandles = true
      await this.showDirectory(this.url, subList)
    }
    this.showSublisContent(optionsWasHandles)
  } 
  
  
  async showSublisContent(optionsWasHandles) {
    // show console.log("show sublist content " + this.url)
     
    if (!this.targetItem) return 
    var subList = this.targetItem.querySelector("ul")
    if (!subList) return // we are a sublist item?
    this.clearSublists()
    if (this.url.match(/templates\/.*html$/)) {
      this.showSublistHTML(subList)
    } else if (this.url.match(/\.js$/)) {
      this.showSublistJS(subList)
    } else if (this.url.match(/\.md$/)) {
      // console.log("show sublist md" + this.url)

      this.showSublistMD(subList)
    } else {
      if (!optionsWasHandles) {
        this.showSublistOptions(subList)
      }
    }
  } 
  async livelyMigrate(other) {
    await this.show(other.url, other.sourceContentthis, other.contextURL, true)
  }

  livelyUpdate() {
    

    this.clear()
    this.show(this.url,this.sourceContent, this.contextURL, true)
  }
  
  async livelyExample() {
    // var url = lively4url + "/README.md"
    // var url = "innerhtml://"
    var url = "https://lively-kernel.org/lively4/lively4-jens/doc/journal/"
    var content = await fetch(url).then(r => r.text())
    await this.show(url, content)
  }
}