import walkTree from '../walkTree'

export default (node) => [
  'span.breakStatement',
  ['span.label', node.label
    ? walkTree(node.label)
    : null,
  ],
]
