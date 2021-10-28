export default function (babel) {
  const { types: t, template, transformFromAst, traverse } = babel;

  
  const buildAEGenerator = template(`(cond) => aexpr(cond, {isILA: true, ila: ILA_NAME})`);
  
  function parentStatement(path) {
    while(!t.isStatement(path.node)) {
      return parentStatement(path.parentPath);
    }
    return path;
  }
  
  function extractILAName(callExpression, path) {
    const object = callExpression.callee.object;
    if(t.isIdentifier(object)) {
      return object;
    } else {
      const ILAName = t.identifier(path.scope.generateUid("layer"));
      const assignment = t.variableDeclaration("const", [t.variableDeclarator(ILAName, object)]);
      parentStatement(path).insertBefore(assignment);
      callExpression.callee.object = ILAName;
      return ILAName;
    }
  }
  
  function createILA(callExpression, path) {
    const ilaName = extractILAName(callExpression, path);
    
    const AEGeneratorStatement = buildAEGenerator({ILA_NAME: ilaName});
    
    const arrowFuntion = AEGeneratorStatement.expression;    
    const AEIdentifier = arrowFuntion.body.callee;
    AEIdentifier.loc = callExpression.loc;
    
    callExpression.arguments.push(arrowFuntion);
    path.replaceWith(callExpression)
  }
  
  return {
    name: "data-binding",
    visitor: {
      Program: {
        enter(ppath, state) {
          ppath.traverse({
            CallExpression(path) {
              const node = path.node;
              if(!t.isMemberExpression(node.callee)) {
                // Free function
                return;
              }              
              if(!t.isIdentifier(node.callee.property, { name: "activeWhile" })) {
                // Wrong name or computed property access which is probably wrong
                return;
              }
              if(node.arguments.length !== 1) {
                // Wrong amount of arguments;
                lively.warn("Did not rewrite possible ILA, due to wrong amount of parameters: " + node.arguments.length + " instead of 1!");
                return;
              }              
              // We assume this call expression is for an ILA
              createILA(node, path);
            }
          });
        }
      }
    }
  };
}