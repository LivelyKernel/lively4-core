## 2020-05-13
*Author: @JensLincke*

![](window_explosion.png)

## Yeah! Let the Windows Explode!

it seems... we had some View/Explode window code, but it did move the windows to far appart... here we do smaller steps... and the result is much better.

```javascript
var all = Array.from(document.body.querySelectorAll("lively-window"))

for(var elementA of all) {
  for(var elementB of all) {

    var a = lively.getGlobalBounds(elementA)
    var b = lively.getGlobalBounds(elementB)

    
    var intersection = a.intersection(b) 
    
    
    if (intersection.isNonEmpty()) {
 
      // lively.showRect(intersection)

      if (a.left() < intersection.left()) {
        var xdir = -1
      } else {
        xdir = 1
      }
      
      if (a.top() < intersection.top()) {
        var ydir = -1
      } else {
        ydir = 1
      }
      
      lively.moveBy(elementA, lively.pt(xdir *  0.1 * intersection.width, ydir *  0.1 * intersection.width))
      lively.moveBy(elementB, lively.pt(-xdir *  0.1 * intersection.width, -ydir *  0.1 * intersection.width))

    }
  }
}



```