function drawSmiley(canvas, eyeColor) {
  if (canvas.getContext) {
    let ctx = canvas.getContext('2d');
    if(eyeColor) {
      ctx.fillStyle = eyeColor;
    }
    ctx.beginPath();
    ctx.arc(75, 75, 50, 0, Math.PI * 2, true); // Outer circle
    ctx.moveTo(110, 75);
    ctx.arc(75, 75, 35, 0, Math.PI, false);  // Mouth (clockwise)
    ctx.moveTo(65, 65);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(60, 65, 5, 0, Math.PI * 2, true);  // Left eye
    ctx.moveTo(95, 65);
    ctx.arc(90, 65, 5, 0, Math.PI * 2, true);  // Right eye
    ctx.fill();
    ctx.stroke();
  }
}/* Examples: {"probes":[],"sliders":[],"examples":[{"location":[1,9,1,19],"id":"20bb-e3d5-b35c","name":"","values":{"canvas":"","eyeColor":"\"green\""},"instanceId":"0"},{"location":[1,9,1,19],"id":"b0f4-d0e5-c0e9","name":"","values":{"canvas":"","eyeColor":"\"brown\""},"instanceId":"0"}],"replacements":[],"instances":[]} */