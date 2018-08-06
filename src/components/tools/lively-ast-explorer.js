'use strict';

import Morph from 'src/components/widgets/lively-morph.js';
import babelDefault from 'systemjs-babel-build';
const babel = babelDefault.babel;
import SyntaxChecker from 'src/client/syntax.js'
import sourcemap from 'src/external/source-map.min.js'
import { uuid as generateUUID, debounce, flatmap, executeAllTestRunners, promisedEvent } from 'utils';

export default class AstExplorer extends Morph {

  get pluginEditor() { return this.get("#plugin"); }
  get sourceEditor() { return this.get("#source"); }
  get outputEditor() { return this.get("#output"); }
  get pluginInput() { return this.get("#plugin-url"); }
  get sourceInput() { return this.get("#source-url"); }

  async initialize() {
    this.windowTitle = "AST Explorer";
    // lets work with properties until we get access to the module state again
    this.babel = babel;

    let initLivelyEditorFromAttribute = async (editor, input, attributeToRead, defaultPath) => {
      var filePath =  this.getAttribute(attributeToRead);
      if (!filePath) {
        filePath = defaultPath;
      }
    
      // #TODO get rid of this runtime check by either:
      //   a) guaranty loaded childnodes before running initialize
      //   b) editor that only be initialized through attributes access
      let text = await lively.files.loadFile(filePath);
      editor.value = text;
      input.value = filePath;
    };
    initLivelyEditorFromAttribute(
      this.sourceEditor,
      this.sourceInput,
      'source',
      lively4url + "/src/client/reactive/active-expressions/babel-plugin-aexpr-source-transformation/example.js"
    );
    initLivelyEditorFromAttribute(
      this.pluginEditor,
      this.pluginInput,
      'plugin', 
    	lively4url + "/src/client/reactive/active-expressions/babel-plugin-aexpr-source-transformation/index.js"
    );

    this.pluginEditor.doSave = async () => {
      await lively.files.saveFile(this.pluginInput.value, this.pluginEditor.value);
      
      await lively.reloadModule("" + this.pluginInput.value);
      this.updateAST();
    };
    this.sourceEditor.doSave = async () => {
      await this.saveSourceFile();
      this.updateAST();
    };
    
    this.pluginInput.addEventListener('keydown', async event => {
      if (event.keyCode == 13) { // ENTER
        this.onPluginUrlChanged(event.detail)      
      }
    });
    this.sourceInput.addEventListener('keydown', async event => {
      if (event.keyCode == 13) { // ENTER
        this.onSourceUrlChanged(event.detail);
        // load file text for new url
        this.sourceEditor.value = await lively.files.loadFile(this.sourceInput.value);
      } else if(event.keyCode == 83 && event.ctrlKey) {
        this.onSourceUrlChanged(event.detail);
        // #TODO: save file text to new url
        this.saveSourceFile();
        event.stopPropagation();
        event.preventDefault();
      }
    });

    await promisedEvent(this.sourceEditor, "editor-loaded");
    await promisedEvent(this.outputEditor, "editor-loaded");
    
    function enableSyntaxCheckForEditor(editor) {
      editor.addEventListener("change", (evt => SyntaxChecker.checkForSyntaxErrors(editor.editor))::debounce(200));
    }
    enableSyntaxCheckForEditor(this.pluginEditor);
    enableSyntaxCheckForEditor(this.sourceEditor);
    
  	this.sourceEditor.editor.on("beforeSelectionChange", evt => this.onSourceSelectionChanged(evt));
    this.outputEditor.editor.on("beforeSelectionChange", evt => this.onOutputSelectionChanged(evt));
   
    this.dispatchEvent(new CustomEvent("initialize"));
  }
  
  async saveSourceFile() {
    await lively.files.saveFile(this.sourceInput.value, this.sourceEditor.value);
  }
  
  onPluginUrlChanged(details) {
    this.setAttribute("plugin", details.url);
  }
  onSourceUrlChanged(details) {
    this.setAttribute("source", details.url);
  }
  
  async updateAST() {
    const src = this.sourceEditor.editor.getValue();
    
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

    var url = "" + this.pluginInput.value;
    // url +=  "?" + Date.now(); // #HACK, we thought we don't have this to do any more, but ran into a problem when dealing with syntax errors...
    // assumend problem: there is a bad version of the code in either the browser or system.js cache
    // idea: we have to find and flush it...
    // wip: the browser does not cache it, but system.js does...
    const plugin = (await System.import(url)).default;
    
    try {
      console.group("PLUGIN TRANSFORMATION");
      this.result = babel.transform(src, {
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
      });
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
        var result ='' + (await this.outputEditor.boundEval(this.outputEditor.editor.getValue())).value;
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
    
    executeAllTestRunners();
  }

  livelyMigrate(other) {
    this.addEventListener("initialize", () => {
      this.sourceInput.value = other.sourceInput.value;
      this.sourceEditor.editor.setValue(other.sourceEditor.editor.getValue());
      this.pluginEditor.value = other.pluginEditor.value;
      this.pluginEditor.editor.setValue(other.pluginEditor.editor.getValue());
      
      this.outputEditor.editor.setValue(other.outputEditor.editor.getValue()); 
    
      this.result = other.result;
    
      this.updateAST();
    });
  }
  
  livelyPrepareSave() {
    this.setAttribute('source', this.sourceInput.value);
    this.setAttribute('plugin', this.pluginInput.value);
    console.log("PREPARE SAVE", this.getAttribute('source'), this.getAttribute('plugin'));
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
      if(this.sourceEditor.get("#editor").isFocused()) {
        this.mapEditorsFromToPosition(
          this.sourceEditor.currentEditor(), this.outputEditor.editor, false)
      }
    }, 0);
  }
  onOutputSelectionChanged(evt) {
    setTimeout(() => {
      if(this.outputEditor.isFocused()) { 
        this.mapEditorsFromToPosition(
          this.outputEditor.editor, this.sourceEditor.currentEditor(), true)
      }
    }, 0);
  }
}
