import Morph from 'src/components/widgets/lively-morph.js';

export default class LivelyColor extends Morph {
  
  async initialize() {
    this.windowTitle = "LivelyColor";
    this.updateDisplay();
  }
  
  updateDisplay() {
    const color = this.getAttribute('color') || '#000';
    const size = this.getAttribute('size') || '15px';
    
    const colorDisplay = this.shadowRoot.querySelector('.color-display');
    if (colorDisplay) {
      colorDisplay.style.width = size;
      colorDisplay.style.height = size;
      colorDisplay.style.backgroundColor = color;
    }
  }
  
  static get observedAttributes() {
    return ['color', 'size'];
  }
  
  attributeChangedCallback() {
    this.updateDisplay();
  }
  
  livelyExample() {
    this.setAttribute('color', '#ff6600');
  }
}