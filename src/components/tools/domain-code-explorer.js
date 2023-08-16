/*MD # Domain Code Explorer

[graph](edit://src/components/tools/domain-code-graph.js) | [domain-code](edit://src/client/domain-code.js)  | [inspector](edit://src/components/tools/lively-ast-treesitter-inspector.js)

## Tasks:

- [ ] scroll source with AST (similar to HedgeDoc)
- [ ] select text in source, highlight in AST
- [ ] show inspector for DomainCode tree
- [ ] show editor for source + DomainCode replacement / widgets

## Notes

- define Query / Binding for const/let unnamed child of lexical-declaration
- Plan
  - change content of unamed child "let" to "const"
  - native alt plan:
    - print whole tree
    - reparse whole tree with upodated indexes
  - change code mirror contents at indexes of unmamed child
    - this will fuck up all existing tree-sitter indexes....
    - solution?: call treesiter.edit with changed indices (old and new?)
      - not clear what happens than... hopefully we are all happy...
MD*/


import Morph from 'src/components/widgets/lively-morph.js';
import SyntaxChecker from 'src/client/syntax.js'

import { uuid as generateUUID, debounce, flatmap, executeAllTestRunners, promisedEvent, loc, range } from 'utils';

import {TreeSitterDomainObject, LetSmilyReplacementDomainObject, ConstSmilyReplacementDomainObject} from "src/client/domain-code.js"


export default class DomainCodeExplorer extends Morph {

  static get defaultSourceURL() { return lively4url + "/src/components/tools/lively-domain-code-explorer-example-source.js"; }

  /*MD ## UI Accessing MD*/

  get container() { return this.get("#content"); }

  get sourceEditor() { return this.get("#source"); }
  get editor() { return this.get("#editor"); }
  
  get sourceLCM() { return this.sourceEditor.livelyCodeMirror(); }
  get sourceCM() { return this.sourceEditor.currentEditor(); }
  get source() { return this.sourceCM.getValue(); }

  get astInspector() { return this.get("#ast"); }
  get domainObjectInspector() { return this.get("#domainobject"); }
  
  get sourcePath() { return this.get("#sourcePath"); }
  get sourceURL() { return this.sourcePath.value; }
  set sourceURL(urlString) { this.sourcePath.value = urlString; }
  onSourcePathEntered(urlString) { this.loadSourceFile(urlString); }
  
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

  /*MD ## Initialization MD*/

  async loadSourceFile(urlString) {
    console.log("LOAD ", urlString);
    this.sourceURL = urlString;
    this.sourceEditor.setURL(lively.paths.normalizePath(urlString, ""));
    await this.sourceEditor.loadFile();
    await this.update();
   
    
  }

  async initialize() {
    this.windowTitle = "DomainCode Explorer";
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
    this.sourceLCM.addEventListener("change", (evt => SyntaxChecker.checkForSyntaxErrors(this.sourceCM))::debounce(200));
    this.sourceLCM.addEventListener("change", evt => {if (this.autoUpdate) this.debouncedUpdate()});
    
    
    
    this.sourcePath.addEventListener("keyup", evt => {
      if (evt.code == "Enter") this.onSourcePathEntered(this.sourcePath.value);
    });

    const source = this.getAttribute("source");
    if (source) this.loadSourceFile(source);
    this.autoUpdate = true;

    
    this.editor.hideToolbar();

    this.editor.livelyCodeMirror().editor.on("cursorActivity", (cm) => {      
      this.onEditorCursorActivity(cm)
    })
    
    this.editor.livelyCodeMirror().addEventListener("domain-code-changed", evt => {      
        this.onDomainCodeChanged(evt)
    })
    
    
    this.domainObjectInspector.addEventListener("select-object", (evt) => {
      this.onDomainObjectSelect(evt.detail.node, evt.detail.object)
    })
    
    
    this.dispatchEvent(new CustomEvent("initialize"));
  }
  
  onEditorCursorActivity(cm) {
    var from = cm.getCursor(true)
    var to = cm.getCursor(false)
    
    this.get("#editorInfo").textContent = `${cm.indexFromPos(from)}-${cm.indexFromPos(to)}`
  }
  
  onDomainObjectSelect(node, object) {
    
    if(!object.isDomainObject) return false
    
    
    var currentRootNode = object.rootNode().treeSitter
    if (currentRootNode !== this.treeSitterRootNode) {
      this.treeSitterRootNode = currentRootNode
      this.astInspector.inspect(this.treeSitterRootNode);
    }
    this.astInspector.selectNode(object.treeSitter)
    
  }

  onDomainCodeChanged(evt) {
    lively.notify("on domain code changed " + evt.detail.edit.startIndex)
     this.domainObjectInspector.inspect(this.domainObjectInspector.targetObject)
  }
  
  onDomainUpdateButton() {
    lively.notify("update")
    this.domainObjectInspector.inspect(this.domainObjectInspector.targetObject)
  }
  
  onDomainGraphButton() {
    lively.openMarkdown(lively4url + "/src/components/tools/domain-code-graph.md", 
      "Domain Graph Graph", {domainObject: this.domainObject})
  }
  /*MD ## Execution MD*/
  
  async update() {
    try {
      var node = await this.astInspector.treeSitterParse(this.source)
      this.treeSitterRootNode = node.rootNode
      this.astInspector.inspect(this.treeSitterRootNode);
    } catch (e) {
      this.astInspector.inspect({Error: e.message});
    }
   
    this.domainObject = TreeSitterDomainObject.fromTreeSitterAST(node.rootNode)
    this.domainObject.replaceType('let', LetSmilyReplacementDomainObject)
    this.domainObject.replaceType('const', ConstSmilyReplacementDomainObject)

    this.domainObjectInspector.isAstMode = function() {return true}
    this.domainObjectInspector.inspect(this.domainObject)
    // this.domainObjectInspector.hideWorkspace()


    await this.editor.setText(this.source)
    await lively.sleep(1000)
    this.domainObject.renderAll(this.editor.livelyCodeMirror())
    
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
    // #TODO: do we still need this?
    this.addEventListener("initialize", () => {
      this.loadSourceFile(other.sourceURL);
    });
  }

  async livelyExample() {
    await this.loadSourceFile(DomainCodeExplorer.defaultSourceURL);
   
  }
}