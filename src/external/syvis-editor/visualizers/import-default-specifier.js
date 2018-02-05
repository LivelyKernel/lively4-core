import walkTree from '../walkTree.js'

export default node => [
  'span.importDefaultSpecifier',
  ['span.local', walkTree(node.local)],
]
