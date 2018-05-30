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
}/* Examples: {"probes":[{"location":[26,6,26,9]}],"sliders":[],"examples":[{"location":[1,9,1,19],"id":"20bb-e3d5-b35c","name":"Simpson","values":{"canvas":"","eyeColor":"\"green\"","skinColor":"\"yellow\""},"instanceId":"0"},{"location":[1,9,1,19],"id":"b0f4-d0e5-c0e9","name":"Alien","values":{"canvas":"","eyeColor":"\"brown\"","skinColor":"\"green\""},"instanceId":"0"},{"location":[64,2,64,8],"id":"9b62-6c3e-6271","name":"","values":{"x":"100","y":"100"},"instanceId":"7309-a90c-9b51"}],"replacements":[],"instances":[{"location":[57,6,57,12],"id":"7309-a90c-9b51","name":"Weird Alien","values":{"canvas":"","eyeColor":"\"red\"","skinColor":"\"blue\""}}]} */