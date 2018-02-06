import walkTree from '../walkTree.js'

export default node => {
  return [
    'section.code.blockStatement',
    ['.body', node.body ? walkTree(node.body) : null],
  ]
}
