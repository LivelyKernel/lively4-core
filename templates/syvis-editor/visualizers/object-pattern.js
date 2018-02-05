const walkTree = require('../walkTree')

module.exports = (node) => [
  'span.objectPattern',
  walkTree(node.properties),
]
