const walkTree = require('../walkTree')

module.exports = (node) => [
  'span.importDefaultSpecifier',
  ['span.local', walkTree(node.local)],
]
