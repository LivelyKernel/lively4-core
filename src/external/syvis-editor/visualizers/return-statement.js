import walkTree from '../walkTree.js'

export default node => [
  'span.return',
  walkTree(node.argument),
]
