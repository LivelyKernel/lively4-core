# Canvas

<canvas width="800" height="800"></canvas>
<script>
  const canvas = this.parentElement.querySelector('canvas')
  const ctx = canvas.getContext('2d')

  const points = []
  for (var i = 0; i < 15000; i++) {
    points.push([Math.random() * 800, Math.random() * 800])
  }

  const draw = () => {
    canvas.width = 800

    for (const point of points) {
      point[0] += 2 * Math.random() - 1
      point[1] += 2 * Math.random() - 1
    }
    for (const point of points)
      ctx.fillRect(point[0], point[1], 2, 2)
    requestAnimationFrame(draw)
  }

  requestAnimationFrame(draw)
</script>
