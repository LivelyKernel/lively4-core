const walkTree = require('../walkTree')

module.exports = (node) => [
  'span.exportSpecifier',
  ['span.local', walkTree(node.local)],
  ['span.exported', walkTree(node.exported)],
]
