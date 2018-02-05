const walkTree = require('../walkTree')

module.exports = (node) => {
  return [
    'section.method',
    ['span.name', walkTree(node.key)],
    walkTree(node.value),
  ]
}
