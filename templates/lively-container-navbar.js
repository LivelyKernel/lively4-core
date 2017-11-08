import Morph from './Morph.js';
import ContextMenu from 'src/client/contextmenu.js';

export default class LivelyContainerNavbar extends Morph {
  async initialize() {
    
    this.addEventListener("drop", this.onDrop)
    this.addEventListener("dragover", this.onDragOver)
    // this.addEventListener("dragenter", this.onDragEnter)
  }
  
  clear() {
    this.get("#navbar").innerHTML = ""
  }
  
  onDragOver(evt) {    
    evt.dataTransfer.dropEffect = "copy";
    evt.preventDefault()    
  }

  onDrop(evt) {
    var data = evt.dataTransfer.getData("text");
    
    if (data.match("^https?:\/\/") || data.match(/^data\:image\/png;/)) {
      this.copyFromURL(data)
    } else {
      console.log('ignore data ' + data)
    }
    evt.preventDefault();
  }
  
  async copyFromURL(fromurl) {
    var filename = fromurl.replace(/.*\//,"")
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
    if (await lively.confirm("copy to " + newurl +"?")) {
      var content = await fetch(fromurl).then(r => r.blob());
      lively.notify("copy to " + newurl + ": " + content.size)  
      await fetch(newurl, {
        method: "PUT",
        body: content
      })
      this.show(newurl, content)
    }
  }
  
  async show(targetUrl, sourceContent) {
    this.sourceContent = sourceContent;
    this.url = "" + targetUrl;
    var filename = this.url.replace(/.*\//,"");

    var root = this.url.replace(/\/[^\/]+$/,"/");
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
    throw new Error("please implement deleteFile()")
  }

  renameFile(url) {
    throw new Error("please implement renameFile()")
  }

  newfile(path) {
    throw new Error("please implement newfile()")
  }
  
  navigateToName(name) {
    throw new Error("please implement navigateToName()")
  }

  followPath(name) {
    throw new Error("please implement followPath()")
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