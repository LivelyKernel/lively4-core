import { fileName, copyTextToClipboard } from 'utils';
import SearchRoots from "src/client/search-roots.js"
import ContextMenu from 'src/client/contextmenu.js';

export default class FileMenu {
  
  constructor(target) {
    this.target = target
  }
  
  renameFile(url, proposedName) {
    return this.target.renameFile(url, proposedName)
  }
  
  newFile(prefix, path, postfix) {
    return this.target.newFile(prefix, path, postfix)
  }
  
  newDirectory(prefix, path, postfix) {
    return this.target.newDirectory(prefix, path, postfix)
  }
  
  getSelection() {
    return this.target.getSelection()
  }
  
  deleteFile(url, urls) {
    debugger
    return this.target.deleteFile(url, urls)
  }
  
  
  async followPath(url, lastPath) {
    return this.target.followPath(url, lastPath)
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
  
  // #important
  onContextMenu(evt, otherUrl) {
    
    var isDir = otherUrl.match(/\/$/,"")
    var file = otherUrl.replace(/\/$/,"").replace(/.*\//,"");
    
    const menuElements = []
    
    let selection =  this.getSelection()
    if (selection.length < 2) {
      selection = [otherUrl] // user means probably the thing pointed to
    }
    
    if (selection.length > 0) {
      menuElements.push(...[
        [<b>{(selection.map(ea => ea.replace(/.*\//, "")).join(", "))}</b>, 
         () => {}, "", '>'],
        [`delete `, () => this.deleteFile(otherUrl, selection)],
      ])
    } else {
      menuElements.push(...[
        [<b>{file}</b>, 
         () => {}, "", '>'],
      ])
    }
    if (selection.length == 1) {
      menuElements.push(...[
        [`rename`, () => this.renameFile(otherUrl)],
        [`become bundle`, () => this.convertFileToBundle(otherUrl)],
        
        ["edit ", () => lively.openBrowser(otherUrl, true)],
        ["browse", () => lively.openBrowser(otherUrl)],
        // ["save as png", () => lively.html.saveAsPNG(otherUrl)],
        ["copy path to clipboard", () => copyTextToClipboard(otherUrl), "", '<i class="fa fa-clipboard" aria-hidden="true"></i>'],
        // ["copy file name to clipboard", () => copyTextToClipboard(otherUrl::fileName()), "", '<i class="fa fa-clipboard" aria-hidden="true"></i>'],
      ])
      
      let serverURL = lively.files.serverURL(otherUrl)
      if (serverURL && serverURL.match("localhost")) {
        // does only make sense when accessing a localhost server, 
        // otherwise a pdf viewer would be opened on a remote machine?
        menuElements.push(["open externally", async () => {
          let buildPath = otherUrl.replace(serverURL,"").replace(/^\//,"")
          var openURL = serverURL + "/_open/" + buildPath 
          fetch(openURL)
         }])
      }
      
    }
   if (isDir) {
      
      if(SearchRoots.isSearchRoot(otherUrl)) {
        menuElements.push(...[
          [`update search root`, () => SearchRoots.addSearchRoot(otherUrl)],
          [`remove search root`, () => SearchRoots.removeSearchRoot(otherUrl)],
        ])        
      } else {
        menuElements.push(...[
          [`add search root`, () => SearchRoots.addSearchRoot(otherUrl)],
        ])
      }
    }

    if (lively.files.isPicture(otherUrl)) {
      menuElements.push(...[
        [`set as background`, () => lively.files.setURLAsBackground(otherUrl)],
      ])
    }
    
   
    var basePath = otherUrl.replace(/[^/]*$/,"")
    menuElements.push(...[
      ["new", [
        [`directory`, () => this.newDirectory(basePath, "folder", "/")],
        [`markdown file`, () => this.newFile(basePath, "file", ".md")],
        [`source file`, () => this.newFile(basePath, "file", ".js")],
        [`drawio figure`, () => this.newFile(basePath, "file", ".drawio")],
      ], "", ''],
    ])
    const menu = new ContextMenu(this, menuElements)
    menu.openIn(document.body, evt, this)
  }

}