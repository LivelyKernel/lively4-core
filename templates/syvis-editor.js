/* global stylus */

import Morph from 'src/components/widgets/lively-morph.js'

export default class SyvisEditor extends Morph {
  async initialize() {
    console.info('Syvis editor was initialized')
    
    this.windowTitle = "SyvisEditor"
    
    stylus('body\n  color: blue')
      .render((error, css) => {
        if (error) {
          console.error(error)
          return
        }
        console.info(css)
      })
  }
}
