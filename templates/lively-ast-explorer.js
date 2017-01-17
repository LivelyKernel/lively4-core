'use strict';

import Morph from './Morph.js';
//import lively from './../src/client/lively.js';

import {babel} from 'systemjs-babel-build';

import SyntaxChecker from 'src/client/syntax.js'

// import {html} from 'src/client/html.js';

import locals from 'babel-plugin-locals'

export default class AstExplorer extends Morph {

  initialize() {
    this.windowTitle = "AST Explorer";  // #TODO why does it not work?
    this.dispatchEvent(new CustomEvent("initialize"));

    // lets work with properties until we get access to the module state again
    this.babel = babel
    
    lively.html.registerButtons(this);

    this.get("#plugin").doSave = () => {
      this.updateAST()      
    }
    
    this.get("#source").doSave = () => {
      this.updateAST()      
    }
    
    this.get("#plugin").addEventListener("change", evt => 
      SyntaxChecker.checkForSyntaxErrors(this.get("#plugin").editor))

    this.get("#source").addEventListener("change", evt => 
      SyntaxChecker.checkForSyntaxErrors(this.get("#source").editor))
  }
  
  
  
  
  updateAST() {
    var pluginSrc = this.get("#plugin").editor.getValue()
    this.get("#plugin").editor.getSession().setAnnotations([]);
    
    try {
      var plugin = eval(pluginSrc)
    } catch(err) {
      console.error(err)
      this.get("#output").editor.setValue("Error evaluating Plugin: " + err);
      // TODO: Error locations in Plugin Editor
      lively.notify(err.name, err.message, 5, ()=>{}, 'red');
      return
    }
    
    try {
      debugger
      var src = this.get("#source").editor.getValue();
      this.result = babel.transform(src, {
        babelrc: false,
        plugins: [plugin],
        presets: [],
        filename: undefined,
        sourceFileName: undefined,
        moduleIds: false,
        sourceMaps: false,
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
      this.get("#plugin").editor.getSession().setAnnotations(err.stack.split('\n')
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
    lively.openInspector(this.result.ast)
  }
  
  livelyMigrate(other) {
    this.addEventListener("initialize", () => {
      this.get("#source").editor.setValue(other.get("#source").editor.getValue())
      this.get("#plugin").editor.setValue(other.get("#plugin").editor.getValue())
      this.get("#output").editor.setValue(other.get("#output").editor.getValue()) 
    
      this.result = other.result
    
      this.updateAST()
      
    })
  }
}
