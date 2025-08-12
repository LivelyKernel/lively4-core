import Morph from 'src/components/widgets/lively-morph.js';

export default class LivelyColor extends Morph {
  
  async initialize() {
    this.windowTitle = "LivelyColor";
    this.updateDisplay();
  }
  
  updateDisplay() {
    const color = this.getAttribute('color') || '#000';
    const size = this.getAttribute('size') || '15px';
    
    this.style.display = 'inline-block';
    this.style.width = size;
    this.style.height = size;
    this.style.backgroundColor = color;
    this.style.border = '1px solid #ccc';
    this.style.margin = '0 5px';
    this.style.verticalAlign = 'middle';
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