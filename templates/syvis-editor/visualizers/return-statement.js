const walkTree = require('../walkTree')

module.exports = (node) => [
  'span.return',
  walkTree(node.argument),
]
