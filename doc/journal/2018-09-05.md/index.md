## 2018-09-05

Our XRay is pretty live...

```javascript
that.style.transformOrigin ="0 0"

var rotation = 0
var running = true

function anim() {
  if(running) {    
    rotation += 1
    that.style.transform = "rotate(" + rotation +"deg)"
    requestAnimationFrame(anim)
  }
}


anim()

// running = false

```

<video width="600" autoplay controls>
  <source src="xray_rotation.mp4" type="video/mp4">
</video>