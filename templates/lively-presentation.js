import Morph from 'src/components/widgets/lively-morph.js';

export default class LivelyPresentation extends Morph {
  async initialize() {
    lively.html.registerButtons(this);
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
    this.setSlide(this.slides()[n])
  }
  
  currentSlideNumber() {
    return this.slides().indexOf(this.slide)
  }
  
  nextSlide() {
    this.gotoSlideAt(this.currentSlideNumber() + 1)
  }

  prevSlide() {
    this.gotoSlideAt(this.currentSlideNumber() - 1)
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
  
  updatePageNumber() {
    if (!this.slide) return;
    var pageNumber = this.slide.querySelector(".page-number")
    if (pageNumber) pageNumber.textContent = this.currentSlideNumber()
  }  
  
  
}