import walkTree from '../walkTree.js'

export default node => [
  'span.throwStatement',
  ['span.argument', walkTree(node.argument)],
]
