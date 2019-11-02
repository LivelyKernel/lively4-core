import Preferences from 'src/client/preferences.js';

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
    visitor: {
      Program: {
        enter(path, state) {
          debugger
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
            const proxyPreference = Preferences.get('UseProxiesForAExprs');
            const inWorkspace = state.opts.executedIn === 'workspace';
            const inFile = state.opts.executedIn === 'file';

            if (inWorkspace) {
              return proxyPreference;
            } else if (inFile) {
              return proxyDirective;
            }
            return true;
            throw new Error('This should not be possible');
          }

          if (!shouldTransform()) { return; }

          path.traverse({
            ObjectExpression(path) {
              // do not wrap the same object twice
              if (path.node.__already_transformed__) { return; }
              path.node.__already_transformed__ = true;

              const wrapped = t.callExpression(
                addCustomTemplate(state.file, 'wrap'), [path.node]
              );
              path.replaceWith(wrapped);
            }
          })
        }
      }
    }
  };
}
