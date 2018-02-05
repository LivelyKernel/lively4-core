import walkTree from '../walkTree.js'

export default node => {
  return [
    'section.code.doWhile',
    ['.body', node.body
      ? walkTree(node.body)
      : null,
    ],
    ['footer.test',
      ['div', walkTree(node.test)],
    ],
  ]
}
