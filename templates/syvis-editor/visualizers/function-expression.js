const arrowFunctionExpression = require('./arrow-function-expression')

module.exports = node => {
  const shavenArray = arrowFunctionExpression(node)
  shavenArray[1].class = shavenArray[1].class
    .replace('arrowFunctionExpression', 'functionExpression')
  return shavenArray
}
