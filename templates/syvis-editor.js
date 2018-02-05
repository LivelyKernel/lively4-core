/* global stylus */

import Morph from 'src/components/widgets/lively-morph.js'
import syvis from 'src/external/syvis-editor/syvis.js'
import shaven from 'src/external/shaven/index.js'

// Not working with minifed file
// import stylus from 'src/external/stylus.min.js'

export default class SyvisEditor extends Morph {
  async initialize() {
    console.info('Syvis editor was initialized')
    
    const filePath = `${lively4url}/src/external/syvis-editor/neo.styl`
    console.info(`Try to load "${filePath}"`)
  
    const response = await fetch(filePath)
    const fileContent = await response.text()
    
    const rootEl = this.shadowRoot
    
    stylus(fileContent)
      .render((error, css) => {
        if (error) {
          console.error(error)
          return
        }
        console.info(`Syvis: Loaded CSS "${css.slice(0, 50).replace(/\n/g, '')}…"`)
        const styleEl = rootEl.querySelector('#syvis-style')
        const styleText = document.createTextNode(css)
        styleEl.appendChild(styleText)
      })
  }
  
  async loadUrl (url) {
    console.info(`Syvis: Load ${url}`)
  
    try {
      const response = await fetch(url)
      const fileContent = await response.text()
      console.info(`Syvis: Loaded file content "${
        fileContent.slice(0, 50).replace(/\n/g, '')}…"`)
      const fileData = {
        url: new URL(url),
        path: url,
        content: fileContent,
      }
      const vDom = syvis(fileData)
      console.log(vDom)
      const obj = shaven(vDom)
      console.log(obj)
      // this.appendChild(obj.rootElement)
      // shaven.default([this, vDom])[0]
    }
    catch (error) {
      console.error(error)
    }
  }
}
