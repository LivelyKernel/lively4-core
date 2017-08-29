'use strict';

import Morph from './Morph.js';
//import lively from './../src/client/lively.js';

import {babel} from 'systemjs-babel-build';

import SyntaxChecker from 'src/client/syntax.js'

// import {html} from 'src/client/html.js';

import locals from 'babel-plugin-locals'

import {setCode} from 'src/client/workspaces.js'

import sourcemap from 'https://raw.githubusercontent.com/mozilla/source-map/master/dist/source-map.min.js'
import generateUUID from './../src/client/uuid.js';

import {modulesRegister} from 'systemjs-babel-build';

import { debounce } from 'utils';

export default class AstExplorer extends Morph {

  get pluginEditor() { return this.get("#plugin"); }
  get sourceEditor() { return this.get("#source"); }

  initialize() {

    this.windowTitle = "AST Explorer";  // #TODO why does it not work?

    // lets work with properties until we get access to the module state again
    this.babel = babel
    //this.smc = smc

    // try {    

    let initLivelyEditorFromAttribute = (editor, attributeToRead, defaultPath) => {
      var filePath =  this.getAttribute(attributeToRead);
      if (!filePath) {
        filePath = defaultPath;
      }
      editor.setURL(filePath);
      editor.loadFile();
    }
    initLivelyEditorFromAttribute(this.sourceEditor, 'source', "https://lively-kernel.org/lively4/lively4-core/demos/astsource.js");
    initLivelyEditorFromAttribute(this.pluginEditor, 'plugin', "https://lively-kernel.org/lively4/lively4-core/demos/astplugin.js");

    lively.html.registerButtons(this);

    this.pluginEditor.get("juicy-ace-editor").doSave = async () => {
      await this.pluginEditor.saveFile()
      await lively.reloadModule("" + this.pluginEditor.getURL())
      this.updateAST()      
    };
    
    this.pluginEditor.addEventListener("url-changed", (evt) => {
      this.onPluginUrlChanged(evt.detail)      
    })

    this.sourceEditor.get("juicy-ace-editor").doSave = () => {
      this.updateAST();
    };

    function enableSyntaxCheckForEditor(editor) {
      editor.currentEditor().addEventListener("change", (evt => SyntaxChecker.checkForSyntaxErrors(editor.currentEditor()))::debounce(200));
    }
    enableSyntaxCheckForEditor(this.pluginEditor);
    enableSyntaxCheckForEditor(this.sourceEditor);

    this.sourceEditor.currentEditor().session.selection.on("changeSelection", (evt) => {
      this.onSourceSelectionChanged(evt)
    });
    
    this.sourceEditor.currentEditor().session.selection.on("changeCursor", (evt) => {
      this.onSourceSelectionChanged(evt)
    });

    this.get("#output").editor.session.selection.on("changeSelection", (evt) => {
      this.onOutputSelectionChanged(evt)
    });
    
    this.get("#output").editor.session.selection.on("changeCursor", (evt) => {
      this.onOutputSelectionChanged(evt)
    });

    // this.pluginEditor.currentEditor()
    [this.get("#output").editor, this.sourceEditor.currentEditor()].forEach(ea => ea.session.setOptions({
			mode: "ace/mode/javascript",
    	tabSize: 2,
    	useSoftTabs: true
		}));
		
    // } catch(e) {
    //  console.error(e);
      // throw new Error("Could not initialize AST-Explorer " + e);
    //}
    this.dispatchEvent(new CustomEvent("initialize"));

  }
  
  onPluginUrlChanged(details) {
    this.setAttribute("plugin", details.url)
  }
  
  async updateAST() {
    var src = this.sourceEditor.currentEditor().getValue();
    
    var filename = "tempfile.js"

    var pluginSrc = this.pluginEditor.currentEditor().getValue();
    var moduleId = generateUUID();
    //"workspace:" + Date.now();
    console.log(moduleId)
    setCode(moduleId, pluginSrc)
    var plugin = await System.import('workspace:' + encodeURI(moduleId)).then(m => m.default)
    // #HACK: we explicitly enable jsx syntax for now
    // #TODO: how to include syntax extensions for ast generation (without the plugin to develop)?
    var jsxSyntax = await System.import('babel-plugin-syntax-jsx').then(m => m.default)

    // get pure ast
    this.ast = babel.transform(src, {
        babelrc: false,
        plugins: [jsxSyntax],
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
    }).ast
    this.get("#astInspector").inspect(this.ast)

    this.pluginEditor.currentEditor().getSession().setAnnotations([]);
    
    try {
      // var plugin = eval(pluginSrc);
    } catch(err) {
      console.error(err);
      this.get("#output").editor.setValue("Error evaluating Plugin: " + err);
      // TODO: Error locations in Plugin Editor
      lively.notify(err.name, err.message, 5, ()=>{}, 'red');
      return
    }
    
    try {
      var src = this.sourceEditor.currentEditor().getValue();
      this.result = babel.transform(src, {
        babelrc: false,
        plugins: [plugin],
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
      })
    } catch(err) {
      console.error(err);
      this.get("#output").editor.setValue("Error transforming code: " + err);
      this.pluginEditor.currentEditor().getSession().setAnnotations(err.stack.split('\n')
        .filter(line => line.match('updateAST'))
        .map(line => {
          let [row, column] = line
            .replace(/.*<.*>:/, '')
            .replace(/\)/, '')
            .split(':')
          return {
            row: parseInt(row) - 1, column: parseInt(column), text: err.message, type: "error"
          }
        }));
      lively.notify(err.name, err.message, 5, ()=>{}, 'red');
      return;
    }
    
    this.get("#output").editor.setValue(this.result.code);
    
    this.get("#result").textContent = ""
    if (this.get("#live").checked) {
      var oldLog = console.log
      var logNode = this.get("#result");
      try {
        console.log = (s, ...rest) => {
          oldLog.call(console, s, ...rest)
          logNode.textContent += s + "\n"
        }
        var result ='' + (await this.get("#output").boundEval(this.get("#output").editor.getValue())).value;
        this.get("#result").textContent += "-> " + result;       
      } catch(e) {
        console.error(e);
        this.get("#result").textContent += "Error: " + e
      } finally {
        console.log = oldLog
      }
    }
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
      source: "unknown",
      line: line,
      column: column
    });
  }
  
  onSourceSelectionChanged(evt) {
    setTimeout(() => {
      if(this.sourceEditor.currentEditor().isFocused()) {
        this.get("#output").editor.selection.clearSelection()
        
        var range = this.sourceEditor.currentEditor().selection.getRange()
        
        var start = this.generatedPositionFor(range.start.row + 1, range.start.column)
        var end = this.generatedPositionFor(range.end.row + 1, range.end.column)
        
        if (!start || !end) return;
        this.get("#output").editor.selection.moveCursorTo(start.line - 1, start.column)
        this.get("#output").editor.selection.selectTo(end.line -  1, end.column)
    
        // this.get("#output").editor.selection.selectTo(end.line, end.column)
      }
    }, 0);
  }
  onOutputSelectionChanged(evt) {
    setTimeout(() => {
      if(this.get("#output").editor.isFocused()) {
        this.sourceEditor.currentEditor().selection.clearSelection()
        
        var range = this.get("#output").editor.selection.getRange()
        
        var start = this.originalPositionFor(range.start.row + 1, range.start.column)
        var end = this.originalPositionFor(range.end.row + 1, range.end.column)
        
        if (!start || !end) return;
        this.sourceEditor.currentEditor().selection.moveCursorTo(start.line - 1, start.column)
        this.sourceEditor.currentEditor().selection.selectTo(end.line -  1, end.column)
      }
    }, 0);
  }
}
