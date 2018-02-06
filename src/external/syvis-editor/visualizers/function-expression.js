import arrowFunctionExpression from './arrow-function-expression.js'

export default node => {
  const shavenArray = arrowFunctionExpression(node)
  shavenArray[1].class = shavenArray[1].class
    .replace('arrowFunctionExpression', 'functionExpression')
  return shavenArray
}
