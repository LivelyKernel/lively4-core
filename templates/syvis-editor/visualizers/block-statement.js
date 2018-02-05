const walkTree = require('../walkTree')

module.exports = node => {
  return [
    'section.code.blockStatement',
    ['.body', node.body ? walkTree(node.body) : null],
  ]
}
