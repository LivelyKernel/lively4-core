'use strict';

import Morph from './Morph.js';

import {babel} from 'systemjs-babel-build';

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
    
  }
  
  updateAST() {
    var pluginSrc = this.get("#plugin").editor.getValue()
    try {
      var plugin = eval(pluginSrc)
    } catch(e) {
      console.log(e)
      
      this.get("#output").editor.setValue("Error evaluating Plugin: " +e) 
      return
    }
    
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
