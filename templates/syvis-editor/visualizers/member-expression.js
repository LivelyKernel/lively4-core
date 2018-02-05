const walkTree = require('../walkTree')

module.exports = (node) => {
  const classes = ['memberExpression']
  if (node.computed) classes.push('computed')
  if (node.object.type === 'ThisExpression') {
    classes.push('containsThisExpression')
  }

  return [
    'span',
    {class: classes.join(' ')},
    ['span.object', walkTree(node.object)],
    ['span.property', walkTree(node.property)],
  ]
}
