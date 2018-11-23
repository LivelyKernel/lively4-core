"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import d3 from "src/external/d3.v5.js"
import babelDefault from 'systemjs-babel-build';
const babel = babelDefault.babel;
import files from "src/client/fileindex.js"

export default class LivelyAnalysis extends Morph {
  
  async initialize() {
    this.windowTitle = "Lively Semantic Code Analysis";
    this.registerButtons()

    lively.html.registerKeys(this); // automatically installs handler for some methods
    
    lively.addEventListener("template", this, "dblclick", 
      evt => this.onDblClick(evt))
    // #Note 1
    // ``lively.addEventListener`` automatically registers the listener
    // so that the the handler can be deactivated using:
    // ``lively.removeEventListener("template", this)``
    // #Note 1
    // registering a closure instead of the function allows the class to make 
    // use of a dispatch at runtime. That means the ``onDblClick`` method can be
    // replaced during development
  }
  
  getData() {
    if(!this.data) {
      var exampleData = {
        classes: [
          {name: "ClassA"},
          {name: "ClassB"},
        ]
      }
      return exampleData
    }
    return this.data
  }
  
  setData(files) {
    var data = {}
    for(var file in files) {
      data = this.extractFunctionsAndClasses(file)
    }
    this.data = data
  }
  
  parseSource(filename, source) {
    try {
      return babel.transform(source, {
          babelrc: false,
          plugins: [],
          presets: [],
          filename: filename,
          sourceFileName: filename,
          moduleIds: false,
          sourceMaps: true,
          compact: false,
          comments: true,
          code: true,
          ast: true,
          resolveModuleSource: undefined
      }).ast
    } catch(e) {
      console.log('Error - could not parse: ' + filename)
      return undefined
    }
  }
  
  extractFunctionsAndClasses(file) {
    var ast = this.parseSource(file.url, file.content)
    return this.parseFunctionsAndClasses(ast)
  }
  
  parseFunctionsAndClasses(ast) {
    var functions = []
    var classes = []
    babel.traverse(ast,{
      Function(path) {
        if (path.node.key) {
          functions.push(path.node.key.name)
        } else if (path.node.id) {
          functions.push(path.node.id.name)
        }
      },
      ClassDeclaration(path) {
        if (path.node.id) {
          classes.push(path.node.id.name)
        }
      }
    })
    return {functions, classes}
  }
  
  // this method is autmatically registered through the ``registerKeys`` method
  onKeyDown(evt) {
    lively.notify("Key Down!" + evt.charCode)
  }
  
  // this method is automatically registered as handler through ``registerButtons``
  onFirstButton() {
    lively.notify("hello")
  }

  /* Lively-specific API */

  livelyPreMigrate() {
    // is called on the old object before the migration
  }
  
  livelyMigrate(other) {
    // whenever a component is replaced with a newer version during development
    // this method is called on the new object during migration, but before initialization
    this.someJavaScriptProperty = other.someJavaScriptProperty
  }
  
  livelyInspect(contentNode, inspector) {
    // do nothing
  }
  
  livelyPrepareSave() {
    
  }
  
  
  async livelyExample() {
    // this customizes a default instance to a pretty example
    // this is used by the 
    this.appendChild(<div>This is my content</div>)
  }
  
  
}