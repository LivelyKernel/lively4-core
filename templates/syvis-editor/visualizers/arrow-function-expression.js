const walkTree = require('../walkTree')

module.exports = node => {
  const classes = ['arrowFunctionExpression']
  if (node.async) classes.push('async')
  if (node.generator) classes.push('generator')

  return [
    'div',
    {class: classes.join(' ')},
    ['div', // Used for flex layout
      ['.paramsWrapper', // Used for flex layout
        ['.params', walkTree(node.params)],
      ],
      ['.body', walkTree(node.body)],
    ],
  ]
}
