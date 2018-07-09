"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import Node from "templates/lively-codecompletion-utils/node.js";
import CodeTree from "templates/lively-codecompletion-utils/codeTree.js";
import Print from "templates/lively-codecompletion-utils/print.js";
import { promisedEvent } from "utils";


export default class LivelyCodecompletion extends Morph {
  
  get content(){return this.get("#content")}
  get codeEditor() { return this.get('#code-mirror'); }
  async initialize() {
    this.completions=[
      {regex:"^for\\(var .* ",displayText:"for(var i=0;i<'gap';i++)",explanation:"",codeLines:["for(var i='gap';i<'gap' ;'gap'++){","}"],contextFunc:this.contextFunc,applyFunc:function(){}},
      {regex:"^fo",displayText:"for(var i=0;i<<gap>;i++)",explanation:"",codeLines:["for(var i=0;i< ;i++){","}"],contextFunc:this.contextFunc,applyFunc:function(){}}
    ]
    this.windowTitle = "LivelyCodecompletion";
    this.codeTree= new CodeTree();
    this.print = new Print();
    this.root= new Node();
    this.root.nameTag="Root";
    this.codeTree.root=this.root;
    this.codeTree.addNewLine(this.root,0);
    await this.prepareEditor();
    var that = this;
    //define extra hotkey to open to completion menue
    var extraKeys=this.codeEditor.editor.getOption("extraKeys")
    extraKeys["Alt-1"]=function(cm){
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

    // this.addKeyListener();
    this.codeEditor.editor.on("beforeChange",function(cm,object){
      that.changeHandler(cm,object);
    })
    
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
  nextGap(){
    var cursor=this.codeEditor.editor.getCursor()
    console.log("_------------------------------"+cursor)
    console.log(cursor)
    var newPosition=this.codeTree.findNextGap(cursor.line+1,cursor.ch);
    this.codeEditor.editor.focus();
    console.log(newPosition);
    if(newPosition){
      this.codeEditor.editor.setCursor({line:newPosition.line-1,ch:newPosition.ch});
    }else{
      lively.notify("No more gaps ahead found.")
    }
  }
  
  changeHandler(cm,changes){
    var cursor = this.codeEditor.editor.getCursor();
    console.log("cursorchanges")
    console.log(cursor)
    var line= this.codeEditor.editor.getLine(cursor.line)
    if(changes.origin==="+input"){
      if(changes.text[0]===""){
        this.codeTree.addNewLine(this.root,changes.from.line+1)
        this.codeTree.updateLine(this.root,cursor.line+1,line.substring(0,cursor.ch).replace(/^\s+/g, "")+"\n");
        if(this.codeEditor.editor.getValue().split("\n")>cursor.line){
          this.codeTree.updateLine(this.root,cursor.line+2,line.substring(cursor.ch).replace(/^\s+/g, "")+"\n");
        }else{
          this.codeTree.updateLine(this.root,cursor.line+2,line.substring(cursor.ch).replace(/^\s+/g, ""));
        }
        this.updateValue({line:cursor.line+1,ch:cursor.ch+1})
      }else{
        if(this.codeEditor.editor.lineCount()-1>cursor.line){
          this.codeTree.updateLine(this.root,cursor.line+1,line.slice(0, cursor.ch).replace(/^\s+/g, "") + changes.text[0] + line.slice(cursor.ch)+"\n");
        }else{
          this.codeTree.updateLine(this.root,cursor.line+1,line.slice(0, cursor.ch).replace(/^\s+/g, "") + changes.text[0] + line.slice(cursor.ch));
        }
        this.updateValue({line:cursor.line,ch:cursor.ch+1})
      }
      changes.cancel();
    }
    // cursor=changes.to
    if(changes.origin==="+delete"){
      this.deleteLine(cursor,line,changes);
    }
    if(changes.origin==="complete"){
      this.applyHint(changes);
    }
    console.log(changes)
    console.log(this.root)
  }
  
  deleteLine(cursor,line,changes){
    console.log("cursoroodofsdf");
    console.log(cursor)
    if(cursor.ch===0 && cursor.line>0){
        changes.cancel();
        this.codeTree.removeLine(this.root,cursor.line+1)
        let currLine=this.codeEditor.editor.getLine(cursor.line)
        let previousLine = this.codeEditor.editor.getLine(cursor.line-1);
        console.log("line: "+line+previousLine)
        this.codeTree.updateLine(this.root,cursor.line,(line+previousLine).replace(/^\s+/g, ""));
        this.updateValue({line:cursor.line-1,ch:previousLine.length})
      }else{
        if(this.codeEditor.editor.lineCount()-1>cursor.line){
          this.codeTree.updateLine(this.root,cursor.line+1,(line).substring(0,line.length-1).replace(/^\s+/g, "")+"\n");
        }else{
          this.codeTree.updateLine(this.root,cursor.line+1,(line).substring(0,line.length-1).replace(/^\s+/g, ""));
        }
        this.updateValue({line:cursor.line,ch:cursor.ch-1});
      }
  }
  updateValue(cursor){
    console.log(this.codeTree.gaps)
    this.codeEditor.editor.focus();
    this.codeEditor.editor.doc.setValue(this.codeTree.tree2Code(this.root,-1))
    console.log(cursor)
    this.codeEditor.editor.setCursor(cursor.line,cursor.ch)
    console.log(this.codeEditor.editor.getCursor())
    
    console.log("cursor::::::::")
    console.log(cursor)
  }
  render(parent, data, cur){
    const wrapper = document.createElement('div');
    wrapper.innerHTML=cur["text"];
    parent.appendChild(wrapper);
  }
  
  getHint(that){
    var cursor= that.codeEditor.editor.getCursor();
    var line = that.codeEditor.editor.getLine(cursor.line)
    var trimmedLine= line.trim()
    
    //Idee: suche aktiven hint und appende das menue einfach
    var activeHint=this.get(".CodeMirror-hint-active")
    
    //Idee: Ende
    
    that.codeEditor.editor.showHint({"hint":(cm)=>{
          var inner = {from:{line:cursor.line,ch:line.length-trimmedLine.length},to:{line:cursor.line,ch:cursor.ch},list:[]};
          for(var i=0;i<that.completions.length;i++){
            var regex= new RegExp(that.completions[i].regex);
            var partialMatchRegex = regex.toPartialMatchRegex();
            var result=partialMatchRegex.exec(trimmedLine);
            var fullmatch= regex.exec(trimmedLine)
            var treeLine=that.codeTree.findLine(that.root,cursor.line+1,0);
            if(((result && result[0])||fullmatch)&&that.completions[i].contextFunc(treeLine,that.root)){
              inner.list.push({text:that.completions[i].codeLines,displayText:i,render:that.render})
            }
          }
          return inner;
        }})
  }
  
  contextFunc(line,root){
    if(line.parent.nameTag==="forLoop"){
      return true;
    }
    return false;
  }
  
  /**
  Action that is called when an autocompletion was chosen  
  **/
  applyHint(changes){
    for(var i=0;i<changes.text.length;i++){
      if(i!==0){
        console.log("text "+changes.text[i]+" \n")
        this.codeTree.addNewLine(this.root,changes.from.line+1);
        this.codeTree.updateLine(this.root,changes.from.line+1+i,changes.text[i]);
      }else{
        this.codeTree.updateLine(this.root,changes.from.line+1+i,changes.text[i]+"\n");
      }
    }
    changes.cancel();
    this.updateValue({line:changes.to.line,cursor:changes.to.ch+1})
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
RegExp.prototype.toPartialMatchRegex = function() {
    "use strict";
    
    var re = this,
        source = this.source,
        i = 0;
    
    function process () {
        var result = "",
            tmp;

        function appendRaw(nbChars) {
            result += source.substr(i, nbChars);
            i += nbChars;
        }
        
        function appendOptional(nbChars) {
            result += "(?:" + source.substr(i, nbChars) + "|$)";
            i += nbChars;
        }

        while (i < source.length) {
            switch (source[i])
            {
                case "\\":
                    switch (source[i + 1])
                    {
                        case "c":
                            appendOptional(3);
                            break;
                            
                        case "x":
                            appendOptional(4);
                            break;
                            
                        case "u":
                            if (re.unicode) {
                                if (source[i + 2] === "{") {
                                    appendOptional(source.indexOf("}", i) - i + 1);
                                } else {
                                    appendOptional(6);
                                }
                            } else {
                                appendOptional(2);
                            }
                            break;
                            
                        default:
                            appendOptional(2);
                            break;
                    }
                    break;
                    
                case "[":
                    tmp = /\[(?:\\.|.)*?\]/g;
                    tmp.lastIndex = i;
                    tmp = tmp.exec(source);
                    appendOptional(tmp[0].length);
                    break;
                    
                case "|":
                case "^":
                case "$":
                case "*":
                case "+":
                case "?":
                    appendRaw(1);
                    break;
                    
                case "{":
                    tmp = /\{\d+,?\d*\}/g;
                    tmp.lastIndex = i;
                    tmp = tmp.exec(source);
                    if (tmp) {
                        appendRaw(tmp[0].length);
                    } else {
                        appendOptional(1);
                    }
                    break;
                    
                case "(":
                    if (source[i + 1] == "?") {
                        switch (source[i + 2])
                        {
                            case ":":
                                result += "(?:";
                                i += 3;
                                result += process() + "|$)";
                                break;
                                
                            case "=":
                                result += "(?=";
                                i += 3;
                                result += process() + ")";
                                break;
                                
                            case "!":
                                tmp = i;
                                i += 3;
                                process();
                                result += source.substr(tmp, i - tmp);
                                break;
                        }
                    } else {
                        appendRaw(1);
                        result += process() + "|$)";
                    }
                    break;
                    
                case ")":
                    ++i;
                    return result;
                    
                default:
                    appendOptional(1);
                    break;
            }
        }
        
        return result;
    }
    
    return new RegExp(process(), this.flags);
};

