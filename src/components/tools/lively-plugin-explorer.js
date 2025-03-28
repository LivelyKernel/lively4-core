import Morph from 'src/components/widgets/lively-morph.js';


import babelDefault from 'src/external/babel/babel7default.js'
const babel = babelDefault.babel;


import SyntaxChecker from 'src/client/syntax.js'
import sourcemap from 'src/external/source-map.min.js'
import { uuid as generateUUID, debounce, flatmap, executeAllTestRunners, promisedEvent } from 'utils';
import TraceVisualization from 'src/components/tools/trace-visualization.js';
import files from "src/client/files.js"


export default class PluginExplorer extends Morph {

  static get defaultPluginURL() {
    // return lively4url + "/src/components/tools/lively-ast-explorer-example-plugin.js";
    return lively4url + 'src/client/reactive/babel-plugin-sample-data-bindings/sample-data-bindings.js'
  }

  static get defaultWorkspacePath() {
    // return "/src/components/tools/lively-plugin-explorer-playground.workspace";
    return '/src/client/reactive/babel-plugin-sample-data-bindings/sample-data-bindings.workspace';
  }

  /*MD ## UI Accessing MD*/

  get container() { return this.get("#content"); }

  get executionConsole() { return this.get("#executionConsole"); }


  get sourceEditor() { return this.get("#source"); }
  get sourceLCM() { return this.sourceEditor.livelyCodeMirror(); }
  get sourceCM() { return this.sourceLCM.editor; }
  get sourceText() { return this.sourceCM.getValue(); }

  get sourceAstInspector() { return this.get("#sourceAst"); }

  get transformedAstInspector() { return this.get("#transformedAst"); }


  get pluginEditor() { return this.get("#plugin"); }
  get pluginLCM() { return this.pluginEditor.livelyCodeMirror(); }
  get pluginCM() { return this.pluginEditor.currentEditor(); }
  get pluginSource() { return this.pluginCM.getValue(); }

  async getPlugin(url = this.pluginURL) {
    url = this.fullUrl(url) || "";
    const module = await System.import(url);

    // we know no better way to get the plugin-file now, so we append the path to it to the name
    // and can read it from there later on
    const plugin = module.default;
    const modifiedPlugin = function(...args) {
      const result = plugin(...args)
      result.name = result.name || 'Please name your plugin!';
      result.name += ' ' + url
      return result;
    }

    return modifiedPlugin;
  }

  get transformedSourceLCM() { return this.get("#transformedSource"); }
  get transformedSourceCM() { return this.transformedSourceLCM.editor; }
  get transformedSourceText() { return this.transformedSourceCM.getValue(); }

  get pluginURL() { return this.pluginEditor.getURLString(); }

  get workspacePathInput() { return this.get("#workspace-path"); }
  get workspaceURL() { return this.workspacePathInput.value; }
  set workspaceURL(urlString) { this.workspacePathInput.value = urlString; }
  onWorkspacePathInputEntered(urlString) { this.loadWorkspaceFile(urlString); }

  get saveDevToMasterButton() { return this.get('#saveDevToMaster'); }

  displaySaveDevToMasterIfAppropriate() {
    const backupPluginURL = 'demos/tom/plugin-backup.js';
    if (this.workspace.plugin === backupPluginURL) {
      this.saveDevToMasterButton.style.display = 'block';
    } else {
      this.saveDevToMasterButton.style.display = 'none';
    }
  }

  /*MD ## Workspace Options MD*/

  get saveWorkspaceButton() { return this.get("#saveWorkspace"); }
  get autoSaveWorkspace() { return false; } //TODO
  set autoSaveWorkspace(bool) {
    this.saveWorkspaceButton.classList.toggle("on", bool);
  }
  onSaveWorkspace(evt) {
    if (evt.button === 2) {
      this.toggleOption("autoSaveWorkspace");
    } else {
      this.saveWorkspace();
    }
  }

  get updateASTButton() { return this.get("#updateAST"); }
  get autoUpdateAST() { return this.getOption("autoUpdateAST"); }
  set autoUpdateAST(bool) {
    this.updateASTButton.classList.toggle("on", bool);
    this.updateASTButton.querySelector("i").classList.toggle("fa-spin", bool);
  }
  onUpdateAST(evt) {
    if (evt.button === 2) {
      this.toggleOption("autoUpdateAST");
    } else {
      this.updateAST();
    }
  }

  get updateTransformationButton() { return this.get("#updateTransformation"); }
  get autoUpdateTransformation() { return this.getOption("autoUpdateTransformation"); }
  set autoUpdateTransformation(bool) {
    this.updateTransformationButton.classList.toggle("on", bool);
    this.updateTransformationButton.querySelector("i").classList.toggle("fa-spin", bool);
  }
  onUpdateTransformation(evt) {
    if (evt.button === 2) {
      this.toggleOption("autoUpdateTransformation");
    } else {
      this.updateTransformation();
    }
  }

  get runTestsButton() { return this.get("#runTests"); }
  get autoRunTests() { return this.getOption("autoRunTests"); }
  set autoRunTests(bool) {
    this.runTestsButton.classList.toggle("on", bool);
  }
  onRunTests(evt) {
    if (evt.button === 2) {
      this.toggleOption("autoRunTests");
    } else {
      this.runTests();
    }
  }

  get executeButton() { return this.get("#execute"); }
  get autoExecute() { return this.getOption("autoExecute"); }
  set autoExecute(bool) {
    this.executeButton.querySelector("i").classList.toggle("fa-spin", bool);
    this.executeButton.classList.toggle("on", bool);
  }
  onExecute(evt) {
    if (evt.button === 2) {
      this.toggleOption("autoExecute");
    } else {
      this.execute();
    }
  }

  get systemJSButton() { return this.get("#toggleSystemJS"); }
  get systemJS() { return this.getOption("systemJS"); }
  set systemJS(bool) {
    this.systemJSButton.classList.toggle("on", bool);
  }
  onToggleSystemJs() {
    lively.warn("SystemJS transpiling not support (#TODO babel7)")
    this.toggleOption("systemJS");
    this.updateAST();
  }

  onDebug() {
    if (!this.getOption("systemJS")) {
      TraceVisualization.for(this.sourceText, this.workspace.pluginSelection.map(({ url, data }) => {
        return { url: this.fullUrl(url), data: data };
      }));
    } else {
      lively.notify(
        'Visualization does not work together with global SystemJS config. Please disable to use this feature.'
      );
    }
  }

  get defaultWorkspace() {
    return {
      source: '/src/components/tools/lively-ast-explorer-example-source.js',
      sources: ['/src/components/tools/lively-ast-explorer-example-source.js'],
      options: this.optionDefaults,
      plugin: 'src/external/babel-plugin-locals.js',
      openPlugin1s: ['src/external/babel-plugin-locals.js'],
      pluginSelection: []
    }
  }

  extendFileChooserForWorkspaces(chooser) {
    chooser.getMenuElements = () => {
      return [
        ['new workspace-file...', async () => {
          await this.newFile(chooser.get('#navbar').url + "newfile.workspace", JSON.stringify(this.defaultWorkspace,
            undefined, 2))
          chooser.updateView()
        }]
      ]
    }
  }

  async onNewWorkspace() {
    let chooser = await lively.openComponentInWindow("file-chooser");
    this.extendFileChooserForWorkspaces(chooser);
    const fileName = await chooser.chooseFile(lively4url + '/');

    if (fileName) {
      this.loadWorkspaceFile(fileName);
    }
  }

  onSaveDevToMaster() {
    this.saveFile(this.fullUrl('/demos/tom/babel-plugin-tracer.js'), this.pluginSource);
    lively.notify('Saved current plugin version in /demos/tom/babel-plugin-tracer.js');
  }

  /*MD ## Options MD*/

  setOption(option, value) {
    this.workspace.options[option] = value;
    this[option] = value;
  }

  getOption(option) {
    if (option in this.workspace.options) {
      return this.workspace.options[option];
    } else {
      return this.optionDefaults[option];
    }
  }

  toggleOption(option) {
    this.setOption(option, !this.getOption(option));
  }

  loadOptions(options) {
    for (const [option, value] of Object.entries(options)) {
      this.setOption(option, value);
    }
  }

  initOptions() {
    for (const [option, value] of Object.entries(this.optionDefaults)) {
      this[option] = value;
    }
  }

  get optionDefaults() {
    return {
      "systemJS": false,
      "autoExecute": true,
      "autoRunTests": false,
      "autoUpdateAST": true,
      "autoUpdateTransformation": true,
      "autoSaveWorkspace": true,
    }
  }

  /*MD ## Initialization MD*/

  fullUrl(urlString) {
    try {
      if (!urlString.startsWith(lively4url) && urlString[0] !== '/') {
        urlString = '/' + urlString;
      }
      return lively.paths.normalizePath(urlString, "");
    } catch (e) {
      return null;
    }
  }

  async initialize() {
    this.windowTitle = "Plugin Explorer";
    this.registerButtons();

    this.workspace = {
      options: {}
    };

    this.initOptions();

    this.getAllSubmorphs("button").forEach(button => {
      button.addEventListener('contextmenu', e => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.dispatchEvent(new MouseEvent("click", { button: 2 }));
      });
    });

    this.debouncedUpdateAST = this.updateAST::debounce(500);
    this.debouncedUpdateTransformation = this.updateTransformation::debounce(500);

    function enableSyntaxCheckForEditor(editor) {
      editor.addEventListener("change", (evt => SyntaxChecker.checkForSyntaxErrors(editor.editor))::debounce(
        200));
    }

    this.pluginEditor.awaitEditor().then(() => {
      this.pluginEditor.hideToolbar();
      this.pluginLCM.doSave = async () => {
        await this.pluginEditor.saveFile();

        await lively.reloadModule("" + this.pluginURL);
        this.updateAST();
      };
      enableSyntaxCheckForEditor(this.pluginLCM);
      // this.pluginLCM.addEventListener("change", evt => {if (this.autoUpdate) this.debouncedUpdateTransformation()});
      this.transformedSourceCM.on("beforeSelectionChange", evt => this.onTransformedSourceSelectionChanged(
        evt));
    });

    this.sourceLCM.editorLoaded().then(() => {
      this.sourceAstInspector.connectLivelyCodeMirror(this.sourceLCM);
      this.sourceLCM.doSave = async () => {
        // TODO: Save source
        this.updateAST();
      };
      enableSyntaxCheckForEditor(this.sourceLCM);
      this.sourceLCM.addEventListener("change", evt => { if (this.autoUpdateAST) this.debouncedUpdateAST() });
      this.sourceCM.on("beforeSelectionChange", evt => this.onSourceSelectionChanged(evt));
    });

    this.workspacePathInput.addEventListener("keyup", evt => {
      if (evt.code == "Enter") this.onWorkspacePathInputEntered(this.workspacePathInput.value);
    });

    await Promise.all([
      this.pluginEditor.awaitEditor(),
      this.sourceLCM.editorLoaded(),
      this.transformedSourceLCM.editorLoaded().then(() => {
        this.transformedAstInspector.connectLivelyCodeMirror(this.transformedSourceLCM);
        this.transformedSourceLCM.doSave = async () => {
          // TODO: Save source
          this.updateTransformedAST();
        };
      }),
    ]);

    this.dispatchEvent(new CustomEvent("initialize"));

    this.sourceEditor.hideToolbar();
  }

  async loadFile(urlString) {
    try {
      const url = new URL(this.fullUrl(urlString));
      const response = await fetch(url);
      return response.text();
    } catch (e) {
      lively.error(`Failed to load file '${urlString}'`);
      return null;
    }
  }

  async saveFile(urlString, contents) {
    try {
      const url = new URL(this.fullUrl(urlString));
      await fetch(url, {
        method: 'PUT',
        body: contents,
      });
    } catch (e) {
      lively.error(`Failed to save file '${urlString}'`);
    }
  }

  async loadWorkspaceFile(urlString) {
    try {
      const text = await this.loadFile(urlString);
      const ws = JSON.parse(text);
      this.workspacePathInput.value = urlString;
      this.loadWorkspace(ws);
    } catch (e) {
      lively.error(`Failed to load workspace '${urlString}'`);
    }
  }

  loadSourceFile(url) {
    this.sourceEditor.setURL(new URL(this.fullUrl(url)));
    this.sourceEditor.loadFile();
  }

  loadPluginFile(url) {
    this.pluginEditor.setURL(new URL(this.fullUrl(url)));
    this.pluginEditor.loadFile();
  }

  changeSelectedPlugin(url) {
    this.workspace.plugin = url;
    this.saveWorkspaceFile(this.workspaceURL);
    this.loadPluginFile(this.workspace.plugin);

    this.displaySaveDevToMasterIfAppropriate();
    this.updatePluginTabs();
  }

  changeSelectedSource(url) {
    this.workspace.source = url;
    this.saveWorkspaceFile(this.workspaceURL);
    this.loadSourceFile(this.workspace.source);

    this.updateSourceTabs();
  }

  openEditable(url) {
    if (!this.workspace.openPlugins.includes(url)) {
      this.workspace.openPlugins.push(url);
    }

    this.changeSelectedPlugin(url);
  }

  async loadWorkspace(ws) {
    this.workspace = ws;
    this.loadOptions(ws.options);
    this.loadPluginFile(ws.plugin);
    this.loadSourceFile(ws.source);

    this.displaySaveDevToMasterIfAppropriate();

    this.updateAllTabs();
  }

  async saveWorkspaceFile(urlString) {
    try {
      const text = JSON.stringify(this.workspace, undefined, 2);
      this.saveFile(urlString, text);
    } catch (e) {
      lively.error(`Failed to save workspace '${urlString}'`);
    }
  }

  async saveWorkspace() {
    // this.pluginEditor.saveFile();
    this.saveWorkspaceFile(this.workspaceURL);
  }

  /*MD # Plugin & source selection MD*/

  appendTab(url, className, parent, changeTo, removeUrl) {
    const name = url.split('/').last;

    const close = < i class = "fa fa-window-close" > < /i>;
    const tab = < div class = { className } title = { url } > { name } { close } < /div>;
    parent.appendChild(tab);

    tab.addEventListener('click', _ => {
      changeTo(url);
    });

    close.addEventListener('click', e => {
      e.stopPropagation();
      removeUrl(url);
    })

    return tab;
  }

  updateAllTabs() {
    this.updatePluginTabs();
    this.updateSourceTabs();
  }

  updateTabs(tabListElement, list, selectedURL, changeTo, removeUrl) {
    tabListElement.innerHTML = '';

    let activeTabFound = false;
    for (const url of list) {
      let className = 'tab';
      if (selectedURL === url) {
        className += ' active';
        activeTabFound = true;
      }
      this.appendTab(url, className, tabListElement, changeTo, removeUrl);
    }

    if (!activeTabFound) {
      this.appendTab(selectedURL, 'tab notListed', tabListElement, changeTo, removeUrl);
    }
  }

  updatePluginTabs() {
    this.updateTabs(this.get('#plugin-tabs'),
      this.workspace.openPlugins,
      this.workspace.plugin,
      url => {
        this.changeSelectedPlugin(url);
        this.updatePluginTabs();
      },
      url => {
        const list = this.workspace.openPlugins;
        if (list.length === 1) {
          lively.notify('Cannot close all tabs!');
          return;
        }

        const index = list.indexOf(url);

        if (index !== -1) {
          list.splice(index, 1);
        }

        if (url === this.workspace.plugin) {
          let newUrl;
          if (index === -1) {
            newUrl = list.last;
          } else {
            newUrl = list[Math.min(Math.max(index - 1, 0), list.length - 1)];
          }

          this.changeSelectedPlugin(newUrl);
          return;
        }

        this.saveWorkspace();
        this.updatePluginTabs();
      });
  }


  // copied from /src/components/tools/lively-container.js#newFile
  async newFile(path, content) {
    const fileName = await lively.prompt('Please enter the name of the file', path, async dialog => {
      // select the filename in the path...
      await lively.sleep(100) // wait for the new file
      var input = dialog.get("input")
      var s = input.value
      var m = s.match(/([^/.]*)([^/]*)$/)
      input.select()
      input.setSelectionRange(m.index, m.index + m[1].length)
    });

    if (!fileName) {
      return null;
    }

    await files.saveFile(fileName, content);
    lively.notify("created " + fileName);

    return fileName;
  }

  extendFileChooserForSourceFiles(chooser) {
    chooser.getMenuElements = () => {
      return [
        ['new source-file...', async () => {
          await this.newFile(chooser.get('#navbar').url + "newfile.js", '');
          chooser.updateView()
        }]
      ];
    }
  }

  updateSourceTabs() {
    const tabListElement = this.get('#source-tabs');
    this.updateTabs(tabListElement,
      this.workspace.sources,
      this.workspace.source,
      url => {
        this.changeSelectedSource(url);
        this.updateSourceTabs();
      },
      url => {
        const list = this.workspace.sources;

        if (list.length === 1) {
          lively.notify('Cannot close all tabs!');
          return;
        }

        const index = list.indexOf(url);
        if (index !== -1) {
          list.splice(index, 1);
        }

        if (url === this.workspace.source) {
          let newUrl;
          if (index === -1) {
            newUrl = list.last;
          } else {
            newUrl = list[Math.min(Math.max(index - 1, 0), list.length - 1)];
          }

          this.changeSelectedSource(newUrl);
          return;
        }

        this.saveWorkspace();
        this.updateSourceTabs();
      });

    const addButton = < button > < i class = "fa fa-plus-square" / > < /button>;

    addButton.addEventListener('click', async e => {
      let chooser = await lively.openComponentInWindow("file-chooser");
      this.extendFileChooserForSourceFiles(chooser);
      let fileName = await chooser.chooseFile(lively4url + '/');
      fileName = fileName.replace(lively4url, '');

      if (fileName) {
        this.changeSelectedSource(fileName);
        if (!this.workspace.sources.includes(fileName)) {
          this.workspace.sources.push(fileName);
          this.saveWorkspace();
        }
      }

      this.updateSourceTabs();
    });
    tabListElement.appendChild(addButton);
  }

  onSelectPlugins() {
    lively.openComponentInWindow('plugin-selector')
      .then(elm => elm.pluginExplorer = this);
  }

  savePluginSelection(selection) {
    this.workspace.pluginSelection = selection;
    this.saveWorkspace();

    this.updateAllTabs();
  }
  /*MD ## Execution MD*/

  async updateAST() {
    try {
      let ast = this.sourceText.toAST();
      this.sourceAstInspector.inspect(ast);
      if (this.autoUpdateTransformation) this.updateTransformation(ast);
    } catch (e) {
      this.sourceAstInspector.inspect({ Error: e.message });
    }
    this.updateTransformedAST();
  }

  async updateTransformedAST() {
    try {
      let ast = this.transformedSourceText.toAST();
      this.transformedAstInspector.inspect(ast);
    } catch (e) {
      this.transformedAstInspector.inspect({ Error: e.message });
    }
  }

  updateAndExecute(code) {
    this.transformedSourceLCM.value = code;

    if (this.autoExecute) this.execute();
    if (this.autoRunTests) this.runTests();
  }

  async updateTransformation(ast) {
    const selection = this.workspace.pluginSelection;
    
    const plugins = await Promise.all(selection.map(({ url, data }) => {
      let options;
      let result = this.getPlugin(url);

      if (data) {
        try {
          options = eval(data)
        } catch (e) {
          lively.notify(`Could not evaluate options for: ${url}.`);
          lively.error(e);
        }

        if (options) {
          result = [result, options];
        }
      }


      return result;
    }));


    try {
      console.group("PLUGIN TRANSFORMATION");
      if (!ast) return;
      if (this.systemJS) {
        // use SystemJS config do do a full transform
        if (!self.lively4lastSystemJSBabelConfig) {
          lively.error("lively4lastSystemJSBabelConfig missing");
          return;
        }

        let config = Object.assign({}, self.lively4lastSystemJSBabelConfig);
        let url = this.fullUrl(this.pluginURL) || "";
        let originalPluginURL = url.replace(/-dev/, ""); // name of the original plugin .... the one without -dev
        // replace the original plugin with the one under development.... e.g. -dev
        config.plugins = config.plugins.filter(ea => !ea.livelyLocation || !(ea.livelyLocation ==
            originalPluginURL))
          .concat(plugins)
        let filename = "tempfile.js";
        config.filename = filename
        config.sourceFileName = filename
        config.moduleIds = false
        this.transformationResult = babel.transform(this.sourceText, config);
      } else {
        const config = {};

        config.plugins = plugins;

        const filename = 'tempfile.js';
        config.filename = filename
        config.sourceFileName = filename
        config.moduleIds = false;
        config.sourceMaps = true;


        // here for documenting the babel hook
        config.wrapPluginVisitorMethod = (pluginAlias, visitorType, callback) => {
          return (...args) => {
            console.log(pluginAlias, visitorType)
            callback(...args);
          }
        };

        this.transformationResult = babel.transform(this.sourceText, config);
      }

      this.updateAndExecute(this.transformationResult.code);


    } catch (e) {
      console.error(e);
      this.transformedSourceLCM.value = e.stack;
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
        var result = '' + (await this.transformedSourceLCM.boundEval(transformedSource)).value;
      }

      // var result ='' + eval(this.outputEditor.editor.getValue());
      this.executionConsole.textContent += "-> " + result;
    } catch (e) {
      console.error(e);
      this.executionConsole.textContent += e.stack;
    } finally {
      console.log = oldLog
      console.groupEnd();
    }
  }

  async runTests() {
    if (document.querySelectorAll('lively-testrunner').length === 0) {
      await lively.openComponentInWindow('lively-testrunner');
    }
    executeAllTestRunners();
  }

  /*MD ## Mapping Sources MD*/

  originalPositionFor(line, column) {
    var smc = new sourcemap.SourceMapConsumer(this.transformationResult.map)
    return smc.originalPositionFor({
      line: line,
      column: column
    })
  }

  generatedPositionFor(line, column) {
    if (!this.transformationResult || !this.transformationResult.map) return;
    var smc = new sourcemap.SourceMapConsumer(this.transformationResult.map)
    return smc.generatedPositionFor({
      source: "tempfile.js",
      line: line,
      column: column
    });
  }

  mapEditorsFromToPosition(fromTextEditor, toTextEditor, backward) {
    let positionFor = backward ? this["originalPositionFor"] : this["generatedPositionFor"];

    var range = fromTextEditor.listSelections()[0]
    var start = positionFor.call(this, range.anchor.line + 1, range.anchor.ch + 1)
    var end = positionFor.call(this, range.head.line + 1, range.head.ch + 1)

    //lively.notify(`start ${range.anchor.line} ch ${range.anchor.ch} ->  ${start.line} ch ${start.column} / end ${range.head.line} ch ${range.head.ch} -> ${end.line} c ${end.column}`)
    if (!start || !end) return;

    toTextEditor.setSelection({ line: start.line - 1, ch: start.column - 1 }, {
      line: end.line - 1,
      ch: end.column -
        1
    })
  }

  onSourceSelectionChanged(evt) {
    setTimeout(() => {
      if (this.sourceLCM.isFocused()) {
        this.mapEditorsFromToPosition(
          this.sourceCM, this.transformedSourceCM, false)
      }
    }, 0);
  }
  onTransformedSourceSelectionChanged(evt) {
    setTimeout(() => {
      if (this.transformedSourceLCM.isFocused()) {
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
      this.workspaceURL = other.workspaceURL;
      this.loadWorkspace(other.workspace);
      this.sourceCM.setValue(other.sourceText);
      this.transformedSourceCM.setValue(other.transformedSourceCM.getValue());
      this.transformationResult = other.transformationResult;
      this.runsTests = other.runTests;
      this.updateAST();
    });
  }

  livelyExample() {
    this.loadWorkspaceFile(PluginExplorer.defaultWorkspacePath);
  }
}

class Source {
  get name() {
    return this._name;
  }

  set name(str) {
    return this._name = str;
  }
}

class LocalSource extends Source {
  constructor() {
    super();
  }

  async getContent() {
    return this.content || "";
  }

  async setContent(str) {
    this.content = str;
  }
}

class FileSource extends Source {
  constructor() {
    super();
  }

  fullUrl() {
    const normalizedPath = lively.paths.normalizePath(this.url, "");
    return new URL(normalizedPath);
  }

  async getContent() {
    try {
      const url = this.fullUrl();
      const response = await fetch(url);
      return response.text();
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  async setContent(text) {
    try {
      const url = this.fullUrl();
      const response = await fetch(url, {
        method: 'PUT',
        body: text,
      });
      return response.ok;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  get name() {
    return this._name || this.url;
  }
}

class BabelWorkspace {
  static deserialize(json) {
    return JSON.parse(json, ([key, value]) => {
      if (value.type === "local") {
        return Object.assign(new LocalSource(), value);
      } else if (value.type === "file") {
        return Object.assign(new FileSource(), value);
      }
      return value;
    });
  }

  static serialize(ws) {
    return JSON.stringify(ws);
  }
}
