import operatorMap from '../operatorMap.js'
import walkTree from '../walkTree.js'

export default (expression) => {
  const classes = ['assignmentExpression']
  const operator = operatorMap.binary[expression.operator]

  if (operator) classes.push(operator)

  return [
    'div',
    {class: classes.join(' ')},
    ['span.left', walkTree(expression.left)],
    ['span.right', walkTree(expression.right)],
  ]
}
