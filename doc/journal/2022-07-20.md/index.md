## 2022-07-20 Can we load SVG?
*Author: @JensLincke*

## Yes, because SVGs are images...

!
![](https://svgshare.com/i/jJg.svg){width=300px}



## SVGs as elements?

But we cannot look into them! Can we load them as elements?

<script>


var result = <div></div>

fetch(lively4url + "/doc/journal/2022-07-20.md/coala.svg").then(r => r.text()).then(t => result.innerHTML = t)

result
</script>

