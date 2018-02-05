import walkTree from '../walkTree'

export default node => {
  return [
    'section.code.labeledStatement',
    ['header',
      ['.label', walkTree(node.label)],
    ],
    ['.body', node.body ? walkTree(node.body) : null],
  ]
}
