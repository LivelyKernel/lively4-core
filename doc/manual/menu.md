# How to create a Menu

```javascript
var menu
(async () => {
  menu = await lively.create("lively-menu")

  menu.openOn([["hello", () => {
    menu.remove()
    lively.openBrowser(lively4url)
  }]])
})() 
```