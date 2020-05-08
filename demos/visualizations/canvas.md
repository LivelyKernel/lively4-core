# Canvas

<canvas width="800" height="800"></canvas>
<script>
  const canvas = this.parentElement.querySelector('canvas')
  const ctx = canvas.getContext('2d')

  const points = []
  for (var i = 0; i < 15000; i++) {
    points.push([Math.random() * 800, Math.random() * 800])
  }

  var lastTime = performance.now()
  const draw = () => {
    
    
    
    if (!lively.isInBody(canvas)) return 
    
    var time = performance.now()
    var deltaT = (time - lastTime) / 1000
    lastTime = time
    
    canvas.width = 800

    for (const point of points) {
      point[0] += deltaT * (2 * Math.random() - 1) * 10 
      point[1] += deltaT * (2 * Math.random() - 1) * 10
    }
    for (const point of points)
      ctx.fillRect(point[0], point[1], 2, 2)
    requestAnimationFrame(draw)
  }
  requestAnimationFrame(draw)
</script>
