# Animation


```javascript
var pos = lively.getPosition(that)
var pos2 = pos.addPt(lively.pt(100,200))


 var animation = that.animate([
   {  top: pos.y + "px", left: pos.x + "px" }, 
   { top: pos2.y + "px", left: pos2.x + "px" }], 

   {
    duration: 3000
  });
animation.onfinish = () => {
  lively.setPosition(that, pos2)
};
```


```javascript
 var animation2 = that.animate([
   { background: "white",  }, 
   { background: "red",   }, 
   { background: "white", }], 
  {
    duration: 3000
  });

```