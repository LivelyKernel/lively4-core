import Morph from 'src/components/widgets/lively-morph.js';
import SyntaxChecker from 'src/client/syntax.js'

import { uuid as generateUUID, debounce, flatmap, executeAllTestRunners, promisedEvent } from 'utils';

export default class ASTExplorer extends Morph {

  static get defaultSourceURL() { return "/src/components/tools/lively-ast-explorer-example-source.js"; }

  /*MD ## UI Accessing MD*/

  get container() { return this.get("#content"); }

  get sourceEditor() { return this.get("#source"); }
  get sourceLCM() { return this.sourceEditor.livelyCodeMirror(); }
  get sourceCM() { return this.sourceEditor.currentEditor(); }
  get source() { return this.sourceCM.getValue(); }

  get astInspector() { return this.get("#ast"); }
  
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
    this.update();
  }

  async initialize() {
    this.windowTitle = "AST Explorer";
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
    
    this.dispatchEvent(new CustomEvent("initialize"));
  }

  /*MD ## Execution MD*/

  async update() {
    try {
      this.astInspector.inspect(this.source.toAST());
    } catch (e) {
      this.astInspector.inspect({Error: e.message});
    }
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

  livelyExample() {
    this.loadSourceFile(ASTExplorer.defaultSourceURL);
  }
}