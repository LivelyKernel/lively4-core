import walkTree from '../walkTree.js'

export default node => [
  'span.expressionStatement',
  walkTree(node.expression),
]
