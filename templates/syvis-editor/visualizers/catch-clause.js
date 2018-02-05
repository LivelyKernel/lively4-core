const walkTree = require('../walkTree')

module.exports = (node) => [
  '.catchClause',
  ['span.param', walkTree(node.param)],
  ['span.body', walkTree(node.body)],
]
