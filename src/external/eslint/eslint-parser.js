import babelDefault from 'systemjs-babel-build';
const babel = babelDefault.babel;

import babelPluginSyntaxJSX from 'babel-plugin-syntax-jsx';
import babelPluginSyntaxDoExpressions from  'babel-plugin-syntax-do-expressions';
import babelPluginSyntaxFunctionBind from 'babel-plugin-syntax-function-bind';
import babelPluginSyntaxGenerators from 'babel-plugin-syntax-async-generators';
import classProperties from 'babel-plugin-syntax-class-properties';
import objectRestSpread from 'babel-plugin-syntax-object-rest-spread';

import { tokTypes } from "src/external/eslint/tokTypes.js";
import { babylonToEspree } from "src/external/eslint/babylon-to-espree7/index.js"

const syntaxPlugins = [
  babelPluginSyntaxJSX,
  babelPluginSyntaxDoExpressions,
  babelPluginSyntaxFunctionBind,
  babelPluginSyntaxGenerators,
  classProperties,
  objectRestSpread
];

export function parse(
    code,
    options
) {
    return parseForESLint(code, options).ast;
}

export function parseForESLint (
    code,
    options,
) {
  var babylonAst = babel.transform(code, {
          babelrc: false,
          plugins: syntaxPlugins,
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
        }).ast;
  
  babylonAst = convertNodes(code, babylonAst, babel.traverse, babel.types);
  var espreeAst = babylonToEspree(babylonAst, babel.traverse, tokTypes, babel.types, code);
  
  const scopeManager = null;
  const visitorKeys = null;
  return { ast: espreeAst, scopeManager, visitorKeys };
      
}

function convertNodes(code, ast, traverse, babelTypes) {
    const state = { source: code };
    const traverseRules = {
        noScope: true,
        enter(path) {
            if (path.node.end) {
                path.node.range = [path.node.start, path.node.end];
            }
        },
        ObjectProperty: function(path) {
            path.node.kind = "init";
            path.node.type = "Property";
        },
        ObjectMethod: function(path) {
            if (!path.node || path.node === "method") {
                path.node.kind = "init";
            }
            path.node.value = {
                type: "FunctionExpression",
                start: path.node.start,
                end: path.node.end,
                range: [path.node.start, path.node.end],
                id: path.node.id,
                generator: path.node.generator,
                expression: path.node.expression,
                async: path.node.async,
                params: path.node.params,
                body: path.node.body
            };
            if (path.node.returnType) {
              path.node.value.returnType = path.node.returnType;
            }
            if (path.node.typeParameters) {
              path.node.value.typeParameters = path.node.typeParameters;
            }
            path.node.type = "Property";
        },
        ClassMethod: function(path) {
            path.node.value = {
                type: "FunctionExpression",
                start: path.node.start,
                end: path.node.end,
                range: [path.node.start, path.node.end],
                id: path.node.id,
                generator: path.node.generator,
                expression: path.node.expression,
                async: path.node.async,
                params: path.node.params,
                body: path.node.body
            };
            if (path.node.returnType) {
              path.node.value.returnType = path.node.returnType;
            }
            if (path.node.typeParameters) {
              path.node.value.typeParameters = path.node.typeParameters;
            }
            path.node.type = "MethodDefinition";
        },
        NumericLiteral: function(path) {
            path.node.type = "Literal";
            path.node.raw = path.node.value.toString();
        },
        NullLiteral: function(path) {
            path.node.type = "Literal";
            path.node.value = null;
            path.node.raw = "null";
        },
        StringLiteral: function(path) {
            path.node.type = "Literal";
            path.node.raw = path.node.value.toString();
        },
        BooleanLiteral: function(path) {
            path.node.type = "Literal";
            path.node.raw = path.node.value.toString();
        },
        RegExpLiteral : function(path) {
            path.node.type = "Literal";
            path.node.raw = path.node.extra.raw;
            path.node.value = {};
            path.node.regex = {
              pattern: path.node.pattern,
              flags: path.node.flags
            };
        },
      
    };
  
     // Monkey patch visitor keys in order to be able to traverse the estree nodes
    // necessary for a deep traverse
    babelTypes.VISITOR_KEYS.Property = babelTypes.VISITOR_KEYS.ObjectProperty;
    babelTypes.VISITOR_KEYS.MethodDefinition = [
        "key",
        "value",
        "decorators",
        "returnType",
        "typeParameters",
    ];

    ast.range = [ast.start, ast.end];
    traverse(ast, traverseRules, null, state);
  
    delete babelTypes.VISITOR_KEYS.Property;
    delete babelTypes.VISITOR_KEYS.MethodDefinition;
  
  return ast;
}
