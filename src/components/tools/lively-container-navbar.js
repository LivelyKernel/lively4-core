import Morph from 'src/components/widgets/lively-morph.js';
import ContextMenu from 'src/client/contextmenu.js';
import { applyDragCSSClass, DropElementHandler } from 'src/client/draganddrop.js';
import { fileName, copyTextToClipboard } from 'utils';
import components from 'src/client/morphic/component-loader.js';
import Preferences from 'src/client/preferences.js';
import Mimetypes from 'src/client/mimetypes.js';
import JSZip from 'src/external/jszip.js';

export default class LivelyContainerNavbar extends Morph {
  async initialize() {
    this.addEventListener("drop", this.onDrop);
    this.addEventListener("dragover", this.onDragOver);
    // this.addEventListener("dragenter", this.onDragEnter)
    this::applyDragCSSClass();
    this.lastSelection = [];
  }
  
  clear() {
    this.get("#navbar").innerHTML = ""
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
    
    if (DropElementHandler.handle(evt, this, (element, evt) => {
      lively.notify("handle " + element)
    })) return;
    
    var data = evt.dataTransfer.getData("text");
    if (data.match("^https?://") || data.match(/^data\:image\/png;/)) {
      this.copyFromURL(data);        
    } else {
      console.log('ignore data ' + data);
    }
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
    return url.replace(/\/[^\/]+$/,"/")
  }
  
  getFilename(url) {
    url = url || this.url;
    return url.replace(/.*\//,"")
  }
  
  async update() {
    await this.show(this.url, this.sourceContent)
  }
  
  getSelection() {
    return _.map(this.shadowRoot.querySelectorAll(".selected a"), ea => ea.href)
  }
  
  async show(targetUrl, sourceContent) {
    
    this.sourceContent = sourceContent;
    this.url = "" + targetUrl;
    var filename = this.getFilename();
    var root = this.getRoot();
    this.currentDir = root;
    var stats = await fetch(root, {
      method: "OPTIONS",
    }).then(r => r.status == 200 ? r.json() : {})
    
    var mystats = await fetch(targetUrl, {
      method: "OPTIONS",
    }).then(r => r.status == 200 ? r.json() : {})
    
    if (!stats || !stats.type) {
      stats = {};// fake it
      stats.contents = [{type: "file", name: "index.html"}];
      
      var html = await fetch(root.replace(/\/?$/,"/")).then(r => r.text())
      var div = document.createElement("div");
      div.innerHTML = html;
      var i=0;
      Array.from(div.querySelectorAll("a"))
        .filter( ea => !ea.getAttribute("href").match(/^javascript:/))
        .forEach( ea => {
        stats.contents.push({
          type: 'link', 
          name: '' + ea.getAttribute("href").replace(/\/(index.html)?$/,"").replace(/.*\//,""), // ea.textContent,
          href: "" + ea.getAttribute("href") 
        });
      });
    }
    this.clear();
    var navbar = this.get("#navbar")
      
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
        
        // date based filenames are sorted so lastest are first
        if (a.name.match(/\d\d\d\d-\d\d-\d\d/) && b.name.match(/\d\d\d\d-\d\d-\d\d/)) {
          return (a.name >= b.name) ? -1 : 1;          
        }
        
        return ((a.title || a.name) >= (b.title || b.name)) ? 1 : -1;
      })
      .filter(ea => ! ea.name.match(/^\./));
    
      

    files.unshift({name: "..", type: "directory"});
    files.forEach((ea) => {

      // if there is an Markdown File, ignore the rest
      // #TODO should we make this an option?
      // var m = ea.name.match(/(.*)\.(.*)/);
      // if (m && m[2] != "md" && names[m[1]+".md"]) return;
      // if (m && m[2] != "livelymd" && names[m[1]+".livelymd"]) return;

      var element = document.createElement("li");
      var link = document.createElement("a");

      if (ea.name == filename) this.targetItem = element;
      
      if (this.targetItem) this.targetItem.classList.add("selected");
      
      var name = ea.name;
     
      var icon;
      if (ea.type == "directory") {
        name += "/";
        icon = '<i class="fa fa-folder"></i>';
      } else if (ea.type == "link") {
        icon = '<i class="fa fa-arrow-circle-o-right"></i>';
      } else if (/(\.|-)(spec|test)\.js$/i.test(name)) {
        icon = '<i class="fa fa-check-square-o"></i>'
      } else {
        icon = '<i class="fa fa-file"></i>';
      }
      var title = ea.title || name
      // name.replace(/\.(lively)?md/,"").replace(/\.(x)?html/,"")
      link.innerHTML =  icon + title;
      var href = ea.href || ea.name;
      if (ea.type == "directory" && !href.endsWith("/")) {
        href += "/"
      }
      var otherUrl = href.match(/^[a-z]+:\/\//) ? href : root + "" + href;
      if (mystats.parent && ea.name == "..") {        
        otherUrl = mystats.parent
      }
      link.href = otherUrl;
      
      
      if (this.lastSelection && this.lastSelection.includes(otherUrl)) {
        element.classList.add("selected")
      }
      
      link.onclick = (evt) => { 
        this.onItemClick(link, evt); 
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
      navbar.appendChild(element);
    });
    this.showSublist()
  }
  
  onItemClick(link, evt) {
    if (evt.shiftKey) {
      this.lastSelection = this.getSelection()     
    } else {
      this.lastSelection = []
    }
    this.followPath(link.href );
  }
  
  async editWithSyvis (url) {
    const editor = await components.createComponent('syvis-editor');
    await editor.loadUrl(url);
    await components.openInWindow(editor);
  }

  onContextMenu(evt, otherUrl) {
    const menuElements = [
      ["delete file", () => this.deleteFile(otherUrl)],
      ["rename file", () => this.renameFile(otherUrl)],
      ["new file", () => this.newfile(otherUrl)],
      ["edit", () => lively.openBrowser(otherUrl, true)],
      ["browse", () => lively.openBrowser(otherUrl)],
      ["save as png", () => lively.html.saveAsPNG(otherUrl)],
      ["copy path to clipboard", () => copyTextToClipboard(otherUrl), "", '<i class="fa fa-clipboard" aria-hidden="true"></i>'],
      ["copy file name to clipboard", () => copyTextToClipboard(otherUrl::fileName()), "", '<i class="fa fa-clipboard" aria-hidden="true"></i>'],
    ];
    
    const menu = new ContextMenu(this, menuElements)
    menu.openIn(document.body, evt, this)
  }
  
  deleteFile(url) {
    lively.notify("please implement deleteFile()")
  }

  renameFile(url) {
    lively.notify("please implement renameFile()")
  }

  newfile(path) {
    lively.notify("please implement newfile()")
  }
  
  navigateToName(url) {
    lively.notify(`please implement navigateToName(${url})`)
  }

  followPath(url) {
    this.show(new URL(url),"")
  }

  showSublistHTML(subList) {
    if (!this.sourceContent) return;
    var template = $($.parseHTML(this.sourceContent)).filter("template")[0];
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

  async showSublistOptions(subList) {
    var options = await fetch(this.url, {method: "OPTIONS"})
      .then(r => r.status == 200 ? r.json() : {})
    if (!options.contents) return;
    for(var ea of options.contents) {
      var element = <li 
          class="link subitem">{ea.name}</li>
      subList.appendChild(element);
      element.onclick = () => {
        lively.notify("follow " + ea.name)
        this.followPath(this.url + "/" + ea.name)
      }
    }
  }
  
  async showSublist() {
    if (!this.targetItem) return 
    var subList = document.createElement("ul");
    this.targetItem.appendChild(subList);
    if (this.url.match(/templates\/.*html$/)) {
      this.showSublistHTML(subList)
    } else if (this.url.match(/\.js$/)) {
      this.showSublistJS(subList)
    } else if (this.url.match(/\.md$/)) {
      this.showSublistMD(subList)
    } else {
      this.showSublistOptions(subList)
    }
  } 
  
  async livelyMigrate(other) {
    await this.show(other.url, other.sourceContent)
    this.showSublist()
  }

  async livelyExample() {
    // var url = lively4url + "/README.md"
    var url = "innerhtml://"
    var content = await fetch(url).then(r => r.text())
    await this.show(url, content)
  }
}