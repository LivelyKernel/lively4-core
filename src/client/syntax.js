

import {babel} from 'systemjs-babel-build';


export default class SyntaxChecker {
  
  static checkForSyntaxErrors(editor) {
    var Range = ace.require('ace/range').Range;
    var doc = editor.getSession().getDocument(); 
    var src = editor.getValue();
    
    // clear annotations
    editor.getSession().setAnnotations([]);
    
    // clear markers
    var markers = editor.getSession().getMarkers();
    for(var i in markers) {
        if (markers[i].clazz == "marked") {
            editor.getSession().removeMarker(i);
        }
    }
    
    try {
        var result = babel.transform(src, {
          babelrc: false,
          plugins: [],
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
        var ast = result.ast;
        return false;
    } catch(e) {
      editor.session.addMarker(Range.fromPoints(
        doc.indexToPosition(e.pos),
        doc.indexToPosition(e.raisedAt)), "marked", "text", false); 
      
      editor.getSession().setAnnotations([{
        row: e.loc.line - 1,
        column: e.loc.column,
        text: e.message,
        type: "error"
      }]);
      
      return true
    }
  }
  
  
   static checkForSyntaxErrorsCodeMirror(editor) {
    var src = editor.getValue();
    
    editor.clearGutter("leftgutter")
    
    // clear markers
    editor.getAllMarks()
      .filter(ea => ea.isSyntaxError)
      .forEach(ea => ea.clear())
    
    try {
        var result = babel.transform(src, {
          babelrc: false,
          plugins: [],
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
        var ast = result.ast;
        return false;
    } catch(e) {
      
      
      // lively.notify("Error: " + e)
      
      var line = e.loc.line - 1;
      var errorMark = document.createElement("div")
      errorMark.style.color = "red";
      errorMark.style.marginLeft = "5px"
      errorMark.innerHTML = "<b>!</b>"
      errorMark.classList.add("errorMark")
      errorMark.setAttribute("title", "" + e)
      editor.setGutterMarker(line, "leftgutter", errorMark)
      
      var marker = editor.markText(
        {line: line, ch: 0}, // e.loc.column
        {line: line, ch: 100},
        {
          isSyntaxError: true,
          css: "background-color: red", 
          title: "" + e
        }); 
      
      // editor.getSession().setAnnotations([{
      //   row: e.loc.line - 1,
      //   column: e.loc.column,
      //   text: e.message,
      //   type: "error"
      // }]);
      
      return true
    }
  }
  
  
}