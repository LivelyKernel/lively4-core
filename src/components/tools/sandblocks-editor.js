import "src/client/tree-sitter.js"



// while in dev, we keep sandblocks in a separate git repo
import md5 from "../../../../sandblocks-text/md5.min.js"
window.md5= md5

import  {SBParser, setConfig} from "../../../../sandblocks-text/model.js"
import {} from "../../../../sandblocks-text/view.js";
import {} from "../../../../sandblocks-text/smalltalk.js";
import {} from "../../../../sandblocks-text/javascript.js";

//   // initialize language.... 
var baseDir = lively4url + "/../sandblocks-text/"
setConfig({baseURL: baseDir})


import Morph from 'src/components/widgets/lively-morph.js';

export default class SandblocksEditor extends Morph {
  async initialize() {
    this.windowTitle = "SandblocksEditor";
    this.registerButtons()

    lively.html.registerKeys(this); // automatically installs handler for some methods
    
  }
  
  setURL(urlString) {
    this.setAttribute("url", urlString)
  }

  getURL() {
    return this.getAttribute("url")
  }
  
  async loadFile() {
    var source = await fetch(this.getURL()).then(r => r.text()) 
    
    this.setText(source)
  }
  
  async saveFile() {
    await lively.files.saveFile(this.getURL(), this.getText())
  }
  
  currentEditor() {
    return this
  }

  getValue() {
    return this.getText()
  }
  
  getText() {
    let sbEditor = this.get("sb-editor")
    return sbEditor.sourceString
  }
  
  async setText(source) {
    
    var ui = await (
    <sb-extension-scope enable="smalltalkTools" disable="">
      <sb-editor text={source} language="javascript"></sb-editor>
    </sb-extension-scope>)

    var holder = this.get("#sandblocks")
    holder.innerHTML = ""
    holder.appendChild(ui)
  }
  
  setScrollInfo() {
    // do nothing
  }
  
  getScrollInfo() {
    
  }
  
  livelyExample() {
    this.setURL(lively4url + "/demos/javascript/sb.js");
    this.loadFile()
  }
  
  
}