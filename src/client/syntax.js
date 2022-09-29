import babelDefault from 'systemjs-babel-build';
const babel = babelDefault.babel;

import jsx from 'babel-plugin-syntax-jsx';
import doExpressions from 'babel-plugin-syntax-do-expressions';
import bind from 'babel-plugin-syntax-function-bind';
import asyncGenerators from 'babel-plugin-syntax-async-generators';
import classProperties from 'babel-plugin-syntax-class-properties';
import objectRestSpread from 'babel-plugin-syntax-object-rest-spread';

const SYNTAX_PLUGINS = [
  jsx,
  doExpressions,
  bind,
  asyncGenerators,
  classProperties,
  objectRestSpread
];

export default class SyntaxChecker {
  
  static async checkForSyntaxErrors(editor) {
   
    var src = editor.getValue();
    
    editor.clearGutter("leftgutter")
    
    // clear markers
    editor.getAllMarks()
      .filter(ea => ea.isSyntaxError)
      .forEach(ea => ea.clear())
    
    const syntaxPlugins = (await Promise.all([
      'babel-plugin-syntax-jsx',
      'babel-plugin-syntax-async-generators',
      'babel-plugin-syntax-do-expressions',
      'babel-plugin-syntax-function-bind',
      'babel-plugin-syntax-class-properties',
      'babel-plugin-syntax-object-rest-spread'
    ]
      .map(syntaxPlugin => System.import(syntaxPlugin))))
      .map(m => m.default);
    try {
        var result = babel.transform(src, {
          babelrc: false,
          plugins: SYNTAX_PLUGINS,
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