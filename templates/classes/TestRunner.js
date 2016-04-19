'use strict';

export default class Sync extends HTMLDivElement {
  initialize() {
    lively.html.registerButtons(this)
  }
  
  onRunButton() {
    lively.notify("run tests")
  }

}
