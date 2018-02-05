import walkTree from '../walkTree.js'

export default node => {
  return [
    'section.code.while',
    ['header.test',
      ['div', walkTree(node.test)],
    ],
    ['div.body', node.body ? walkTree(node.body) : null],
  ]
}
