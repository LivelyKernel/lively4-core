const walkTree = require('../walkTree')
const operatorMap = require('../operatorMap.js')


module.exports = (node) => {
  const classes = ['logicalExpression']
  if (node.operator) {
    classes.push('operator-' + operatorMap.binary[node.operator])
  }

  return [
    'span',
    {class: classes.join(' ')},
    ['span.left', walkTree(node.left)],
    ['span.right', walkTree(node.right)],
  ]
}
