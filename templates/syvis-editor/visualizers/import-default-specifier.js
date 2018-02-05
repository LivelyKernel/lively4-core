import walkTree from '../walkTree'

export default node => [
  'span.importDefaultSpecifier',
  ['span.local', walkTree(node.local)],
]
