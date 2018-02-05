const walkTree = require('../walkTree')

module.exports = node => {
  return [
    'section.code.forIn',
    ['header',
      ['.left', walkTree(node.left)],
      ['.right', walkTree(node.right)],
    ],
    ['.body', node.body
      ? walkTree(node.body)
      : null,
    ],
  ]
}
