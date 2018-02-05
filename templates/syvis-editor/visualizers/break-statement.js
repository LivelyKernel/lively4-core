import walkTree from '../walkTree.js'

export default (node) => [
  'span.breakStatement',
  ['span.label', node.label
    ? walkTree(node.label)
    : null,
  ],
]
