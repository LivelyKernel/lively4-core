import jsx from "babel-plugin-syntax-jsx";
import Preferences from 'src/client/preferences.js';

/**
 * Resources for JSX Syntax
 * JSX babel Preset: https://github.com/babel/babel/blob/master/packages/babel-preset-react/src/index.js
 * JSX spec draft: https://github.com/facebook/jsx
 * JSX Syntax definition in babel: https://github.com/babel/babel/blob/master/packages/babel-types/src/definitions/jsx.js#L10
 * Babel nodes list: https://babeljs.io/docs/core-packages/babel-types/#apij-sxidentifier
 */
export default function ({ types: t, template, traverse }) {
  const GENERATED_IMPORT_IDENTIFIER = Symbol("generated import identifier");

  // #TODO: duplicate with aexpr transform -> extract it
  function addCustomTemplate(file, name) {
    let declar = file.declarations[name];
    if (declar) return declar;

    let identifier = file.declarations[name] = file.addImport("rp19-jsx", name, name);
    identifier[GENERATED_IMPORT_IDENTIFIER] = true;
    return identifier;
  }

  return {
    inherits: jsx,
    visitor: {
      Program(path, state) {
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
          const rp19Directive = hasDirective(path, 'use rp19-jsx');
          const rp19Preference = Preferences.get('UseRP19JSX');
          const inWorkspace = state.opts.executedIn === 'workspace';
          const inFile = state.opts.executedIn === 'file';

          if (inWorkspace) {
            return rp19Preference;
          } else if (inFile) {
            return rp19Directive;
          }
          return true;
          throw new Error('This should not be possible');
        }

        if (!shouldTransform()) { return; }

        // the transformation itself
        path.traverse({
          JSXElement(path) {
            const tagName = t.stringLiteral(path
                                            .get("openingElement")
                                            .get("name").node.name)
            const newNode = t.callExpression(
              addCustomTemplate(state.file, "element"),
              [tagName]
            );

            path.replaceWith(newNode);
          }
        });
      }
    }
  };
}
