export default function (babel) {
  const { types: t, template, transformFromAst, traverse } = babel;

  return {
    name: "ast-transform", // not required
    visitor: { 
      BinaryExpression(path) {
        const func = path.findParent(p => p.isFunctionDeclaration())
        if (func) {
          path.get('right').replaceWith(t.NumericLiteral(0))
        }
      }
    }
  }
}
