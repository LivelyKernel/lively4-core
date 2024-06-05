console.log(123)
export default function ({ template, types: t }) {
  return {
    name: 'sample data bindings (<~)',
    visitor: {
      Program(program) {
        // handle squiggly arrow operator
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
          debugger
          if (!right) { return [] }

          const left = path.get('left')
          if (!left.isLVal()) {
            throw left.buildCodeFrameError("Unassignable left-hand side of data binding")
          }

          return [left, right]
        }

        program.traverse({
          ExpressionStatement(expressionStatementPath) {
            const path = expressionStatementPath.get('expression');
            const [left, right] = leftRightOfSquigglyArrow(path);
            if (!left  || !right) {
              // path.replaceWith(t.numberLiteral(123))
              return
            }

            const valueName = right.scope.generateUidIdentifier('value')
            const bindingTemplate = template(`aexpr(() => EXPRESSION)
.dataflow(${valueName.name} => REFERENCE = ${valueName.name})`)
            path.replaceWith(bindingTemplate({
              REFERENCE: left.node,
              EXPRESSION: right.node,
            }))
          }
        })
      }
    }
  }
}











//             const valueName = right.scope.generateUidIdentifier('value')
//             const bindingTemplate = template(`aexpr(() => EXPRESSION)
// .dataflow(${valueName.name} => REFERENCE = ${valueName.name})`)
//             path.replaceWith(bindingTemplate({
//               REFERENCE: left.node,
//               EXPRESSION: right.node,
//             }))
