import walkTree from '../walkTree'

export default (node) => [
  'span.awaitExpression',
  walkTree(node.argument),
]
