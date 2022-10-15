import doExpressionSyntax from "babel-plugin-syntax-do-expressions";

// #Deprecated in #babel7, we use official plugin 

export default function () {
  return {
    inherits: doExpressionSyntax,

    visitor: {
      DoExpression(path) {
        const body = path.node.body.body;
        if (body.length) {
          path.replaceWithMultiple(body);
        } else {
          path.replaceWith(path.scope.buildUndefinedNode());
        }
      }
    }
  };
}
