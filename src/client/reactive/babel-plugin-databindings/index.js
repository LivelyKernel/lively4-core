

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
    
    
    let dataBindingInformation = [];
    dataBindingInformation.push(t.objectProperty(t.identifier("isDataBinding"), t.booleanLiteral(true)));
    if(t.isMemberExpression(lhs)) {
      dataBindingInformation.push(t.objectProperty(t.identifier("dataBindingContext"), lhs.object));
      dataBindingInformation.push(t.objectProperty(t.identifier("dataBindingIdentifier"), lhs.property));
    } else {
      dataBindingInformation.push(t.objectProperty(t.identifier("dataBindingContext"), t.stringLiteral("__localScopeObject__")));
      dataBindingInformation.push(t.objectProperty(t.identifier("dataBindingIdentifier"), t.stringLiteral(lhs.name)));
    }
    
    const AECall = t.callExpression(AEIdentifier, [arrowFunction, t.objectExpression(dataBindingInformation)]);
    const assignment = t.assignmentExpression("=", lhs, t.identifier("value"));
    // Also add the location info for the assignment
    assignment.loc = node.loc;
    const assignmentFunction = t.arrowFunctionExpression([t.identifier("value")], assignment);
    assignmentFunction.start = node.body.start;
    assignmentFunction.end = node.body.end;
    const onChangeCall = t.callExpression(t.memberExpression(AECall, t.identifier("dataflow")), [assignmentFunction]);
    onChangeCall.isDatabinding = true;

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
                //That is not it! we need to extract highest level key and identifier and save them as constants
                path.replaceWith(t.variableDeclaration(node.body.kind, node.body.declarations.map(varDecl => t.variableDeclarator(varDecl.id))));

                for (const variableDeclaration of node.body.declarations.reverse()) {
                  const [registerIfStatement, AEVariableDeclaration] = generateDatabindingCode(variableDeclaration.id, variableDeclaration.init, path, node, variableDeclaration.id.name);

                  path.insertAfter(registerIfStatement);
                  path.insertAfter(AEVariableDeclaration);
                }
              } else if (t.isExpressionStatement(node.body) && t.isAssignmentExpression(node.body.expression, { operator: "=" })) {
                const statements = [];
                const expression = node.body.expression;
                const lvalue = expression.left;
                let lhs;
                //There are only three lvalues
                if(t.isMemberExpression(lvalue)) {
                  // object.property and object["property"] are both memberExpressions. the latter is computed. 
                  // object and property are both evaluated at the beginning and then stay constant.
                  const uniqueObjectIdentifier = t.identifier(path.scope.generateUid("object"));
                  const objectAssignmentStatement = t.variableDeclaration("const", [t.variableDeclarator(uniqueObjectIdentifier, lvalue.object)]);
                  statements.push(objectAssignmentStatement);
                  
                  const uniquePropertyIdentifier = t.identifier(path.scope.generateUid("property"));
                  const computedProperty = lvalue.computed ? lvalue.property : t.stringLiteral(lvalue.property.name)
                  const propertyAssignmentStatement = t.variableDeclaration("const", [t.variableDeclarator(uniquePropertyIdentifier, computedProperty)]);
                  statements.push(propertyAssignmentStatement);
                  
                  lhs = t.memberExpression(uniqueObjectIdentifier, uniquePropertyIdentifier, true);
                } else if(t.isIdentifier(lvalue)) {
                  // local variable is also an lvalue. No evaluation required.
                  lhs = lvalue;
                } else {
                  lively.warn("LHS of databinding assignment is not an lvalue. No databinding registered!"); //This should not be valid code in the first place
                  path.replaceWith(expression);
                }
                const [registerIfStatement, AEVariableDeclaration] = generateDatabindingCode(lhs, expression.right, path, node, path.get("body.expression.left").getSource());

                statements.push(AEVariableDeclaration);
                statements.push(registerIfStatement);
                path.replaceWith(t.blockStatement(statements));

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