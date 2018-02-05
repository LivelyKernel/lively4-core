import walkTree from '../walkTree'

export default node => [
  'span.importNamespaceSpecifier',
  ['span.local', walkTree(node.local)],
]
