var ctx = this.getContext("2d");
// this rest is implicit in most live programming environmens
ctx.fillStyle = "white";
ctx.fillRect(0, 0, 300, 300);

function draw() {
  for (var i = 0; i < 3; i++) {
    for (var j = 0; j < 3; j++) {
      ctx.save();
      ctx.fillStyle = 'rgb(' + (51 * i) + ', ' + (255 - 51 * i) + ', 255)';
      ctx.translate(10 + j * 50, 10 + i * 50);
      ctx.fillRect(0, 0, 25, 25);
      ctx.restore();
    }
  }
}
draw()

