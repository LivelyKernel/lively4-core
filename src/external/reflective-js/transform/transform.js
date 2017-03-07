const REFLECTIVE_JS_IMPORT_NAME = 'reflective-js';

const IMPORT_NEW_EXPRESSION = "hookNewExpression";

export default function({ types: t, template, traverse, }) {
  
  function addCustomTemplate(file, name) {
    let declar = file.declarations[name];
    if (declar) return declar;

    let identifier = file.declarations[name] = file.addImport(REFLECTIVE_JS_IMPORT_NAME, name, name);
    //identifier[GENERATED_IMPORT_IDENTIFIER] = true;
    return identifier;
  }
  
  return {
    name: "reflective-js",
    pre(...args) {
      //console.clear();
      //console.log('TRANSFORM START');
    },
    post(...args) {
      //console.log('TRANSFORM END');
    },
    visitor: {
      Program(program, state) {
      },
      NewExpression(path, state) {
        path.replaceWith(t.callExpression(
          addCustomTemplate(state.file, IMPORT_NEW_EXPRESSION),
          [
            path.get('callee').node,
            ...path.node.arguments
          ]
        ));
      }
    }
  };
}
