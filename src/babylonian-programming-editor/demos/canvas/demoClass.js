
class /*instance:*/Smiley/*{"id":"6f94_3bd3_2945","name":{"mode":"input","value":"Simpson"},"values":{"canvas":{"mode":"select","value":"43d5_2cde_800c"},"eyeColor":{"mode":"input","value":"\"blue\""},"skinColor":{"mode":"input","value":"\"yellow\""}}}*/ {
  constructor(canvas, eyeColor, skinColor) {
    this._canvas = canvas;
    this._eyeColor = eyeColor;
    this._skinColor = skinColor;
  }
  
  /*example:*/drawAt/*{"id":"989b_f10b_d42e","name":{"mode":"input","value":"drawSimpson"},"color":"hsl(20, 30%, 70%)","values":{"x":{"mode":"input","value":"75"},"y":{"mode":"input","value":"75"}},"instanceId":{"mode":"select","value":"6f94_3bd3_2945"},"prescript":"","postscript":""}*/(x, y) {
    let ctx = this._canvas.getContext('2d');
    let size = 50;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2, true); // Outer circle
    ctx.stroke();
    ctx.fillStyle = this._skinColor;
    /*probe:*/ctx/*{}*/.fill();
    
    ctx.beginPath();
    ctx.moveTo(x+35, y);
    ctx.arc(x, y, 35, 0, Math.PI, false);  // Mouth (clockwise)
    ctx.moveTo(x-10, y-10);
    /*probe:*/ctx/*{}*/.stroke();
    
    ctx.beginPath();
    ctx.arc(x-10, y-10, 5, 0, Math.PI * 2, true);  // Left eye
    ctx.moveTo(x+20, y-10);
    ctx.arc(x+15, y-10, 5, 0, Math.PI * 2, true);  // Right eye
    ctx.fillStyle = this._eyeColor;
    ctx.fill();
    /*probe:*/ctx/*{}*/.stroke();
  }
}
/* Context: {"context":{"prescript":"console.log(\"before module\");","postscript":""},"customInstances":[{"id":"43d5_2cde_800c","name":"A Canvas","code":"return document.createElement(\"canvas\")"}]} */