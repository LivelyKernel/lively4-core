const walkTree = require('../walkTree')
const operatorMap = require('../operatorMap.js')

module.exports = (node) => {
  const classes = [
    'binaryExpression',
    'operator-' + (operatorMap.binary[node.operator] || ''),
  ]

  return [
    'span',
    {class: classes.join(' ')},
    ['span.left', walkTree(node.left)],
    ['span.right', walkTree(node.right)],
  ]
}
