"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import Node from "templates/lively-codecompletion-utils/node.js";
import CodeTree from "templates/lively-codecompletion-utils/codeTree.js";
import Print from "templates/lively-codecompletion-utils/print.js";
import Utils from "templates/lively-codecompletion-utils/utils.js";
import Completion from "templates/lively-codecompletion-utils/completion.js";
import { promisedEvent } from "utils";


export default class LivelyCodecompletion extends Morph {
  
  get content(){return this.get("#content")}
  get codeEditor() { return this.get('#code-mirror'); }
  async initialize() {
    
    this.windowTitle = "LivelyCodecompletion";
    
    
    this.codeTree= new CodeTree();
    this.utils = new Utils();
    this.completion= new Completion(this.codeTree,this);
    this.clipboard="";
    await this.prepareEditor();
    var that = this;
    //define extra hotkey to open to completion menue
    var extraKeys=this.codeEditor.editor.getOption("extraKeys")
    this.ctrlDown=false;
    this.clipboardListener(this);
    extraKeys["Alt-1"]=function(cm){
      lively.notify('hsdfjgkhfgskjehgfkjhg')
      that.getHint(that);}

    extraKeys["Alt-3"]=function(cm){
      that.nextGap();
    }
    extraKeys["Enter"]=function(cm){
      console.log("return")
      that.changeHandler(
        cm,
        {cancel:function(){},
          "canceled":true,
         from:that.codeEditor.editor.getCursor(),
        origin:"+input",
        text:[""],
        to:that.codeEditor.editor.getCursor(),
        update:function(){}}
      )
    }

    this.codeEditor.editor.on("beforeChange",function(cm,object){
      that.changeHandler(cm,object);
    })
    this.codeEditor.editor.getSelectedRange = function() {
      return { from: that.codeEditor.editor.getCursor(true), to: that.codeEditor.editor.getCursor(false) };
    };
    
    this.registerButtons()

    lively.html.registerKeys(this); // automatically installs handler for some methods
    
    lively.addEventListener("template", this, "dblclick", 
      evt => this.onDblClick(evt))
    
  }
  
  clipboardListener(that){
    this.content.addEventListener('keydown',function(e){
      if(e.key==="Control"){
        that.ctrlDown=true;
      }
      if(e.key==="c"&&that.ctrlDown){
        that.clipboard=that.codeEditor.editor.getSelection();
        console.log(that.clipboard)
      }
    });
    this.content.addEventListener('keyup',function(e){
      if(e.key==="Control"){
        that.ctrlDown=false;
      }
    })
  }
  nextGap(){
    var cursor=this.codeEditor.editor.getCursor()
    var newPosition=this.codeTree.findNextGap(cursor.line+1,cursor.ch);
    this.codeEditor.editor.focus();
    if(newPosition){
      this.codeEditor.editor.setCursor({line:newPosition.line-1,ch:newPosition.ch});
    }else{
      lively.notify("No more gaps ahead found.")
    }
  }
  
  handleSelectedRange(cm){
    var selected=cm.getSelectedRange();
    if(selected.from.line===selected.to.line&&selected.from.ch===selected.to.ch){
      return;
    }
    for(var i=selected.from.line;i<selected.to.line-1;i++){
      this.codeTree.removeLine(i+1);
    }
    var fromLine = this.codeEditor.editor.getLine(selected.from.line);
    var toLine = this.codeEditor.editor.getLine(selected.to.line);
    var fromString= fromLine.substring(0,selected.from.ch);
    var toString= toLine.substring(selected.to.ch,toLine.length);
    if(selected.from.line!==selected.to.line){
      this.codeTree.removeLine(selected.to.line+1);
    }
    this.codeTree.updateLine(selected.from.line+1,(fromString+toString).replace(/^\s+/g, ""));
    this.updateValue(selected.from,this.codeEditor,this.codeTree)
  }
  handlePaste(changes){
    if(changes.text.length===0||changes.origin!=="paste"){
      return;
    }
    var cursor = this.codeEditor.editor.getCursor();
    console.log(cursor)
    for(var i=1;i<changes.text.length;i++){
      this.codeTree.addNewLine(changes.from.line+i);
      this.codeTree.updateLine(changes.from.line+i,changes.text[i].replace(/^\s+/g, "\n"));
    }
    var fromLine = this.codeEditor.editor.getLine(cursor.line);
    var beginString= fromLine.substring(0,cursor.ch);
    var endString= fromLine.substring(cursor.ch);
    if(changes.text.length>1){
      this.codeTree.updateLine(cursor.line+1,(beginString+changes.text[0]).replace(/^\s+/g, "\n"));
      this.codeTree.updateLine(cursor.line+changes.text.length,(changes.text[changes.text.length-1]+endString).replace(/^\s+/g, "\n"));
    }else{
      this.codeTree.updateLine(cursor.line+1,(beginString+changes.text[0]+endString).replace(/^\s+/g, "\n"));
    }
    this.updateValue({line:cursor.line+changes.text.length-1,ch:changes.text[changes.text.length-1].length-1},this.codeEditor,this.codeTree);
    changes.cancel();
  }
  
  changeHandler(cm,changes){
    
    if(changes.origin!=="setValue"){
      this.handleSelectedRange(cm);
    }
    if(changes.origin==="paste"){
      this.handlePaste(changes);
      return;
    }
    var cursor = this.codeEditor.editor.getCursor();
    var line= this.codeEditor.editor.getLine(cursor.line)
    if(changes.origin==="+input"){
      if(changes.text[0]===""){
        this.codeTree.addNewLine(changes.from.line+1)
        this.codeTree.updateLine(cursor.line+1,line.substring(0,cursor.ch).replace(/^\s+/g, "")+"\n");
        if(this.codeEditor.editor.getValue().split("\n").length>cursor.line+1){
          this.codeTree.updateLine(cursor.line+2,line.substring(cursor.ch).replace(/^\s+/g, "")+"\n");
        }else{
          this.codeTree.updateLine(cursor.line+2,line.substring(cursor.ch).replace(/^\s+/g, ""));
        }
        this.updateValue({line:cursor.line+1,ch:cursor.ch+1},this.codeEditor,this.codeTree)
      }else{
        if(this.codeEditor.editor.lineCount()-1>cursor.line){
          this.codeTree.updateLine(cursor.line+1,line.slice(0, cursor.ch).replace(/^\s+/g, "") + changes.text[0] + line.slice(cursor.ch)+"\n");
        }else{
          this.codeTree.updateLine(cursor.line+1,line.slice(0, cursor.ch).replace(/^\s+/g, "") + changes.text[0] + line.slice(cursor.ch));
        }
        this.updateValue({line:cursor.line,ch:cursor.ch+1},this.codeEditor,this.codeTree)
      }
      changes.cancel();
    }
    // cursor=changes.to
    if(changes.origin==="+delete"){
      if(changes.from.line===changes.to.line){
        if(this.codeEditor.editor.lineCount()-1>cursor.line){
          this.codeTree.updateLine(cursor.line+1,line.slice(0, cursor.ch).replace(/^\s+/g, "") + line.slice(cursor.ch)+"\n");
        }else{
          this.codeTree.updateLine(cursor.line+1,line.slice(0, cursor.ch).replace(/^\s+/g, "") + line.slice(cursor.ch));
        }
      }else{
        this.deleteLine(cursor,line,changes);
      }
    }
    if(changes.origin==="complete"){
      // this.applyHint(changes);
      changes.cancel();
    }
  }
  
  deleteLine(cursor,line,changes){
    if(cursor.ch===0 && cursor.line===this.codeEditor.editor.lineCount()-1){
      console.log("deleting lastline")
      let currLine=this.codeEditor.editor.getLine(cursor.line)
      let previousLine = this.codeEditor.editor.getLine(cursor.line-1);
      this.codeTree.removeLine(cursor.line+1)
      this.updateValue({line:cursor.line-1,ch:previousLine.length},this.codeEditor,this.codeTree)
    }else{
      if(cursor.ch===0 && cursor.line>0){
        console.log("trying to delete "+(cursor.line+1))

          let currLine=this.codeEditor.editor.getLine(cursor.line)
          let previousLine = this.codeEditor.editor.getLine(cursor.line-1);
          if(this.codeEditor.editor.lineCount()-1>cursor.line){
            this.codeTree.updateLine(cursor.line,(previousLine+line).replace(/^\s+/g, "")+"\n");
          }else{
            this.codeTree.updateLine(cursor.line,(previousLine+line).replace(/^\s+/g, ""));
          }
          this.codeTree.removeLine(cursor.line+1)
          this.updateValue({line:cursor.line-1,ch:previousLine.length},this.codeEditor,this.codeTree)
        }else{
          //check if cursor.line===0
          if(this.codeEditor.editor.lineCount()-1>cursor.line){
            console.log("replace "+(line).substring(0,changes.from.ch).replace(/^\s+/g, "")+(line).substring(changes.to.ch))
            this.codeTree.updateLine(cursor.line+1,(line).substring(0,changes.from.ch).replace(/^\s+/g, "")+(line).substring(changes.to.ch)+"\n");
          }else{
            this.codeTree.updateLine(cursor.line+1,(line).substring(0,changes.from.ch).replace(/^\s+/g, "")+(line).substring(changes.to.ch));
          }
          this.updateValue({line:cursor.line,ch:cursor.ch-1},this.codeEditor,this.codeTree);
        }
    }
    changes.cancel();
  }
  updateValue(cursor,cm,codeTree){
    cm.editor.doc.setValue(codeTree.tree2Code(-1))
    cm.editor.focus();
    cm.editor.setCursor(cursor.line,cursor.ch)
  }
  
  render(parent, data, cur){
    //not used right now, but could be usefull if you would want to extent the hint explanation
    const wrapper = document.createElement('div');
    wrapper.innerHTML=cur["text"];
    parent.appendChild(wrapper);
  }
  
  showHintExtension(explContent){
    if(this.lastHintExtension){
      this.lastHintExtension.remove();
    }
    var activeHint=this.activeHint();
    const hintExtension = document.createElement('div');
    
    //some styling
    hintExtension.style.color="white";
    hintExtension.style.background
    hintExtension.style.borderTop="solid 1px black";
    hintExtension.style.borderBottom="solid 1px black";
    hintExtension.style.padding="3px";
    hintExtension.style.margin="5px 5px";
    //some styling
    
    hintExtension.innerHTML=explContent;
    activeHint.appendChild(hintExtension);
    this.lastHintExtension=hintExtension;
  }
  
  activeHint(){
    //this function would be obsolete if Id know how to use getElByClass...
    let codeMirror=this.codeEditor;
    // thats the element with the id=code-mirror-hints
    let hintsWrapper=codeMirror.shadowRoot.children[11];
    let hintsWrapperInner= hintsWrapper.children[0];
    for(var i=0;i<hintsWrapperInner.children.length;i++){
      if(hintsWrapperInner.children[i].className==="CodeMirror-hint CodeMirror-hint-active"){
        return hintsWrapperInner.children[i];
      }
    }
    return null;
  }
  
  getHint(that){
    var cursor= that.codeEditor.editor.getCursor();
    var line = that.codeEditor.editor.getLine(cursor.line)
    var trimmedLine= line.trim()
  
    
    that.codeEditor.editor.showHint({"hint":(cm)=>{
          var inner = {from:{line:cursor.line,ch:line.length-trimmedLine.length},to:{line:cursor.line,ch:cursor.ch},list:[]};
          var completions = this.completion.completions;
          for(var i=0;i<completions.length;i++){
            var regex= new RegExp(completions[i].regex);
            var partialMatchRegex = regex.toPartialMatchRegex();
            var result=partialMatchRegex.exec(trimmedLine);
            var fullmatch= regex.exec(trimmedLine)
            var treeLine=that.codeTree.findLine(cursor.line+1,0);
            if((that.utils.partialMatch(completions[i].regex,trimmedLine)[0]||fullmatch)&&completions[i].contextFunc(treeLine,that.codeTree.root)){
              var selectionItem=completions[i];
              selectionItem.text=selectionItem.codeLines
              inner.list.push(selectionItem)
            }
          }
          CodeMirror.on(inner, "select", function(selectedItem) {
            that.showHintExtension(selectedItem["explanation"]);
          });
          CodeMirror.on(inner, "pick", function(selectedItem) {
            // seems better than just passing a hint function, since hint function seems to fire on creation of hint selection
            var codeLines=selectedItem.text;
            codeLines=selectedItem.adaptCompletionFunc(codeLines,that.codeTree.root,that.codeTree.findLine(cursor.line+1,0),that);
            console.log("-------------------------------1")
            console.log(codeLines)
            selectedItem.applyFunc(that.codeEditor,codeLines,that.updateValue,that.codeTree)
          })
          return inner;
        }})
  }
  
  async prepareEditor(){
    await promisedEvent(this.codeEditor, "editor-loaded");
  }
  
  // this method is autmatically registered through the ``registerKeys`` method
  onKeyDown(evt) {
    // lively.notify("Key Down!" + evt.charCode)
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
    // this.style.backgroundColor = "red"
    // this.someJavaScriptProperty = 42
    // this.appendChild(<div>This is my content</div>)
  }  
}

