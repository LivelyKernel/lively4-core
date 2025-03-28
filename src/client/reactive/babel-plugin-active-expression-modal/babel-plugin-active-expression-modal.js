import Preferences from 'src/client/preferences.js';
import {addNamed} from 'src/external/babel/babel7-helpers.js';

const AEXPR_IDENTIFIER_NAME = 'aexpr';
const FLAG_SHOULD_NOT_REWRITE_IDENTIFIER = Symbol('FLAG: should not rewrite identifier');

export default function({ types: t, template, traverse }) {
  const GENERATED_IMPORT_IDENTIFIER = Symbol("generated import identifier");
  
  function addCustomTemplate(file, name, path) {
    let declar = file.declarations[name];
    if (declar) return declar;

    const IMPORT_PATH = 'src/client/reactive/active-expression-modal/active-expression-modal.js';
    let identifier = file.declarations[name] = addNamed(path, name, IMPORT_PATH, {nameHint: name});
    
    identifier[GENERATED_IMPORT_IDENTIFIER] = true;
    identifier[FLAG_SHOULD_NOT_REWRITE_IDENTIFIER] = true;
    return identifier;
  }
  
  
  return {
    name: 'just testing',
    visitor: {
      Identifier(path) {
        console.log('IDENTIFIER', path.node.name)
        if (!path.scope.hasBinding(path.node.name)) {
          console.warn(path.node.name)
        }
        if (path.node.name === '_wrap') {
          path.scope.rename('_wrap', '__wrap__');
        }
      },
      Function(path) {
        path
      },
      Program: {
        enter(path, state) {
          console.log('PROGRAM START')
          if (!shouldTransform(path, state)) { return; }
          
          const BODY_BLOCK_MARKER = 'BODY_BLOCK_MARKER'
          const BODY_EXPRESSION_MARKER = 'BODY_EXPRESSION_MARKER'
          const FUNCTION_TYPES_BLOCK = "FunctionExpression|FunctionDeclaration|ClassMethod|ObjectMethod|ClassPrivateMethod|TSDeclareMethod";
          path.traverse({
            [FUNCTION_TYPES_BLOCK](path) {
              path.get('body').node[BODY_BLOCK_MARKER] = true
            },
            ArrowFunctionExpression(path) {
              if (path.get('body').isBlockStatement()) {
                path.get('body').node[BODY_BLOCK_MARKER] = true
              } else {
                path.get('body').node[BODY_EXPRESSION_MARKER] = true
              }
            }
          })
          
          path.traverse({
            BlockStatement(path) {
              if (!path.node[BODY_BLOCK_MARKER]) {
                return
              }
              delete path.node[BODY_BLOCK_MARKER]

              const originalBody = _.cloneDeep(path.node);
              originalBody.body.unshift(t.stringLiteral('original'))

              const eamBody = _.cloneDeep(path.node);
              eamBody.body.unshift(t.stringLiteral('expression analysis mode'))

              // Create the if statement with the condition
              const ifStatement = t.ifStatement(
                t.booleanLiteral(false),  // Replace this with your actual condition
                eamBody,
                originalBody
              );

              // Replace the function body with the if statement
              if (t.isBlockStatement(path.node)) {
                path.node.body = [ifStatement];
              } else {
                path.replaceWith(t.blockStatement([ifStatement]));
              }

        //       path.replaceWith(
        // t.blockStatement([
        //   t.expressionStatement(
        //     t.stringLiteral(path.type))]))
            },
            ArrowFunctionExpression(path) {
              
            }
          })
          
          console.log('PROGRAM END')
        }
      }
    }
  };
}

function shouldTransform(path, state) {
  return true;
  
  const proxyDirective = hasDirective(path, 'use proxies for aexprs');
  const proxyPreference = typeof Preferences == 'undefined' ? true : Preferences.get('UseProxiesForAExprs');
  const inWorkspace = state.opts.executedIn === 'workspace';
  const inFile = state.opts.executedIn === 'file';

  if (inWorkspace) {
    return proxyPreference;
  } else if (inFile) {
    return proxyDirective;
  }
  return true;
  // throw new Error('This should not be possible');
}

function hasDirective(path, name) {
  let foundDirective = false;
  path.traverse({
    Directive(path) {
      if(path.get("value").node.value === name) {
        foundDirective = true;
      }
    }
  });
  return foundDirective;
}

