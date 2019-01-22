import Morph from 'src/components/widgets/lively-morph.js';
import {pt}  from 'src/client/graphics.js'

export default class LivelyPresentation extends Morph {
  async initialize() {
    this.registerButtons();
    lively.html.registerKeys(this);
    
    lively.html.addChooList(this.get("#gotoButton"), () => {
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
    debugger
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
    this.updatePageNumber()
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
  
  async exportPrint() {
    this.showAllSlides()
    var printurl = lively.query(this, "lively-container").getURL().toString().replace(/\.md/,"_print.html")
    await fetch(
      printurl,
      {
      method: "PUT",
      body: this.innerHTML
    })
    if (await lively.confirm("visit " + printurl)) {
      window.open(printurl)
    }
  }  

  async print() {
    var currentSlideNumber = this.currentSlideNumber() 
    this.showAllSlides()

    window.oldBody = Array.from(document.body.childNodes)


    document.body.innerHTML = this.innerHTML
    var bodyCSS = document.body.style.cssText
    document.body.style = ""
    
    await lively.sleep(1000)

    window.print()

    // await lively.sleep(1000)

    // await lively.confirm("finished printing?")

    
    
    // I'll be back
    document.body.innerHTML = "" // tabula raza
    document.body.style = bodyCSS
    window.oldBody.forEach(ea => document.body.appendChild(ea))
    this.gotoSlideAt(currentSlideNumber)
    
  }  
  
  
  updatePageNumber() {
    if (!this.slide) return;
    var pageNumber = this.slide.querySelector(".page-number")
    if (pageNumber) pageNumber.textContent = this.currentSlideNumber()
  }  
  
  
}