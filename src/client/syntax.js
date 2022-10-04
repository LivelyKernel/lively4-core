import babelPluginJsxLively from "src/client/reactive/reactive-jsx/babel-plugin-jsx-lively-babel7.js"
import "src/external/babel/babel7.js"

var babel7 =  window.lively4babel
var babel =  babel7.babel


/*MD 

## Duplication Warning #Babel7

- <edit://src/client/syntax.js>
- <edit://src/external/babel/plugin-babel7.js>
- <edit://src/external/eslint/eslint-parser.js>

MD*/
 


let plugins = [
  babel7.babelPluginProposalExportDefaultFrom,
  babel7.babelPluginProposalExportNamespaceFrom,
  babel7.babelPluginSyntaxClassProperties,
  // babel7.babelPluginSyntaxFunctionBind,
  babel7.babelPluginNumericSeparator,
  babel7.babelPluginProposalDynamicImport,
  babel7.babelPluginProposalFunctionBind,
  babel7.babelPluginTransformModulesSystemJS,
  babelPluginJsxLively
];

let stage3Syntax = [
  'asyncGenerators', 
  'classProperties', 
  'classPrivateProperties', 
  'classPrivateMethods',
  'dynamicImport',
  'importMeta',
  'nullishCoalescingOperator',
  'numericSeparator',
  'optionalCatchBinding',
  'optionalChaining',
  'objectRestSpread', 
  'topLevelAwait'];

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
          filename: undefined,
          sourceMaps: false,
          ast: false,
          compact: false,
          sourceType: 'module',
          parserOpts: {
            plugins: stage3Syntax,
            errorRecovery: true
          },
          plugins: plugins
          
          // babelrc: false,
          // plugins: plugins,
          // presets: [],
          // filename: undefined,
          // sourceFileName: undefined,
          // moduleIds: false,
          // sourceMaps: false,
          // compact: false,
          // comments: true,
          // code: true,
          // ast: true,
          // resolveModuleSource: undefined
        })
        var ast = result.ast;
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