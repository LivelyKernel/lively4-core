import Point from './point.js';

export default class RenderStyle {
  constructor() {
    this.fontHeight = 18;
    this.font = this.fontHeight + "px FontAwesome";
    this.foreColor = "#000000ff";
    this.linkColor = "#2200ccff";
    this.borderThickness = 1;
    this.borderColor = "#000000ff";
    this.textMargin = new Point(6, 6);
  }
}