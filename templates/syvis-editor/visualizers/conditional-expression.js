const walkTree = require('../walkTree')

module.exports = (node) => [
  'span.conditionalExpression',
  ['span', walkTree(node.test)],
  ['span', ' ? '],
  ['span', walkTree(node.consequent)],
  ['span', ' : '],
  ['span', walkTree(node.alternate)],
]
