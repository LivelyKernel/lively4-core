

export default function (babel) {
  const { types: t, template, transformFromAst, traverse } = babel;

  const generateDatabindingCode = (lhs, expression, path, node, lhsString) => {
    const AEIdentifier = t.identifier("aexpr");
    // When registering the AE, we want to know the code that generated it, which is this entire LabeledStatement
    AEIdentifier.loc = node.loc;
    const arrowFunction = t.arrowFunctionExpression([], expression);
    arrowFunction.loc = expression.loc;
    arrowFunction.start = expression.start;
    arrowFunction.end = expression.end;
    const AECall = t.callExpression(AEIdentifier, [arrowFunction]);
    const assignment = t.assignmentExpression("=", lhs, t.identifier("value"));
    // Also add the location info for the assignment
    assignment.loc = node.loc;
    const assignmentFunction = t.arrowFunctionExpression([t.identifier("value")], assignment);
    assignmentFunction.start = node.body.start;
    assignmentFunction.end = node.body.end;
    const onChangeCall = t.callExpression(t.memberExpression(AECall, t.identifier("dataflow")), [assignmentFunction]);

    const uniqueAEIdentifier = t.identifier(path.scope.generateUid("ae"));
    const AEVariableDeclaration = t.variableDeclaration("const", [t.variableDeclarator(uniqueAEIdentifier, onChangeCall)]);

    //Register the generated AE, if a registerDatabinding method exists
    const registerMemberExpression = t.memberExpression(t.thisExpression(), t.identifier("registerDatabinding"));
    const registerIfStatement = t.ifStatement(t.logicalExpression("&&", t.thisExpression(), registerMemberExpression), t.expressionStatement(t.callExpression(registerMemberExpression, [uniqueAEIdentifier, t.stringLiteral(lhsString)])));
    return [registerIfStatement, AEVariableDeclaration];
  };

  return {
    name: "data-binding",
    visitor: {
      Program: {
        enter(ppath, state) {
          ppath.traverse({
            LabeledStatement(path) {
              const node = path.node;
              if (node.label.name !== "always") return;
              if (t.isVariableDeclaration(node.body)) {
                if (node.body.kind === "const") {
                  node.body.kind = "let";
                  lively.warn("Invalid const in databinding. Was automatically replaced with let");
                }
                path.replaceWith(t.variableDeclaration(node.body.kind, node.body.declarations.map(varDecl => t.variableDeclarator(varDecl.id))));

                for (const variableDeclaration of node.body.declarations.reverse()) {
                  const [registerIfStatement, AEVariableDeclaration] = generateDatabindingCode(variableDeclaration.id, variableDeclaration.init, path, node, variableDeclaration.id.name);

                  path.insertAfter(registerIfStatement);
                  path.insertAfter(AEVariableDeclaration);
                }
              } else if (t.isExpressionStatement(node.body) && t.isAssignmentExpression(node.body.expression, { operator: "=" })) {
                const expression = node.body.expression;
                const [registerIfStatement, AEVariableDeclaration] = generateDatabindingCode(expression.left, expression.right, path, node, path.get("body.expression.left").getSource());

                path.replaceWith(AEVariableDeclaration);
                path.insertAfter(registerIfStatement);
              } else {
                lively.error("Unable to parse databinding");
              }
            }
          });
        }
      }
    }
  };
}