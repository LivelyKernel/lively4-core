const walkTree = require('../walkTree')

module.exports = (node) => [
  'div.exportDefaultDeclaration',
  walkTree(node.declaration),
]
