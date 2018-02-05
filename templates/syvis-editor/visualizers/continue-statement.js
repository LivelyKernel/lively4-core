const walkTree = require('../walkTree')

module.exports = node => [
  'span.continueStatement',
  walkTree(node.label),
]
