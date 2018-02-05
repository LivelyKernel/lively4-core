import walkTree from '../walkTree.js'

export default node => {
  return [
    'span.operator-spread',
    walkTree(node.argument),
  ]
}
