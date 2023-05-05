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

export function parseModuleSemanticsFromSource(filename, source) {
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

      for (let ea of path.node.body) {
        let metaInfos = ['Keywords', 'Authors']
        if (ea.leadingComments) {
          for(let comment of ea.leadingComments) {
            let info = {
                start: comment.start,
                end: comment.end,
              }
            
            if (comment.value) {
              let lines = comment.value.split("\n")
              info.firstline = lines[0] 
              
              for(let line of lines) {
                let m = line.match(/([A-Za-z][A-Za-z0-9]*): (.*)/)
                if (m) {
                  let key = m[1]
                  let value = m[2]
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
      if (path.node.id) {
        let funcNode = path.node
        let func = {
            name: funcNode.id.name,
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
  // The bug was caused by stupid client code... (adding to data structure while iterating it) but it should not break the tools
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