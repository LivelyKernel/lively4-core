const walkTree = require('../walkTree')

function zipExpressions (quasis, expressions) {
  const combined = []
  quasis.forEach((quasi, index) => {
    combined.push(quasi)
    if (expressions[index]) {
      combined.push(expressions[index])
    }
  })
  return combined
}

module.exports = node => [
  'span.templateLiteral',
  walkTree(zipExpressions(node.quasis, node.expressions)),
]
