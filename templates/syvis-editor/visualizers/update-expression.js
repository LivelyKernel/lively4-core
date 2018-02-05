import walkTree from '../walkTree'

export default node => [
  'span.updateExpression',
  ['span.operator', node.operator],
  walkTree(node.argument),
]
