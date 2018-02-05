const walkTree = require('../walkTree')

module.exports = (node) => [
  'span.exportNamedDeclaration',
  ['span.specifiers', walkTree(node.specifiers)],
  ['span.declaration', walkTree(node.declaration)],
]
