## 2018-11-21 #BackgroundImage

I want custome background images.... that I don't want to share with the internet. So I use a lively file.

```javascript

function livelyLoad() {
  document.querySelectorAll("#custombackground").forEach(ea => ea.remove())

  var back = document.createElement("div")
  back.id = "custombackground"
  document.body.appendChild(back)

  back.isMetaNode = true
  
  var inner = document.createElement("div")
  inner.style.backgroundImage = `url("https://lively4/scheme/livelyfile//${this.name }")`
  inner.style.width = "2560px"
  inner.style.height = "1440px"
  inner.style.pointerEvents = "none"

  inner.style.opacity = "0.9"


  back.appendChild(inner)

  back.style.width = "1px"
  back.style.height = "1px"
  back.style.overflow = "visible"
  back.style.zIndex = -10000

}

```



![](181121_backgroundimage.png)