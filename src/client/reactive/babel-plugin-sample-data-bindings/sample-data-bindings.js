export default function ({ template, types: t }) {
  return {
    name: 'sample data bindings (<~)',
    visitor: {
      Program(program) {
        // handle squiggly arrow operator
        program.traverse({
          ExpressionStatement(stmt) {
            const path = stmt.get('expression');
            const [left, right] = leftRightOfSquigglyArrow(path);
            if (!left  || !right) { return }

            // path.replaceWith(t.numberLiteral(123))
            
            // const name = path.scope.generateUidIdentifier('value').name;
            // const db = template(`ae(EXPR).onChange(${name} => REF = ${name})`)({
            //   EXPR: right,
            //   REF: left
            // });
            // path.replaceWith(db)
          }
        })
      }
    }
  }
}


function leftRightOfSquigglyArrow(path) {
  if (!path.isBinaryExpression()) { return [] }
  if (path.node.operator !== '<') { return [] }

  let right
  const expression = path.get('right')
  if (expression.isUnaryExpression() && expression.node.operator === '~') {
    right = expression.get('argument')
  } else {
    expression.traverse({
      UnaryExpression(unary) {
        if (unary.node.operator !== '~') { return }
        if (expression.node.loc.start.index !== unary.node.loc.start.index) { return }
        unary.stop()
        unary.replaceWith(unary.get('argument').node)
        right = expression
      }
    })
  }
  if (!right) { return [] }

  const left = path.get('left')
  if (!left.isLVal()) {
    throw left.buildCodeFrameError("Unassignable left-hand side of data binding")
  }

  console.warn('squiggly arrow found')
  return [left.node, right.node]
}








            // const db = template(`aexpr(() => SOURCE).dataflow(v => TARGET = v)`)({
            //   SOURCE: right,
            //   TARGET: left,
            // });
            // path.replaceWith(db)