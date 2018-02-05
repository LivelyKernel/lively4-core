const walkTree = require('../walkTree')

module.exports = (node) => [
  'div.assignmentPattern',
  ['span.left', walkTree(node.left)],
  ['span.right', walkTree(node.right)],
]
