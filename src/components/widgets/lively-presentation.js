import Morph from 'src/components/widgets/lively-morph.js';
import {pt}  from 'src/client/graphics.js'

export default class LivelyPresentation extends Morph {
  async initialize() {
    this.registerButtons();
    lively.html.registerKeys(this);
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