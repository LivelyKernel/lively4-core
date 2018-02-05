const walkTree = require('../walkTree')

module.exports = (node) => [
  'span.newExpression',
  'new ',
  ['span', walkTree(node.callee)],
  ['span.leftSeparator', '('],
  ['span', ...node.arguments.map(walkTree)],
  ['span.rightSeparator', ')'],
]
