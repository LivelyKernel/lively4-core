## 2018-09-05

```
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

<object width="500" height="500" data="doc/journal/2018-09-05.md/xray_rotation.mp4"></object> 