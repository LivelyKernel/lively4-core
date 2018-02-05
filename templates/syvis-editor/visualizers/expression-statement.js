const walkTree = require('../walkTree.js')

module.exports = (node) => [
  'span.expressionStatement',
  walkTree(node.expression),
]
