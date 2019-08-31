## 2019-08-30 #CSS #Fun #Animation


```javascript
that.color = getComputedStyle(that).color
that.animate([
  { color: that.color }, 
  { color: 'red' }, 
  { color:  that.color }, 
], { 
  duration: 2000,
});
```


