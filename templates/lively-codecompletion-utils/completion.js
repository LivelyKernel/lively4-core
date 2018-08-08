export default class Completion {
  
    constructor(codeTree,patternCompletion) {
      this.completions=[
      {regex:"^for\\(var .* ",displayText:"for(var i=0;i<'gap';i++)",explanation:"For loop with a gap in in the condition",codeLines:["for(var i='gap';i<'gap' ;'gap'++){","}"],contextFunc:function(){return true;},applyFunc:this.applyHint,adaptCompletionFunc:this.exampleApply},
      {regex:"^describe\\(\'.*?\', function(){",explanation:"Do something",codeLines:["describe('', function (){","})"],contextFunc:function(){return true;},applyFunc:this.applyHint,adaptCompletionFunc:this.exampleApply},
        {regex:"^describe\\(\'.*?\', function(){",explanation:"World",codeLines:["describe('', function (){","})"],contextFunc:function(){return true;},applyFunc:this.applyHint,adaptCompletionFunc:this.exampleApply},
      {regex:"^fo",displayText:"for(var i=0;i<<gap>;i++)",explanation:"!",codeLines:["for(var i=0;i< ;i++){","}","o","e"],contextFunc:function(){return true;},applyFunc:this.applyHint,adaptCompletionFunc:this.exampleApply},
      {regex:"^console.log\\(.*?\\)",displayText:"console.log()",explanation:"Empty console log",codeLines:["console.log();"],contextFunc:function(){return true;},applyFunc:this.applyHint,adaptCompletionFunc:this.exampleApply},
      {regex:"^console.log\\(.*?\\)",displayText:"console.log(<clipboard>)",explanation:"Console log that prints the clipboard",codeLines:["console.log();"],contextFunc:function(){return true;},applyFunc:this.applyHint,adaptCompletionFunc:this.clipboardLog},
      {regex:"^/\\*\\*",displayText:"\\**",explanation:"Generates Codestubs for a function in the next line",codeLines:["/**","*","*/"],contextFunc:function(){return true;},applyFunc:this.applyHint,adaptCompletionFunc:this.codeStubs},
      {regex:"^it\\(*?, \\(\\)\\)",displayText:"\\**",explanation:"Generates Codestubs for a function in the next line",codeLines:["it('', function (){","})"],contextFunc:this.itContextFunction,applyFunc:this.applyHint,adaptCompletionFunc:this.exampleApply}
      
    ]
      this.codeTree=codeTree;
      this.patternCompletion=patternCompletion;
    }
  
  
  codeStubs(codeLines,root,line,patternCompletion){
    let localCodeLines=codeLines.slice(0);
    var lineIndex=line.parent.children.indexOf(line);
    if(line.parent.children[lineIndex+1]&&line.parent.children[lineIndex+1].nameTag==="function"){
      var funcParams=line.parent.children[lineIndex+1].attributes["params"].value.split(",");
      for(var i=0;i<funcParams.length;i++){
        localCodeLines.splice(i+2,0,"@param "+funcParams[i]);
      }
    }
    return localCodeLines;
  }
  
  /**
  Action that is called when an autocompletion was chosen  
  **/
  applyHint(cm,codelines,updateValue,codeTree){
    var cursor= cm.editor.getCursor();
    for(var i=0;i<codelines.length;i++){
      if(i!==0){
        codeTree.addNewLine(cursor.line+i);
        if(i<codelines.length-1){
          codeTree.updateLine(cursor.line+1+i,codelines[i]+"\n");
        }else{
          codeTree.updateLine(cursor.line+1+i,codelines[i]);
        }
        //codeTree.makeLineProtected(cursor.line+1+i);
      }else{
        codeTree.updateLine(cursor.line+1+i,codelines[i]+"\n");
        //codeTree.makeLineProtected(cursor.line+1+i);
      }
    }
    updateValue({line:cursor.line+codelines.length,cursor:cursor.ch},cm,codeTree)
  }
  
  exampleApply(codeLines,root,line){
    return codeLines;
  }
  
  clipboardLog(codeLines,root,line,patternCompletion){
    console.log("patterncompletion "+patternCompletion)
    var clipboard = patternCompletion.clipboard;
    console.log("clipboard "+clipboard)
    var code = codeLines[0];
    var indexOfContent=code.indexOf("(")+1;
    var result=code.substring(0,indexOfContent)+"\""+clipboard+"\""+code.substring(indexOfContent);
     console.log("result "+result)
    return [result];
  }

  inForLoop(line, root){
    if(line.parent.nameTag==="forLoop"){
      return true;
    }
    return false;
  }
  
  itContextFunction(line, root){
    if(line.parent.nameTag==="describeFunction"){
      return true;
    }
    return false;
  }
}