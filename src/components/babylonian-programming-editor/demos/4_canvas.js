function drawBall(canvas, x, y, r) {
  const context = canvas.getContext("2d");
  context.beginPath();
  context.arc(x, y, r, 0, Math.PI*2);
  context.fill();
}/* Examples: {"probes":[],"sliders":[],"examples":[{"location":[1,9,1,17],"id":"4bb6-ba2a-fbdd","name":"","values":{"canvas":"","x":"100","y":"100","r":"20"},"instanceId":"0"}],"replacements":[],"instances":[]} */