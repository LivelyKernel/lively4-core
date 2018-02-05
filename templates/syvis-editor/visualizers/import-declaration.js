const walkTree = require('../walkTree')

module.exports = (node) => [
  '.importDeclaration',
  ['span.specifiers', walkTree(node.specifiers)],
  ['span.source', walkTree(node.source)],
]
