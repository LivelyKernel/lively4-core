const walkTree = require('../walkTree')

module.exports = (node) => [
  'span.breakStatement',
  ['span.label', node.label
    ? walkTree(node.label)
    : null,
  ],
]
