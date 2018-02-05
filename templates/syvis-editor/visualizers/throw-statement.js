const walkTree = require('../walkTree')

module.exports = (node) => [
  'span.throwStatement',
  ['span.argument', walkTree(node.argument)],
]
