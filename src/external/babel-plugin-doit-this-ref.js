const GLOBAL_THIS_REPLACEMENT = '__global_this__';

export default function(param) {
  let { types: t, template, traverse, } = param;
  return {
    visitor: {
      ThisExpression(path) {
        // are we in a 'this'-capturing scope?
        if(path.findParent(parent => t.isObjectMethod(parent) ||
          t.isClassMethod(parent) ||
          t.isFunctionDeclaration(parent) ||
          t.isFunctionExpression(parent)
        )) return;
        path.replaceWith(t.identifier(GLOBAL_THIS_REPLACEMENT));
      }
    }
  };
}