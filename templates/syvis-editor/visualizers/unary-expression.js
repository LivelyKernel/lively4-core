const walkTree = require('../walkTree')
const operatorMap = require('../operatorMap.js')

module.exports = (node) => [
  'span.unaryExpression',
  {
    class: 'operator-' + (operatorMap.unary[node.operator] || ''),
  },
  walkTree(node.argument),
]
