"disable examples"
"enable deepeval"

/*MD # JavaScript Parsing / Semantics

(used in fileindex etc)

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
  babel.traverse(ast,{
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
  return {classes, functions, dependencies, functionExports, classExports, unboundIdentifiers}
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
