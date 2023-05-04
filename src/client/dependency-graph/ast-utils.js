import babelDefault from 'src/external/babel/babel7default.js'
const { types: t, template, transformFromAst, traverse } = babelDefault.babel;
export const AEXPR_IDENTIFIER_NAME = 'aexpr';

export function dependencies(astNode, fullAst) {
  
}

export function externalState(astNode, fullAst) {
  const state = [];
  
}

export function nodeForLoc(loc) {
  
}

/*MD # Traversal Helpers MD*/

export function leakingBindings(path) {
  const bindings = new Set;
  path.traverse({
    ReferencedIdentifier(id) {
      const outerBinding = path.scope.getBinding(id.node.name);
      if (!outerBinding) return;
      const actualBinding = id.scope.getBinding(id.node.name);
      if (outerBinding === actualBinding) {
        bindings.add(actualBinding);
      }
    }
  });
  return bindings;
}

export function isVariableAccess(identifier) {
  if (!t.isIdentifier(identifier)) return false;
  const badKeys = ['left', 'key', 'id', 'label', 'param', 'local', 'exported', 'imported', 'meta', 'property'];
  const parent = identifier.parent;
  if (t.isBinaryExpression(parent)
      || (t.isMemberExpression(parent) && parent.computed)) return true;
  if (t.isUpdateExpression(parent)
      || badKeys.includes(identifier.key)) return false;
  return true;
}

export function isAExpr(path) {
  return t.isCallExpression(path)
          && t.isIdentifier(path.node.callee)
          && path.node.callee.name === AEXPR_IDENTIFIER_NAME
          && !path.scope.hasBinding(AEXPR_IDENTIFIER_NAME, true);
}