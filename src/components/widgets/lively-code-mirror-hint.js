import { uniq } from "utils";

var stringProps = Object.getOwnPropertyNames(''.__proto__);
var arrayProps = Object.getOwnPropertyNames([].__proto__);
var funcProps = Object.getOwnPropertyNames(function () {}.__proto__);
import { javaScriptKeywords, cssProperties, domEvents } from 'src/client/constants.js';

import * as utils from "utils";
import { indentSelections } from "./code-mirror-utils.js";

var Pos = CodeMirror.Pos;

function lcmFromCM(cm) {
  return lively.allParents(cm.getWrapperElement(), undefined, true).find(e => e.tagName === 'LIVELY-CODE-MIRROR');
}

/*MD # Import MD*/
var importsCache;
var importsCacheTime;
async function searchImports() {
  if (!importsCache || Date.now() - importsCacheTime > 60 * 60 * 1000) {
    importsCacheTime = Date.now();
    importsCache = await fetch(lively4url + "/../_search/files", {
      headers: {
        searchpattern: "^import",
        rootdirs: lively4url.replace(/.*\//, ""),
        excludes: "node_modules,src/external,vendor/,lodash-bound.js"
      } }).then(r => r.text());
  }
  return importsCache;
}
searchImports();

/*MD # Completions MD*/
class Completions {

  constructor(cm) {
    this.cm = cm;
    this.list = [];
    this.seenCompletions = new Set();
    this.prepareToken();
  }

  prepareToken() {
    const cm = this.cm;

    // Find the token at the cursor
    var cursor = cm.getCursor();
    var token = cm.getTokenAt(cursor);

    token.state = CodeMirror.innerMode(cm.getMode(), token.state).state;

    // lively.notify(token.string, token.type);
    if (token.type === 'string') {
      token = {
        start: token.start + 1,
        end: cursor.ch,
        string: token.string.substring(1, cursor.ch - token.start),
        state: token.state,
        type: 'string'
      };
    } else if (!/^[\w$_]*$/.test(token.string)) {
      // If it's not a 'word-style' token, ignore the token.
      token = {
        start: cursor.ch,
        end: cursor.ch,
        string: "",
        state: token.state,
        type: token.string == "." ? "property" : null
      };
    } else if (token.end > cursor.ch) {
      token.end = cursor.ch;
      token.string = token.string.slice(0, cursor.ch - token.start);
    }

    this.token = token;
  }

  maybeAdd(completion) {
    const simple = typeof completion === 'string';
    const text = simple ? completion : completion.text;

    if (this.seenCompletions.has(text)) {
      return;
    }

    // #TODO: getTextAt(from, to) or string iff no from/to in completion
    if (!text.startsWith(this.token.string)) {
      return;
    }

    this.seenCompletions.add(text);
    this.list.push(completion);
  }

  asCompletionsObject() {
    if (this.list.length === 0) {
      return;
    }

    const line = this.cm.getCursor().line;
    const completionsObject = {
      list: this.list,
      from: Pos(line, this.token.start),
      to: Pos(line, this.token.end)
    };

    CodeMirror.on(completionsObject, "shown", () => {
      // lively.warn("shown");
    });
    CodeMirror.on(completionsObject, "select", (completion, element) => {
      if (!element.parentElement.querySelector('li.shortcut-present')) {
        element.classList.add('shortcut-present');
        const hints = element.parentElement.querySelectorAll('li.CodeMirror-hint');
        hints.forEach((hint, i) => {
          if (i > 9) {
            return;
          }
          hint.prepend(<span style="position: absolute; transform: translate(-6px, 0); font-size: xx-small; color: darkgray; background: white;">{i}</span>);
        });
      }
    });
    CodeMirror.on(completionsObject, "pick", completion => {
      // lively.warn("pick");
    });
    CodeMirror.on(completionsObject, "close", () => {
      // lively.warn("close");
    });

    return completionsObject;
  }
}
import ColorHash from 'src/external/color-hash.js';
const colorHash = new ColorHash({ saturation: 0.8, lightness: 0.8 });

function colorForString(str) {
  return colorHash.hex(str);
}

function forOrigin(completion, origin) {
  if (typeof completion === 'string') {
    completion = {
      text: completion
    };
  }

  return Object.assign({
    render(element, self, data) {
      if (completion.innerRender) {
        completion.innerRender(element, self, data);
      } else {
        element.append(<span>{completion.displayText || completion.text}</span>);
      }
      element.append(<span style="display: inline-block; width: 50px;"></span>);
      element.append(<span style={`background: ${colorForString(origin)}; color: black; position: absolute; right: 2px; font-size: x-small;`}>{origin}</span>);
    }
  }, completion);
}

/*MD # CompletionsBuilder MD*/
class CompletionsBuilder {

  constructor(cm) {
    this.cm = cm;
    this.completions = new Completions(cm);
  }

  maybeAdd(str) {
    this.completions.maybeAdd(str);
  }

  async buildHint(options) {
    await this.collectCompletions(options);

    // lively.notify(this.completions.list.length, 'num completions');
    return this.completions.asCompletionsObject();
  }

  async collectCompletions(options) {
    const cm = this.cm;
    const completions = this.completions;

    var cursor = cm.getCursor();

    const line = cm.getLine(cursor.line);
    if (line.startsWith("import")) {
      await this.completeFromImport(cm);
      return;
    }

    var token = completions.token;
    // lively.notify('type: ' + token.type, 'string: ' + token.string);

    if (token.type === 'string') {
      cssProperties.map(property => forOrigin(property, 'cssProperties')).forEach(::this.maybeAdd);
      domEvents.map(property => forOrigin(property, 'domEvents')).forEach(::this.maybeAdd);
      return;
    }

    if (token.type === 'comment') {
      return;
    }

    this.completeLively();
    this.completeDoItCommand();

    await this.completeFromTern();

    if (token.type === 'property') {
      const variables = [];
      const startExpr = {};

      let lineNumber = cursor.line;
      let firstLine = true;
      whileLoop: while (lineNumber >= 0) {
        let tokens;
        tokens = cm.getLineTokens(lineNumber, true);
        if (firstLine) {
          firstLine = false;
          tokens = tokens.filter(t => t.start < token.start);
        }
        tokens = tokens.reverse();

        let parensBalance = 0;

        for (let { string, type, start } of tokens) {
          // console.log( string, type, start )
          if (type === null && string === '(') {
            parensBalance--;
          } else if (type === null && string === ')') {
            parensBalance++;
          } else if (typeof type === 'string' && type.includes('variable')) {
            variables.push(string);
            if (parensBalance <= 0) {
              startExpr.ch = start;
              startExpr.line = lineNumber;
              break whileLoop;
            }
          }
        }
        lineNumber--;
      }

      let code;
      // lively.notify(variables, 'variables')
      try {
        code = cm.getRange(startExpr, { line: cursor.line, ch: token.start - 1 });
      } catch (e) {
        console.warn("Error in code-mirror-hint, could not comlete, because: ", e);
        return;
      }

      const decls = [];

      // lively.getGlobalBounds(document.body)
      //   .topLeft().subPt(pt(-10, 0)).x.rFOOOOOO

      const uniqueVariables = new Set(variables);

      decls.push(`var decls = await System.import('src/components/widgets/lively-code-mirror-hint-decls.js');`);
      const codeMirrorDecls = 'cm, lcm';
      if (['cm', 'lcm'].some(vari => uniqueVariables.has(vari))) {
        decls.push(`var { cm, lcm } = await decls.codeMirror();`);
      }
      const babelDecls = 'babel, t, template, path, parentPath, node, parentNode, identifier, scope, binding';
      if (babelDecls.split(', ').some(vari => uniqueVariables.has(vari))) {
        decls.push(`var { ${babelDecls} } = await decls.babel();`);
      }
      const finalCode = `(async () => {
try {
${decls.join(`;
`)}
return ${code}
} catch(e) {}
})()`;

      var { value, isError } = await options.codemirror.boundEval(finalCode);
      if (isError) {
        lively.warn(value);
      } else {
        value = await value;
        this.gatherCompletionsForObject(value, 'x');
      }
    }

    var tprop = token;
    const getToken = ::cm.getTokenAt;
    // If it is a property, find out what it is a property of.
    while (tprop.type == "property") {
      tprop = getToken(Pos(cursor.line, tprop.start));
      if (tprop.string != ".") {
        break;
      }
      tprop = getToken(Pos(cursor.line, tprop.start));
      if (!context) {
        var context = [];
      }
      context.push(tprop);
    }

    if (context && context.length === 1 && context[0].string === 'this') {
      this.completeMembersOfThis();
    }

    var global = options && options.globalScope || window;

    if (context && context.length) {
      // If this is a property, see if it belongs to some object we can
      // find in the current environment.
      var obj = context.pop(),
          base;

      if (obj.type && obj.type.indexOf("variable") === 0 || obj.string == "this") {
        if (options && options.additionalContext) base = options.additionalContext[obj.string];

        if (base === undefined && obj && obj.string) {
          // #TODO instead of doing a blackbox evaluation of a string, we could look into the various scopes... 
          // in the module or live prgoramming data structures... e.g. from AST with trace data such as #ContinuousEditor
          // documentation: getDoitContext() and getTargetModule()
          var { value, isError } = await options.codemirror.boundEval(obj.string);
          if (!isError) {
            base = value;
          }
        }
        if (!options || options.useGlobalScope !== false) {
          base = base || global[obj.string];
        }
      } else if (obj.type == "string") {
        base = "";
      } else if (obj.type == "atom") {
        base = 1;
      } else if (obj.type == "function") {

        // #TODO make it work for function calls such as pt(10,10), too.... 
        if (global.jQuery != null && (obj.string == '$' || obj.string == 'jQuery') && typeof global.jQuery == 'function') {
          base = global.jQuery();
        } else if (global._ != null && obj.string == '_' && typeof global._ == 'function') {
          base = global._();
        };
      }
      while (base != null && context.length) base = base[context.pop().string];
      if (base != null) this.gatherCompletionsForObject(base);
      return;
    }

    const c = cm.getCursor();
    const prevToken = cm.getTokenAt({ line: c.line, ch: token.start - 0 });
    const prevPrevToken = cm.getTokenAt({ line: c.line, ch: token.start - 1 });
    if (prevToken.string == ":" && prevPrevToken.string == ":") {
      this.completeUtilsFunctions(token);
      return;
    }

    // If not, just look in the global object and any local scope
    // (reading into JS mode internals to get at the local and global variables)

    for (var v = token.state.localVars; v; v = v.next) {
      this.maybeAdd(forOrigin(v.name, 'local'));
    }
    for (var w = token.state.globalVars; w; w = w.next) {
      this.maybeAdd(forOrigin(w.name, 'global'));
    }
    if (!options || options.useGlobalScope !== false) {
      this.gatherCompletionsForObject(global);
    }

    javaScriptKeywords.map(keyword => forOrigin(keyword + ' ', 'keyword')).forEach(::this.maybeAdd);
  }

  /*MD ## Completions for an Object MD*/
  gatherCompletionsForObject(obj, hintPrefix = '') {
    this.allProps(obj, hintPrefix);

    if (typeof obj == "string") {
      this.forPropList(stringProps, hintPrefix + 'str');
    } else if (obj instanceof Array) {
      this.forPropList(arrayProps, hintPrefix + 'arr');
    } else if (obj instanceof Function) {
      this.forPropList(funcProps, hintPrefix + 'fun');
    }
  }

  forPropList(propList, origin) {
    propList.map(name => forOrigin(name, origin)).forEach(::this.maybeAdd);
  }

  allProps(obj, hintPrefix) {
    for (var o = obj; o; o = Object.getPrototypeOf(o)) {
      Object.getOwnPropertyNames(o).forEach(prop => this.addObjectProp(o, prop, hintPrefix));
    }
  }

  addObjectProp(obj, prop, hintPrefix) {
    let completion = prop;
    const descriptor = Object.getOwnPropertyDescriptor(obj, prop);
    let value = descriptor.value;

    if (value) {
      if (typeof value === 'function') {
        let str = value.toString().split('\n').first.substring(0, 50);
        completion = {
          text: prop,
          innerRender(element, self, data) {
            element.append(<span>{prop} <span style="color: rgba(200, 200, 200, 0.9)">{str}</span></span>);
          },
          hint: (cm, self, data) => {
            const args = this.parseArgsFrom(`const fn = ${value}`, 'FunctionExpression') || this.parseArgsFrom(`class C {${value}}`, 'ClassMethod') || [];

            this.completeFunction(cm, self, data, prop, args);
            CodeMirror.commands.indentAuto(cm);
          }
        };
        this.maybeAdd(forOrigin(completion, hintPrefix + 'prop'));
        return;
      } else if (value.toString) {
        value = value.toString().substring(0, 50);
      }
      lively.n;
      completion = {
        text: prop,
        innerRender(element, self, data) {
          element.append(<span>{prop} <span style="color: rgba(200, 200, 200, 0.9)">{value}</span></span>);
        }
      };
    } else {}

    this.maybeAdd(forOrigin(completion, hintPrefix + 'prop'));
  }

  parseArgsFrom(code, nodeType) {
    const args = [];
    try {
      code.traverseAsAST({
        [nodeType](path) {
          const params = path.get('params');
          params.forEach(param => {
            if (param.isIdentifier()) {
              args.push(param.node.name);
            } else {
              // RestElement, Patterns
              let arg = '';
              param.traverse({
                Identifier(path) {
                  arg += path.node.name;
                }
              });
              args.push(arg);
            }
          });
        }
      });
      return args;
    } catch (e) {}
  }

  /*MD ## Specific Completions MD*/
  completeMembersOfThis() {
    let currentClass;
    this.cm.eachLine(lineHandle => {
      const classMatch = lineHandle.text.match(/^(?:\s|export\s|default\s)*class\s+([_$a-zA-z][_$a-zA-Z0-9]*).*\{$/);
      if (classMatch) {
        currentClass = classMatch[1];
        // lively.notify(Object.getOwnPropertyNames(lineHandle));
        return;
      }

      const firstLine = lineHandle.text;
      const match = firstLine.match(/^\s*((?:async\s|get\s|set\s|static\s)*)([_$a-zA-z][_$a-zA-Z0-9]*)(\*?\s*\(.*\)\s*\{)$/);
      if (match) {
        const [, modifiers, name, argsAndBodyStart] = match;
        if (javaScriptKeywords.includes(name) || name === 'constructor') {
          return;
        }

        const myClass = currentClass;
        const completion = {
          text: name,
          innerRender(element, self, data) {
            function grayish(content) {
              const style = "color: rgba(200, 200, 200, 0.9); display:inline-block; max-width: 50ch;";
              return <span style={style}>{content}</span>;
            }
            element.append(<span>{grayish(modifiers + (myClass ? myClass + '::' : ''))}{name}{grayish(argsAndBodyStart)}</span>);
          },
          hint: (cm, self, data) => {
            if (modifiers.includes('get') || modifiers.includes('set')) {
              cm.replaceRange(data.text, self.from, self.to);
            } else {
              const args = this.parseArgsFrom(`class C {${firstLine}}}`, 'ClassMethod') || [];
              this.completeFunction(cm, self, data, name, args);
            }
            CodeMirror.commands.indentAuto(cm);
          }
        };
        // lively.notify(name);
        this.maybeAdd(forOrigin(completion, 'member'));
      }
    });
  }

  async completeFromImport(cm) {
    const getCompletionsFromImports = async () => {
      // #TODO make faster with index and caching
      // but: #TODO what is the workflox / programming XP, we aim for?
      var text = await searchImports();
      var imports = text.split("\n").map(ea => ea.replace(/.*:/, "").replace(/;$/, "").replace(/"/g, "'")).filter(ea => !ea.match('\'\.\.?/')).filter(ea => ea.startsWith("import ")).sort()::uniq();
      imports.map(i => forOrigin(i, 'import')).forEach(::this.maybeAdd);
    };

    const getToken = ::cm.getTokenAt;

    // Find the token at the cursor
    var cursor = cm.getCursor();
    var token = getToken(cursor);

    // use a "line" token
    this.completions.token = {
      start: 0,
      end: cursor.ch,
      string: cm.getLine(cursor.line),
      state: token.state,
      type: null
    };

    await getCompletionsFromImports();
  }

  completeUtilsFunctions(token) {
    Object.keys(utils).filter(ea => ea.startsWith(token.string)).forEach(utilFuncName => {
      const completion = {
        text: utilFuncName,
        displayText: "util." + utilFuncName,
        hint: (cm, self, data) => {
          var offset = 0;
          cm.replaceRange(utilFuncName + "()", self.from, self.to);
          var lines = cm.getValue().split("\n");
          var imports = lines.filter(ea => ea.match(/^import .*from ['"]utils['"];?/));
          if (!imports.find(ea => ea.match(utilFuncName))) {
            var utils = imports.find(ea => ea.match(/import {.*} from 'utils';/));
            if (utils) {
              var funcs = utils.replace(/.*{ */, "").replace(/ *}.*/, "").split(/ *, */);
              funcs.push(utilFuncName);
              lines = lines.map(ea => ea == utils ? `import { ${funcs.sort().join(", ")} } from 'utils';` : ea);
              cm.setValue(lines.join("\n"));
            } else {
              var prefix = `import { ${utilFuncName} } from 'utils';\n`;
              cm.setValue(prefix + cm.getValue());
              offset += 1;
            }
          }
          cm.setCursor({ line: self.from.line + offset, ch: self.from.ch + utilFuncName.length + "(".length });
        }
      };

      this.completions.maybeAdd(forOrigin(completion, 'utils'));
    });
  }

  completeLively() {
    if (['variable', null].includes(this.completions.token.type)) {
      this.maybeAdd({
        text: 'lively.',
        hint: (cm, self, data) => {
          cm.replaceRange("lively.", self.from, self.to);
          CodeMirror.commands.indentAuto(cm);
          CodeMirror.commands.autocomplete(cm);
        }
      });
    }
  }

  completeDoItCommand() {
    const token = this.completions.token;
    const str = token.string;
    const cm = this.cm;
    var cursor = cm.getCursor();

    if (str.length >= 1 && 'DoItCommand'.startsWith(str)) {
      var tprop = token;
      const getToken = ::cm.getTokenAt;
      if (token.type == "variable") {
        const { type, string, start } = getToken(Pos(cursor.line, tprop.start));
        if (type === null && string === ' ') {
          const { type, string } = getToken(Pos(cursor.line, start));
          if (type === 'keyword' && string === 'new') {

            this.maybeAdd({
              text: 'DoItCommand(args)',
              hint: async (cm, self, data) => {
                cm.setSelection(self.from, self.to);
                cm.replaceSelection(`DoItCommand({
  do: () => {
    
  },
  undo: () => {
    
  },
  redo: () => {
    
  }
})`, 'around');
                cm::indentSelections();
                const startLine = cm.getCursor('start').line;
                cm.setCursor(startLine + 2, Infinity);
                CodeMirror.commands.autocomplete(cm);
              }
            });
          }
        }
      }
    }
  }

  /*MD ## Tern Integration MD*/
  async completeFromTern() {
    const lcm = lcmFromCM(this.cm);
    const tw = await lcm.ternWrapper;
    const fileName = lcm.getTargetModule();
    const data = await tw.request({
      query: {
        type: "completions",
        types: true,
        file: fileName,
        end: this.cm.getCursor(),
        depths: true,
        docs: true,
        urls: true,
        origins: true,
        filter: false,
        caseInsensitive: false,
        guess: false,
        sort: false,
        expandWordForward: true,
        omitObjectPrototype: true,
        includeKeywords: false,
        inLiteral: true,
        start: undefined, // #TODO: improve by checking for selections first
        lineCharPositions: true
      },
      files: [{
        type: 'full',
        name: fileName,
        text: lcm.value
      }]
    });

    data.completions.map(({ name, type }) => forOrigin(type && type !== '?' ? {
      text: name,
      innerRender(element, self, data) {
        element.append(<span>{name} <span style="color: rgba(200, 200, 200, 0.9); display:inline-block; max-width: 50ch;">{type}</span></span>);
      },
      hint: (cm, self, data) => {
        if (type.startsWith('fn(') && !/^[A-Z]/.test(name)) {
          const parseArgsFromTernType = str => {

            const findMatchingParen = (str, start) => {
              str = str.substring(start);

              const matches = [...str.matchAll(/[()]/g)].map(match => ({ char: match[0], index: match.index }));

              let openParens = 1;

              for (let match of matches) {
                const { char, index } = match;

                if (char === '(') {
                  openParens++;
                } else if (char === ')') {
                  openParens--;
                  if (openParens === 0) {
                    return index + start;
                  }
                } else {
                  lively.error(`parseFnFromTern: match ${char} at position ${index} should never happen`);
                }
              }

              return -1;
            };

            const start = str.indexOf('(') + 1;
            const end = findMatchingParen(str, start);
            const argsString = str.substring(start, end);
            return argsString.split(', ').map(argWithType => argWithType.replace(/:.*/gm, '').replace(/\?/gm, ''));
          };

          this.completeFunction(cm, self, data, data.text, parseArgsFromTernType(type));
        } else {
          cm.replaceRange(data.text, self.from, self.to);
        }
        CodeMirror.commands.indentAuto(cm);
      }

    } : name, 'tern')).forEach(::this.maybeAdd);
  }

  /*MD ## Performing Completions MD*/
  completeFunction(cm, self, data, funcName, args = []) {
    cm.replaceRange(funcName + '(', self.from, self.to);
    cm.replaceSelection(')', 'start');

    const [firstArg, ...rest] = args;
    if (rest.length > 0) {
      cm.replaceSelection(', ' + rest.join(', '), 'start');
    }
    if (firstArg) {
      cm.replaceSelection(firstArg, 'around');
    }
  }

}

function javascriptHint(cm, options) {
  return new CompletionsBuilder(cm).buildHint(options);
}

CodeMirror.registerHelper("hint", "javascript", javascriptHint);