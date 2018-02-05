const walkTree = require('../walkTree')

module.exports = (node) => [
  '.tryStatement',
  ['.block', walkTree(node.block)],
  ['.handler', walkTree(node.handler)],
  ['.finalizer', node.finalizer
    ? walkTree(node.finalizer)
    : null,
  ],
]
