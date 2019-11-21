import Morph from 'src/components/widgets/lively-morph.js';
import babelDefault from 'systemjs-babel-build';
const babel = babelDefault.babel;
import SyntaxChecker from 'src/client/syntax.js'
import sourcemap from 'src/external/source-map.min.js'
import { uuid as generateUUID, debounce, flatmap, executeAllTestRunners, promisedEvent } from 'utils';

export default class AstExplorer extends Morph {

  static get defaultSourceURL() { return lively4url + "/src/components/tools/lively-ast-explorer-example-source.js"; }
  static get defaultPluginURL() { return lively4url + "/src/components/tools/lively-ast-explorer-example-plugin.js"; }

  get pluginEditor() { return this.get("#plugin"); }
  get sourceEditor() { return this.get("#source"); }
  get outputEditor() { return this.get("#output"); }
  get sourceURL() { return this.sourceEditor.getURLString(); }
  get pluginURL() { return this.pluginEditor.getURLString(); }
  
  get runTests() { return this.get('#run-tests').checked; }
  set runTests(value) { return this.get('#run-tests').checked = value; }

  async initLivelyEditorFromAttribute(editor, attributeToRead, defaultPath) {
    var filePath =  this.getAttribute(attributeToRead);
    if (!filePath) {
      filePath = defaultPath;
    }
    editor.setURL(filePath);
    await editor.loadFile();
  }

  async initialize() {
    this.windowTitle = "AST Explorer";

    await this.initLivelyEditorFromAttribute(this.sourceEditor, 'source', AstExplorer.defaultSourceURL);
    await this.initLivelyEditorFromAttribute(this.pluginEditor, 'plugin', AstExplorer.defaultPluginURL);

    this.pluginEditor.awaitEditor().then(() => {
      this.pluginEditor.get('#editor').doSave = async () => {
        await this.pluginEditor.saveFile();

        await lively.reloadModule("" + this.pluginURL);
        this.updateAST();
      };
    });
    this.sourceEditor.awaitEditor().then(() => {
      this.sourceEditor.get('#editor').doSave = async () => {
        await this.sourceEditor.saveFile();
        this.updateAST();
      };
    });
    
    this.pluginEditor.addEventListener('url-changed', async event => {
      this.setAttribute("plugin", event.detail.url);
      this.updateAST();
    });
    this.sourceEditor.addEventListener('url-changed', async event => {
      this.setAttribute("source", event.detail.url);
      this.updateAST();
    });

    await Promise.all([
      this.pluginEditor.awaitEditor(), // Busy waiting for promise
      // promisedEvent(this.pluginEditor.get('#editor'), "editor-loaded"),
      this.sourceEditor.awaitEditor(),
      // promisedEvent(this.sourceEditor.get('#editor'), "editor-loaded"),
      this.outputEditor.editorLoaded() // check property, fallback to event; #TODO: which is better? Both have a problem: the component class has to be loaded first
      //promisedEvent(this.outputEditor, "editor-loaded"),
    ]);
    
    function enableSyntaxCheckForEditor(editor) {
      editor.addEventListener("change", (evt => SyntaxChecker.checkForSyntaxErrors(editor.editor))::debounce(200));
    }
    enableSyntaxCheckForEditor(this.sourceEditor.get('#editor'));
    enableSyntaxCheckForEditor(this.pluginEditor.get('#editor'));
    
  	this.sourceEditor.get('#editor').editor.on("beforeSelectionChange", evt => this.onSourceSelectionChanged(evt));
    this.outputEditor.editor.on("beforeSelectionChange", evt => this.onOutputSelectionChanged(evt));
   
    this.dispatchEvent(new CustomEvent("initialize"));
  }
  
  async updateAST() {
    const src = this.sourceEditor.get('#editor').editor.getValue();
    
    const filename = "tempfile.js"

    // #HACK: we explicitly enable some syntax plugins for now
    // #TODO: how to include syntax extensions for ast generation (without the plugin to develop)?
    const syntaxPlugins = (await Promise.all([
      'babel-plugin-syntax-jsx',
      'babel-plugin-syntax-do-expressions',
      'babel-plugin-syntax-function-bind',
      'babel-plugin-syntax-async-generators'
    ]
      .map(syntaxPlugin => System.import(syntaxPlugin))))
      .map(m => m.default);

    // get pure ast
    this.ast = babel.transform(src, {
        babelrc: false,
        plugins: syntaxPlugins,
        presets: [],
        filename: filename,
        sourceFileName: filename,
        moduleIds: false,
        sourceMaps: true,
        // inputSourceMap: load.metadata.sourceMap,
        compact: false,
        comments: true,
        code: true,
        ast: true,
        resolveModuleSource: undefined
    }).ast;
    this.get("#astInspector").inspect(this.ast);

    
    // #TODO refactor
    // this.pluginEditor.editor.getSession().setAnnotations([]);

    var url = "" + this.pluginURL;
    // url +=  "?" + Date.now(); // #HACK, we thought we don't have this to do any more, but ran into a problem when dealing with syntax errors...
    // assumend problem: there is a bad version of the code in either the browser or system.js cache
    // idea: we have to find and flush it...
    // wip: the browser does not cache it, but system.js does...
    const plugin = (await System.import(url)).default;
    
    try {
      console.group("PLUGIN TRANSFORMATION");
      var config = {
        babelrc: false,
        plugins: [...syntaxPlugins, plugin],
        presets: [],
        filename: filename,
        sourceFileName: filename,
        moduleIds: false,
        sourceMaps: true,
        // inputSourceMap: load.metadata.sourceMap,
        compact: false,
        comments: true,
        code: true,
        ast: true,
        resolveModuleSource: undefined
      }
      
      if (this.get("#systemjs").checked) {
        // use SystemJS config do do a full transform
        if (!self.lively4lastSystemJSBabelConfig) {
          lively.error("lively4lastSystemJSBabelConfig missing")
          return
        }
        var myconfig = config;
        config = Object.assign({}, self.lively4lastSystemJSBabelConfig)
        var originalPluginURL = url.replace(/-dev/,"") // name of the original plugin .... the one without -dev
        // replace the original plugin with the one under development.... e.g. -dev
        config.plugins = config.plugins.filter(ea => !ea.livelyLocation || !(ea.livelyLocation == originalPluginURL))
                          .concat([plugin])
        config.filename = filename
        config.sourceFileName = filename
        config.moduleIds = false
        
      }
      this.result = babel.transform(src, config);
    } catch(err) {
      console.error(err);
      this.outputEditor.editor.setValue("Error transforming code: " + err);
   
      // #TODO refactor
      // #Feature Show Syntax errors in editor... should be generic
//       this.pluginEditor.editor.getSession().setAnnotations(err.stack.split('\n')
//         .filter(line => line.match('updateAST'))
//         .map(line => {
//           let [row, column] = line
//             .replace(/.*<.*>:/, '')
//             .replace(/\)/, '')
//             .split(':')
//           return {
//             row: parseInt(row) - 1, column: parseInt(column), text: err.message, type: "error"
//           }
//         }));
      
      lively.notify(err.name, err.message, 5, () => {}, 'red');
      return;
    } finally {
      console.groupEnd();
    }
    
    this.outputEditor.editor.setValue(this.result.code);
    
    let logNode = this.get("#result");
    logNode.innerHTML = "";
    logNode.textContent = "";
    if (this.get("#live").checked) {
      var oldLog = console.log
      try {
        console.group("EXECUTE REWRITTEN FILE");
        console.log = (...fragments) => {
          oldLog.call(console, ...fragments)
          //typeof fragments[i] === "string"
          // let toPrint = fragments::flatmap((obj, i) => {
          //   return [<p>{obj}</p>];
          // });
          // logNode.appendChild(<div>{toPrint[0]}</div>)
          logNode.textContent += fragments.join(', ') + "\n"
        }
        // #TODO active expressions...
        var outputSource = this.outputEditor.editor.getValue()
        if (this.get("#systemjs").checked) {
          // use systemjs to load it's module without any further transformation
          var url = "tmp://" + filename // replace this with local TMP 
          
          var modURL = lively.swxURL(url)
          await lively.unloadModule(modURL)
          await fetch(url, {
            method: "PUT",
            body: outputSource 
          })
          await System.import(modURL)
        } else {
          var result ='' + (await this.outputEditor.boundEval(outputSource)).value;
        }
        
        // var result ='' + eval(this.outputEditor.editor.getValue());
        this.get("#result").textContent += "-> " + result;       
      } catch(e) {
        console.error(e);
        this.get("#result").textContent += "Error: " + e
      } finally {
        console.log = oldLog
        console.groupEnd();
      }
    }
    
    if(this.runTests) {
      executeAllTestRunners();
    }
  }
  
  livelyPrepareSave() {
    this.setAttribute('source', this.sourceURL);
    this.setAttribute('plugin', this.pluginURL);
    console.log("PREPARE SAVE", this.getAttribute('source'), this.getAttribute('plugin'));
  }
  
  livelyMigrate(other) {
    // #TODO: do we still need this?
    this.addEventListener("initialize", () => {
      this.outputEditor.editor.setValue(other.outputEditor.editor.getValue()); 
      this.result = other.result;
      this.runTests = other.runTests;
      this.updateAST();
    });
  }

  originalPositionFor(line, column) {
    var smc =  new sourcemap.SourceMapConsumer(this.result.map)
    return smc.originalPositionFor({
      line: line,
      column: column
    })
  }
  
  generatedPositionFor(line, column) {
    if (!this.result || !this.result.map) return; 
    var smc =  new sourcemap.SourceMapConsumer(this.result.map)
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
      if(this.sourceEditor.get('#editor').isFocused()) {
        this.mapEditorsFromToPosition(
          this.sourceEditor.get('#editor').editor, this.outputEditor.editor, false)
      }
    }, 0);
  }
  onOutputSelectionChanged(evt) {
    setTimeout(() => {
      if(this.outputEditor.isFocused()) {
        this.mapEditorsFromToPosition(
          this.outputEditor.editor, this.sourceEditor.get('#editor').editor, true)
      }
    }, 0);
  }
}
