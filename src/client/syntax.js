import {parseToCheckSyntax} from "src/external/babel/plugin-babel7.js"



export default class SyntaxChecker {
  
  static async checkForSyntaxErrors(editor) {
   
    var src = editor.getValue();
    
    editor.clearGutter("leftgutter")
    
    // clear markers
    editor.getAllMarks()
      .filter(ea => ea.isSyntaxError)
      .forEach(ea => ea.clear())
    
    try {
      var ast = parseToCheckSyntax(src)
      // we are trying to get the error, if it parses everything is fine
      return false;
    } catch(e) {   
      if (!e.loc) {
        console.warn("checkForSyntaxErrors failed, loc missing ", e)
        return false
      }
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
          css: "background-color: rgba(255,0,0,0.3)", 
          title: "" + e
        }); 
            
      return true
    }
  }
  
  
}