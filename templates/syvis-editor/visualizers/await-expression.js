const walkTree = require('../walkTree')

module.exports = (node) => [
  'span.awaitExpression',
  walkTree(node.argument),
]
