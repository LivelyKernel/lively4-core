export default function (babel) {
  const { types: t, template, transformFromAst, traverse } = babel;

  return {
    name: "data-binding",
    visitor: {
      Program: {
        enter(ppath, state) {
          ppath.traverse({
            LabeledStatement(path) {
              const node = path.node;
              if (node.label.name !== "always") return;
              const variableDeclaration = node.body.declarations[0];
              path.replaceWith(t.variableDeclaration(node.body.kind, node.body.declarations.map(varDecl => t.variableDeclarator(varDecl.id))));

              for (const variableDeclaration of node.body.declarations.reverse()) {
                const expression = variableDeclaration.init;
                const AEIdentifier = t.identifier("aexpr");
                // When registering the AE, we want to know the code that generated it, which is this entire LabeledStatement
                AEIdentifier.loc = node.loc;
                const AECall = t.callExpression(AEIdentifier, [t.arrowFunctionExpression([], expression)]);
                const assignment = t.assignmentExpression("=", variableDeclaration.id, t.identifier("value"));
                // Also add the location info for the assignment
                assignment.loc = node.loc;
                const assignmentFunction = t.arrowFunctionExpression([t.identifier("value")], assignment);
                const onChangeCall = t.callExpression(t.memberExpression(AECall, t.identifier("dataflow")), [assignmentFunction]);
                const AEexpreesion = t.expressionStatement(onChangeCall);

                path.insertAfter(AEexpreesion);
              }
            }
          });
        }
      }
    }
  };
}