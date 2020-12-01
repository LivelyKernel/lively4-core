export default function (babel) {
  const { types: t, template, transformFromAst, traverse } = babel;
  return {
    name: "underscore-decorator",
    visitor: {
      FunctionDeclaration(path) {
          if(path.node.isDecorated) {
              return;
          }
        const nameParts = path.node.id.name.split('_');
        if (nameParts.length < 2) {
            return;
        }
          let body = path.node.body;
        
          for (const id of nameParts.slice(0, -1).reverse()) {
             body = t.callExpression(
                 t.identifier(id), 
                 [t.arrowFunctionExpression([], body)])
        }
          
      const fun = t.functionDeclaration(
            path.node.id, 
            path.node.params, 
            t.blockStatement([t.returnStatement(body)]
        ));
          fun.isDecorated = true;
          path.replaceWith(fun);          
      },//*/
        
        ReturnStatement(path) {
            // debugger
        }
    }
  };
}