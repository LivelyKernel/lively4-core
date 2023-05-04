import {parseForAST, loadPlugins, allSyntaxFlags} from "src/plugin-babel.js"
import { tokTypes } from "src/external/eslint/tokTypes.js";
import { babylonToEspree } from "src/external/eslint/babylon-to-espree7/index.js"


import babelDefault from 'src/external/babel/babel7default.js'
const babel = babelDefault.babel;

loadPlugins() // initialize async plugins, sadly we cannot wait here...

// This has to be sync
export function parse(code,options) {
  return parseForESLint(code).ast
}

export function parseForESLint(code) {

  if (!babel) throw new Error("Babel7 not loaded!")
  
  var babylonAst = parseForAST(code, {syntaxFlags: allSyntaxFlags}).ast;
    
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
            } else {
              // #TODO @onsetsu what do you think should happen here?
              
              if (path.parent.end) {
                path.node.range = [path.parent.start, path.parent.end];
              } else {
                // #TODO take something that is a range....
                if (path.parent.range) {
                  path.node.range = path.parent.range
                } else {
                  debugger
                }
              }
              path.node.start = path.node.range[0]
              path.node.end = path.node.range[1]
            }
            if (!path.node.loc) {
              path.node.loc = path.parent.loc // hope for the best?
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

