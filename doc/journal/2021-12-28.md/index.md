## 2021-12-28

*Author: @onsetsu*

to copy style from one element to another one:

```JavaScript
function copyStyle(source, target) {
  const computedStyle = window.getComputedStyle(source);
  Array.from(computedStyle).forEach(key => target.style.setProperty(key, computedStyle.getPropertyValue(key), computedStyle.getPropertyPriority(key)))
}
```
