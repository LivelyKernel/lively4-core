# Crossref API

```javascript
var search = "Entity Component System"

var value;
(async () => {
  value = await fetch(`https://api.crossref.org/works?filter=has-license:true,has-full-text:true&query=${search}&rows=10`).then(r => r.json())
})()

value.message
```