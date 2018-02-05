import walkTree from '../walkTree'

export default node => {
  return [
    'span.operator-spread',
    walkTree(node.argument),
  ]
}
