const walkTree = require('../walkTree')

module.exports = (node) => [
  'section.classDeclaration',
  ['header',
    ['span.name', walkTree(node.id)],
    ['span.superClass', '', node.superClass
      ? walkTree(node.superClass)
      : null,
    ],
  ],
  ['div.body', walkTree(node.body)],
]
