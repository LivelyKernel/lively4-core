import walkTree from '../walkTree'

export default node => {
  return [
    'section.code.for',
    ['header',
      ['.init', walkTree(node.init)],
      ['.test', walkTree(node.test)],
    ],
    ['.body', node.body ? walkTree(node.body) : null],
    ['.update', walkTree(node.update)],
  ]
}
