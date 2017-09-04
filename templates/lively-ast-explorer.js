'use strict';

import Morph from './Morph.js';
import {babel} from 'systemjs-babel-build';
import SyntaxChecker from 'src/client/syntax.js'
import locals from 'babel-plugin-locals'
import sourcemap from 'https://raw.githubusercontent.com/mozilla/source-map/master/dist/source-map.min.js'
import generateUUID from './../src/client/uuid.js';
import {modulesRegister} from 'systemjs-babel-build';
import { debounce, flatmap, executeAllTestRunners, promisedEvent } from 'utils';
// import lively from './../src/client/lively.js';
// import {html} from 'src/client/html.js';
// import {setCode} from 'src/client/workspaces.js'

export default class AstExplorer extends Morph {

  get pluginEditor() { return this.get("#plugin"); }
  get sourceEditor() { return this.get("#source"); }

  async initialize() {
    this.windowTitle = "AST Explorer";
    // lets work with properties until we get access to the module state again
    this.babel = babel
    //this.smc = smc


    let initLivelyEditorFromAttribute = (editor, attributeToRead, defaultPath) => {
      var filePath =  this.getAttribute(attributeToRead);
      if (!filePath) {
        filePath = defaultPath;
      }
      editor.setURL(filePath);
      editor.loadFile();
    }
    initLivelyEditorFromAttribute(this.sourceEditor, 'source', 
   		"https://lively-kernel.org/lively4/lively4-core/demos/astsource.js");
    initLivelyEditorFromAttribute(this.pluginEditor, 'plugin', 
    	"https://lively-kernel.org/lively4/lively4-core/demos/astplugin.js");

    lively.html.registerButtons(this);

    
    this.pluginEditor.get("#editor").doSave = async () => {
      await this.pluginEditor.saveFile();
      
      await lively.reloadModule("" + this.pluginEditor.getURL());
      this.updateAST();
    };
    
    this.pluginEditor.addEventListener("url-changed", evt => {
      this.onPluginUrlChanged(evt.detail)      
    });
    this.sourceEditor.addEventListener("url-changed", evt => {
      this.onSourceUrlChanged(evt.detail)      
    });

    this.sourceEditor.get("#editor").doSave = async () => {
      await this.sourceEditor.saveFile()
      this.updateAST();
    };

    function enableSyntaxCheckForEditor(editor) {
      editor.addEventListener("change", (evt => SyntaxChecker.checkForSyntaxErrors(
        editor.currentEditor()))::debounce(200));
    }
    enableSyntaxCheckForEditor(this.pluginEditor);
    enableSyntaxCheckForEditor(this.sourceEditor);
    
    await promisedEvent(this.sourceEditor, "editor-loaded");
    
  	this.sourceEditor.currentEditor().on("beforeSelectionChange", (evt) => {
      this.onSourceSelectionChanged(evt)
    });


    this.get("#output").editor.on("beforeSelectionChange", (evt) => {
      this.onOutputSelectionChanged(evt)
    });
   
    this.dispatchEvent(new CustomEvent("initialize"));

  }
  
  onPluginUrlChanged(details) {
    this.setAttribute("plugin", details.url)
  }
  onSourceUrlChanged(details) {
    this.setAttribute("source", details.url)
  }
  
  async updateAST() {
    const src = this.sourceEditor.currentEditor().getValue();
    
    const filename = "tempfile.js"

    // #HACK: we explicitly enable some syntax plugins for now
    // #TODO: how to include syntax extensions for ast generation (without the plugin to develop)?
    const syntaxPlugins = (await Promise.all([
      'babel-plugin-syntax-jsx',
      'babel-plugin-syntax-do-expressions',
      'babel-plugin-syntax-function-bind'
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
    // this.pluginEditor.currentEditor().getSession().setAnnotations([]);

    var url = "" + this.pluginEditor.getURL() 
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
      this.get("#output").editor.setValue("Error transforming code: " + err);
   
      // #TODO refactor
      // #Feature Show Syntax errors in editor... should be generic
//       this.pluginEditor.currentEditor().getSession().setAnnotations(err.stack.split('\n')
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
    
    this.get("#output").editor.setValue(this.result.code);
    
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
        var result ='' + (await this.get("#output").boundEval(this.get("#output").editor.getValue())).value;
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
      this.sourceEditor.setURL(other.sourceEditor.getURL())
      this.sourceEditor.currentEditor().setValue(other.sourceEditor.currentEditor().getValue())
      this.pluginEditor.setURL(other.pluginEditor.getURL())
      this.pluginEditor.currentEditor().setValue(other.pluginEditor.currentEditor().getValue())
      
      this.get("#output").editor.setValue(other.get("#output").editor.getValue()) 
    
      this.result = other.result
    
      this.updateAST()
      
    })
  }
  
  livelyPrepareSave() {
    this.setAttribute('source', this.sourceEditor.getURLString());
    this.setAttribute('plugin', this.pluginEditor.getURLString());
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
          this.sourceEditor.currentEditor(), this.get("#output").editor, false)
      }
    }, 0);
  }
  onOutputSelectionChanged(evt) {
    setTimeout(() => {
      if(this.get("#output").isFocused()) { 
        this.mapEditorsFromToPosition(
          this.get("#output").editor, this.sourceEditor.currentEditor(), true)
      }
    }, 0);
  }
}
