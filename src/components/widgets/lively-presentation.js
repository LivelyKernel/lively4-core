import Morph from 'src/components/widgets/lively-morph.js';
import {pt}  from 'src/client/graphics.js'

export default class LivelyPresentation extends Morph {
  
  async initialize() {
    this.registerButtons();
    lively.html.registerKeys(this);
    
    lively.html.addChooseList(this.get("#gotoButton"), () => {
      return this.slides().map((ea, index) => {
        var h = ea.querySelector("h1,h2,h3,h4") 
        var item = {
          toString: () => "Slide " + index + ": " + (h ? h.textContent : ""),
          style: "color: black",
          target: ea,
        }
        return item
      })
    }, (evt, item) => {
      this.setSlide(item.target)
    })
  }

  onLeftDown(evt) {
    this.prevSlide()     
    evt.preventDefault() 
    evt.stopPropagation() 
  }
  
  onRightDown(evt) {
    this.nextSlide()
    evt.preventDefault() 
    evt.stopPropagation() 
  }
  
  onPrintButton() {
    this.print()
  }
  
  onPrevButton() {
    this.prevSlide() 
  }
  
  onNextButton() {
    this.nextSlide() 
  }

  
  onGotoButton() {
//    lively.notify("goto")
  }
  
  onFullscreenButton() {
    this.toggleFullscreen()
  }

  async toggleFullscreen() {
    var container = lively.query(this, "lively-container")
    var presentation = this;
    var slide = this.slide
    presentation.fullscreen = !presentation.fullscreen
    if (presentation.fullscreen) {    
      
      
      var parents = lively.allParents(this, [], true)
      // hide all windows
      document.body.querySelectorAll("lively-window").forEach(ea => {
        if (!parents.includes(ea))  {
          ea.style.display = "none"
        }
      })
      
      document.documentElement.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT)
      await lively.sleep(100) // wait for fullscreen

      if (container && !container.isFullscreen()) {
        // container.hideNavbar()
        container.onFullscreen()
      }
      var slideBounds = slide.getBoundingClientRect()
      
      var scaleX = (window.innerWidth - 10)/ slideBounds.width
      var scaleY = (window.innerHeight - 10)/ slideBounds.height
      var minScale = Math.min(scaleY, scaleX)
      lively.setPosition( presentation, pt(0,0))
      presentation.style.transformOrigin = "0px 0px"
      presentation.style.transform = `scale(${minScale * 1})`

      await lively.sleep(10) // wait for rendering
      var scaledBounds = slide.getBoundingClientRect();
      lively.setPosition(presentation, 
        pt((window.innerWidth - scaledBounds.width) / 2,
        ((window.innerHeight - scaledBounds.height) / 2)) )

      container.style.backgroundColor = "black"
    } else {
      
      // unhide windows again
      document.body.querySelectorAll("lively-window").forEach(ea => {
        ea.style.display = ""
      })
      document.webkitCancelFullScreen()
      if (container && container.isFullscreen()) {
        container.onFullscreen()
        // container.showNavbar()
      }
      presentation.style.transform = ""
      lively.setPosition(presentation, pt(0,0))
      container.style.backgroundColor = ""
      
      if (container) {
        container.parentElement.focus() 
      }
    }
  }
  
  newSlide() {
    this.slide = document.createElement("div")
    this.slide.classList.add("lively-slide")
    this.appendChild(this.slide)
  }
  
  convertSiblings() {
    var content = this.parentElement 
    if (!content) return;
    this.newSlide()
    Array.from(content.childNodes).forEach(ea => {
      if (ea.tagName == "LIVELY-PRESENTATION") return;
      if (ea.classList && ea.classList.contains("lively-slide")) return;
      if (ea.tagName === "HR") {
        this.newSlide() 
        ea.remove()
      } else {
        this.slide.appendChild(ea)
      }
    })
    this.loaded
  }

  gotoSlideAt(n) {
    var slides = this.slides()
    if (n < 0) {
      n = slides.length - 1
    }
    this.setSlide(slides[n])
  }
  
  currentSlideNumber() {
    return this.slides().indexOf(this.slide)
  }
  
  updateContainerURLForSlideNumber(nextSlideNumber) {
    var container = lively.query(this, "lively-container")
    if (container) {
      var baseURL =  container.getURL().toString().replace(/\#.*/,"")
      var nextURL = baseURL + "#@" +nextSlideNumber
      container.setPathAttributeAndInput(nextURL)
      container.history().push(nextURL);
    }
  }
  
  nextSlide() {
    var nextSlideNumber = this.currentSlideNumber() + 1
    this.updateContainerURLForSlideNumber(nextSlideNumber)
    this.gotoSlideAt(nextSlideNumber)
  }

  prevSlide() {
    var nextSlideNumber = this.currentSlideNumber() - 1
    this.updateContainerURLForSlideNumber(nextSlideNumber)
    this.gotoSlideAt(nextSlideNumber)
  }
  
  slides() {
    return Array.from(this.querySelectorAll(".lively-slide"))
  }
  
  start() {
    this.setSlide(this.slides()[0])
  }
  
  setSlide(slide) {
    var all = this.slides()
    all.forEach(ea => ea.style.display = "none")
    if (slide) {
      slide.style.display = "block"  
    }
    this.slide = slide
    if (this.slide) {
      // #Hack, #TODO move it into drawio
      this.slide.querySelectorAll("lively-drawio").forEach(ea => ea.update()) 
      this.updatePageNumber()
    }
  }
  
  showAllSlides() {
    var i=1;
    this.slides().forEach(ea => {
      ea.style.display = "block"
      lively.setPosition(ea, pt(0,0), "relative") 
      var pageNumber = ea.querySelector(".page-number")
      if (pageNumber) pageNumber.textContent = i++
    })
  }
    
  async print() {
    var currentSlideNumber = this.currentSlideNumber() 
    this.showAllSlides()

    window.oldBody = Array.from(document.body.childNodes)
    var bodyCSS = document.body.style.cssText

    try {
      // give lively-scripts id's so, we can rescue the content...
      var printId = 0
      var originals = new Map()
      this.querySelectorAll("lively-script").forEach(ea => {
        var id = "" + printId++
        originals.set(id, ea)
        ea.setAttribute("print-id", id)
      })

      document.body.innerHTML = this.innerHTML
        .replace(/<lively-script/g,"<lively-no-script")
        .replace(/<\/lively-script/g,"</lively-no-script")
      
      Array.from(document.body.querySelectorAll("lively-no-script")).forEach(ea => {
        var id = ea.getAttribute("print-id")
        var original = originals.get(id, ea)
        if (original) {
          var replacement = <div>hello</div>
          replacement.attachShadow({mode: 'open'})
          replacement.shadowRoot.innerHTML = original.get("#result").innerHTML
          ea.parentElement.replaceChild(replacement, ea)
        }
      })

      document.body.style = ""

      await lively.sleep(3000)

      window.print()

      // await lively.sleep(1000)    
      // await lively.confirm("finished printing?")
    } finally {
      // I'll be back
      document.body.innerHTML = "" // tabula raza
      document.body.style = bodyCSS
      window.oldBody.forEach(ea => document.body.appendChild(ea))
      this.gotoSlideAt(currentSlideNumber)  
    }
  }  
  
  updatePageNumber() {
    if (!this.slide) return;
    var pageNumber = this.slide.querySelector(".page-number")
    if (pageNumber) pageNumber.textContent = this.currentSlideNumber()
  }
  
  static async config(ctx, config={}) {
    await lively.sleep(500)
    var presentation = lively.query(ctx, "lively-presentation")
    if (presentation && presentation.slides) {
      presentation.slides().forEach(ea => {
        if(config.logo) {
          var img = document.createElement("img")
          img.classList.add("logo")
          img.src=config.logo 
          img.setAttribute("width", "50px")
          ea.appendChild(img)          
        }
        if (config.pageNumbers) {
          var div = document.createElement("div")
          div.classList.add("page-number")
          ea.appendChild(div)          
        }
      });
    }
  }
}