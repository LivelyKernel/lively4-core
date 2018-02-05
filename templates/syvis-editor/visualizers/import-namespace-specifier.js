const walkTree = require('../walkTree')

module.exports = (node) => [
  'span.importNamespaceSpecifier',
  ['span.local', walkTree(node.local)],
]
