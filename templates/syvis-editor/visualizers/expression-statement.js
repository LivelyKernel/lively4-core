import walkTree from '../walkTree'

export default node => [
  'span.expressionStatement',
  walkTree(node.expression),
]
