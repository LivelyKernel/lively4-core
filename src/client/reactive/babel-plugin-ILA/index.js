import { getSourceLocation } from 'src/client/reactive/babel-plugin-active-expression-rewriting/index.js'

export default function (babel) {
  const { types: t, template, transformFromAst, traverse } = babel;

  
  const buildAEGenerator = template(`(cond, layer) => aexpr(cond, {isILA: true, ila: layer})`);
  
  function parentStatement(path) {
    while(!t.isStatement(path.node)) {
      return parentStatement(path.parentPath);
    }
    return path;
  }
  
  function createILA(callExpression, path) {    
    const AEGeneratorStatement = buildAEGenerator();
    
    const arrowFunction = AEGeneratorStatement.expression;     
    const condition = arrowFunction.body.arguments[0];
    const originalCondition = callExpression.arguments[0];
    condition.loc = originalCondition.loc;
    condition.start = originalCondition.start;
    condition.end = originalCondition.end;
    
    const AEIdentifier = arrowFunction.body.callee;
    AEIdentifier.loc = callExpression.loc;
    
    callExpression.arguments.push(arrowFunction);
    path.replaceWith(callExpression)
  }
  
  const buildFunctionDebugInfo = template(`({ location: LOCATION, code: CODE })`)
  
  function addRefineInfo(callExpression, path, state) {  
    const debugInfos = [];
    const objectExpressionPath = path.get("arguments")[1];
    if(!t.isObjectExpression(objectExpressionPath.node)) {
      
      lively.warn("Second object refinement argument of layer is not an objectExpression. We do currently not support searching for the root. No debug info is provided.");
      return;
    }
    const refinedFunctions = objectExpressionPath.get("properties"); //Array of ObjectMethods
    for(const refinedFunctionPath of refinedFunctions) {
      const node = refinedFunctionPath.node;
      const location = getSourceLocation(node, state, template, t);
      // FNNAME: node.key, 
      debugInfos.push(t.objectProperty(node.key, buildFunctionDebugInfo({LOCATION: location, CODE: t.stringLiteral(refinedFunctionPath.getSource())}).expression));
    }
    path.pushContainer('arguments', t.objectExpression(debugInfos));
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
              if(t.isIdentifier(node.callee.property, { name: "activeWhile" })) {
                if(node.arguments.length !== 1) {
                  // Wrong amount of arguments;
                  lively.warn("Did not rewrite possible ILA, due to wrong amount of parameters: " + node.arguments.length + " instead of 1!");
                  return;
                }              
                // We assume this call expression is for an ILA
                createILA(node, path);
              } else if (t.isIdentifier(node.callee.property, { name: "refineObject" })  ||
                        t.isIdentifier(node.callee.property, { name: "refineClass" })) {
                addRefineInfo(node, path, state);
              } else {
                // Wrong name or computed property access which is probably wrong
                return;
                
              }
            }
          });
        }
      }
    }
  };
}