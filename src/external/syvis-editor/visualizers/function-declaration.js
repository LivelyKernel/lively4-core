import walkTree from '../walkTree.js'

function markAsFunctionParameter (objects) {
  return objects.map(param => {
    param.isFunctionParameter = true
    return param
  })
}

export default node => {
  return [
    'section.code.function',
    ['header',
      ['span.name', walkTree(node.id)],
      ['span.params', walkTree(markAsFunctionParameter(node.params))],
    ],
    ['div', node.body ? walkTree(node.body) : null],
  ]
}
