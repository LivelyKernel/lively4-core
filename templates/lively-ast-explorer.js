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


export default class AstExplorer extends Morph {

  initialize() {

    this.windowTitle = "AST Explorer";  // #TODO why does it not work?
    this.dispatchEvent(new CustomEvent("initialize"));

    // lets work with properties until we get access to the module state again
    this.babel = babel
    //this.smc = smc

    // try {    

    this.get("#plugin").setURL("https://lively-kernel.org/lively4/lively4-jens/demos/astplugin.js")

    this.get("#plugin").loadFile()


    lively.html.registerButtons(this);

    this.get("#plugin").get("juicy-ace-editor").doSave = () => {
      this.updateAST()      
    };
    
    this.get("#source").doSave = () => {
      this.updateAST()      
    };
    
    // this.get("#plugin").currentEditor().addEventListener("change", evt => 
    //  SyntaxChecker.checkForSyntaxErrors(this.get("#plugin").currentEditor().editor));

    this.get("#source").addEventListener("change", evt => 
      SyntaxChecker.checkForSyntaxErrors(this.get("#source").editor));

    this.get("#source").editor.session.selection.on("changeSelection", (evt) => {
      this.onSourceSelectionChanged(evt)
    });
    
    this.get("#source").editor.session.selection.on("changeCursor", (evt) => {
      this.onSourceSelectionChanged(evt)
    });

    this.get("#output").editor.session.selection.on("changeSelection", (evt) => {
      this.onOutputSelectionChanged(evt)
    });
    
    this.get("#output").editor.session.selection.on("changeCursor", (evt) => {
      this.onOutputSelectionChanged(evt)
    });

    // this.get("#plugin").currentEditor()
    [this.get("#output"), this.get("#source")].forEach(ea => ea.editor.session.setOptions({
			mode: "ace/mode/javascript",
    	tabSize: 2,
    	useSoftTabs: true
		}));
		
    // } catch(e) {
    //  console.error(e);
      // throw new Error("Could not initialize AST-Explorer " + e);
    //}
  }
  
  async updateAST() {
    var pluginSrc = this.get("#plugin").currentEditor().getValue();
    var moduleId = generateUUID();
    //"workspace:" + Date.now();
    console.log(moduleId)
    setCode(moduleId, pluginSrc)
    var plugin = await System.import('workspace:' + encodeURI(moduleId)).then(m => m.default)
  
    this.get("#plugin").editor.getSession().setAnnotations([]);
    
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
      var src = this.get("#source").editor.getValue();
      this.result = babel.transform(src, {
        babelrc: false,
        plugins: [plugin],
        presets: [],
        filename: undefined,
        sourceFileName: undefined,
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
      this.get("#plugin").currentEditor().getSession().setAnnotations(err.stack.split('\n')
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
    
    this.get("#output").editor.setValue(this.result.code) 
  }
  
  onAcceptSource() {
    this.updateAST()
  }
  
  onAstInspect() {
    lively.openInspector(this.result)
  }
  
  livelyMigrate(other) {
    this.addEventListener("initialize", () => {
      this.get("#source").editor.setValue(other.get("#source").editor.getValue())
      this.get("#plugin").currentEditor().setValue(
        other.get("#plugin").currentEditor().getValue())
      this.get("#output").editor.setValue(other.get("#output").editor.getValue()) 
    
      this.result = other.result
    
      this.updateAST()
      
    })
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
      if(this.get("#source").editor.isFocused()) {
        this.get("#output").editor.selection.clearSelection()
        
        var range = this.get("#source").editor.selection.getRange()
        
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
        this.get("#source").editor.selection.clearSelection()
        
        var range = this.get("#output").editor.selection.getRange()
        
        var start = this.originalPositionFor(range.start.row + 1, range.start.column)
        var end = this.originalPositionFor(range.end.row + 1, range.end.column)
        
        if (!start || !end) return;
        this.get("#source").editor.selection.moveCursorTo(start.line - 1, start.column)
        this.get("#source").editor.selection.selectTo(end.line -  1, end.column)
      }
    }, 0);
  }
}
