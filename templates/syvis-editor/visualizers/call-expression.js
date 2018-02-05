const walkTree = require('../walkTree')

module.exports = (node) => [
  'span.callExpression',
  ['span.callee', walkTree(node.callee)],
  ['span.arguments', walkTree(node.arguments)],
]
