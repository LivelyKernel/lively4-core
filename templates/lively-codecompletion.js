"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import Node from "templates/lively-codecompletion-utils/node.js";
import CodeTree from "templates/lively-codecompletion-utils/codeTree.js";
import Print from "templates/lively-codecompletion-utils/print.js";
import { promisedEvent } from "utils";

var data=[
  {regex:"^for\\(var .* ",displayText:"for(var i=0;i<gap;i++)",explanation:"",codeLines:["for(var i=0;i< ;i++){","}"]},
  {regex:"^fo",displayText:"for(var i=0;i<gap;i++)",explanation:"",codeLines:["for(var i=0;i< ;i++){","}"]}
]

export default class LivelyCodecompletion extends Morph {
  
  get content(){return this.get("#content")}
  get codeEditor() { return this.get('#code-mirror'); }
  async initialize() {
    this.windowTitle = "LivelyCodecompletion1";
    this.codeTree= new CodeTree();
    this.print = new Print();
    this.root= new Node();
    this.root.nameTag="Root";
    this.codeTree.addNewLine(this.root,0);
    await this.prepareEditor();
    var that = this;
    //define extra hotkey to open to completion menue
    var extraKeys=this.codeEditor.editor.getOption("extraKeys")
    extraKeys["Alt-1"]=function(){that.getHint(that);}
    this.codeEditor.editor.setOption("extraKeys",extraKeys);
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
  changeHandler(cm,changes){
    console.log(changes)
    var cursor = changes.from
    var line= this.codeEditor.editor.getLine(cursor.line)
    if(changes.origin==="+input"){
      if(changes.text[0]===""){
        //return has been hit
        this.codeTree.addNewLine(this.root,changes.from.line+1)
        console.log(this.root)
        console.log("test : "+line.substring(changes.from.ch)+"..")
        this.codeTree.updateLine(this.root,cursor.line+1,line.substring(0,cursor.ch).replace(/^\s+/g, "")+"\n");
        if(this.codeEditor.editor.getValue().split("\n")>cursor.line+1){
          this.codeTree.updateLine(this.root,cursor.line+2,line.substring(cursor.ch).replace(/^\s+/g, "")+"\n");
        }else{
          this.codeTree.updateLine(this.root,cursor.line+2,line.substring(cursor.ch).replace(/^\s+/g, ""));
        }
        this.updateValue({line:cursor.line+1,cursor:cursor.ch+1})
      }else{
        this.codeTree.updateLine(this.root,cursor.line+1,line.slice(0, cursor.ch).replace(/^\s+/g, "") + changes.text[0] + line.slice(cursor.ch));
        this.updateValue({line:cursor.line,cursor:cursor.ch+1})
      }
      changes.cancel();
      
    }
    cursor=changes.to
    if(changes.origin==="+delete"){
      if(cursor.ch===0 && cursor.line>0){
        changes.cancel();
        this.codeTree.removeLine(this.root,cursor.line+1)
        let currLine=this.codeEditor.editor.getLine(cursor.line+1)
        let previousLine = this.codeEditor.editor.getLine(cursor.line);
        console.log("line: "+line+previousLine)
        this.codeTree.updateLine(this.root,cursor.line,(line+previousLine).replace(/^\s+/g, ""));
        this.updateValue({line:cursor.line-1,ch:previousLine.length})
      }
    }
    console.log(this.root)
  }
  updateValue(cursor){
    this.codeEditor.editor.setValue(this.codeTree.tree2Code(this.root,-1))
    this.codeEditor.editor.focus();
    this.codeEditor.editor.setCursor(cursor)
  }
  addKeyListener(){
    var that=this;
    this.addEventListener('keydown', function(event){
      
    })
    this.addEventListener('keyup',function(event){
    
      var cursor= that.codeEditor.editor.getCursor();
      var line = that.codeEditor.editor.getLine(cursor.line)
      if(event.key!=="Enter"){  
        var inp = String.fromCharCode(event.keyCode);
        if(/[a-zA-Z0-9-_ ]/.test(inp)){
          line+=event.key;
          cursor.ch+=1;
        }
        that.lastCursor=cursor;
        if(that.codeEditor.editor.getValue().split("\n")>cursor.line){
          that.codeTree.updateLine(that.root,cursor.line+1,that.codeEditor.editor.getLine(cursor.line).replace(/^\s+/g, "")+"\n");
        }else{
          that.codeTree.updateLine(that.root,cursor.line+1,that.codeEditor.editor.getLine(cursor.line).replace(/^\s+/g, ""));
        }
        console.log(that.codeTree.tree2Code(that.root,-1))
      }else{
        console.log("enter")
        that.lastCursor=cursor;
        that.codeTree.addNewLine(that.root,cursor.line-1);
        that.codeTree.updateLine(that.root,cursor.line,that.codeEditor.editor.getLine(cursor.line-1).replace(/^\s+/g, "")+"\n");
        if(that.codeEditor.editor.getValue().split("\n")>cursor.line){
          that.codeTree.updateLine(that.root,cursor.line+1,that.codeEditor.editor.getLine(cursor.line).replace(/^\s+/g, "")+"\n");
        }else{
          that.codeTree.updateLine(that.root,cursor.line+1,that.codeEditor.editor.getLine(cursor.line).replace(/^\s+/g, ""));
        }
      }
      that.codeEditor.editor.setValue(that.codeTree.tree2Code(that.root,-1))
      that.codeEditor.editor.focus();
      that.codeEditor.editor.setCursor(that.lastCursor)
      console.log(this.root)
    })
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
    that.codeEditor.editor.showHint({"hint":(cm)=>{
          var inner = {from:{line:cursor.line,ch:line.length-trimmedLine.length},to:{line:cursor.line,ch:cursor.ch},list:[]};
          for(var i=0;i<data.length;i++){
            var regex= new RegExp(data[i].regex);
            var partialMatchRegex = regex.toPartialMatchRegex();
            var result=partialMatchRegex.exec(trimmedLine);
            var fullmatch= regex.exec(trimmedLine)
            if((result && result[0])||fullmatch){
              inner.list.push({text:data[i].codeLines[0],displayText:i,render:that.render})
            }
          }
          return inner;
        }})
  }
  
  async prepareEditor(){
    await promisedEvent(this.codeEditor, "editor-loaded");
  }
  
  // this method is autmatically registered through the ``registerKeys`` method
  onKeyDown(evt) {
    lively.notify("Key Down!" + evt.charCode)
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

