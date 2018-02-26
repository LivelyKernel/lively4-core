import walkTree from '../walkTree.js'

export default (node) => [
  'span.awaitExpression',
  walkTree(node.argument),
]
