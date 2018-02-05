import walkTree from '../walkTree'

export default node => {
  return [
    'section.code.blockStatement',
    ['.body', node.body ? walkTree(node.body) : null],
  ]
}
