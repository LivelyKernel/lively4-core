"enable examples"
"disable deepeval"

import babelDefault from 'systemjs-babel-build';
const babel = babelDefault.babel;
const t = babel.types;

import babelPluginSyntaxJSX from 'babel-plugin-syntax-jsx'
import babelPluginSyntaxDoExpressions from  'babel-plugin-syntax-do-expressions'
import babelPluginSyntaxFunctionBind from 'babel-plugin-syntax-function-bind'
import babelPluginSyntaxGenerators from 'babel-plugin-syntax-async-generators'
import classProperties from 'babel-plugin-syntax-class-properties';
import objectRestSpread from 'babel-plugin-syntax-object-rest-spread';

const syntaxPlugins = [babelPluginSyntaxJSX, babelPluginSyntaxDoExpressions, babelPluginSyntaxFunctionBind, babelPluginSyntaxGenerators, classProperties, objectRestSpread]



export function /*example:*/parseSource/*{"id":"d471_7474_cb07","name":{"mode":"input","value":""},"color":"hsl(120, 30%, 70%)","values":{"filename":{"mode":"input","value":"\"f1\""},"source":{"mode":"select","value":"2025_8b45_d12e"}},"instanceId":{"mode":"input","value":""},"prescript":"","postscript":""}*/(filename, source) {
  try {
    return babel.transform(/*probe:*/source/*{}*/, {
        babelrc: false,
        plugins: [...syntaxPlugins],
        presets: [],
        filename: filename,
        sourceFileName: filename,
        moduleIds: false,
        sourceMaps: true,
        compact: false,
        comments: true,
        code: true,
        ast: true,
        resolveModuleSource: undefined
    }).ast
  } catch(e) {
    console.log('FileIndex, could not parse: ' + filename, e)
    return undefined
  }
}

export function /*example:*//*example:*/parseModuleSemanticsFromSource/*{"id":"51cb_f5a8_fdc6","name":{"mode":"input","value":""},"color":"hsl(210, 30%, 70%)","values":{"filename":{"mode":"input","value":"\"f1\""},"source":{"mode":"select","value":"2025_8b45_d12e"}},"instanceId":{"mode":"input","value":""},"prescript":"","postscript":""}*//*{"id":"b7e6_5eb4_eb65","name":{"mode":"input","value":""},"color":"hsl(160, 30%, 70%)","values":{"filename":{"mode":"input","value":"\"f2\""},"source":{"mode":"select","value":"e2f2_1108_811c"}},"instanceId":{"mode":"input","value":""},"prescript":"","postscript":""}*/(filename, source) {
   return parseModuleSemantics(parseSource(filename, source))
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
      if (/*probe:*/path.node/*{}*/.id) {
        let funcNode = path.node
        let func = {
            name: funcNode/*probe:*/.id.name/*{}*/,
            start: funcNode.start, // start byte 
            end: funcNode.end,     // end byte
            loc: funcNode.loc.end.line - funcNode.loc.start.line + 1,
            kind: funcNode.kind,
            static: funcNode.static,
            leadingComments: funcNode.leadingComments
         }
         functions.push(/*probe:*/func/*{}*/)
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
}/* Context: {"context":{"prescript":"","postscript":""},"customInstances":[{"id":"2025_8b45_d12e","name":"source_f1","code":"return `\n\nfunction f1() {\n  return 3 + 4\n}\n\n`;"},{"id":"e2f2_1108_811c","name":"source_f2","code":"return `\n\nexport async function f1(a, b=3) {\n  return a + b\n}\n\n`;"}]} */