import walkTree from '../walkTree.js'

export default node => [
  'span.objectPattern',
  walkTree(node.properties),
]
