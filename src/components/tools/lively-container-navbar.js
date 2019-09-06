import Morph from 'src/components/widgets/lively-morph.js';
import ContextMenu from 'src/client/contextmenu.js';
import { applyDragCSSClass, DropElementHandler } from 'src/client/draganddrop.js';
import { fileName, copyTextToClipboard } from 'utils';
import components from 'src/client/morphic/component-loader.js';
import Preferences from 'src/client/preferences.js';
import Mimetypes from 'src/client/mimetypes.js';
import JSZip from 'src/external/jszip.js';
import moment from "src/external/moment.js"; 
import FileCache from "src/client/fileindex.js"
import Strings from "src/client/strings.js"

import FileIndex from "src/client/fileindex.js"


const FILTER_KEY_BLACKLIST = [
  'Control', 'Shift', 'Capslock', 'Alt',
  ' ', 'Enter',
  'ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft', 'Tab'
];

export default class LivelyContainerNavbar extends Morph {
  
  /* # Base Component */
  
  // #important
  async initialize() {
    lively.html.registerKeys(this);
    lively.html.registerKeys(this.get("#navbar"));
    lively.html.registerKeys(this.get("#details"));
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
  
  // #important 
  async update() {
    
    var urls = this.targetItem ? _.uniq(lively.allParents(this.targetItem)
      .reverse()
      .map(ea => ea.url)
      .filter(ea => ea)) : []
    var url = this.url
    var content = this.sourceContent
    
    for(let ea of urls) {
      // console.log("show " + ea)
      await this.show(ea, "", urls[0])  
      
      await lively.sleep(50)
    }
    // await lively.sleep(1000)

    await this.show(url, content, urls[0])  

  }
  
  
  clear(parentElement=this.get("#navbar")) {
    parentElement.innerHTML = ""
    this.updateFilter("")
  }
  
  /*MD # #DragAndDrop #Files  MD*/
  
  // #private
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

  resetCursor() {
    this.setCursorDetailsItem(null)
    this.navigateColumn = "files"
    this.setCursorItem(null)
  }
  
  onItemDragStart(link, evt) {
    this.resetCursor()
    
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
    // console.log("dropped " + newurl)
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
          lively.notify(`${this.transferMode}d to ` + newurl + ": " + content.size)  
        }
        this.show(newurl, content)
      }
    }  
  }
  
  /*MD # Getters/Setters MD*/
  
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

  getSelectedItems() {
    return this.shadowRoot.querySelectorAll(".selected")
  }
  
  getSelection() {
    return _.map(this.shadowRoot.querySelectorAll(".selected a"), ea => ea.href)
  }
  
  getRootElement() {
    return this.get("#navbar")
  }
  
  /*MD # API MD*/
  
  selectItem(item) {
    this.get("#navbar").querySelectorAll(".selected").forEach(ea => ea.classList.remove("selected"))
    item.classList.add("selected");      
  }
  
  
  findItem(url) {
    return _.find(this.getRootElement().querySelectorAll("li"), ea => {
      if (ea.textContent == "../") return false
      var link = ea.querySelector("a")
      return link && (link.href == url )
    });
  }

  // #important #public 
  async show(targetURL, sourceContent, contextURL, force=false) {
    // console.log("[navbar] show " + targetURL + (sourceContent ? " source content: " + sourceContent.length : ""))
    var lastURL = this.url
    this.url = ("" + targetURL).replace(/[?#].*/,""); // strip options 
    var lastContent = this.sourceContent
    this.sourceContent = sourceContent
    
    this.contextURL = contextURL
    var lastDir = this.currentDir
    this.currentDir = this.getRoot(targetURL)

    let urlWithoutIndex = this.url.replace(/(README.md)|(index\.((html)|(md)))$/,"")
    if (this.url.match(/microsoft:\/\//)) {
      urlWithoutIndex = urlWithoutIndex.replace(/\/contents/,"")
    }
    
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
        this.showSublistContent(true)
      }        
      
      return         
    } else {
      this.resetCursor()
      // lively.notify("RESET DIR")
      await this.showDirectory(targetURL, this.get("#navbar"))
      await this.showSublist()    
      this.scrollToItem(this.targetItem)
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
   
    this.lastTitle = ""
    files.forEach((ea) => {

      var element = this.createItem(ea)
      if (ea.name == filename) {
        this.targetItem = element;
      }
      if (this.targetItem) this.targetItem.classList.add("selected");

      
      parentElement.appendChild(element);
    });
    delete this.lastTitle
    
    // this.clearSublists()
  }
  
  createItem(ea) {
    var element = document.createElement("li");
    var link = document.createElement("a");
    var name = ea.name;
    element.name = ea.name
    var icon;
    if (ea.name.match(/\.md$/)) {
      icon = '<i class="fa fa-file-text-o"></i>';
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
    } else if (/\.html$/i.test(name)) {
      icon = '<i class="fa fa-html5"></i>'
      element.classList.add("test")
    } else if (/(\.|-)(spec|test)\.js$/i.test(name)) {
      icon = '<i class="fa fa-check-square-o"></i>'
      element.classList.add("test")
    } else if (/\.js$/i.test(name)) {
      icon = '<i class="fa fa-file-code-o"></i>';
      element.classList.add("file");
    } else if (/\.css$/i.test(name)) {
      icon = '<i class="fa fa-css3"></i>';
      element.classList.add("file");
    } else if (/\.(png|jpg)$/i.test(name)) {
      icon = '<i class="fa fa-file-image-o"></i>';
      element.classList.add("file");
    } else if (/\.(pdf)$/i.test(name)) {
      icon = '<i class="fa fa-file-pdf-o"></i>';
      element.classList.add("file");
    } else {
      icon = '<i class="fa fa-file-o"></i>';
      element.classList.add("file");
    }
    var title = ea.title || name

    // name.replace(/\.(lively)?md/,"").replace(/\.(x)?html/,"")

    var prefix = this.lastTitle ? Strings.longestCommonPrefix([title, this.lastTitle]) : ""
    prefix = prefix.replace(/-([a-zA-Z0-9])*$/,"-")
    if (prefix.length < 4) {
      prefix = ""
    }      
    link.innerHTML =  icon + title.replace(new RegExp("^" + prefix), "<span class='prefix'>" +prefix +"</span>");
    this.lastTitle = title

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
    return element
  }
  
  
  getLink(item) {
    return item.querySelector(":scope > a")
  }
  
  /*MD # Testing MD*/
  
  isDirectory(item) {
    if (!item) return false
    var link = this.getLink(item)
    return link && link.href.match(/\/$/) && true
  }
  
  isSelected(item)  {
    var selectedChild = item.querySelector(".selected")
    
    return item.classList.contains("selected") || selectedChild
  }
  
  hasSublist(item) {
    var sublist = item.querySelector("ul")
    return sublist && sublist.querySelector("li")
  }
  
  /*MD # Selection Events MD*/
  // #important
  async onItemClick(link, evt) {
    if (link.localName == "li") {
      link = link.querySelector("a") // if someone passed the item and not the link
    }
    
    if (evt.type == "click") {
      this.updateFilter("")
    }
    
    if (evt.shiftKey && evt.code != "Enter") {
      link.parentElement.classList.toggle("selected")
      this.lastSelection = this.getSelection()     
    } else {
      this.lastSelection = []
      // collapse previousely expanded tree
      var item = link.parentElement
      
      if (this.isSelected(item) || this.hasSublist(item) && item== "Enter") { 
        this.currentDir = null
        item.classList.remove("selected")
        var sublist = item.querySelector("ul")
        if (sublist) sublist.remove()
      } else {
        if (evt.shiftKey) {
          var container = lively.query(this, "lively-container")
          if (container) await container.editFile();
        } 
        await this.followPath(link.href);
      }
      
      
    }
    this.updateFilter("")
    this.focusFiles()
    this.setCursorItem(null)
  }
  
  async onItemDblClick(link, evt) {
    this.clear()
    await this.followPath(link.href);
    this.focusFiles()
  }
  
  // #important
  async onDetailsItemClick(item, evt) {
    evt.stopPropagation()
    evt.preventDefault()
    
    if (evt.type == "click") {
      this.updateFilter("")
    }
    this.cursorDetailsItem = item
    this.navigateColumn = "details"
    var sublist = this.get("#details").querySelector("ul")
    this.selectSublistItem(item, sublist)
    await this.navigateToName(item.name, item.data);
    this.get("#details").focus()
  }

  // #important
  onContextMenu(evt, otherUrl=this.getRoot()) {
    lively.notify("other" + otherUrl)
    
    var isDir = otherUrl.match(/\/$/,"")
    var file = otherUrl.replace(/\/$/,"").replace(/.*\//,"");
    
    const menuElements = []
    
    var selection =  this.getSelection()
    if (selection.length == 1) {
      selection = [otherUrl] // user means probably the thing pointed to
    }
    
    
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
    if (isDir) {
      menuElements.push(...[
        [`add search root`, () => this.addSearchRoot(otherUrl)],
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
  
  // #private
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
  
  
  /*
   * #private add url to local file index rember to search there  
   */
  addSearchRoot(url) {
    var roots = lively.preferences.get("ExtraSearchRoots")
    roots = _.uniq(roots.concat([url]))
    FileCache.current().addDirectory(url)     
    lively.preferences.set("ExtraSearchRoots", roots)
    lively.notify("Current Search Roots:", roots)
  }
  
  /*MD 
  # Abstract Public Interface 
  
  Please override/implement the following methods ... in `lively-container`
  
  MD*/
  
  deleteFile(url, selectedURLs) {
    lively.notify("please implement deleteFile()")
  }

  renameFile(url) {
    lively.notify("please implement renameFile()")
  }

  newfile(path, type) {
    lively.notify("please implement newfile()")
  }
  
  navigateToName(url, data) {
    lively.notify(`please implement navigateToName(${url})`)
  }

  async followPath(url, lastPath) {
    var resp = await fetch(url)
    var content = ""
    var contentType = resp.headers.get("content-type")
    if (contentType.match(/text\//)) {
      content = await resp.text()
    } else {
      // lively.notify("content type not suppored: " + contentType)
    }
    this.show(new URL(url), content, this.contextURL)
  }

  

  
  /*MD # Details 
  
  - #TODO refactor "sublist" -> "details"
  - maybe extract / separate `Files` and `Details`
  
  MD*/
  
  createDetailsItem(name) {
    var item = <li class="link" click={evt => this.onDetailsItemClick(item, evt)}><a>{name}</a></li>
    item.name = name
    
    item.addEventListener('contextmenu', (evt) => {
        if (!evt.shiftKey) {
          this.onDetailsContextMenu(evt, item)
          evt.stopPropagation();
          evt.preventDefault();
          return true;
        }
    }, false);
    
    return item
  }
   
  // #private
  selectSublistItem(element, sublist) {
    for(var ea of sublist.querySelectorAll(".selected")) {
      ea.classList.remove("selected")
    }
    element.classList.add("selected")
  }
  
  // #private
  clearNameMD(name) {
    return name
      .replace(/<.*?>/g, "")
      .replace(/\{.*/g, "")
      .replace(/\(.*?\)/g, "")
      .replace(/[\[\]]/g, "")
      .replace(/\n/g, "")
      .replace(/([ ,])#/g, "$1")
  }
  async showSublist(force) {
    // console.log("show sublist " + this.url)
     
    if (!this.targetItem) return 
    var sublist = this.targetItem.querySelector("ul")
    if (!sublist) {
      sublist = document.createElement("ul");
      this.targetItem.appendChild(sublist);
    } else {
      sublist.innerHTML = ""
    }
    if (this.url !== this.contextURL && this.targetItem.classList.contains("directory")) {
      var optionsWasHandles = true
      await this.showDirectory(this.url, sublist)
    }
    this.showSublistContent(optionsWasHandles)
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
  
  async showSublistContent(optionsWasHandles) {
    
    // show console.log("show sublist content " + this.url) 
    if (!this.targetItem) return 
    
    var details = this.get("#details")
    var sublist = this.targetItem.querySelector("ul")
    
    if (details) {
      details.innerHTML = ""
      sublist = <ul></ul>
      details.appendChild(sublist)
    }
    
    if (!sublist) return // we are a sublist item?
    
    // keep expanded trees open... or not
    // this.clearSublists()
    
    if (this.url.match(/templates\/.*html$/)) {
      this.showSublistHTML(sublist)
    } else if (this.url.match(/\.js$/)) {
      this.showSublistJS(sublist)
    } else if (this.url.match(/\.md$/)) {
      // console.log("show sublist md" + this.url)

      this.showSublistMD(sublist)
    } else {
      if (!optionsWasHandles) {
        this.showSublistOptions(sublist)
      }
    }
  }
  
  // #HTML
  showSublistHTML(sublist) {
    if (!this.sourceContent) return;
    var template =  lively.html.parseHTML(this.sourceContent).find(ea => ea.localName == "template");
      if (!template) {
        console.log("showNavbar: no template found");
        return;
      }
      // fill navbar with list of script
      Array.from(template.content.querySelectorAll("script")).forEach(ea => {
        var element = this.createDetailsItem(ea.getAttribute('data-name'));
        element.classList.add("subitem");
        
        element.name = `data-name="${ea.getAttribute('data-name')}"`
        element.onclick = (evt) => {
          this.onDetailsItemClick(element, evt)
        }
        sublist.appendChild(element) ;
      });
  }
  
  // #Markdown #private #Refactor 
  simpleParseMD(source) {
    if (!source) return {};
    let defRegEx = /(?:^|\n)( *(#+) ?(.*))/g;
    let m;
    let links = {};
    let i=0;
    while (m = defRegEx.exec(source)) {
      if (i++ > 1000) throw new Error("Error while showingNavbar " + this.url);
      links[m[3]] = {name: m[0], level: m[2].length};
    }
    return links
  }
  
  // #important
  showSublistMD(sublist) {
    // console.log("sublist md " + this.sourceContent.length)
    var links = this.simpleParseMD(this.sourceContent)
    _.keys(links).forEach( name => {
      var item = links[name];
      var element = this.createDetailsItem(this.clearNameMD(name));;
      element.classList.add("link");
      element.classList.add("subitem");
      element.classList.add("level" + item.level);
      element.name = this.clearNameMD(item.name)
      element.onclick = (evt) => {
          this.onDetailsItemClick(element, evt)
      }
      sublist.appendChild(element);
    });
  }
  
  // #JavaScript #important
  async showSublistJS(sublist) {
    var classInfos = [];
    
    await FileIndex.current().db.classes.where("url").equals(this.url).each(aClassInfo => {
        classInfos.push(aClassInfo)
    })
       
    classInfos.forEach((classInfo) => {
      let name = classInfo.name;
      var classItem = this.createDetailsItem(name)
      classItem.classList.add("class")
      
      classItem.classList.add("subitem");
      classItem.classList.add("level1");
      var methodList = <ul></ul>
      classItem.appendChild(methodList)
      classItem.data = classInfo
      classInfo.methods.forEach(eaMethodInfo => {
        var name = eaMethodInfo.name
        if (eaMethodInfo.static) {
          name = `<span class="mod">static</span>` + name
        }
        var methodItem = this.createDetailsItem(name)
        var comments = eaMethodInfo.leadingComments || []
        comments.forEach(eaComment => {
          // special markdown tag
          var m = eaComment.value.match(/^MD((.|\n)*)MD$/m)
          if (m) {
            var markdownLinks = this.simpleParseMD(m[1])
            var key = _.keys(markdownLinks).first
            var item =  markdownLinks[key]
            if (item) {
              var commentItem = this.createDetailsItem(this.clearNameMD(key))  
              commentItem.data = eaComment
              commentItem.classList.add("comment")
              commentItem.classList.add("subitem")
              commentItem.classList.add("level" + item.level);
              methodList.appendChild(commentItem)
            }
          } else {
            var tagItem = <span class="tag">{eaComment.value}</span>
                
            Strings.matchAllDo(/#([A-Za-z0-9]+)/g, eaComment.value, (hashTagMatch) => {
              methodItem.classList.add(hashTagMatch) // #TODO, #Refactor, etc.. just for CSS 
            })
            methodItem.appendChild(tagItem)
          }
           
        })
        methodItem.classList.add("subitem");
        methodItem.classList.add("method")
        methodItem.classList.add("level2");
        methodItem.data = eaMethodInfo
        methodList.appendChild(methodItem)
      }) 
      sublist.appendChild(classItem)
    })
  }


  async showSublistOptions(sublist, url) {
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
      sublist.appendChild(element);
      element.onclick = () => {
        this.selectSublistItem(element, sublist)
        if (ea.href) {
          this.followPath(ea.href);
        } else {
          this.followPath(url + "/" + ea.name)
        }
      }
    }
  }
  
  
  /*MD ## Keyboard Navigation MD*/
  async onRightDown(evt) {
    evt.stopPropagation()
    evt.preventDefault()
    
    this.updateFilter("")
    if (!this.navigateColumn || this.navigateColumn == "files") {
      
      if(this.cursorItem && this.targetItem !== this.cursorItem) {
        await this.onItemClick(this.cursorItem,  evt)
      }
      
      this.navigateColumn = "details"
      var details = this.get("#details")
      details.focus()
      this.setCursorItem(details.querySelector("li"))
    } else if (this.navigateColumn == "details") {
    
      var container = lively.query(this, "lively-container")
      if (container) container.focus()
    
      
    }   
  }
  
  onLeftDown(evt) {
    evt.stopPropagation()
    evt.preventDefault()
    this.updateFilter("")
    
    if (!this.navigateColumn || this.navigateColumn == "details") {
      this.navigateColumn = "files"
      this.get("#navbar").focus()    
    }    
  }

  async onUpDown(evt) {
    if (evt.altKey) {
      evt.stopPropagation()
      evt.preventDefault()
      var container = lively.query(this, "lively-container")
      if (container) {
        container.get("#container-path").focus()
      }
      return
    }
    this.navigateItem("up", evt)
  }

  onDownDown(evt) {
    this.navigateItem("down", evt)
  }
  
  
  async onEnterDown(evt) {
    evt.stopPropagation()
    evt.preventDefault()
    
    var item = this.cursorItem || this.targetItem
    if (this.navigateColumn == "details") {
      if (this.cursorDetailsItem) {
        if (evt.shiftKey) {
          var container = lively.query(this, "lively-container")
          if (container) {
            await container.editFile()
          }
        } 
        await this.onDetailsItemClick(this.cursorDetailsItem, evt)
        this.onRightDown(evt)
      }
    } else if (item) {
      var nextLink = item.querySelector("a")
      await this.onItemClick(nextLink, evt) 
      
      this.setCursorItem(item)      
    }
  }
  
  onKeyDown(evt) {
    if(FILTER_KEY_BLACKLIST.includes(evt.key)) { return; }

    if(evt.key == "PageUp" || evt.key == "PageDown") {
      evt.stopPropagation()
      evt.preventDefault()
    }
    
    if (evt.altKey && evt.key == "Backspace") {
      return this.onLeftDown(evt)
    }
     
    
    if(['Backspace', 'Delete', 'Escape'].includes(evt.key)) {
      this.filter = '';
    } else {
      if (evt.key.length == 1) {
        this.filter += evt.key;
      }
    }
    
    this.updateFilter()
  }
  
  /*MD # Focus and Scrolling MD*/
  
  navigateItem(direction, evt) {
    evt.stopPropagation()
    evt.preventDefault()    
    var items = this.matchingItems
    var startItem = this.getCursorItem()
    if (!startItem) return
    var index = items.indexOf(startItem)
    
    var nextItem = items[index + (direction == "down" ? 1 : -1) ] 
   
    if(nextItem) {
      this.setCursorItem(nextItem)
      if (nextItem.classList.contains("directory")) {
        // just navigate
      } else {
        if (this.navigateColumn == "details") {
          // preview details while navigating
          this.onDetailsItemClick(nextItem, evt)
        } else {
          // don't preview while browsing files, because it is to slow
        }
      } 
      this.scrollToItem(nextItem)
    }
  }

  // #private
  relativeOffset(item, anyParent) {
    return item.offsetTop - anyParent.offsetTop
    // var nextParent = item.parentElement
    // if (anyParent === nextParent) {
    //   return item.offsetTop
    // } else {
    //   return item.offsetTop + this.relativeOffset(nextParent, anyParent) 
    // }
    
  }
  
  scrollToItem(item, scroll = this.rootList()) {
    if (!item) return
    
    var t = scroll.scrollTop 
    var y = this.relativeOffset(item, scroll)
    var h = item.offsetHeight
    var b = scroll.scrollTop + scroll.offsetHeight
    
    // #Debug #Visualization
    // lively.showPoint(lively.getGlobalPosition(scroll).addPt(pt(0, t - scroll.scrollTop))).style.backgroundColor = "blue" 
    // lively.showPoint(lively.getGlobalPosition(scroll).addPt(pt(0, y - scroll.scrollTop))) 
    // lively.showPoint(lively.getGlobalPosition(scroll).addPt(pt(0, b - scroll.scrollTop))).style.backgroundColor = "green"
    // console.log(`t: ${t} y: ${y} b: ${b}`)
    
    if (t < y && y < b) {
      return // no need to scroll
    }
    
    if (y + h > (scroll.scrollTop + scroll.offsetHeight)) {
      // scroll down
      scroll.scrollTop = y - scroll.offsetHeight + h
    } else if ( (y ) < (scroll.scrollTop)) {
      // scroll up
      scroll.scrollTop = y
    }    
  }
  
  
  getCursorItem() {
    if (this.cursorItem && !this.cursorItem.parentElement) {
      this.cursorItem = null
    }
    var startItem
    if (this.navigateColumn == "details") {
      startItem = this.cursorDetailsItem || this.get("#details").querySelector("li")
    } else {
      startItem = this.cursorItem || this.targetItem || this.get("#navbar").querySelector("li")
    }
    return startItem
  }
  
  setCursorItem(nextItem) {
    var startItem = this.getCursorItem()
    if (startItem) {
      startItem.classList.remove("cursor")
    }
    if (nextItem) {
      nextItem.classList.add("cursor")
    }
    if (this.navigateColumn == "details") {
      this.cursorDetailsItem = nextItem  
    } else {
      this.cursorItem = nextItem  
    }
  }
  
  setCursorDetailsItem(item) {
    if (this.cursorDetailsItem) {
      this.cursorDetailsItem.classList.remove("cursor")
    }
    this.cursorDetailsItem = null
  }
  
  focusDetails() {
    this.navigateColumn = "details"
    this.get("#details").focus()
  }

  focusFiles() {
    this.navigateColumn = "files"
    this.get("#navbar").focus()
  }
  
  rootList() {
    if (this.navigateColumn == "details") {
      return this.get("#details")
    } else {
      return this.get("#navbar")
    }
  }

  /*MD # Filter 
  Copied from lively-menu 
  MD*/
  // lazy filter property
  get filter() { return this._filter = this._filter || ''; }
  set filter(value) { return this._filter = value; }
  
  updateFilter(filter=this.filter) {
    this.filter = filter
    
    this.get('#filter-hint').innerHTML = this.filter;
    lively.setGlobalPosition(this.get('#filter-hint'), lively.getGlobalPosition(this.rootList()))
    
    
    // lively.warn(evt.key, this.filter)
    
    this.items.forEach(item => item.classList.remove('filtered-out'));
    this.nonMatchingItems.forEach(item => item.classList.add('filtered-out'));
    
    if (this.filter.length > 0) {
      this.setCursorItem(this.matchingItems.first)
    }
  }

  
  get detailItems() {
    return Array.from(this.get("#details").querySelectorAll("li"));
  }
  
  get fileItems() {
    return Array.from(this.get("#navbar").querySelectorAll("li"));
  }
  
  get items() {
    if(this.navigateColumn == "details") {
      return this.detailItems
    } else {
      return this.fileItems
    }
    
  }
  
  matchFilter(item) {
    if (this.filter.length == 0) return true;
    if(!item || !item.name ) { return false; }
    return (item.name + "").toLowerCase().includes(this.filter.toLowerCase());
  }
  
  get matchingItems() {
    return this.items.filter(item => this.matchFilter(item));
  }
  
  get nonMatchingItems() {
    return this.items.filter(item => !this.matchFilter(item));
  }
  
  async livelyMigrate(other) {
    await this.show(other.url, other.sourceContentthis, other.contextURL, true)
  }

  livelyUpdate() {
    this.clear()
    this.show(this.url,this.sourceContent, this.contextURL, true)
  }
  
  hightlightElement(element) {
    var text = element.querySelector("a") || element
    text.style.color = getComputedStyle(text).color || "black"
    text.animate([
      { color: text.style.color }, 
      { color: 'green' }, 
      { color:  text.style.color }, 
    ], { 
      duration: 2000,
    });
  }
  
  
  
  /*MD ## Context Menu MD*/
  
  // #TODO do something useful here
  onDetailsContextMenu(evt, item) {    
    const menuElements = []
    menuElements.push(...[
      [`do nothing`, () => {lively.notify("I said nothing! really!")}],
    ])
    
    if (item.data) {
      menuElements.push([`inspect`, () => {lively.openInspector(item.data)}])
    }
    
    const menu = new ContextMenu(this, menuElements)
    menu.openIn(document.body, evt, this)
  }
  
  /*MD
  # Change Observer
  
  MD*/
  
  // #private
  baseURL(url) {
    if (url) {
      return url.replace(/[#?].*/,"")
    }
  }
  
  // #private
  getElementByURL(url) {
    url = this.baseURL(url)
    return this.items.find(ea =>  this.baseURL(ea.url)== url && ea.textContent !== "../")
  }
  
  // #private
  sortIntoAfter(sibling, element) {
    
    if (!sibling) return
    if (sibling.classList.contains("file") && element.textContent < sibling.textContent) {
      sibling.parentElement.insertBefore(element, sibling) 
      return true
    } else {
      if (sibling.nextElementSibling) {
        return this.sortIntoAfter(sibling.nextElementSibling, element)
      } 
    }
    
  }
  
  async onObserveURLChange(url, method) {
    try {
      url = this.baseURL(url)
      if (url.startsWith(this.currentDir)) {
        // console.log("[navbar] onObserveURLChange " + url)
        var element = this.getElementByURL(url)
        if (element) {
          if (method == "PUT") {
            this.hightlightElement(element)
            if (this.baseURL(this.url) == url) {
              await this.showSublist(true) 
            }
          } else if(method == "DELETE") {
            element.remove()
          }
        } else {
          if (method == "PUT") {
            // maybe we should create an item for the element?
            var parentURL = url.replace(/\/[^/]+$/,"/")
            var parentElement = this.getElementByURL(parentURL)
            if (!parentElement) parentElement = this.get("#row")
            if (parentElement) {
              var stats = await fetch(url, {method: "OPTIONS"}).then(r => r.json())
              stats.name = stats.name.replace(/.*\//,"")
              var element = this.createItem(stats)
              var parentElementList = parentElement.querySelector(":scope > ul") 

              if (parentElementList) {
                var firstSibling = parentElementList.querySelector(":scope > li")
                if (!this.sortIntoAfter(firstSibling, element)) {
                  parentElementList.appendChild(element) 
                }
                this.hightlightElement(element)            
              }
            } 
          }
        }
      }      
    } catch(e) {
      console.error(e)
    }
  }
  
  onDetailsContentCursorActivity(editor, start, end) {

    if (lively.activeElement() == this.get("#details")) return
    
    var startIndex = editor.indexFromPos(start)
    var endIndex = editor.indexFromPos(end)
    
    this.setCursorDetailsItem(null)
    
    this.detailItems.forEach(ea => ea.classList.remove("selected"))
    
    var selectedDetails = []
  
    this.detailItems.forEach(ea => {
      if( !ea.data ) return;
      if (ea.data.start <= startIndex && startIndex < ea.data.end ) {
        this.cursorDetailsItem  = ea
        selectedDetails.push(ea)
      }
      
      if (ea.data.end < startIndex) return;
      if (ea.data.start > endIndex) return;
        selectedDetails.push(ea)
      
    })
    
    
    
    selectedDetails.forEach(ea => ea.classList.add("selected"))
    this.scrollToItem(this.cursorDetailsItem, this.get("#details")) // scroll only to the last selected cursor... 
    
    // lively.notify("start" + startIndex)
    
  }
  
  async livelyExample() {
    // var url = lively4url + "/README.md"
    // var url = "innerhtml://"
    var url = "https://lively-kernel.org/lively4/lively4-jens/doc/"
    var content = await fetch(url).then(r => r.text())
    await this.show(url, content)
  }
}


if (self.lively4fetchHandlers) {  
  // remove old instances of me
  self.lively4fetchHandlers = self.lively4fetchHandlers.filter(ea => !ea.isNavbarHandler);
  self.lively4fetchHandlers.push({
    isNavbarHandler: true,
    handle(request, options) {
      // do nothing
    }, 
    async finsihed(request, options) {
      var url = (request.url || request).toString()
      var method = "GET"
      if (options && options.method) method = options.method;
      if (method == "PUT" || method == "DELETE") {
        try {
          for(var container of document.querySelectorAll("lively-container")) {
            var navbar = container.get("lively-container-navbar")
            if (navbar && navbar.onObserveURLChange) {

              await navbar.onObserveURLChange(url, method)
            }
          }        
        } catch(e) {
          console.error(e)
        }
      }
    }
  })
  
}
