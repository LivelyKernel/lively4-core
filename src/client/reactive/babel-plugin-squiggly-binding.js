const dataBindingMarker = Symbol('has data binding directive')

export default function ({ template }) {
  return {
    name: 'data bindings (<~)',
    visitor: {
      Directive(path) {
        if (path.get('value').node.value === 'use data binding') {
          path.parentPath.node[dataBindingMarker] = true
        }
      },

      BinaryExpression(bin) {
        if (bin.node.operator !== '<') { return }

        const hasDirective = bin.findParent(path => path.node[dataBindingMarker])
        if (!hasDirective) { return }

        let rightHandSide
        const right = bin.get('right')
        if (right.isUnaryExpression() && right.node.operator === '~') {
          rightHandSide = right.get('argument')
        } else {
          right.traverse({
            UnaryExpression(unary) {
              if (unary.node.operator !== '~') { return }
              if (right.node.loc.start.index !== unary.node.loc.start.index) { return }
              unary.stop()
              unary.replaceWith(unary.get('argument').node)
              rightHandSide = right
            }
          })
        }
        if (!rightHandSide) { return }

        const left = bin.get('left')
        if (!left.isLVal()) {
          throw left.buildCodeFrameError("Unassignable left-hand side of data binding")
        }

        const valueName = right.scope.generateUidIdentifier('value')
        const bindingTemplate = template(`REFERENCE = aexpr(() => EXPRESSION)
.onChange(${valueName.name} => REFERENCE = ${valueName.name})
.now()`)
        bin.replaceWith(bindingTemplate({
          REFERENCE: left.node,
          EXPRESSION: rightHandSide.node,
        }))
      }
    }
  }
}