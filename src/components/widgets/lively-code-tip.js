import Morph from 'src/components/widgets/lively-morph.js';
import FileIndex from "src/client/fileindex.js";
import _ from 'src/external/lodash/lodash.js';

export default class CodeTip extends Morph {

  initialize() {
    this.registerButtons();
    this.nextTipButton.style.background = "#00FF00";
    this.cancelButton.style.background = "#ff0000";
    this.setTitle("Tip of the Day");

    // TODO tidy up
    this.setupTipText();

    this.onResetButton();
    this.whackImg.addEventListener("click", this.moveImg.bind(this));
  }

  setupTipText() {
    this.tips = ["With 'Alt-Enter' you can access a powerful refactoring menu.", "Press 'Next Tip' to get more advice!", "Make your code simpler to understand with the extract method feature 'Alt+M'.", "You can find many useful shortcuts under 'Right-click' --> 'Documentation'.", "'that' can be used to reference the last component you used the 'halo-menu' (Alt+Click) on.", "'Ctrl+Shift+F' opens the global text search (that is case sensitive!).", "This could be your tip!", "Use 'Alt+P' to switch between markdown code and its visualization in the codemirror.", "When editing a js file, press 'F7' to open the associated HTML file (if it exists) and vice versa."];
    this.tipIndex = Math.floor(Math.random() * this.tips.length);
    this.generateTipText();
  }

  onNextTipButton() {
    this.incrementTipCounter();
    this.generateTipText();
  }

  incrementTipCounter() {
    this.tipIndex = (this.tipIndex + 1) % this.tips.length;
  }

  onCancelButton() {
    this.parentElement.remove();
  }

  get cancelButton() {
    return this.get("#cancelButton");
  }

  get nextTipButton() {
    return this.get("#nextTipButton");
  }

  get text() {
    return this.get("#text");
  }

  get stats() {
    return this.get("#stats");
  }

  get avg() {
    return this.get("#avg");
  }

  get currentTime() {
    return this.get("#current-time");
  }

  get whackImg() {
    return this.get("#whack-img");
  }

  setTitle(title) {
    this.windowTitle = title;
  }

  focus() {
    //this.get("#searchInput").focus();
  }
  clearLog(s) {
    this.codeOccurencesList.innerHTML = "";
  }

  progressString() {
    return `Tip: ${this.tipIndex + 1} / ${this.tips.length}`;
  }

  moveImg(a) {
    const box = a.target;

    box.style.marginLeft = (Math.random() * (box.parentElement.offsetWidth - box.offsetWidth)).toString() + "px";
    box.style.marginTop = (Math.random() * (box.parentElement.offsetHeight - box.offsetHeight)).toString() + "px";

    const newLength = this.tapTimes.push(new Date().getTime());
    this.setupTimer(this.tapTimes[this.tapTimes.length - 1]);
    if (newLength < 2) {
      this.avg.innerHTML = "-";
      this.stats.style.display = "block";
      return;
    } else if (newLength > 10) {
      this.tapTimes = this.tapTimes.splice(1, 10);
    }

    let sum = 0;
    for (let i = 0; i < this.tapTimes.length - 1; i++) {
      sum += parseInt(this.tapTimes[i + 1]) - parseInt(this.tapTimes[i]);
    }

    this.avg.innerHTML = Math.floor(sum / this.tapTimes.length).toString() + "ms";
  }
  
  setupTimer(last) {
    const htmlElement = this.currentTime;
    clearInterval(this.timer);
    this.timer = setInterval(function () {
      const now = new Date().getTime();
      const distance = now - last;

      const seconds = Math.floor(distance % (1000 * 60) / 1000);
      const milliseconds = distance % 1000;

      htmlElement.innerHTML = seconds + "s " + milliseconds + "ms";

      if (distance > 10000) {
        htmlElement.innerHTML = "Too slow!";
        clearInterval(this.timer);
      }
    }, 1);
  }

  onResetButton() {
    this.tapTimes = [];
    this.stats.style.display = "none";
    this.avg.innerHTML = "";
    this.whackImg.style.marginLeft = "5px";
    this.whackImg.style.marginTop = "5px";
    clearInterval(this.timer);
  }

  generateTipText() {
    this.text.innerHTML = this.tips[this.tipIndex] + "<br> " + this.progressString();
  }

}