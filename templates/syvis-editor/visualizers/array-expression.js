const walkTree = require('../walkTree')

module.exports = (node) => [
  'span.arrayExpression',
  // ['span.openingBracket', '['],
  ...node.elements.map(element =>
    [
      ['span.arrayElement', walkTree(element)],
      // (index !== node.elements.length - 1) ?
      //  ['span.arraySeparator', ','] :
      //  ''
    ]
  ),
  // ['span.closingBracket', ']']
]
