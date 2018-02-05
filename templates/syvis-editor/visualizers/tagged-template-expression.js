const walkTree = require('../walkTree')

module.exports = (node) => {
  return [
    'span.taggedTemplateExpression',
    ['span.tag', walkTree(node.tag)],
    ['span.quasi', walkTree(node.quasi)],
  ]
}
