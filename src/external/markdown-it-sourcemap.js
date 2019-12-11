const sourceMapPlugin = (md) => {
  const originalFunc = md.renderer.renderToken.bind(md.renderer)
  md.renderer.renderToken = function (tokens, idx, options) {
    let token = tokens[idx]
    if (token.map !== null && token.type.endsWith('_open')) {
      token.attrPush(['data-source-line', token.map[0] + 1])
    }
    return originalFunc(tokens, idx, options)
  }
}

export default sourceMapPlugin