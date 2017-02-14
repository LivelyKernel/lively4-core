

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
  
  
}