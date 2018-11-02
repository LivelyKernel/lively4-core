
export default function (babel) {
  const { types: t, template, transformFromAst, traverse } = babel;

  return {
    name: "ast-transform", // not required
    visitor: { 
      CallExpression(path) {
        if(path.node.marked) { return; }
        path.node.marked = true;
        
        path.replaceWith(t.SequenceExpression([
          t.StringLiteral('HELLO'),
          path.node
        ]))
      }
    }
  }
}
