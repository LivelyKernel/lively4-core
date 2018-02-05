const walkTree = require('../walkTree')

module.exports = (node) => [
  '.switchCase',
  ['span.test', walkTree(node.test)],
  ['span.consequent', walkTree(node.consequent)],
]
