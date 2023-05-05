"enable examples"
"enable deepeval"

/*MD # JavaScript Parsing / Semantics

(used in fileindex etc)

MD*/

/*MD 

# Meta Nodes #Babylonian #Programming

- Issue: focus lost while using text elements in widgets ....
- saving, both losing changes when closing... and no feedback
  - even if not saving... we need some kind of auto backup for recovery.... maybe in local storage
- feedback while execution
- typing stuttering while example execution
  - Solution: remote/external non-blocking execution.... tools need to work on remote objects (LSP anybody?)
  - Benefit: might bring Babylonian to other languages + heavy loads... e.g. number crunching examples
- probes text annotations can extent while writing (probe on m[1]) breaks probe...
- external tools / UX of "Customs instance Editor" bad...
- shortcut support for probes and example creation? because... my hands are on the keyboard... UX baseline: like select + Ctrl+P
- multiline text editing in code mirror text widgets (e.g. examples..)
- long running examples may kill the system

MD*/

import {parseForAST, loadPlugins} from "src/plugin-babel.js"

import babelDefault from 'src/external/babel/babel7default.js'
const babel = babelDefault.babel;
const t = babel.types;

export function parseSource(filename, source) {
  try {
    return  parseForAST(source).ast
  } catch(e) {
    console.log('FileIndex, could not parse: ' + filename, e)
    return null
  }
}

export function /*example:*//*example:*//*example:*//*example:*/parseModuleSemanticsFromSource/*{"id":"3f52_7520_1a2b","name":{"mode":"input","value":"functions"},"color":"hsl(320, 30%, 70%)","values":{"filename":{"mode":"input","value":"'f2'"},"source":{"mode":"select","value":"a009_c6f3_e94e"}},"instanceId":{"mode":"input","value":""},"prescript":"","postscript":""}*//*{"id":"8551_7ffb_c8bc","name":{"mode":"input","value":"anonymous functions"},"color":"hsl(280, 30%, 70%)","values":{"filename":{"mode":"input","value":"'f3'"},"source":{"mode":"input","value":"'() => x * 2'"}},"instanceId":{"mode":"input","value":""},"prescript":"","postscript":""}*//*{"id":"75b2_551a_a5ac","name":{"mode":"input","value":"tests"},"color":"hsl(90, 30%, 70%)","values":{"filename":{"mode":"input","value":"\"test\""},"source":{"mode":"input","value":"`describe('hello', () => { it(\"bla\",() => {})})`"}},"instanceId":{"mode":"input","value":""},"prescript":"","postscript":""}*//*{"id":"b28c_fcf0_9921","name":{"mode":"input","value":"metainfo"},"color":"hsl(20, 30%, 70%)","values":{"filename":{"mode":"input","value":"\"metainfo\""},"source":{"mode":"select","value":"bf7e_1c8f_26da"}},"instanceId":{"mode":"input","value":""},"prescript":"","postscript":""}*/(filename, source) {
  var ast = parseSource(filename, source)
  if (ast) {
    return parseModuleSemantics(ast)
  }
}

export function parseModuleSemantics(ast) {
  

  let classes = []
  let functions = []
  let dependencies = []
  let importDeclarations = new Map()
  let functionExports = []
  let classExports = []
  let unboundIdentifiers = []
  let comments = []
  
  babel.traverse(ast,{
    Program(path) {
      return // #TODO after started working here... everything seems to break
      
      for (let ea of path.node.body) {
        var comments = ea.leadingComments
        if (comments) {
          for(let comment of comments) {
            var info = {
                start: comment.start,
                end: comment.end,
              }
            
            if (comment.value) {
              var lines = comment.value.split("\n")
              info.firstline = lines[0] 
              for(let line of lines) {
                var m = line.match(/([A-Za-z][A-Za-z0-9]*): (.*)/)
                if (m) {
                  var key = /*probe:*/m[1]/*{}*/
                  var value = /*probe:*/m[2]/*{}*/
                  var metaInfos = ['Keywords', 'Authors']
                  if (metaInfos.includes(key)) {
                    info[key] = value.split(/ +/)
                  } 
                }
              }              
            }
            comments.push(info)
          }
        }
  
      }
      
    },
    ImportDeclaration(path) {
      if (path.node.source && path.node.source.value) {
        let specifierNames = []
        let moduleUrl = path.node.source.value
        if (path.node.specifiers) { 
          path.node.specifiers.forEach(function(item) {
            if (item.type === "ImportNamespaceSpecifier") {
              specifierNames.push('*')
              importDeclarations.set('*', moduleUrl)
            } else {
              specifierNames.push(item.local.name)
              importDeclarations.set(item.local.name, moduleUrl)
            }
          })
        }
        let dependency = {
          url: path.node.source.value,
          names: specifierNames
        }
         dependencies.push(dependency)
      }
    },
    FunctionDeclaration(path) {
      if (/*probe:*/path/*{}*/.node.id) {
        let funcNode = path.node
        let func = {
            name: /*probe:*/funcNode.id.name/*{}*/,
            start: funcNode.start, // start byte 
            end: funcNode.end,     // end byte
            loc: funcNode.loc.end.line - funcNode.loc.start.line + 1,
            kind: funcNode.kind,
            static: funcNode.static,
            leadingComments: funcNode.leadingComments
         }
         functions.push(func)
      }
    },
    ClassDeclaration(path) {
      let superClassName = ''
      let superClassUrl = ''
      if (path.node.id) {
        let clazz = {
          name: path.node.id.name,
          start: path.node.start, // start byte 
          end: path.node.end,     // end byte
          loc: path.node.loc.end.line - path.node.loc.start.line + 1
        }
        superClassName = (path.node.superClass) ? path.node.superClass.name : ''
        superClassUrl = importDeclarations.get(superClassName)
        let methods = []

        if (path.node.body.body) {
          path.node.body.body.forEach(function(item) {
            if(item.type === "ClassMethod") {
              let method = {
                name: item.key.name,
                loc: item.loc.end.line - item.loc.start.line + 1,
                start: item.start,
                kind: item.kind,
                static: item.static,
                end: item.end,
                leadingComments: item.leadingComments
              }
              methods.push(method)
            }              
          })
        }
        clazz.methods = methods
        clazz.superClassName = superClassName
        clazz.superClassUrl = superClassUrl
        classes.push(clazz)
      } 
    },
    ExportNamedDeclaration(path) {
      if(t.isFunctionDeclaration(path.node.declaration)) {
        functionExports.push(path.node.declaration.id.name)
      }
      if(t.isClassDeclaration(path.node.declaration)) {
        classExports.push(path.node.declaration.id.name)
      }
    },
    Identifier(path) {
      if (!(hasASTBinding(path))) {
        unboundIdentifiers.push(path.node.name);
      }
    }
  })
  // #TODO #BabylonianProgramming #Warning... adding a probe here breaks babylonian programming... because of to much data? 
  // #Research besides time, there are cutoffs needed for to heavy tracing loads.... and one time tasks that are to heavy like serializing the whole world, or going in a cycle? 
  return {classes, functions, dependencies, functionExports, classExports, unboundIdentifiers, comments}
}

function getBindingDeclarationIdentifierPath(binding) {
  return getFirstSelectedIdentifierWithName(binding.path, binding.identifier.name);
}

function getFirstSelectedIdentifierWithName(startPath, name) {
  
  if (t.isIdentifier(startPath.node, { name: name })) {
    return startPath;
  }
  var first;
  startPath.traverse({
    Identifier(path) {
      if (!first && t.isIdentifier(path.node, { name: name })) {
        first = path;
        path.stop();
      }
    }
  });
  return first;
}

function hasASTBinding(identifier) {
  if (!identifier.scope.hasBinding(identifier.node.name)) return false;

  const binding = identifier.scope.getBinding(identifier.node.name);
  if (!binding) return false;

  const identifierPaths = [...new Set([getBindingDeclarationIdentifierPath(binding), ...binding.referencePaths, ...binding.constantViolations.map(cv => getFirstSelectedIdentifierWithName(cv, binding.identifier.name))])];
  return identifierPaths.includes(identifier);
}
/* Context: {"context":{"prescript":"","postscript":""},"customInstances":[{"id":"a009_c6f3_e94e","name":"f1","code":"return `function f(x) { return x * 2}`;"},{"id":"bf7e_1c8f_26da","name":"metainfo","code":"return `/\\*\\nComponentBin: #Tool #Debugging #bar\\n\\*\\/ class Foo {}`;"}]} */