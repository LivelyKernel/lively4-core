import walkTree from '../walkTree'

export default node => {
  return [
    'section.method',
    ['span.name', walkTree(node.key)],
    walkTree(node.value),
  ]
}
