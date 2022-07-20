## 2022-07-20 Can we load SVG?
*Author: @JensLincke*

## Yes, because SVGs are images...

![](https://svgshare.com/i/jJg.svg){width=300px}



## SVGs as elements?

But we cannot look into them! Can we load them as elements?

Here we have an SVG Editor in 10lines or so....


<script>

var url = lively4url + "/doc/journal/2022-07-20.md/coala.svg" 
var content = <div></div>
var result = <div>
<button click={
async () => {
content.innerHTML = await lively.files.loadFile(url)
}
}>load</button>
<button click={
() => {

var data = content.innerHTML
lively.files.saveFile(url, data)
}
}>save</button>

{content}</div>


result
</script>

## Moving paths with Halo is broken with transforrm

 #TODO, but using the Halo to move path ignores transformation matrices at the moment...

But the fix is easy... the Halo seems to be using setPosition directly... but setGlobalPosition is clever and would work!

```javascript
lively.showPoint(lively.getGlobalPosition(this))
lively.setGlobalPosition(this, lively.getGlobalPosition(this).addPt(lively.pt(0,10)))
```

