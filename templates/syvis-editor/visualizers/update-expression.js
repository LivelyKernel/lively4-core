const walkTree = require('../walkTree')

module.exports = (node) => [
  'span.updateExpression',
  ['span.operator', node.operator],
  walkTree(node.argument),
]
