import walkTree from '../walkTree.js'

export default node => [
  'span.updateExpression',
  ['span.operator', node.operator],
  walkTree(node.argument),
]
