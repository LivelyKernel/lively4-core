import walkTree from '../walkTree'

export default node => [
  'span.continueStatement',
  walkTree(node.label),
]
