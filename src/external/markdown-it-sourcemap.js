const sourceMapPlugin = (md) => {
  const temp = md.renderer.renderToken.bind(md.renderer)
  md.renderer.renderToken = function (tokens, idx, options) {
    let token = tokens[idx]
    // if (token.level === 0 && token.map !== null && token.type.endsWith('_open')) {
    //   token.attrPush(['data-source-line', token.map[0] + 1])
    // }
    if (token.map !== null && token.type.endsWith('_open')) {
      token.attrPush(['data-source-line', token.map[0] + 1])
    }
    
    return temp(tokens, idx, options)
  }
}

export default sourceMapPlugin