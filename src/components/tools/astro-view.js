/*MD # Astro View - AST Token View spelled wrong

MD*/


import Morph from 'src/components/widgets/lively-morph.js';
import SyntaxChecker from 'src/client/syntax.js'

import { uuid as generateUUID, debounce, flatmap, executeAllTestRunners, promisedEvent, loc, range } from 'utils';

export default class AstroView extends Morph {

  static get defaultSourceURL() { return lively4url + "/src/components/tools/astro-view-example-source.js"; }
  static get defaultWorkspaceURL() { return lively4url + "/src/components/tools/astro-view-example-workspace.js"; }

  /*MD ## UI Accessing MD*/
  get container() { return this.get("#content"); }

  get sourceEditor() { return this.get("#source"); }
  get workspaceEditor() { return this.get("#workspace"); }
  
  get sourceLCM() { return this.sourceEditor.livelyCodeMirror(); }
  get sourceCM() { return this.sourceEditor.currentEditor(); }
  get source() { return this.sourceCM.getValue(); }

  get astInspector() { return this.get("#ast"); }
  
  get sourcePath() { return this.get("#sourcePath"); }
  
  get sourceURL() { return this.sourcePath.value; }
  set sourceURL(urlString) { this.sourcePath.value = urlString; }
  onSourcePathEntered(urlString) { this.loadSourceFile(urlString); }

  get workspaceURL() { return this.workspaceEditor.getURL(); }
  set workspaceURL(urlString) {
  this.workspaceEditor.setURL(urlString) }
  
  get updateButton() { return this.get("#update"); }
  
  get autoUpdate() { return this._autoUpdate; }
  set autoUpdate(bool) {
    this.updateButton.classList.toggle("on", bool);
    this.updateButton.querySelector("i").classList.toggle("fa-spin", bool);
    this._autoUpdate = bool;
  }
  onUpdate(evt) {
    if (evt.button === 2) this.autoUpdate = !this.autoUpdate;
    this.update();
  }
  
  log(s) {
    console.log(s)
  }

  /*MD ## Initialization MD*/

  async loadSourceFile(urlString) {
    console.log("LOAD ", urlString);
    this.sourceURL = urlString;
    this.sourceEditor.setURL(lively.paths.normalizePath(urlString, ""));
    await this.sourceEditor.loadFile();
    await this.update(); 
  }

  async loadWorkspaceFile(urlString) {
    console.log("LOAD Workspace", urlString);
    this.workspaceURL = urlString;
    this.workspaceEditor.setURL(lively.paths.normalizePath(urlString, ""));
    await this.workspaceEditor.loadFile();
  }

  
  async initialize() {
    this.windowTitle = "Astro View";
    this.registerButtons();

    this.getAllSubmorphs("button").forEach(button => {
      button.addEventListener('contextmenu', e => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.dispatchEvent(new MouseEvent("click", {button: 2}));
      });
    });

    this.debouncedUpdate = this.update::debounce(500);
    
    await this.sourceEditor.awaitEditor();
    
    this.sourceEditor.hideToolbar();
    this.astInspector.connectEditor(this.sourceEditor);
    this.sourceLCM.doSave = async () => {
      this.save();
    };
    
    this.sourceEditor.livelyCodeMirror().editor.on("cursorActivity", (cm) => {
      // #TODO continue here....
      // this.selectPath(pathKeys);
    })
    
    
    this.sourceLCM.addEventListener("change", (() =>
      SyntaxChecker.checkForSyntaxErrors(this.sourceCM))::debounce(200));
    this.sourceLCM.addEventListener("change", () => {
      if (this.autoUpdate) this.debouncedUpdate()
    });
    
    
    this.sourcePath.addEventListener("keyup", evt => {
      if (evt.code == "Enter") this.onSourcePathEntered(this.sourcePath.value);
    });

    const source = this.getAttribute("source");
    if (source) this.loadSourceFile(source);
    this.autoUpdate = true;

    
    const workspace = this.getAttribute("workspace");
    if (workspace) this.loadWorkspaceFile(workspace);
    
    this.workspaceEditor.awaitEditor().then(() => {
      // this object for workspace....
      this.workspaceEditor.livelyCodeMirror().getDoitContext = () => this
    })
    
    
    
    this.dispatchEvent(new CustomEvent("initialize"));
  }

  onEditorCursorActivity(cm) {
    var from = cm.getCursor(true)
    var to = cm.getCursor(false)
    
    this.get("#editorInfo").textContent = `${cm.indexFromPos(from)}-${cm.indexFromPos(to)}`
  }
  
  updateTokens() {    
    this.get("#tokens").innerHTML = ""
    let counter = 1
    let pos = 0
    this.tokens = this.source.split(/(?=[^a-zA-Z])/g)
      .map(ea => { 
        let start = pos
        let end = start + ea.length
        pos = end
        return { id: counter++, start: start, end: end, value: ea}
      })
      .filter(ea => !ea.value.match(/^[ \n]+$/))
    
    for(let token of this.tokens) {
      let tokenView = <div class="token" style="">
          <div style="font-size: 6pt">{token.id}</div>
          <div style="background-color: lightgray" click={() => this.selectToken(tokenView, token)}>{token.value}</div>
          <div style="font-size: 6pt; color: blue">{token.start}-{token.end}</div>
        </div>
      this.get("#tokens").appendChild(tokenView)
    }
  }
  
  selectToken(view, token) {
    if (this.selectedTokenView) this.selectedTokenView.classList.remove("selected")
    view.classList.add("selected")
    this.selectedTokenView = view
    
    this.get("#embeddings").innerHTML = ""
    let rows = []
  
    let tds = Array.from(token.value)
      .map(ea => ea.charCodeAt(0))
      .map(ea => <td style="border: 1px solid gray">{ea}</td>)
           
    rows.push(<tr>{...tds}</tr>)
    
    let table = <table style="border-collapse: collapse; border: 1px solid gray">{...rows}</table>
    
    this.get("#embeddings").appendChild(table)
    
  }
  
  
  
  
  /*MD ## Execution MD*/
  
  async update() {
    this.lastSource  = this.source
    this.log("source code changed, length: " + this.source.length + "")
    
    try {
      var node = await this.astInspector.treeSitterParse(this.source)
      this.treeSitterRootNode = node.rootNode
      this.astInspector.inspect(this.treeSitterRootNode);
    } catch (e) {
      this.astInspector.inspect({Error: e.message});
    }
    
    this.updateTokens()
  }

  async save() {
    if (this.sourceURL) {
      await this.sourceEditor.saveFile();
    }
    this.update();
  }

  /*MD ## Lively Integration MD*/

  livelyPrepareSave() {
    this.setAttribute('source', this.sourceURL);
    console.log("PREPARE SAVE (AST Explorer)");
  }
  
  livelyMigrate(other) {
  }

  async livelyExample() {
    await this.loadSourceFile(AstroView.defaultSourceURL);
    await this.loadWorkspaceFile(AstroView.defaultWorkspaceURL);
   
  }
}