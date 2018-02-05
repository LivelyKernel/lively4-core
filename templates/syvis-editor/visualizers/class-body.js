const walkTree = require('../walkTree')

module.exports = (node) => [
  'div.classBody',
  walkTree(node.body),
]
