import walkTree from '../walkTree.js'

export default node => [
  'span.importNamespaceSpecifier',
  ['span.local', walkTree(node.local)],
]
