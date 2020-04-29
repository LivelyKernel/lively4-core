/* JavaScript Hint */

import {uniq} from "utils"

import * as utils from "utils"

var Pos = CodeMirror.Pos;

async function scriptHint(editor, keywords, getToken, options) {
  // Find the token at the cursor
  var cur = editor.getCursor(), token = getToken(editor, cur);

  // lively.notify('hint ' + cur.ch)
  var firstTokenInLine = getToken(editor, Pos(cur.line, 1)) 
  if (firstTokenInLine.string == "import") {
    return {list: await getCompletions(
      {start: 9, end: cur.ch, string: editor.getLine(cur.line), state: token.state, type: null}, 
      null, keywords, options),
          from: Pos(cur.line, 0),
          to: Pos(cur.line, cur.ch)};
  }
  
  if (/\b(?:string|comment)\b/.test(token.type)) return;
  token.state = CodeMirror.innerMode(editor.getMode(), token.state).state;

  // If it's not a 'word-style' token, ignore the token.
  if (!/^[\w$_]*$/.test(token.string)) {
    token = {start: cur.ch, end: cur.ch, string: "", state: token.state,
             type: token.string == "." ? "property" : null};
  } else if (token.end > cur.ch) {
    token.end = cur.ch;
    token.string = token.string.slice(0, cur.ch - token.start);
  }

  var tprop = token;
  // If it is a property, find out what it is a property of.
  while (tprop.type == "property") {
    tprop = getToken(editor, Pos(cur.line, tprop.start));
    if (tprop.string != ".") return;
    tprop = getToken(editor, Pos(cur.line, tprop.start));
    if (!context) var context = [];
    context.push(tprop);
  }
  return {list: await getCompletions(token, context, keywords, options),
          from: Pos(cur.line, token.start),
          to: Pos(cur.line, token.end)};
}

function javascriptHint(editor, options) {
  return scriptHint(editor, javascriptKeywords,
                    function (e, cur) {return e.getTokenAt(cur);},
                    options);
};
CodeMirror.registerHelper("hint", "javascript", javascriptHint);

function getCoffeeScriptToken(editor, cur) {
// This getToken, it is for coffeescript, imitates the behavior of
// getTokenAt method in javascript.js, that is, returning "property"
// type and treat "." as indepenent token.
  var token = editor.getTokenAt(cur);
  if (cur.ch == token.start + 1 && token.string.charAt(0) == '.') {
    token.end = token.start;
    token.string = '.';
    token.type = "property";
  }
  else if (/^\.[\w$_]*$/.test(token.string)) {
    token.type = "property";
    token.start++;
    token.string = token.string.replace(/\./, '');
  }
  return token;
}

function coffeescriptHint(editor, options) {
  return scriptHint(editor, coffeescriptKeywords, getCoffeeScriptToken, options);
}
CodeMirror.registerHelper("hint", "coffeescript", coffeescriptHint);

var stringProps = ("charAt charCodeAt indexOf lastIndexOf substring substr slice trim trimLeft trimRight " +
                   "toUpperCase toLowerCase split concat match replace search").split(" ");
var arrayProps = ("length concat join splice push pop shift unshift slice reverse sort indexOf " +
                  "lastIndexOf every some filter forEach map reduce reduceRight ").split(" ");
var funcProps = "prototype apply call bind".split(" ");
var javascriptKeywords = ("async await break case catch continue debugger default delete do else false finally for function " +
                "if in instanceof new null return switch throw true try typeof var void while with").split(" ");
var coffeescriptKeywords = ("and break catch class continue delete do else extends false finally for " +
                "if in instanceof isnt new no not null of off on or return switch then throw true try typeof until void while with yes").split(" ");

function forAllProps(obj, callback) {
  if (!Object.getOwnPropertyNames || !Object.getPrototypeOf) {
    for (var name in obj) callback(name)
  } else {
    for (var o = obj; o; o = Object.getPrototypeOf(o))
      Object.getOwnPropertyNames(o).forEach(callback)
  }
}

async function getCompletions(token, context, keywords, options) {
  var found = [], start = token.string, global = options && options.globalScope || window;
  
  // options.additionalContext = {
  //   that: that,
  //   "this": that
  // }
  
  keywords.push("import") //  #TODO move to right place  
  
  function maybeAdd(str) {
    if (str.lastIndexOf(start, 0) == 0 && !found.includes(str)) found.push(str);
  }
  
  function gatherCompletions(obj) {
    if (typeof obj == "string") stringProps.forEach(maybeAdd);
    else if (obj instanceof Array) arrayProps.forEach(maybeAdd);
    else if (obj instanceof Function) funcProps.forEach(maybeAdd);
    forAllProps(obj, maybeAdd)
  }

  function completeUtilsFunctions() {
    Object.keys(utils).filter(ea => ea.startsWith(token.string)).forEach(utilFuncName => {
      found.push({
        text: utilFuncName,
        displayText:"util." +utilFuncName,
        hint: (cm, self, data) => {
          var offset = 0
          cm.replaceRange(utilFuncName + "()",self.from, self.to)
          var lines = cm.getValue().split("\n");
          var imports = lines
            .filter(ea => ea.match(/^import .*from ['"]utils['"];?/))
          if (!imports.find(ea => ea.match(utilFuncName))) {
            var utils = imports.find(ea => ea.match(/import {.*} from 'utils';/))
            if (utils) {
              var funcs = utils.replace(/.*{ */,"").replace(/ *}.*/,"").split(/ *, */)
              funcs.push(utilFuncName)
              lines = lines.map(ea => ea == utils ?  
                  `import { ${funcs.sort().join(", ")} } from 'utils';` : ea);
              cm.setValue(lines.join("\n"))
            } else {
              var prefix = `import { ${utilFuncName} } from 'utils';\n` 
              cm.setValue(prefix+ cm.getValue())
              offset  += 1                  
            }
          }
          cm.setCursor({line: self.from.line + offset, ch: self.from.ch + utilFuncName.length + "(".length})
        }
      })
    });
  }
  
  if (context && context.length) {
    
    // If this is a property, see if it belongs to some object we can
    // find in the current environment.
    var obj = context.pop(), base;
    
    if (obj.type && obj.type.indexOf("variable") === 0) {
      if (options && options.additionalContext)
        base = options.additionalContext[obj.string];

      if (base === undefined && obj && obj.string) {
        // #TODO instead of doing a blackbox evaluation of a string, we could look into the various scopes... 
        // in the module or live prgoramming data structures... e.g. from AST with trace data such as #ContinuousEditor
        // documentation: getDoitContext() and getTargetModule()
        var result =  (await options.codemirror.boundEval(obj.string))
        base = result.value
      }
      
      if (!options || options.useGlobalScope !== false)
        base = base || global[obj.string];
    } else if (obj.type == "string") {
      base = "";
    } else if (obj.type == "atom") {
      base = 1;
    } else if (obj.type == "function") {
      
      // #TODO make it work for funciton calls such as pt(10,10), too.... 
      
      if (global.jQuery != null && (obj.string == '$' || obj.string == 'jQuery') &&
          (typeof global.jQuery == 'function'))
        base = global.jQuery();
      else if (global._ != null && (obj.string == '_') && (typeof global._ == 'function'))
        base = global._();
    }
    while (base != null && context.length)
      base = base[context.pop().string];
    if (base != null) gatherCompletions(base);
  } else {       
    if (token.string && (token.string == "import" || token.string.startsWith("import "))) {
      // #TODO make faster with index and caching
      // but: #TODO what is the workflox / programming XP, we aim for?
      var text = await searchImports()
      var imports = text.split("\n")
        .map(ea => ea.replace(/.*:/,"").replace(/;$/,"").replace(/"/g,"'"))
          .filter(ea => !ea.match('\'\.\.?/'))
        .filter(ea => ea.startsWith("import ")).sort()::uniq();
      imports.forEach(maybeAdd)
    } else {
      let editor = options.codemirror.editor,
        cur = editor.getCursor(),
        prevToken = editor.getTokenAt({line: cur.line, ch: token.start - 0  }),
        prevPrevToken = editor.getTokenAt({line: cur.line, ch: token.start - 1});
      if ( prevToken.string == ":" && prevPrevToken.string == ":") {
        completeUtilsFunctions()
      } else {
        // If not, just look in the global object and any local scope
        // (reading into JS mode internals to get at the local and global variables)
        for (var v = token.state.localVars; v; v = v.next) maybeAdd(v.name);
        for (var v = token.state.globalVars; v; v = v.next) maybeAdd(v.name);
        if (!options || options.useGlobalScope !== false)
          gatherCompletions(global);
        keywords.forEach(maybeAdd);              
      }
    }
    
  }
  return found;
}



var importsCache
var importsCacheTime

async function searchImports() {

  if (!importsCache || (Date.now() - importsCacheTime) > 5 * 60 * 1000 ) {
    importsCacheTime = Date.now()
    importsCache = await fetch(lively4url + "/../_search/files",  {
        headers: { 
         "searchpattern": "import",
         "rootdirs": lively4url.replace(/.*\//,""),
         "excludes": "node_modules,src/external,vendor/,lodash-bound.js",
      }}).then(r => r.text())   
  }
  return importsCache
}

// lively.bench(() => searchImports())

