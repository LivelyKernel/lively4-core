import Morph from 'src/components/widgets/lively-morph.js';

export default class LivelyBackground extends Morph {
  
  async initialize() {     
    this.update()
  }
  get isMetaNode() {
    return true
  }

  get url() {
    return this.getAttribute("url")
  }
  
  set url(url) {
    this.setAttribute("url", url)
    this.update()
  }
  
  async update() {
    if (!this.url) return 
    await fetch(this.url)
    
    
    
    
    var inner = this.get("#inner")
    
    inner.style.backgroundImage = ""
    inner.style.backgroundImage = `url("${this.url}")`
    // inner.style.backgroundPosition = "50px 50px"
    var width = 2560
    var height = 1440
    lively.setPosition(inner, lively.pt(0,0))
    lively.setPosition(inner, lively.pt(-1 * width, -1 * height))
    inner.style.width = 3 * width + "px"
    inner.style.height = 3 * height + "px"
    inner.style.pointerEvents = "none"

    inner.style.opacity = "0.9"
    inner.style.zIndex = -10000000

    this.style.width = "1px"
    this.style.height = "1px"
    this.style.overflow = "visible"
    this.style.zIndex = -10000000  
    
  }
  
  async livelyExample() {
    this.url = "https://lively-kernel.org/lively4/lively4-jens/media/lively4_logo_smooth.png"             
  }
  
  
}