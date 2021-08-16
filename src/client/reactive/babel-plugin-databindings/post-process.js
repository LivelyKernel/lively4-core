import {FLAG_SHOULD_NOT_REWRITE_IDENTIFIER, FLAG_GENERATED_SCOPE_OBJECT} from 'src/client/reactive/babel-plugin-active-expression-rewriting/index.js'

export default function (babel) {
  const { types: t, template, transformFromAst, traverse } = babel;

  function getIdentifierForExplicitScopeObject(localIdentifier) {
    let parentWithScope = localIdentifier.findParent(par => par.scope.hasOwnBinding(localIdentifier.node.name || localIdentifier.node.value));
    
    let bindings = parentWithScope.scope.bindings;
    let scopeName = Object.keys(bindings).find(key => {
      return bindings[key].path && bindings[key].path.node && bindings[key].path.node.id && bindings[key].path.node.id[FLAG_GENERATED_SCOPE_OBJECT]; // should actually be IS_EXPLICIT_SCOPE_OBJECT
    });

    let uniqueIdentifier;
    if (scopeName) {
      uniqueIdentifier = t.identifier(scopeName);
    } else {
      uniqueIdentifier = parentWithScope.scope.generateUidIdentifier('scope');
      uniqueIdentifier[FLAG_GENERATED_SCOPE_OBJECT] = true;

      parentWithScope.scope.push({
        kind: 'let',
        id: uniqueIdentifier,
        init: t.objectExpression([t.objectProperty(t.identifier("isScope"), t.booleanLiteral(true))])
      });
    }
    uniqueIdentifier[FLAG_SHOULD_NOT_REWRITE_IDENTIFIER] = true;
    return uniqueIdentifier;
  }
  
  return {
    name: "data-binding-post-process",
    visitor: {
      Program: {
        enter(ppath, state) {
          ppath.traverse({
            StringLiteral(path) {
              if(path.node.value === "__localScopeObject__") {
                const identifierPath = path.parentPath.parentPath.get("properties.2.value");
                const scopeIdentifier = getIdentifierForExplicitScopeObject(identifierPath);
                path.replaceWith(scopeIdentifier);
              }
            }
          });
        }
      }
    }
  };
}