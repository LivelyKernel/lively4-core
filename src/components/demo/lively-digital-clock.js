import Morph from 'src/components/widgets/lively-morph.js';

export default class DigitalClock extends Morph {

  static observedAttributes = ["color", "xsize"];
  
  initialize() {
    if (!this.start)
      this.start = Date.now()
  }

  connectedCallback() {
    this.setup();
  }
  
  attributeChangedCallback(attrName, oldValue, newValue) {
    if (attrName === "color") {
      this.get("#time").style.backgroundColor = newValue
    } else if (attrName === "xsize")  {
      this.get("#time").style.fontSize = newValue
    }
  }

  setup() {
    this.renderLoop();
  }

  render() {
    this.updateTime();
  }
  
  renderLoop() {
    this.render();
    
    setTimeout(
      this.renderLoop.bind(this),
      1000
    );
  }
  
  formatTime(dateTime) {
    var hours = ("0" + dateTime.getHours()).substr(-2);
    var minutes = ("0" + dateTime.getMinutes()).substr(-2);
    var seconds = ("0" + dateTime.getSeconds()).substr(-2);

    return hours + ":" + minutes + ":" + seconds;
  }
  
  updateTime() {
    var date = new Date()
    var time = date.getTime() - this.start
    this.shadowRoot.querySelector("#time").innerHTML = 
      `${this.formatTime(date)}  timer: ${Math.round(time / 1000 / 60)}min`;
  }

  livelyExample() {
    this.setAttribute("color",  "gray")
  }
  
  
  livelyMigrate(oldInstance) {
    this.start = oldInstance.start
  }
  
}
