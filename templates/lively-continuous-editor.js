import Morph from './Morph.js';
import {babel} from 'systemjs-babel-build';
import SyntaxChecker from 'src/client/syntax.js'
import traceBabelPlugin from "./lively-continuous-editor-plugin.js"

//import lively from './../src/client/lively.js';

export default class ContinuousEditor extends Morph {

  initialize() {
    this.windowTitle = "Continos Editor";  // #TODO why does it not work?
    this.get("#source").setURL("https://lively-kernel.org/lively4/lively4-jens/demos/hello.js")
    this.get("#source").loadFile()

    lively.html.registerButtons(this);

    this.get("#traceInspector").get("#editor").style.display = "none";

    this.editorComp().doSave = () => {
      this.get("#source").saveFile();
      this.runCode();      
    };
    
    this.editorComp.addEventListener("change", evt => 
      SyntaxChecker.checkForSyntaxErrors(this.editor()));

    // this.get("#source").get("juicy-ace-editor").editor.session.selection.on("changeSelection", (evt) => {
    //   this.onSourceSelectionChanged(evt)
    // });
    
    // this.get("#source").get("juicy-ace-editor").editor.session.selection.on("changeCursor", (evt) => {
    //   this.onSourceSelectionChanged(evt)
    // });


    // this.get("#plugin").currentEditor()
  //   [this.get("#source").get("juicy-ace-editor")].forEach(ea => ea.editor.session.setOptions({
		// 	mode: "ace/mode/javascript",
  //   	tabSize: 2,
  //   	useSoftTabs: true
		// }));
		
    this.dispatchEvent(new CustomEvent("initialize"));
  }
  
  editorComp() {
    return this.get("#source").get("juicy-ace-editor");
  }
  
  editor() {
    return this.editorComp().editor
  }
  
  async runCode() {
    debugger
    var src = this.editor().getValue();
  
    // this.get("#astInspector").inspect(this.ast)

    try {
      var src = this.editor().getValue();
      this.result = babel.transform(src, {
        babelrc: false,
        plugins: [traceBabelPlugin],
        presets: [],
        filename: undefined,
        sourceFileName: undefined,
        moduleIds: false,
        sourceMaps: false,
        compact: false,
        comments: true,
        code: true,
        ast: true,
        resolveModuleSource: undefined
      })
    } catch(err) {
      console.error(err);
      lively.notify(err.name, err.message, 5, ()=>{}, 'red');
      return;
    }
    
    try {
      // lively.notify("output: " + this.result.code)
      var result =  eval('' +this.result.code);
      // this.get("#result").textContent += "-> " + result;       
    } catch(e) {
        
      this.get("#source").currentEditor().getSession().setAnnotations(err.stack.split('\n')
        .filter(line => line.match('runCode???'))
        .map(line => {
          let [row, column] = line
            .replace(/.*<.*>:/, '')
            .replace(/\)/, '')
            .split(':')
          return {
            row: parseInt(row) - 1, column: parseInt(column), text: err.message, type: "error"
          }
        }));
      throw e
      // this.get("#result").textContent = "Error: " + e
    } finally {
    
    }
    if (window.__tr__root__)   
      this.get("#traceInspector").inspect(window.__tr__root__)
    
  }

  livelyMigrate(other) {
    this.addEventListener("initialize", () => {
      this.get("#source").setURL(other.get("#source").getURL())
      this.editor().setValue(other.editor().getValue())
    })
  }
  
}
