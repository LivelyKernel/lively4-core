import walkTree from '../walkTree'

export default node => [
  'span.throwStatement',
  ['span.argument', walkTree(node.argument)],
]
