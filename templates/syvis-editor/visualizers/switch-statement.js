const walkTree = require('../walkTree')

module.exports = (node) => [
  '.switchStatement',
  ['span.discriminant', walkTree(node.discriminant)],
  ['span.cases', walkTree(node.cases)],
]
