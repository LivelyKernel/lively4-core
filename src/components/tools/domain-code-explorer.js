/*MD # Domain Code Explorer

## Tasks:

- [ ] scroll source with AST (similar to HedgeDoc)
- [ ] select text in source, highlight in AST
- [ ] show inspector for DomainCode tree
- [ ] show editor for source + DomainCode replacement / widgets


MD*/


import Morph from 'src/components/widgets/lively-morph.js';
import SyntaxChecker from 'src/client/syntax.js'

import { uuid as generateUUID, debounce, flatmap, executeAllTestRunners, promisedEvent } from 'utils';

import {TreeSitterDomainObject, LetSmilyReplacementDomainObject} from "src/client/domain-code.js"


export default class DomainCodeExplorer extends Morph {

  static get defaultSourceURL() { return "/src/components/tools/lively-domain-code-explorer-example-source.js"; }

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

    
    
    
    this.dispatchEvent(new CustomEvent("initialize"));
  }
  
  
  onDomainGraphButton() {
    lively.openMarkdown(lively4url + "/src/components/tools/domain-code-graph.md", 
      "Domain Graph Graph", {domainObject: this.domainObject})
  }

  /*MD ## Execution MD*/

  async update() {
    try {
      var node = await this.astInspector.treeSitterParse(this.source)
      this.astInspector.inspect(node.rootNode);
    } catch (e) {
      this.astInspector.inspect({Error: e.message});
    }
   
    this.domainObject = TreeSitterDomainObject.fromTreeSitterAST(node.rootNode)
    this.domainObject.replaceType('lexical_declaration', LetSmilyReplacementDomainObject)

    this.domainObjectInspector.isAstMode = function() {return true}
    this.domainObjectInspector.inspect(this.domainObject)
    this.domainObjectInspector.hideWorkspace()


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