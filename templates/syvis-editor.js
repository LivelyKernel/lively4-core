/* global stylus */

import Morph from 'src/components/widgets/lively-morph.js'
import syvis from 'templates/syvis-editor/syvis.js'

export default class SyvisEditor extends Morph {
  async initialize() {
    console.info('Syvis editor was initialized')
    
    const filePath = `${lively4url}/templates/syvis-editor/neo.styl`
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
        const styleEl = rootEl.querySelector('#syvis-style')
        const styleText = document.createTextNode(css)
        styleEl.appendChild(styleText)
      })
  }
  
  async loadUrl (url) {
    console.info(`<b>Syvis</b>: Load ${url}`)
    
    console.info(`WTFFFFFFFFFFFFFFFFFFFFF`)
    
    try {
      const response = await fetch(url)
      console.log('response', response)
      const fileContent = await response.text()
      console.log('HEEELLO', fileContent)
      syvis.loadAndRender(fileContent)
    }
    catch (error) {
      console.error(error)
    }
    
    
  }
}
