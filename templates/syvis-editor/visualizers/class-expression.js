import walkTree from '../walkTree.js'

export default (node) => [
  'section.classExpression',
  ['header',
    ['span.name', walkTree(node.id)],
    ['span.superClass', '', node.superClass
      ? walkTree(node.superClass)
      : null,
    ],
  ],
  ['div.body', walkTree(node.body)],
]
