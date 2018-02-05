import walkTree from '../walkTree.js'

export default node => [
  'span.exportSpecifier',
  ['span.local', walkTree(node.local)],
  ['span.exported', walkTree(node.exported)],
]
