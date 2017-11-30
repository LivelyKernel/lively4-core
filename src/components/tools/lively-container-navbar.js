import Morph from 'src/components/widgets/lively-morph.js';
import ContextMenu from 'src/client/contextmenu.js';
import { applyDragCSSClass } from 'src/client/draganddrop.js';
import { fileName } from 'utils';

export default class LivelyContainerNavbar extends Morph {
  async initialize() {
    
    this.addEventListener("drop", this.onDrop)
    this.addEventListener("dragover", this.onDragOver)
    // this.addEventListener("dragenter", this.onDragEnter)
    this::applyDragCSSClass();
  }
  
  clear() {
    this.get("#navbar").innerHTML = ""
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
    if(files.length > 0 &&
      await lively.confirm(`Copy ${files.length} file(s) into directory ${this.url}?`)
    ) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = async event => {
          var newURL = this.url.replace(/[^/]*$/, file.name);
          const content = event.target.result;
          await fetch(newURL, {
            method: "PUT",
            body: content
          });          
          this.show(newURL, content);
        };
        reader.readAsBinaryString(file);
      });
      return;
    }

    var data = evt.dataTransfer.getData("text");
    if (data.match("^https?:\/\/") || data.match(/^data\:image\/png;/)) {
      this.copyFromURL(data);        
    } else {
      console.log('ignore data ' + data);
    }
  }
  
  async copyFromURL(fromurl) {
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
    if (await lively.confirm(`${this.transferMode} to ${newurl}?`)) {
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
        that.updateOtherNavbars(this.getRoot(fromurl))
        that.updateOtherNavbars(this.getRoot(newurl))

        lively.notify(`${this.transferMode}d to ` + newurl + ": " + content.size)  
      }
      this.show(newurl, content)
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
    await this.showSublist()
  }
  
  async show(targetUrl, sourceContent) {
    this.sourceContent = sourceContent;
    this.url = "" + targetUrl;
    var filename = this.getFilename();
    var root = this.getRoot();
    this.currentDir = root;
    var stats = await fetch(root, {
      method: "OPTIONS",
    }).then(r => r.json()).catch(e => null);
    
    if (!stats) {
      stats = {};// fake it
      stats.contents = [{type: "file", name: "index.html"}];
      
      var html = await fetch(root).then(r => r.text())
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
        
        return (a.name >= b.name) ? 1 : -1;
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
      } 
        else {
        icon = '<i class="fa fa-file"></i>';
      }
      
      // name.replace(/\.(lively)?md/,"").replace(/\.(x)?html/,"")
      link.innerHTML = icon + name;
      var href = ea.href || ea.name;
      
      var otherUrl = href.match(/^https?:\/\//) ? href : root + "" + href;
      link.href = otherUrl;

      link.onclick = () => {
        this.followPath(otherUrl);
        return false;
      };
      link.addEventListener('contextmenu', (evt) => {
	        if (!evt.shiftKey) {
            evt.preventDefault();
            var menu = new ContextMenu(this, [
              ["delete file", () => this.deleteFile(otherUrl)],
              ["rename file", () => this.renameFile(otherUrl)],
              ["new file", () => this.newfile(otherUrl)],
              ["edit", () => lively.openBrowser(otherUrl, true)],
              ["browse", () => lively.openBrowser(otherUrl)],
              
            ]);
            menu.openIn(document.body, evt, this);
            evt.stopPropagation();
            evt.preventDefault();
            return true;
          }
      }, false);
      element.appendChild(link);
      navbar.appendChild(element);
    });
    
  

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
    this.show(new URL(url +"/"),"")
  }

  async showSublist() {
    if (!this.targetItem || !this.sourceContent) return 
    
    var subList = document.createElement("ul");
    this.targetItem.appendChild(subList);
    
    if (this.url.match(/templates\/.*html$/)) {
      var template = $($.parseHTML(this.sourceContent)).filter("template")[0];
      if (!template) {
        console.log("showNavbar: no template found");
        return;
      }
      // fill navbar with list of script
      Array.from(template.content.querySelectorAll("script")).forEach((ea) => {
	      var element = document.createElement("li");
	      element.innerHTML = ea.getAttribute('data-name');
	      element.classList.add("subitem");
	      element.onclick = () => {
	        this.navigateToName(
	          "data-name=\""+ea.getAttribute('data-name')+'"');
	      };
	      subList.appendChild(element) ;
      });
    } else if (this.url.match(/\.js$/)) {
      // |async\\s+
      
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
    } else if (this.url.match(/\.md$/)) {
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
  }
  
  async livelyMigrate(other) {
    await this.show(other.url, other.sourceContent)
    this.showSublist()
  }

  async livelyExample() {
    var url = lively4url + "/README.md"
    var content = await fetch(url).then(r => r.text())
    await this.show(url, content)
    this.showSublist()
    
  }
  
  
}