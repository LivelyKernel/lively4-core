import Preferences from 'src/client/preferences.js';

const AEXPR_IDENTIFIER_NAME = 'aexpr';
const FLAG_SHOULD_NOT_REWRITE_IDENTIFIER = Symbol('FLAG: should not rewrite identifier');

export default function({ types: t, template, traverse }) {
  const GENERATED_IMPORT_IDENTIFIER = Symbol("generated import identifier");
  
  function addCustomTemplate(file, name) {
    let declar = file.declarations[name];
    if (declar) return declar;

    let identifier = file.declarations[name] = file.addImport("active-expression-proxies", name, name);
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
      Program: {
        enter(path, state) {
          console.log('PROGRAM START')
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

          function shouldTransform() {
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

          if (!shouldTransform()) { return; }

          function replaceNode(path, wrapType, unwrap = false) {
            // do not wrap the same object twice
            if (path.node.__already_transformed__) { return; }
            path.node.__already_transformed__ = true;           
            
            let transformed;
            if (unwrap){
              transformed = t.callExpression(
                addCustomTemplate(state.file, 'unwrap'), [path.node])
              
            } else {
              transformed = t.callExpression(
                addCustomTemplate(state.file, 'wrap'), [t.stringLiteral(wrapType),path.node]
              );
            }
            path.replaceWith(transformed);   
          }
          
          path.traverse({
            ObjectExpression(path) {
              // do not replace objects in calls to Object.defineProperty
              try {
                if(path.parent.callee.property.name === "defineProperty") { 
                  return;
                }
              } catch(e) {
                // Once we can use the new ecma script2020 syntax this try-catch can be replaced by optional chaining
                // https://iolap.com/2019/09/27/whats-next-for-javascript-top-5-new-features-for-2020/
              }
              replaceNode(path, 'Object')
            },

            CallExpression(path) {
              // unwrap proxies in Object.defineProperty 
              try {
                if(path.node.callee.property.name === "defineProperty" && path.node.arguments[2].type === "Identifier") { 
                  path.node.arguments[2].__should_unwrap__ = true;
                }
              } catch(e) {
                // Once we can use the new ecma script2020 syntax this try-catch can be replaced by optional chaining
                // https://iolap.com/2019/09/27/whats-next-for-javascript-top-5-new-features-for-2020/
              }
            },
            
            NewExpression(path) {
              replaceNode(path, path.node.callee.name)

            },

            ArrayExpression(path) {
              replaceNode(path, 'Array')
            },
            
            Identifier(path) {
              if (path.node[FLAG_SHOULD_NOT_REWRITE_IDENTIFIER]) {
                return;
              }

              // Check for a call to undeclared aexpr:
              if (
                t.isCallExpression(path.parent) &&
                path.node.name === AEXPR_IDENTIFIER_NAME &&
                !path.scope.hasBinding(AEXPR_IDENTIFIER_NAME)
              ) {
                //logIdentifier("call to aexpr", path);
                path.replaceWith(
                  addCustomTemplate(state.file, AEXPR_IDENTIFIER_NAME)
                );
                return;
              }

              try {
                if(path.parent.callee.property.name === "defineProperty" && path.parent.arguments[2] === path.node) { 
                  replaceNode(path, 'Proxy', true);           
                }
              } catch(e) {
                // Once we can use the new ecma script2020 syntax this try-catch can be replaced by optional chaining
                // https://iolap.com/2019/09/27/whats-next-for-javascript-top-5-new-features-for-2020/
              }
            }
          })

          console.log('PROGRAM END')
        }
      }
    }
  };
}
