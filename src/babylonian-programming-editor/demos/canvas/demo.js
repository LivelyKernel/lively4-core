function drawSmiley(canvas, eyeColor, skinColor) {
  if (canvas.getContext) {
    let ctx = canvas.getContext('2d');
    
    ctx.beginPath();
    ctx.arc(75, 75, 50, 0, Math.PI * 2, true); // Outer circle
    ctx.stroke();
    ctx.fillStyle = skinColor;
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(110, 75);
    ctx.arc(75, 75, 35, 0, Math.PI, false);  // Mouth (clockwise)
    ctx.stroke();
    
    ctx.fillStyle = eyeColor;
    const eyeDistance = 35;
    const numEyes = 2;
    for(let i = 0; i < numEyes; i++) {
      const eyePosX = 60 + i*(eyeDistance / (numEyes-1));
      ctx.beginPath();
      ctx.moveTo(eyePosX, 65);
      ctx.arc(eyePosX, 65, 5, 0, Math.PI * 2, true);  // Eye
      ctx.stroke();
      ctx.fill();
    }
  }
}

class Smiley {
  constructor(canvas, eyeColor, skinColor) {
    this._canvas = canvas;
    this._eyeColor = eyeColor;
    this._skinColor = skinColor;
  }
  
  drawAt(x, y) {
    let ctx = this._canvas.getContext('2d');
    let size = 50;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2, true); // Outer circle
    ctx.stroke();
    ctx.fillStyle = this._skinColor;
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(x+35, y);
    ctx.arc(x, y, 35, 0, Math.PI, false);  // Mouth (clockwise)
    ctx.moveTo(x-10, y-10);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(x-10, y-10, 5, 0, Math.PI * 2, true);  // Left eye
    ctx.moveTo(x+20, y-10);
    ctx.arc(x+15, y-10, 5, 0, Math.PI * 2, true);  // Right eye
    ctx.fillStyle = this._eyeColor;
    ctx.fill();
    ctx.stroke();
  }
}
/* Examples: {"annotations":{"probes":[{"location":[25,6,25,9]}],"sliders":[],"examples":[{"location":[1,9,1,19],"id":"e5b0_d0e8_38ca","name":{"mode":"input","value":"Simpson"},"color":"hsl(100, 30%, 70%)","values":{"canvas":{"mode":"connect","value":"e5b0_d0e8_38ca_canvas"},"eyeColor":{"mode":"input","value":"\"blue\""},"skinColor":{"mode":"input","value":"\"yellow\""}},"instanceId":{"mode":"input","value":""},"prescript":"canvas.getContext(\"2d\").clearRect(0, 0, canvas.width, canvas.height)","postscript":""}],"replacements":[],"instances":[]},"context":{"prescript":"","postscript":""},"customInstances":[]} */