import operatorMap from '../operatorMap'
import walkTree from '../walkTree'

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
