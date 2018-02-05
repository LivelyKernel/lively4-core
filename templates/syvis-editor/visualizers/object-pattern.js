import walkTree from '../walkTree'

export default node => [
  'span.objectPattern',
  walkTree(node.properties),
]
