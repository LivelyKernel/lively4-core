import walkTree from '../walkTree'

export default node => [
  'span.return',
  walkTree(node.argument),
]
