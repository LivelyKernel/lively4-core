export default function ({ types: t }) {
  return {
    visitor: {
      Program(program, state) {
        const statements = program.get('body');
        if (statements.length <= 0) return;

        program.traverse({
          ExpressionStatement(stmt) {
            const expr = stmt.get('expression');
            if (expr.isBinaryExpression() && expr.node.operator === '<') {
              
              const left = expr.get('left');
              const right = expr.get('right');

              right.traverse({
                UnaryExpression(unary) {
                  if (unary.node.operator === '~') {}
                }
              });

              stmt.insertAfter(t.ExpressionStatement(t.Identifier('foo' + left.node.loc.end.column)));
              expr.replaceWith;
            }
          }
        }, state);
        statements.first.replaceWith(t.BlockStatement([]));
      }
    }
  };
}