/*MD # Domain Code Editor

MD*/

import Morph from 'src/components/widgets/lively-morph.js';
import SyntaxChecker from 'src/client/syntax.js'
import { uuid as generateUUID, debounce, flatmap, executeAllTestRunners, promisedEvent, loc, range } from 'utils';

import {DomainObject, TreeSitterDomainObject, LetSmilyReplacementDomainObject, ConstSmilyReplacementDomainObject} from "src/client/domain-code.js"

export default class DomainCodeEditor extends Morph {

  /*MD ## UI Accessing MD*/

  get container() { return this.get("#content")}
  

  /*MD ## Initialization MD*/

  async initialize() {
    this.windowTitle = "Domain Code Editor";

  
    this.livelyCodeMirror = await (<lively-code-mirror></lively-code-mirror>)
    this.appendChild(this.livelyCodeMirror)
    if (this._source) {
      this.source = this._source
      delete this._source
    }
    
    this.initializeSource() 
    
    // await  this.livelyCodeMirror.editorLoaded()
    var codeMirror = this.livelyCodeMirror.editor
    codeMirror.on("cursorActivity", (cm) => {      
      this.onEditorCursorActivity(cm)
    })


    var debouncedChange = (() => {
        this.onDomainCodeChanged()
    })::debounce(200)
    
    this.livelyCodeMirror.addEventListener("domain-code-changed", debouncedChange)

  }

  get source() {
    if (this.livelyCodeMirror) {
      return this.livelyCodeMirror.value
    } 
    return this._source
  }

  set source(s) {
    if (this.livelyCodeMirror) {
       this.livelyCodeMirror.value = s
    } else {
       this._source = s
    }
  }

  
  async initializeSource() {
    let source = this.source
    this.lastSource  = source
    
    this.domainObject = TreeSitterDomainObject.fromSource(source)
    this.domainObject.replaceType('let', LetSmilyReplacementDomainObject)
    this.domainObject.replaceType('const', ConstSmilyReplacementDomainObject)

    this.domainObject.livelyCodeMirror = this.livelyCodeMirror
    this.domainObject.updateReplacements()
  }
  
  
  onEditorCursorActivity(cm) {
    // var from = cm.getCursor(true)
    // var to = cm.getCursor(false)
  }

  onDomainCodeChanged() {
    
    if (this.lastSource == this.livelyCodeMirror.getText()) return
      
    var newSource = this.editor.getText()
    this.sourceEditor.setText(newSource)
    
    DomainObject.edit(this.domainObject, newSource, undefined, {
      newAST: (ast) => {
        
        this.astInspector.inspect(ast.rootNode);
      }
    }) 
    
    this.domainObject.updateReplacements()
    this.domainObjectInspector.inspect(this.domainObject)
    
  }
  
  onDomainUpdateButton() {
    lively.notify("update")
    this.domainObjectInspector.inspect(this.domainObjectInspector.targetObject)
  }
  
  onDomainGraphButton() {
    lively.openMarkdown(lively4url + "/src/components/tools/domain-code-graph.md", 
      "Domain Code Graph", {domainObject: this.domainObject})
  }


  async save() {
    if (this.sourceURL) {
      await this.sourceEditor.saveFile();
    }
    this.update();
  }

  /*MD ## Lively Integration MD*/

  livelyPrepareSave() {
  }
  
  livelyMigrate(other) {
        
  }

  async livelyExample() {
    this.source = "let a = 3 + 4"
  }
}