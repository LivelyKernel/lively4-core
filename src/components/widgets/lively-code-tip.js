import Morph from 'src/components/widgets/lively-morph.js';
import FileIndex from "src/client/fileindex.js";
import _ from 'src/external/lodash/lodash.js';

import preferences from 'src/client/preferences.js';

export default class CodeTip extends Morph {

  initialize() {
    this.registerButtons();
    this.nextTipButton.style.background = "#54ab5f";
    this.cancelButton.style.background = "#be4441";
    this.setTitle("Tip of the Day");

    this.setupTipText();    
    this.startupCheckbox.checked = preferences.get('TipOfTheDay');
    
    this.startupCheckbox.addEventListener("click", () => this.updatePreferences() )
  }

  setupTipText() {
    function fa(cls) {
      return `<i class='fa fa-${cls}' aria-hidden='true'></i>`;
    }

    this.tips = [
      "With 'Alt-Enter' you can access a powerful refactoring menu.",
      "Press 'Next Tip' to get more advice!",
      "You can get a global context menu by clicking on the background or anywhere there is  not a local context menu.",
      "Make your code simpler to understand with the extract method feature 'Alt+M'.",
      "You can find many useful shortcuts under 'Right-click' --> 'Documentation'.",
      "'that' can be used to reference the last component you used the 'halo-menu' (Alt+Click) on.",
      "'Ctrl+Shift+F' opens the global text search (which is case sensitive!).",
      "This could be your tip! Add new tips in lively-code-tip.js",
      "Use 'Alt+P' to switch between markdown code and its visualization in the codemirror.",
      "When editing a js file, press 'F7' to open the associated HTML file (if it exists) and vice versa.",
      "Press 'F8' to search files by name.",
      `You can fav files you frequently edit using the ${fa('star-o')} symbol (under ${fa('ellipsis-h')}) in the browser. Access them from the context menu under '${fa('star')} Favorites'.`
    ];
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

  updatePreferences() {
    const showOnNextStartup = this.startupCheckbox.checked;
    lively.notify("update preference: TipOfTheDay " +  showOnNextStartup)
    preferences.set('TipOfTheDay', showOnNextStartup);
  }
  
  onCancelButton() {
    this.parentElement.remove();
  }

  get startupCheckbox() {
    return this.get("#startupCheckbox");
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

  setTitle(title) {
    this.windowTitle = title;
  }

  progressString() {
    
    return `Tip: ${this.tipIndex + 1} / ${this.tips.length}`;
  }
  
  generateTipText() {
    this.text.innerHTML = this.tips[this.tipIndex] + "<br /> " + this.progressString();
  }
}