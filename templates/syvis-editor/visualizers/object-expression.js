const walkTree = require('../walkTree')

module.exports = (node) => {
  return [
    'span.objectExpression',
    walkTree(node.properties),
  ]
}
