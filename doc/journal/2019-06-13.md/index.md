## 2019-06-13

Given this:

```javascript
var db = FileIndex.current().db
links  = await db.links.where({url:"https://lively-kernel.org/lively4/lively4-jens/demos/plex/plex-media.html"})
```
I wanted to do this:

```javascript
links[0].status = "xxx"
```

But had to do this:

```javascript
db.transaction("rw", db.links, () => {
  db.links.where({url: links[0].url, link: links[0].link}).modify({status: "xxxx"})
})
```


