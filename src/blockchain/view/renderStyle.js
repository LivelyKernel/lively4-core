import Point from './point.js';

export default class RenderStyle {
  constructor() {
    this.font = "18px FontAwesome";
    this.foreColor = "#000000ff";
    this.borderThickness = 1;
    this.borderColor = "#000000ff";
    this.textMargin = new Point(6, 6);
  }
}