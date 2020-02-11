import Morph from 'src/components/widgets/lively-morph.js';
import babelDefault from 'systemjs-babel-build';
const babel = babelDefault.babel;
import SyntaxChecker from 'src/client/syntax.js'
import sourcemap from 'src/external/source-map.min.js'
import { uuid as generateUUID, debounce, flatmap, executeAllTestRunners, promisedEvent } from 'utils';

export default class PluginExplorer extends Morph {

  static get defaultSourceURL() { return lively4url + "/src/components/tools/lively-ast-explorer-example-source.js"; }
  static get defaultPluginURL() { return lively4url + "/src/components/tools/lively-ast-explorer-example-plugin.js"; }

  static get defaultWorkspacePath() { return "/src/components/tools/lively-plugin-explorer-playground.workspace"; }

  /*MD ## UI Accessing MD*/

  get container() { return this.get("#content"); }

  get executionConsole() { return this.get("#executionConsole"); }

  get sourceEditor() { return this.get("#source"); }
  get sourceLCM() { return this.sourceEditor.livelyCodeMirror(); }
  get sourceCM() { return this.sourceEditor.currentEditor(); }
  get source() { return this.sourceCM.getValue(); }

  get sourceAstInspector() { return this.get("#sourceAst"); }
  
  get pluginEditor() { return this.get("#plugin"); }
  get pluginLCM() { return this.pluginEditor.livelyCodeMirror(); }
  get pluginCM() { return this.pluginEditor.currentEditor(); }
  get pluginSource() { return this.pluginCM.getValue(); }

  async getPlugin() {
    const url = this.fullUrl(this.pluginURL) || "";
    const module = await System.import(url);
    // url +=  "?" + Date.now(); // #HACK, we thought we don't have this to do any more, but ran into a problem when dealing with syntax errors...
    // assumend problem: there is a bad version of the code in either the browser or system.js cache
    // idea: we have to find and flush it...
    // wip: the browser does not cache it, but system.js does...
    return module.default;
  }
  
  get transformedSourceLCM() { return this.get("#transformedSource"); }
  get transformedSourceCM() { return this.transformedSourceLCM.editor; }
  
  get sourceURL() { return this.sourceEditor.getURLString(); }
  get pluginURL() { return this.pluginEditor.getURLString(); }

  get workspacePath() { return this.get("#workspace-path"); }
  get workspaceURL() { return this.workspacePath.value; }
  set workspaceURL(urlString) { this.workspacePath.value = urlString; }
  onWorkspacePathEntered(urlString) { this.loadWorkspaceFile(urlString); }
  
  get saveButton() { return this.get("#save"); }
  get autoSave() { return this.workspace.autoSave; }
  set autoSave(bool) {
    this.saveButton.classList.toggle("on", bool);
    this.workspace.autoSave = bool;
  }
  onSave(evt) {
    if (evt.button === 2) this.autoSave = !this.autoSave;
    this.save();
  }

  get updateButton() { return this.get("#update"); }
  get autoUpdate() { return this.workspace.autoUpdate; }
  set autoUpdate(bool) {
    this.updateButton.classList.toggle("on", bool);
    this.updateButton.querySelector("i").classList.toggle("fa-spin", bool);
    this.workspace.autoUpdate = bool;
  }
  onUpdate(evt) {
    if (evt.button === 2) this.autoUpdate = !this.autoUpdate;
    this.updateAST();
  }

  get runsTestsButton() { return this.get("#toggleRunsTests"); }
  get runsTests() { return this.workspace.runsTests; }
  set runsTests(bool) {
    this.runsTestsButton.classList.toggle("on", bool);
    this.workspace.runsTests = bool;
  }
  onToggleRunsTests() { this.runsTests = !this.runsTests; }

  get executeButton() { return this.get("#execute"); }
  get autoExecute() { return this.workspace.autoExecute; }
  set autoExecute(bool) {
    this.executeButton.querySelector("i").classList.toggle("fa-spin", bool);
    this.executeButton.classList.toggle("on", bool);
    this.workspace.autoExecute = bool;
  }
  onExecute(evt) {
    if (evt.button === 2) this.autoExecute = !this.autoExecute;
    this.execute();
  }
  
  get systemJSButton() { return this.get("#toggleSystemJS"); }
  get systemJS() { return this.workspace.systemJS; }
  set systemJS(bool) {
    this.systemJSButton.classList.toggle("on", bool);
    this.workspace.systemJS = bool;
  }
  onToggleSystemJS() { this.systemJS = !this.systemJS; }
  
  get options() {
    return {
      "systemJS": false,
      "autoExecute": true,
      "runsTests": false,
      "autoUpdate": true,
      "autoSave": true, 
    }
  }

  /*MD ## Initialization MD*/

  fullUrl(urlString) {
    try {
      return lively.paths.normalizePath(urlString, "");
    } catch(e) {
      return null;
    }
  }

  async initLivelyEditorFromAttribute(editor, attributeToRead, defaultPath) {
    var filePath =  this.getAttribute(attributeToRead);
    if (!filePath) {
      filePath = defaultPath;
    }
    editor.setURL(filePath);
    await editor.loadFile();
  }

  async initialize() {
    this.windowTitle = "Plugin Explorer";
    this.registerButtons();

    this.workspace = {};

    this.getAllSubmorphs("button").forEach(button => {
      button.addEventListener('contextmenu', e => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.dispatchEvent(new MouseEvent("click", {button: 2}));
      });
    });

    this.debouncedUpdateAST = this.updateAST::debounce(500);
    this.debouncedUpdateTransformation = this.updateTransformation::debounce(500);
    
    function enableSyntaxCheckForEditor(editor) {
      editor.addEventListener("change", (evt => SyntaxChecker.checkForSyntaxErrors(editor.editor))::debounce(200));
    }

    this.pluginEditor.awaitEditor().then(() => {
      this.pluginEditor.hideToolbar();
      this.pluginLCM.doSave = async () => {
        await this.pluginEditor.saveFile();

        await lively.reloadModule("" + this.pluginURL);
        this.updateAST();
      };
      enableSyntaxCheckForEditor(this.pluginLCM);
      this.pluginLCM.addEventListener("change", evt => {if (this.autoUpdate) this.debouncedUpdateTransformation()});
      this.transformedSourceCM.on("beforeSelectionChange", evt => this.onTransformedSourceSelectionChanged(evt));
    });

    this.sourceEditor.awaitEditor().then(() => {
      this.sourceEditor.hideToolbar();
      this.sourceAstInspector.connectEditor(this.sourceEditor);
      this.sourceLCM.doSave = async () => {
        await this.sourceEditor.saveFile();
        this.updateAST();
      };
      enableSyntaxCheckForEditor(this.sourceLCM);
      this.sourceLCM.addEventListener("change", evt => {if (this.autoUpdate) this.debouncedUpdateAST()});
      this.sourceCM.on("beforeSelectionChange", evt => this.onSourceSelectionChanged(evt));
    });

    this.workspacePath.addEventListener("keyup", evt => {
      if (evt.code == "Enter") this.onWorkspacePathEntered(this.workspacePath.value);
    });

    await Promise.all([
      this.pluginEditor.awaitEditor(),
      this.sourceEditor.awaitEditor(),
      this.transformedSourceLCM.editorLoaded(),
    ]);
    
    this.dispatchEvent(new CustomEvent("initialize"));
  }

  async loadWorkspaceFile(urlString) {
    try {
      const url = new URL(this.fullUrl(urlString));
      const response = await fetch(url);
      const text = await response.text();
      const ws = BabelWorkspace.deserialize(text);
      this.workspacePath.value = urlString;
      this.loadWorkspace(ws);
    } catch (e) {
      lively.error(`[Plugin Explorer] Failed to load workspace.`, urlString);
    }
  }

  async loadWorkspace(ws) {
    console.log(ws);
    this.workspace = ws;
    this.pluginEditor.setURL(new URL(this.fullUrl(ws.plugin)));
    this.pluginEditor.loadFile();
    this.sourceEditor.setURL(new URL(this.fullUrl(ws.source)));
    this.sourceEditor.loadFile();
    this.setOptions(ws);
  }
  
  async setOptions(ws) {
    for (const [option, defaultValue] of Object.entries(this.options)) {
      console.log(option, defaultValue);
      this[option] = option in ws ? ws[option] : defaultValue;
    }
  }

  async saveWorkspaceFile(urlString) {
    try {
      const url = new URL(this.fullUrl(urlString));
      const text = BabelWorkspace.serialize(this.workspace);
      await fetch(url, {
        method: 'PUT', 
        body: text,
      });
    } catch (e) {
      lively.error('[Plugin Explorer] Failed to save workspace.', urlString);
    }
  }

  /*MD ## Execution MD*/

  async updateAST() {
    try {
      this.ast = this.source.toAST();
      this.sourceAstInspector.inspect(this.ast);
      this.updateTransformation();
    } catch (e) {
      this.ast = null;
      this.sourceAstInspector.inspect({Error: e.message});
    }
  }

  async updateTransformation() {
    const plugin = await this.getPlugin();
    
    try {
      console.group("PLUGIN TRANSFORMATION");
      if (this.systemJS) {
        // use SystemJS config do do a full transform
        if (!self.lively4lastSystemJSBabelConfig) {
          lively.error("lively4lastSystemJSBabelConfig missing");
          return;
        }
        let config = Object.assign({}, self.lively4lastSystemJSBabelConfig);
        let url = this.fullUrl(this.pluginURL) || "";
        let originalPluginURL = url.replace(/-dev/,""); // name of the original plugin .... the one without -dev
        // replace the original plugin with the one under development.... e.g. -dev
        config.plugins = config.plugins.filter(ea => !ea.livelyLocation || !(ea.livelyLocation == originalPluginURL))
                          .concat([plugin])
        let filename = "tempfile.js";
        config.filename = filename
        config.sourceFileName = filename
        config.moduleIds = false
        this.transformationResult = babel.transform(this.source, config);
      } else {
        this.transformationResult = this.ast.transformAsAST(plugin);
      }
      
      this.transformedSourceCM.setValue(this.transformationResult.code);
      
      if (this.autoExecute) this.execute();
      if (this.runsTests) executeAllTestRunners();
    } catch(err) {
      console.error(err);
      this.transformedSourceCM.setValue("Error: " + err.message);
    } finally {
      console.groupEnd();
    }
  }

  async execute() {
    const log = this.executionConsole;
    log.innerHTML = "";
    log.textContent = "";
    
    const oldLog = console.log
    try {
      console.group("[Plugin Explorer] EXECUTE REWRITTEN FILE");
      console.log = (...fragments) => {
        oldLog.call(console, ...fragments)
        log.textContent += fragments.join(', ') + "\n"
      }
      // #TODO active expressions...
      var transformedSource = this.transformedSourceCM.getValue()
      if (this.systemJS) {
        // use systemjs to load it's module without any further transformation
        var url = "tmp://" + filename // replace this with local TMP 
        
        var modURL = lively.swxURL(url)
        await lively.unloadModule(modURL)
        await fetch(url, {
          method: "PUT",
          body: transformedSource 
        })
        await System.import(modURL)
      } else {
        var result ='' + (await this.transformedSourceLCM.boundEval(transformedSource)).value;
      }
      
      // var result ='' + eval(this.outputEditor.editor.getValue());
      this.executionConsole.textContent += "-> " + result;       
    } catch(e) {
      console.error(e);
      this.executionConsole.textContent += "Error: " + e
    } finally {
      console.log = oldLog
      console.groupEnd();
    }
  }

  save() {
    this.pluginEditor.saveFile();
    this.saveWorkspaceFile(this.workspaceURL);
  }

  /*MD ## Mapping Sources MD*/

  originalPositionFor(line, column) {
    var smc =  new sourcemap.SourceMapConsumer(this.transformationResult.map)
    return smc.originalPositionFor({
      line: line,
      column: column
    })
  }
  
  generatedPositionFor(line, column) {
    if (!this.transformationResult || !this.transformationResult.map) return; 
    var smc =  new sourcemap.SourceMapConsumer(this.transformationResult.map)
    return smc.generatedPositionFor({
      source: "tempfile.js",
      line: line,
      column: column
    });
  }
  
  mapEditorsFromToPosition(fromTextEditor, toTextEditor, backward) {
    if (backward == true) {
      var method = "originalPositionFor"
    } else {
      method = "generatedPositionFor"
    }
    var range = fromTextEditor.listSelections()[0]
    var start = this[method](range.anchor.line + 1, range.anchor.ch + 1)
    var end = this[method](range.head.line + 1, range.head.ch + 1)

    //lively.notify(`start ${range.anchor.line} ch ${range.anchor.ch} ->  ${start.line} ch ${start.column} / end ${range.head.line} ch ${range.head.ch} -> ${end.line} c ${end.column}`)
    if (!start || !end) return;

    toTextEditor.setSelection(
      {line: start.line - 1, ch:start.column - 1}, {line: end.line -  1, ch: end.column - 1})
  }
  
  onSourceSelectionChanged(evt) {
    setTimeout(() => {
      if(this.sourceLCM.isFocused()) {
        this.mapEditorsFromToPosition(
          this.sourceCM, this.transformedSourceCM, false)
      }
    }, 0);
  }
  onTransformedSourceSelectionChanged(evt) {
    setTimeout(() => {
      if(this.transformedSourceLCM.isFocused()) {
        this.mapEditorsFromToPosition(
          this.transformedSourceCM, this.sourceCM, true)
      }
    }, 0);
  }

  /*MD ## Lively Integration MD*/

  livelyPrepareSave() {
    this.setAttribute('workspace', BabelWorkspace.serialize(this.workspace));
    console.log("PREPARE SAVE (Plugin Explorer)");
  }
  
  livelyMigrate(other) {
    // #TODO: do we still need this?
    this.addEventListener("initialize", () => {
      this.loadWorkspace(other.workspace);
      // this.transformedSourceCM.setValue(other.transformedSourceCM.getValue()); 
      // this.transformationResult = other.transformationResult;
      // this.runsTests = other.runTests;
      // this.updateAST();
    });
  }

  livelyExample() {
    this.loadWorkspaceFile(PluginExplorer.defaultWorkspacePath);
  }
}


class BabelWorkspace {
  static deserialize(json) {
    return JSON.parse(json);
    // return JSON.parse(json, ([key, value]) => {
      
    // });
  }

  static serialize(ws) {
    return JSON.stringify(ws);
  }
}