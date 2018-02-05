const walkTree = require('../walkTree')

module.exports = (node) => {
  return [
    'span.operator-spread',
    walkTree(node.argument),
  ]
}
