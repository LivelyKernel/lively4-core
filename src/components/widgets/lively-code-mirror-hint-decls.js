
export async function codeMirror() {
  const lcm = await lively.create('lively-code-mirror');
  await lcm.editorLoaded();
  const cm = lcm.editor;
  cm.setValue('');

  return { cm, lcm };
}


import babelDefault from 'systemjs-babel-build';
export async function babel() {
  const babel = babelDefault.babel;
  const { types: t, template } = babel;

  let path, parentPath, node, parentNode, identifier, scope, binding;
  
  babel.transform(`
class Point {

  addXY(x, y) {
    this.x += x
    this.y += y
  }

}
`, {
    plugins: [function () {
      const NAME = 'x';
      return {
        visitor: { 
          Identifier(p) {
            if (p.node.name === NAME) {
              path = p
              parentPath = path.parentPath
              node = path.node
              parentNode = path.parent
              identifier = node
              scope = path.scope
              binding = scope.bindings[NAME]
            }
          } 
        }
      };
    }]
  })

  return { t, template, babel, path, parentPath, node, parentNode, identifier, scope, binding };
}
