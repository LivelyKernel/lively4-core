# Lively API

Lively4 uses a lot of HTML, CSS, and JavaScript... but what are those little snippets of code that are showing themselves all over the place.

Most of are defined in our own [lively.js](browse://src/client/lively.js) kitchen sink module. 


## Temporarily Highlighting Something


```javascript
lively.showPoint(lively.pt(100,100))
lively.showRect(lively.pt(100,100), lively.pt(200,200)).style.backgroundColor = "rgba(0,200,0,0.5)"
lively.showElement(this)
```

The HTML element returned by those functions can further be used to customize the highlighting. 

![](media/show_examples.png){height=100}

