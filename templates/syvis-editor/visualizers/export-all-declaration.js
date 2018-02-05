const walkTree = require('../walkTree')

module.exports = (node) => [
  'span.exportAllDeclaration',
  walkTree(node.source),
]
