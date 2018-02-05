import walkTree from '../walkTree'

export default node => [
  '.tryStatement',
  ['.block', walkTree(node.block)],
  ['.handler', walkTree(node.handler)],
  ['.finalizer', node.finalizer
    ? walkTree(node.finalizer)
    : null,
  ],
]
