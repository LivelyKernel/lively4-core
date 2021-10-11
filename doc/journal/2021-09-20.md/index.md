## 2021-09-20 #Zones #Example
*Author: @JensLincke*




```javascript
runZoned(async () => {
await lively.sleep(1000)
return fetch(Zone.current.url).then(r => r.text())
}, {
zoneValues: {
  url: "https://lively-kernel.org/"
}
})
```