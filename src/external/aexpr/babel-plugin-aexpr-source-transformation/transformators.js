import * as constants from './constants.js';
import { addCustomTemplate, getParentWithScope } from './utils.js';

function getPropertyFromMemberExpression(node, t) {
  // We are looking for MemberExpressions, which have two distinct incarnations:
  // 1. we have a computed MemberExpression like a[b], with the property being an Expression
  // 2. a non-computed MemberExpression like a.b, with the property being an Identifier
  return node.computed ?
    // We can easily deal with the first case by replacing the MemberExpression with a call
    node.property :
    // In the second case, we introduce a StringLiteral matching the Identifier
    t.stringLiteral(node.property.name);
}

export function getMember(path, state, t) { // MemberExpression
  path.replaceWith(
    t.callExpression(
      addCustomTemplate(state.file, constants.GET_MEMBER),
      [
        path.node.object,
        getPropertyFromMemberExpression(path.node, t)
      ]
    )
  );
}

export function getAndCallMember(path, state, t) { // CallExpression
  path.replaceWith(
    t.callExpression(
      addCustomTemplate(state.file, constants.GET_AND_CALL_MEMBER),
      [
        path.node.callee.object,
        getPropertyFromMemberExpression(path.node.callee, t),
        t.arrayExpression(path.node.arguments)
      ]
    )
  );
}

export function setMember(path, state, t) { // AssignmentExpression
  path.replaceWith(
    t.callExpression(
      addCustomTemplate(state.file, constants.SET_MEMBER_BY_OPERATORS[path.node.operator]),
      [
        path.node.left.object,
        getPropertyFromMemberExpression(path.node.left, t),
        //t.stringLiteral(path.node.operator),
        path.node.right
      ]
    )
  );
}

export function callAExpr(path, state, t) { // Identifier
  path.replaceWith(
    addCustomTemplate(state.file, constants.AEXPR_IDENTIFIER_NAME)
  );
}

export function getIdentifierForExplicitScopeObject(parentWithScope, t) {
  let bindings = parentWithScope.scope.bindings;
  let scopeName = Object.keys(bindings).find(key => {
    return bindings[key].path &&
      bindings[key].path.node &&
      bindings[key].path.node.id &&
      bindings[key].path.node.id[constants.FLAG_GENERATED_SCOPE_OBJECT] // should actually be IS_EXPLICIT_SCOPE_OBJECT
  });

  let uniqueIdentifier;
  if(scopeName) {
    uniqueIdentifier = t.identifier(scopeName);
  } else {
    uniqueIdentifier = parentWithScope.scope.generateUidIdentifier('scope');
    uniqueIdentifier[constants.FLAG_GENERATED_SCOPE_OBJECT] = true;

    parentWithScope.scope.push({
      kind: 'let',
      id: uniqueIdentifier,
      init: t.objectExpression([])
    });
  }
  uniqueIdentifier[constants.FLAG_SHOULD_NOT_REWRITE_IDENTIFIER] = true;
  return uniqueIdentifier;
}

export function setLocal(path, state, t) { // AssignmentExpression
  let valueToReturn = t.identifier(path.node.left.name);
  valueToReturn[constants.FLAG_SHOULD_NOT_REWRITE_IDENTIFIER] = true;
  path.replaceWith(
    t.sequenceExpression([
      path.node,
      t.callExpression(
        addCustomTemplate(state.file, constants.SET_LOCAL),
        [
          getIdentifierForExplicitScopeObject(getParentWithScope(path.get("left")), t),
          t.stringLiteral(path.node.left.name)
        ]
      ),
      valueToReturn
    ])
  );
}

export function getLocal(path, state, t) { // Identifier
  path.replaceWith(
    t.sequenceExpression([
      t.callExpression(
        addCustomTemplate(state.file, constants.GET_LOCAL),
        [
          getIdentifierForExplicitScopeObject(getParentWithScope(path), t),
          t.stringLiteral(path.node.name)
        ]
      ),
      path.node
    ])
  );
}

export function setGlobal(path, state, t) { // AssignmentExpression
  path.node[constants.FLAG_SHOULD_NOT_REWRITE_ASSIGNMENT_EXPRESSION] = true;

  let valueToReturn = t.identifier(path.node.left.name);
  valueToReturn[constants.FLAG_SHOULD_NOT_REWRITE_IDENTIFIER] = true;
  path.replaceWith(
    t.sequenceExpression([
      path.node,
      t.callExpression(
        addCustomTemplate(state.file, constants.SET_GLOBAL),
        [t.stringLiteral(path.node.left.name)]
      ),
      valueToReturn
    ])
  );
}

export function getGlobal(path, state, t) { // Identifier
  path.replaceWith(
    t.sequenceExpression([
      t.callExpression(
        addCustomTemplate(state.file, constants.GET_GLOBAL),
        [t.stringLiteral(path.node.name)]
      ),
      path.node
    ])
  );
}
