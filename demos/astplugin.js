export default function (babel) {
  const { types: t } = babel;
  
  return {
    name: "ast-transform", // not required
    visitor: { 
      Program(path) {
        var statements = []
        path.traverse({
        	Statement(path) {
            	statements.push(path)
            }
        })
        _.last(statements).insertAfter(t.expressionStatement(t.stringLiteral('x')))
      } 
    }
  };
}