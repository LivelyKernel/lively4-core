const walkTree = require('../walkTree')

module.exports = (node) => [
  '.arrayPattern',
  walkTree(node.elements),
]
