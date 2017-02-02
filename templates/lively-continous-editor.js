import Morph from './Morph.js';
import {babel} from 'systemjs-babel-build';
import SyntaxChecker from 'src/client/syntax.js'
import taceBabelPlugin from "./lively-continous-editor-plugin.js"

//import lively from './../src/client/lively.js';

export default class ContinousEditor extends Morph {

  initialize() {
    this.windowTitle = "Continos Editor";  // #TODO why does it not work?
    this.get("#source").setURL("https://lively-kernel.org/lively4/lively4-jens/demos/hello.js")
    this.get("#source").loadFile()

    lively.html.registerButtons(this);

    this.get("#source").get("juicy-ace-editor").doSave = () => {
      this.get("#plugin").saveFile()
      this.runCode()      
    };
    
    this.get("#source").get("juicy-ace-editor").addEventListener("change", evt => 
      SyntaxChecker.checkForSyntaxErrors(this.get("#source").editor));

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
  
  async runCode() {

    var src = this.get("#source").editor.getValue();
  
    // this.get("#astInspector").inspect(this.ast)

    var pluginSrc = this.get("#plugin").currentEditor().getValue();

    try {
      var src = this.get("#source").editor.getValue();
      this.result = babel.transform(src, {
        babelrc: false,
        plugins: [taceBabelPlugin],
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
    
    try {
      var result =  eval('' +this.result.code);
      // this.get("#result").textContent += "-> " + result;       
    } catch(e) {
      throw e
      // this.get("#result").textContent = "Error: " + e
    } finally {
    
    }
  }

  livelyMigrate(other) {
    this.addEventListener("initialize", () => {
      this.get("#source").setURL(other.get("#source").getURL())
      debugger
      this.get("#source").currentEditor().setValue(
        other.get("#source").currentEditor().getValue())
    })
  }
  
}
