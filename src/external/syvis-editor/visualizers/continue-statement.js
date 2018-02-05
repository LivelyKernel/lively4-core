import walkTree from '../walkTree.js'

export default node => [
  'span.continueStatement',
  walkTree(node.label),
]
