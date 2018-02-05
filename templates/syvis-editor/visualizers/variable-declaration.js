const walkTree = require('../walkTree')

module.exports = (node) => [
  'div',
  {class: 'declarations ' + node.kind},
  walkTree(node.declarations),
]
